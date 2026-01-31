"""Unified data collection orchestrator.

Fetches data from all sources and stores into DB.
Handles failures gracefully — each source is independent.
"""

import logging
from datetime import date

from sqlalchemy.orm import Session

from app.models.market_data import (
    AvianFluStatus,
    ExchangeRate,
    FeedPrice,
    TradingVolume,
    WeatherData,
)
from app.services.kamis_client import fetch_daily_prices
from app.services.volume_client import fetch_trading_volume
from app.services.feed_client import fetch_feed_prices
from app.services.exchange_client import fetch_exchange_rate
from app.services.avian_flu_client import fetch_avian_flu_status
from app.services.weather_client import fetch_weather_data
from app.services.price_service import fetch_and_store_prices

logger = logging.getLogger(__name__)


async def collect_all_daily_data(db: Session, target_date: date | None = None):
    """Run all daily data collection tasks. Each source is independent."""
    if target_date is None:
        target_date = date.today()

    logger.info(f"Starting full data collection for {target_date}")
    results = {"date": target_date, "sources": {}}

    # 1. Egg prices (KAMIS) — daily
    try:
        stored = await fetch_and_store_prices(db, target_date)
        results["sources"]["egg_prices"] = len(stored)
        logger.info(f"  egg_prices: {len(stored)} records")
    except Exception as e:
        results["sources"]["egg_prices"] = f"error: {e}"
        logger.error(f"  egg_prices failed: {e}")

    # 2. Trading volume (다봄) — daily
    try:
        vol = await fetch_trading_volume(target_date)
        if vol:
            _upsert_volume(db, vol)
            results["sources"]["volume"] = vol["volume_kg"]
            logger.info(f"  volume: {vol['volume_kg']} kg")
        else:
            results["sources"]["volume"] = "no data"
    except Exception as e:
        results["sources"]["volume"] = f"error: {e}"
        logger.error(f"  volume failed: {e}")

    # 3. Feed prices (aT) — weekly (but attempt daily, API returns latest)
    try:
        feeds = await fetch_feed_prices(target_date)
        for f in feeds:
            _upsert_feed_price(db, f)
        results["sources"]["feed_prices"] = len(feeds)
        logger.info(f"  feed_prices: {len(feeds)} records")
    except Exception as e:
        results["sources"]["feed_prices"] = f"error: {e}"
        logger.error(f"  feed_prices failed: {e}")

    # 4. Exchange rate (한국은행) — daily
    try:
        rate = await fetch_exchange_rate(target_date)
        if rate:
            _upsert_exchange_rate(db, rate)
            results["sources"]["exchange_rate"] = rate["usd_krw"]
            logger.info(f"  exchange_rate: {rate['usd_krw']}")
        else:
            results["sources"]["exchange_rate"] = "no data"
    except Exception as e:
        results["sources"]["exchange_rate"] = f"error: {e}"
        logger.error(f"  exchange_rate failed: {e}")

    # 5. Avian flu (검역본부) — daily
    try:
        flu = await fetch_avian_flu_status(target_date)
        _upsert_avian_flu(db, flu)
        results["sources"]["avian_flu"] = flu["is_outbreak"]
        logger.info(f"  avian_flu: outbreak={flu['is_outbreak']}")
    except Exception as e:
        results["sources"]["avian_flu"] = f"error: {e}"
        logger.error(f"  avian_flu failed: {e}")

    # 6. Weather (기상청) — daily
    try:
        weather = await fetch_weather_data(target_date)
        if weather:
            _upsert_weather(db, weather)
            results["sources"]["weather"] = weather["avg_temperature"]
            logger.info(f"  weather: avg_temp={weather['avg_temperature']}")
        else:
            results["sources"]["weather"] = "no data"
    except Exception as e:
        results["sources"]["weather"] = f"error: {e}"
        logger.error(f"  weather failed: {e}")

    db.commit()
    logger.info(f"Data collection complete for {target_date}: {results['sources']}")
    return results


def _upsert_volume(db: Session, data: dict):
    existing = db.query(TradingVolume).filter(TradingVolume.date == data["date"]).first()
    if existing:
        existing.volume_kg = data["volume_kg"]
    else:
        db.add(TradingVolume(date=data["date"], volume_kg=data["volume_kg"]))


def _upsert_feed_price(db: Session, data: dict):
    existing = (
        db.query(FeedPrice)
        .filter(FeedPrice.date == data["date"], FeedPrice.feed_type == data["feed_type"])
        .first()
    )
    if existing:
        existing.price = data["price"]
    else:
        db.add(FeedPrice(
            date=data["date"],
            feed_type=data["feed_type"],
            price=data["price"],
            unit=data.get("unit", "원/kg"),
        ))


def _upsert_exchange_rate(db: Session, data: dict):
    existing = db.query(ExchangeRate).filter(ExchangeRate.date == data["date"]).first()
    if existing:
        existing.usd_krw = data["usd_krw"]
    else:
        db.add(ExchangeRate(date=data["date"], usd_krw=data["usd_krw"]))


def _upsert_avian_flu(db: Session, data: dict):
    existing = db.query(AvianFluStatus).filter(AvianFluStatus.date == data["date"]).first()
    if existing:
        existing.is_outbreak = data["is_outbreak"]
        existing.case_count = data["case_count"]
        existing.region = data.get("region")
    else:
        db.add(AvianFluStatus(
            date=data["date"],
            is_outbreak=data["is_outbreak"],
            case_count=data["case_count"],
            region=data.get("region"),
        ))


def _upsert_weather(db: Session, data: dict):
    existing = db.query(WeatherData).filter(WeatherData.date == data["date"]).first()
    if existing:
        existing.avg_temperature = data.get("avg_temperature")
        existing.max_temperature = data.get("max_temperature")
        existing.min_temperature = data.get("min_temperature")
        existing.humidity = data.get("humidity")
    else:
        db.add(WeatherData(
            date=data["date"],
            avg_temperature=data.get("avg_temperature"),
            max_temperature=data.get("max_temperature"),
            min_temperature=data.get("min_temperature"),
            humidity=data.get("humidity"),
        ))
