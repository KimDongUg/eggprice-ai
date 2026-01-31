"""Client for 축산유통정보 다봄 — egg trading volume data.

Uses public API endpoint for livestock distribution information.
"""

import logging
from datetime import date

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

DABOM_BASE_URL = "https://www.ekapepia.com/openApi/eggsTradeInfo.do"


async def fetch_trading_volume(target_date: date | None = None) -> dict | None:
    """Fetch egg trading volume from 다봄.

    Returns dict with keys: date, volume_kg. Or None on failure.
    """
    if target_date is None:
        target_date = date.today()

    params = {
        "serviceKey": settings.KAMIS_API_KEY,  # Shares KAMIS-related auth
        "type": "json",
        "tradeDate": target_date.strftime("%Y%m%d"),
        "itemCode": "0221",  # 계란
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(DABOM_BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

            items = data.get("data", data.get("items", []))
            if not items:
                logger.info(f"No volume data for {target_date}")
                return None

            total_volume = 0.0
            if isinstance(items, list):
                for item in items:
                    vol_str = str(item.get("tradeQy", item.get("volume", "0")))
                    vol_str = vol_str.replace(",", "").strip()
                    if vol_str and vol_str != "-":
                        try:
                            total_volume += float(vol_str)
                        except ValueError:
                            pass

            if total_volume > 0:
                return {
                    "date": target_date,
                    "volume_kg": total_volume,
                }

        except httpx.HTTPStatusError as e:
            logger.error(f"다봄 API HTTP error: {e.response.status_code}")
        except Exception as e:
            logger.warning(f"다봄 API error: {e}")

    return None
