import logging
from datetime import date

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.prediction import Prediction
from app.ml.predict import predict_prices

logger = logging.getLogger(__name__)


def get_predictions(db: Session, grade: str) -> list[Prediction]:
    """Get the most recent predictions for a grade."""
    latest = (
        db.query(Prediction.base_date)
        .filter(Prediction.grade == grade)
        .order_by(desc(Prediction.base_date))
        .first()
    )
    if not latest:
        return []

    return (
        db.query(Prediction)
        .filter(Prediction.grade == grade, Prediction.base_date == latest[0])
        .order_by(Prediction.horizon_days)
        .all()
    )


def run_predictions(db: Session, grade: str) -> list[Prediction]:
    """Run model inference and store prediction results."""
    try:
        results = predict_prices(db, grade, settings.MODEL_VERSION)
    except FileNotFoundError:
        logger.warning(f"No trained model found for grade={grade}")
        return []
    except ValueError as e:
        logger.warning(f"Cannot predict for grade={grade}: {e}")
        return []

    stored = []
    for r in results:
        pred = Prediction(
            base_date=r["base_date"],
            target_date=r["target_date"],
            grade=r["grade"],
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
    """Run predictions for all grades."""
    all_preds = []
    for grade in ["왕란", "특란", "대란", "중란", "소란"]:
        preds = run_predictions(db, grade)
        all_preds.extend(preds)
    return all_preds
