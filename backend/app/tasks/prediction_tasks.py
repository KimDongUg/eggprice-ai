"""Celery tasks for running predictions."""

import asyncio
import logging

from app.core.celery_app import celery
from app.core.database import SessionLocal

logger = logging.getLogger(__name__)


@celery.task(name="app.tasks.prediction_tasks.run_all_predictions_task", bind=True, max_retries=2)
def run_all_predictions_task(self):
    """Run predictions for all grades and check alerts. Runs daily at 7AM KST."""
    from app.services.prediction_service import run_all_predictions
    from app.services.alert_service import check_and_send_alerts

    logger.info("Celery: Starting prediction run")
    db = SessionLocal()
    try:
        preds = run_all_predictions(db)
        logger.info(f"Celery: Generated {len(preds)} predictions")

        pred_dicts = [
            {"grade": p.grade, "predicted_price": p.predicted_price, "horizon_days": p.horizon_days}
            for p in preds
        ]

        loop = asyncio.new_event_loop()
        loop.run_until_complete(check_and_send_alerts(db, pred_dicts))
        loop.close()
        logger.info("Celery: Alert check complete")

        return {"predictions": len(preds)}
    except Exception as exc:
        logger.error(f"Celery: Prediction run failed: {exc}")
        raise self.retry(exc=exc, countdown=60 * 10)
    finally:
        db.close()


@celery.task(name="app.tasks.prediction_tasks.run_grade_prediction_task")
def run_grade_prediction_task(grade: str):
    """Run prediction for a single grade."""
    from app.services.prediction_service import run_predictions

    logger.info(f"Celery: Running prediction for {grade}")
    db = SessionLocal()
    try:
        preds = run_predictions(db, grade)
        return {"grade": grade, "predictions": len(preds)}
    finally:
        db.close()
