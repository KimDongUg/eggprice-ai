"""Celery tasks for model training and retraining."""

import logging

from app.core.celery_app import celery
from app.core.database import SessionLocal

logger = logging.getLogger(__name__)


@celery.task(name="app.tasks.training_tasks.check_retrain_task")
def check_retrain_task():
    """Monthly check: retrain models if needed based on MAPE threshold."""
    from app.services.model_evaluation import check_and_retrain_if_needed

    logger.info("Celery: Starting monthly retrain check")
    db = SessionLocal()
    try:
        check_and_retrain_if_needed(db)
        logger.info("Celery: Retrain check complete")
    finally:
        db.close()


@celery.task(name="app.tasks.training_tasks.train_model_task")
def train_model_task(grade: str, model_version: str | None = None):
    """Train model for a specific grade."""
    from app.ml.train import train_model

    logger.info(f"Celery: Training model for {grade}")
    report = train_model(grade, model_version)
    logger.info(f"Celery: Training complete — {report['metrics']}")
    return report


@celery.task(name="app.tasks.training_tasks.train_all_task")
def train_all_task(model_version: str | None = None):
    """Train models for all grades."""
    from app.ml.train import train_all_grades

    logger.info("Celery: Training all grades")
    reports = train_all_grades(model_version)
    logger.info(f"Celery: Trained {len(reports)} models")
    return [r["grade"] for r in reports]
