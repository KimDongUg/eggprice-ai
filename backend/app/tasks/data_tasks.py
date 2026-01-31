"""Celery tasks for data collection."""

import asyncio
import logging
from datetime import date

from app.core.celery_app import celery
from app.core.database import SessionLocal

logger = logging.getLogger(__name__)


@celery.task(name="app.tasks.data_tasks.collect_all_data_task", bind=True, max_retries=3)
def collect_all_data_task(self, target_date_str: str | None = None):
    """Collect data from all sources. Runs daily at 6AM KST."""
    from app.services.data_collector import collect_all_daily_data

    target = date.fromisoformat(target_date_str) if target_date_str else date.today()
    logger.info(f"Celery: Starting data collection for {target}")

    db = SessionLocal()
    try:
        loop = asyncio.new_event_loop()
        result = loop.run_until_complete(collect_all_daily_data(db, target))
        loop.close()
        logger.info(f"Celery: Data collection complete — {result}")
        return result
    except Exception as exc:
        logger.error(f"Celery: Data collection failed: {exc}")
        raise self.retry(exc=exc, countdown=60 * 5)  # retry in 5 min
    finally:
        db.close()


@celery.task(name="app.tasks.data_tasks.backfill_data_task")
def backfill_data_task(start_date_str: str, end_date_str: str):
    """Backfill historical data for a date range."""
    from datetime import timedelta
    from app.services.data_collector import collect_all_daily_data

    start = date.fromisoformat(start_date_str)
    end = date.fromisoformat(end_date_str)
    logger.info(f"Celery: Backfilling data from {start} to {end}")

    db = SessionLocal()
    current = start
    try:
        loop = asyncio.new_event_loop()
        while current <= end:
            try:
                loop.run_until_complete(collect_all_daily_data(db, current))
            except Exception as e:
                logger.warning(f"Backfill failed for {current}: {e}")
            current += timedelta(days=1)
        loop.close()
    finally:
        db.close()

    logger.info(f"Celery: Backfill complete for {start} to {end}")
