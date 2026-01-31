"""APScheduler fallback scheduler.

In production, Celery Beat handles scheduling. This scheduler is used as
a fallback when Celery is not available (e.g., local development without Redis).
"""

import asyncio
import logging
from datetime import date

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.config import settings
from app.core.database import SessionLocal

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def _celery_available() -> bool:
    """Check if Celery broker (Redis) is reachable."""
    try:
        import redis
        r = redis.from_url(settings.CELERY_BROKER_URL, socket_connect_timeout=2)
        r.ping()
        return True
    except Exception:
        return False


def _run_async(coro):
    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(coro)
    finally:
        loop.close()


def daily_data_collection_job():
    if _celery_available():
        from app.tasks.data_tasks import collect_all_data_task
        collect_all_data_task.delay()
        logger.info("Scheduler: Dispatched data collection to Celery")
    else:
        from app.services.data_collector import collect_all_daily_data
        logger.info("Scheduler: Running data collection locally (no Celery)")
        db = SessionLocal()
        try:
            _run_async(collect_all_daily_data(db, date.today()))
        except Exception as e:
            logger.error(f"Scheduler: Data collection failed: {e}")
        finally:
            db.close()


def daily_prediction_job():
    if _celery_available():
        from app.tasks.prediction_tasks import run_all_predictions_task
        run_all_predictions_task.delay()
        logger.info("Scheduler: Dispatched predictions to Celery")
    else:
        from app.services.prediction_service import run_all_predictions
        from app.services.alert_service import check_and_send_alerts
        logger.info("Scheduler: Running predictions locally (no Celery)")
        db = SessionLocal()
        try:
            preds = run_all_predictions(db)
            pred_dicts = [
                {"grade": p.grade, "predicted_price": p.predicted_price, "horizon_days": p.horizon_days}
                for p in preds
            ]
            _run_async(check_and_send_alerts(db, pred_dicts))
        except Exception as e:
            logger.error(f"Scheduler: Prediction job failed: {e}")
        finally:
            db.close()


def monthly_retrain_check_job():
    if _celery_available():
        from app.tasks.training_tasks import check_retrain_task
        check_retrain_task.delay()
        logger.info("Scheduler: Dispatched retrain check to Celery")
    else:
        from app.services.model_evaluation import check_and_retrain_if_needed
        logger.info("Scheduler: Running retrain check locally (no Celery)")
        db = SessionLocal()
        try:
            check_and_retrain_if_needed(db)
        except Exception as e:
            logger.error(f"Scheduler: Retrain check failed: {e}")
        finally:
            db.close()


def start_scheduler():
    scheduler.add_job(
        daily_data_collection_job,
        CronTrigger(hour=21, minute=0),
        id="daily_data_collection",
        replace_existing=True,
    )
    scheduler.add_job(
        daily_prediction_job,
        CronTrigger(hour=22, minute=0),
        id="daily_prediction",
        replace_existing=True,
    )
    scheduler.add_job(
        monthly_retrain_check_job,
        CronTrigger(day=1, hour=18, minute=0),
        id="monthly_retrain_check",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started (Celery Beat preferred in production)")


def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler shut down")
