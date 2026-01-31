"""Client for 기상청 (KMA) API — weather/temperature data."""

import logging
from datetime import date, timedelta

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

KMA_BASE_URL = "http://apis.data.go.kr/1360000/AsosDalyInfoService/getWthrDataList"

# Seoul (108) as representative station
DEFAULT_STN_ID = "108"


async def fetch_weather_data(target_date: date | None = None) -> dict | None:
    """Fetch daily weather data from KMA API.

    Returns dict with keys: date, avg_temperature, max_temperature,
    min_temperature, humidity. Or None on failure.
    """
    if target_date is None:
        target_date = date.today() - timedelta(days=1)  # KMA data has 1-day lag

    if not settings.KMA_API_KEY:
        logger.warning("KMA_API_KEY not configured, skipping weather fetch")
        return None

    params = {
        "serviceKey": settings.KMA_API_KEY,
        "numOfRows": "1",
        "pageNo": "1",
        "dataType": "JSON",
        "dataCd": "ASOS",
        "dateCd": "DAY",
        "startDt": target_date.strftime("%Y%m%d"),
        "endDt": target_date.strftime("%Y%m%d"),
        "stnIds": DEFAULT_STN_ID,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(KMA_BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

            body = data.get("response", {}).get("body", {})
            items = body.get("items", {}).get("item", [])
            if not items:
                logger.info(f"No weather data for {target_date}")
                return None

            item = items[0]
            return {
                "date": target_date,
                "avg_temperature": _safe_float(item.get("avgTa")),
                "max_temperature": _safe_float(item.get("maxTa")),
                "min_temperature": _safe_float(item.get("minTa")),
                "humidity": _safe_float(item.get("avgRhm")),
            }
        except httpx.HTTPStatusError as e:
            logger.error(f"KMA API HTTP error: {e.response.status_code}")
        except Exception as e:
            logger.error(f"KMA API error: {e}")

    return None


def _safe_float(value) -> float | None:
    if value is None or str(value).strip() in ("", "-"):
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None
