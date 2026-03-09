import logging
from datetime import date, timedelta

from sqlalchemy import delete, desc, func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.prediction import Prediction
from app.models.price import EggPrice
from app.services.kamis_client import REGION_CODE_MAP

logger = logging.getLogger(__name__)

# Base prices for fallback generation
_BASE_PRICES = {"왕란": 7800, "특란": 7200, "대란": 6500, "중란": 5800, "소란": 5200}

ALL_GRADES = ["왕란", "특란", "대란", "중란", "소란"]
ALL_REGIONS = list(REGION_CODE_MAP.keys())


def get_predictions(db: Session, grade: str, region: str = "seoul") -> list[Prediction]:
    """Get the most recent predictions for a grade and region."""
    max_base_date = (
        db.query(func.max(Prediction.base_date))
        .filter(Prediction.grade == grade, Prediction.region == region)
        .scalar_subquery()
    )
    results = (
        db.query(Prediction)
        .filter(
            Prediction.grade == grade,
            Prediction.region == region,
            Prediction.base_date == max_base_date,
        )
        .order_by(Prediction.horizon_days)
        .all()
    )

    # 예측 데이터가 없으면 즉시 30일 예측 생성 (폴백)
    if not results:
        logger.info(f"No predictions for {grade}/{region} — generating 30-day fallback...")
        latest = (
            db.query(EggPrice)
            .filter(EggPrice.grade == grade, EggPrice.region == region)
            .order_by(desc(EggPrice.date))
            .first()
        )

        base_price = latest.wholesale_price if latest and latest.wholesale_price else _BASE_PRICES.get(grade, 6500)
        base_date = latest.date if latest else date.today()

        for days in range(1, 31):
            predicted = base_price * (1 + 0.002 * days) + (days % 5 - 2) * 10
            pred = Prediction(
                base_date=base_date,
                target_date=base_date + timedelta(days=days),
                grade=grade,
                region=region,
                predicted_price=round(predicted, 2),
                confidence_lower=round(predicted * 0.97, 2),
                confidence_upper=round(predicted * 1.03, 2),
                horizon_days=days,
                model_version="sample_v1",
            )
            db.add(pred)
            results.append(pred)

        try:
            db.commit()
            logger.info(f"Generated 30 fallback predictions for {grade}/{region}")
        except Exception as e:
            db.rollback()
            logger.warning(f"Fallback prediction commit failed: {e}")

    return results


def run_predictions(db: Session, grade: str, region: str = "seoul") -> list[Prediction]:
    """Run model inference and store prediction results for a grade/region."""
    try:
        from app.ml.predict import predict_prices
        results = predict_prices(db, grade, settings.MODEL_VERSION, region=region)
    except FileNotFoundError:
        logger.warning(f"No trained model found for grade={grade}")
        return []
    except ValueError as e:
        logger.warning(f"Cannot predict for grade={grade} region={region}: {e}")
        return []

    stored = []
    for r in results:
        pred = Prediction(
            base_date=r["base_date"],
            target_date=r["target_date"],
            grade=r["grade"],
            region=r.get("region", region),
            predicted_price=r["predicted_price"],
            confidence_lower=r["confidence_lower"],
            confidence_upper=r["confidence_upper"],
            horizon_days=r["horizon_days"],
            model_version=r["model_version"],
        )
        db.add(pred)
        stored.append(pred)

    db.commit()
    for s in stored:
        db.refresh(s)
    return stored


def run_all_predictions(db: Session) -> list[Prediction]:
    """Run predictions for all grades × all regions."""
    all_preds = []
    for grade in ALL_GRADES:
        for region in ALL_REGIONS:
            try:
                preds = run_predictions(db, grade, region)
                all_preds.extend(preds)
            except Exception as e:
                logger.error(f"Prediction failed for {grade}/{region}: {e}")
    return all_preds


def regenerate_all_fallback_predictions(db: Session) -> int:
    """Delete all existing predictions and regenerate fallback for all grades × regions.

    Uses a unified base_date (today) so all regions align on the same dates.
    """
    # Delete all existing predictions
    db.execute(delete(Prediction))
    db.commit()
    logger.info("Deleted all existing predictions")

    unified_base = date.today()
    count = 0

    for grade in ALL_GRADES:
        # Get the best base_price per region
        for region in ALL_REGIONS:
            latest = (
                db.query(EggPrice)
                .filter(EggPrice.grade == grade, EggPrice.region == region)
                .order_by(desc(EggPrice.date))
                .first()
            )
            base_price = latest.wholesale_price if latest and latest.wholesale_price else _BASE_PRICES.get(grade, 6500)

            for days in range(1, 31):
                predicted = base_price * (1 + 0.002 * days) + (days % 5 - 2) * 10
                pred = Prediction(
                    base_date=unified_base,
                    target_date=unified_base + timedelta(days=days),
                    grade=grade,
                    region=region,
                    predicted_price=round(predicted, 2),
                    confidence_lower=round(predicted * 0.97, 2),
                    confidence_upper=round(predicted * 1.03, 2),
                    horizon_days=days,
                    model_version="sample_v1",
                )
                db.add(pred)
                count += 1

    db.commit()
    logger.info(f"Regenerated {count} fallback predictions with base_date={unified_base}")
    return count
