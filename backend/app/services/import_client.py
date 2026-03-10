"""Client for egg import data (계란 수입 데이터).

Data source: KATI (한국농수산식품유통공사 수출입 통계)
API: https://www.kati.net/ — monthly import volume and price.
Fallback: manual CSV or admin input when API is unavailable.
"""

import logging
from datetime import date

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

KATI_API_URL = "https://www.kati.net/api/importExport/itemList.do"


async def fetch_egg_import_data(target_date: date | None = None) -> dict | None:
    """Fetch monthly egg import data from KATI API.

    Returns dict with date, import_volume_kg, import_price_usd, origin_country
    or None if data unavailable.
    """
    if target_date is None:
        target_date = date.today()

    kati_key = getattr(settings, "KATI_API_KEY", None)
    if not kati_key:
        logger.info("KATI_API_KEY not configured, skipping egg import fetch")
        return None

    params = {
        "serviceKey": kati_key,
        "type": "json",
        "hscode": "0407",  # HS code for eggs
        "year": target_date.strftime("%Y"),
        "month": target_date.strftime("%m"),
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(KATI_API_URL, params=params)
            response.raise_for_status()
            data = response.json()

            items = data.get("data", data.get("items", []))
            if not items:
                logger.info(f"No egg import data for {target_date.strftime('%Y-%m')}")
                return None

            # Aggregate total import volume and average price
            total_volume = 0.0
            total_value = 0.0
            main_country = None
            max_vol = 0.0

            for item in items:
                vol = float(item.get("weight", item.get("importWeight", 0)) or 0)
                val = float(item.get("amount", item.get("importAmount", 0)) or 0)
                total_volume += vol
                total_value += val
                country = item.get("cntryNm", item.get("country", ""))
                if vol > max_vol:
                    max_vol = vol
                    main_country = country

            avg_price = (total_value / total_volume) if total_volume > 0 else 0.0

            return {
                "date": target_date.replace(day=1),  # monthly data → first of month
                "import_volume_kg": total_volume,
                "import_price_usd": round(avg_price, 4),
                "origin_country": main_country,
            }

        except httpx.HTTPStatusError as e:
            logger.error(f"KATI API HTTP error: {e.response.status_code}")
        except Exception as e:
            logger.error(f"KATI API error: {e}")

    return None
