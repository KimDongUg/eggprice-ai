"""Celery application configuration.

Usage:
    celery -A app.core.celery_app worker --loglevel=info
    celery -A app.core.celery_app beat --loglevel=info
"""

from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery = Celery(
    "eggprice",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Seoul",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)

# Celery Beat schedule — replaces APScheduler
celery.conf.beat_schedule = {
    "daily-data-collection": {
        "task": "app.tasks.data_tasks.collect_all_data_task",
        "schedule": crontab(hour=6, minute=0),  # 6AM KST
    },
    "daily-predictions": {
        "task": "app.tasks.prediction_tasks.run_all_predictions_task",
        "schedule": crontab(hour=7, minute=0),  # 7AM KST
    },
    "monthly-retrain-check": {
        "task": "app.tasks.training_tasks.check_retrain_task",
        "schedule": crontab(day_of_month=1, hour=3, minute=0),  # 1st of month 3AM KST
    },
}

# Auto-discover tasks
celery.autodiscover_tasks(["app.tasks"])
