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
