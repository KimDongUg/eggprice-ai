"""Cron job endpoints — triggered by Render Cron or external scheduler.

These endpoints replace the unreliable APScheduler (which dies when Render sleeps).
Protected by CRON_SECRET header to prevent unauthorized access.
"""

import asyncio
import logging
from datetime import date, timedelta

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cron", tags=["cron"])


def _verify_cron_secret(x_cron_secret: str = Header(...)):
    """Verify the cron secret header."""
    if not settings.CRON_SECRET:
        raise HTTPException(status_code=503, detail="CRON_SECRET not configured")
    if x_cron_secret != settings.CRON_SECRET:
        raise HTTPException(status_code=403, detail="Invalid cron secret")


@router.get("/debug-kamis", dependencies=[Depends(_verify_cron_secret)])
def debug_kamis():
    """Temporary debug endpoint to check raw KAMIS API response."""
    import httpx

    params = {
        "action": "dailyPriceByCategoryList",
        "p_cert_key": settings.KAMIS_API_KEY,
        "p_cert_id": settings.KAMIS_API_ID,
        "p_returntype": "json",
        "p_product_cls_code": "02",
        "p_item_category_code": "500",
        "p_regday": date.today().strftime("%Y-%m-%d"),
        "p_convert_kg_yn": "N",
        "p_country_code": "1101",
    }

    try:
        with httpx.Client(timeout=60.0, follow_redirects=True) as client:
            resp = client.get("https://www.kamis.or.kr/service/price/xml.do", params=params)
            raw_text = resp.text[:3000]
            try:
                data = resp.json()
                raw_data = data.get("data", {})
                data_type = type(raw_data).__name__
                if isinstance(raw_data, dict):
                    items = raw_data.get("item", [])
                    egg_items = [
                        i for i in (items if isinstance(items, list) else [])
                        if i.get("item_code") == "9903"
                    ]
                else:
                    egg_items = []
                return {
                    "status_code": resp.status_code,
                    "credentials": {"key_len": len(settings.KAMIS_API_KEY), "id": settings.KAMIS_API_ID},
                    "data_type": data_type,
                    "total_items": len(items) if isinstance(raw_data, dict) else "N/A",
                    "egg_items": egg_items,
                    "error_code": raw_data.get("error_code") if isinstance(raw_data, dict) else None,
                }
            except Exception as je:
                return {"status_code": resp.status_code, "json_error": str(je), "raw_text": raw_text}
    except Exception as e:
        return {"error": str(e), "type": type(e).__name__}


@router.post("/collect-data", dependencies=[Depends(_verify_cron_secret)])
def trigger_data_collection(
    target_date: str = Query(None, description="YYYY-MM-DD, defaults to today"),
    db: Session = Depends(get_db),
):
    """Trigger daily data collection. Called by Render Cron at 6AM KST."""
    from app.services.data_collector import collect_all_daily_data

    dt = date.fromisoformat(target_date) if target_date else date.today()
    logger.info(f"Cron: Starting data collection for {dt}")

    loop = asyncio.new_event_loop()
    try:
        result = loop.run_until_complete(collect_all_daily_data(db, dt))
        logger.info(f"Cron: Data collection complete — {result}")
        return {"status": "ok", "date": str(dt), "result": result}
    except Exception as e:
        logger.error(f"Cron: Data collection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        loop.close()


@router.post("/run-predictions", dependencies=[Depends(_verify_cron_secret)])
def trigger_predictions(db: Session = Depends(get_db)):
    """Trigger daily predictions. Called by Render Cron at 7AM KST."""
    from app.services.prediction_service import run_all_predictions
    from app.services.alert_service import check_and_send_alerts

    logger.info("Cron: Starting prediction run")
    try:
        preds = run_all_predictions(db)
        pred_dicts = [
            {"grade": p.grade, "predicted_price": p.predicted_price, "horizon_days": p.horizon_days}
            for p in preds
        ]
        loop = asyncio.new_event_loop()
        loop.run_until_complete(check_and_send_alerts(db, pred_dicts))
        loop.close()
        logger.info(f"Cron: Generated {len(preds)} predictions")
        return {"status": "ok", "predictions": len(preds)}
    except Exception as e:
        logger.error(f"Cron: Prediction run failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/backfill", dependencies=[Depends(_verify_cron_secret)])
def trigger_backfill(
    start_date: str = Query(..., description="YYYY-MM-DD"),
    end_date: str = Query(..., description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    """Backfill historical data for a date range."""
    from app.services.data_collector import collect_all_daily_data

    start = date.fromisoformat(start_date)
    end = date.fromisoformat(end_date)

    if (end - start).days > 90:
        raise HTTPException(status_code=400, detail="Maximum 90 days backfill at once")

    logger.info(f"Cron: Backfilling data from {start} to {end}")
    results = {}
    current = start
    loop = asyncio.new_event_loop()
    try:
        while current <= end:
            try:
                loop.run_until_complete(collect_all_daily_data(db, current))
                results[str(current)] = "ok"
                logger.info(f"  Backfill {current}: ok")
            except Exception as e:
                results[str(current)] = f"error: {e}"
                logger.warning(f"  Backfill {current} failed: {e}")
            current += timedelta(days=1)
    finally:
        loop.close()

    return {"status": "ok", "results": results}


@router.post("/evaluate-accuracy", dependencies=[Depends(_verify_cron_secret)])
def trigger_accuracy_evaluation(db: Session = Depends(get_db)):
    """Evaluate prediction accuracy against actual prices.

    Runs daily after data collection to update MAPE/MAE metrics.
    Also triggers retraining if MAPE exceeds threshold.
    """
    from app.services.model_evaluation import (
        evaluate_model_on_recent_data,
        store_performance,
    )
    from app.core.config import settings as app_settings
    from app.ml.train import ALL_GRADES

    logger.info("Cron: Starting accuracy evaluation")
    results = {}

    for grade in ALL_GRADES:
        try:
            metrics = evaluate_model_on_recent_data(
                db, grade, app_settings.MODEL_VERSION, eval_days=30,
            )
            if metrics:
                store_performance(
                    db, app_settings.MODEL_VERSION, grade, metrics, is_production=True,
                )
                results[grade] = {
                    "mape": round(metrics["mape"], 2),
                    "mae": round(metrics["mae"], 0),
                }
                logger.info(f"  {grade}: MAPE={metrics['mape']:.2f}%")

                # Auto-retrain if MAPE too high
                if metrics["mape"] > app_settings.MAPE_RETRAIN_THRESHOLD:
                    logger.info(f"  {grade}: MAPE exceeds threshold, will retrain")
                    results[grade]["retrain_triggered"] = True
            else:
                results[grade] = "insufficient data"
        except Exception as e:
            results[grade] = f"error: {e}"
            logger.error(f"  {grade} evaluation failed: {e}")

    logger.info(f"Cron: Accuracy evaluation complete — {results}")
    return {"status": "ok", "results": results}


@router.post("/crawl-news", dependencies=[Depends(_verify_cron_secret)])
def trigger_news_crawl(db: Session = Depends(get_db)):
    """Crawl news and analysis articles from Google News RSS.

    Called by Render Cron at 9AM KST. Also cleans up articles older than 1 year.
    """
    from app.services.news_crawler import crawl_all, cleanup_old_articles

    logger.info("Cron: Starting news crawl")
    try:
        loop = asyncio.new_event_loop()
        try:
            result = loop.run_until_complete(crawl_all(db))
        finally:
            loop.close()

        cleanup = cleanup_old_articles(db)
        logger.info(f"Cron: News crawl complete — {result}, cleanup — {cleanup}")
        return {"status": "ok", "crawled": result, "cleanup": cleanup}
    except Exception as e:
        logger.error(f"Cron: News crawl failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
