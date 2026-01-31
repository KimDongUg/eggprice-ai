"""Client for 한국은행 (Bank of Korea) API — exchange rates."""

import logging
from datetime import date

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

BOK_BASE_URL = "https://ecos.bok.or.kr/api/StatisticSearch"

# ECOS stat codes
EXCHANGE_RATE_TABLE = "731Y001"  # 환율
EXCHANGE_RATE_ITEM = "0000001"  # 원/달러


async def fetch_exchange_rate(target_date: date | None = None) -> dict | None:
    """Fetch USD/KRW exchange rate from Bank of Korea API.

    Returns dict with keys: date, usd_krw. Or None on failure.
    """
    if target_date is None:
        target_date = date.today()

    if not settings.BOK_API_KEY:
        logger.warning("BOK_API_KEY not configured, skipping exchange rate fetch")
        return None

    date_str = target_date.strftime("%Y%m%d")
    url = (
        f"{BOK_BASE_URL}/{settings.BOK_API_KEY}/json/kr/1/1/"
        f"{EXCHANGE_RATE_TABLE}/D/{date_str}/{date_str}/{EXCHANGE_RATE_ITEM}"
    )

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()

            rows = data.get("StatisticSearch", {}).get("row", [])
            if not rows:
                logger.info(f"No exchange rate data for {target_date}")
                return None

            rate_str = rows[0].get("DATA_VALUE", "0").replace(",", "").strip()
            if not rate_str or rate_str == "0":
                return None

            return {
                "date": target_date,
                "usd_krw": float(rate_str),
            }
        except httpx.HTTPStatusError as e:
            logger.error(f"BOK API HTTP error: {e.response.status_code}")
        except Exception as e:
            logger.error(f"BOK API error: {e}")

    return None
