"""Client for 한국농수산식품유통공사 (aT) API — feed/grain prices."""

import logging
from datetime import date

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

AT_BASE_URL = "https://at.agromarket.kr/openApi/price/sale.do"


async def fetch_feed_prices(target_date: date | None = None) -> list[dict]:
    """Fetch feed/grain prices from aT API.

    Returns records for 배합사료, 옥수수, 대두박.
    """
    if target_date is None:
        target_date = date.today()

    if not settings.AT_API_KEY:
        logger.warning("AT_API_KEY not configured, skipping feed price fetch")
        return []

    params = {
        "serviceKey": settings.AT_API_KEY,
        "type": "json",
        "pageNo": "1",
        "numOfRows": "50",
        "yyyy": target_date.strftime("%Y"),
        "mm": target_date.strftime("%m"),
    }

    results = []
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(AT_BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

            items = data.get("data", [])
            if not items:
                logger.info(f"No feed price data for {target_date}")
                return results

            # Map known feed types
            feed_keywords = {
                "배합사료": "배합사료",
                "옥수수": "옥수수",
                "대두박": "대두박",
            }

            for item in items:
                name = item.get("prdlstNm", "")
                for keyword, feed_type in feed_keywords.items():
                    if keyword in name:
                        price_str = str(item.get("price", "0")).replace(",", "").strip()
                        if price_str in ("-", "", "0"):
                            continue
                        results.append({
                            "date": target_date,
                            "feed_type": feed_type,
                            "price": float(price_str),
                            "unit": item.get("unit", "원/kg"),
                        })
                        break

        except httpx.HTTPStatusError as e:
            logger.error(f"aT API HTTP error: {e.response.status_code}")
        except Exception as e:
            logger.error(f"aT API error: {e}")

    return results
