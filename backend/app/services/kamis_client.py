import logging
from datetime import date, timedelta

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

KAMIS_BASE_URL = "http://www.kamis.or.kr/service/price/xml.do"

# 계란 품목코드
ITEM_CATEGORY_CODE = "500"  # 축산물
ITEM_CODE = "221"  # 계란
KIND_CODE = "01"  # 신선란

GRADE_MAP = {
    "왕란": "09",
    "특란": "08",
    "대란": "04",
    "중란": "05",
    "소란": "06",
}


async def fetch_daily_prices(
    target_date: date | None = None,
) -> list[dict]:
    """Fetch egg prices from KAMIS API for a specific date."""
    if target_date is None:
        target_date = date.today()

    params = {
        "action": "dailyPriceByCategoryList",
        "p_cert_key": settings.KAMIS_API_KEY,
        "p_cert_id": settings.KAMIS_API_ID,
        "p_returntype": "json",
        "p_product_cls_code": "01",  # 소매
        "p_item_category_code": ITEM_CATEGORY_CODE,
        "p_item_code": ITEM_CODE,
        "p_kind_code": KIND_CODE,
        "p_regday": target_date.strftime("%Y-%m-%d"),
        "p_convert_kg_yn": "N",
    }

    results = []
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(KAMIS_BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

            items = data.get("data", {}).get("item", [])
            if not items or items == "":
                logger.warning(f"No data returned from KAMIS for {target_date}")
                return results

            for item in items:
                grade_name = item.get("rank", "").strip()
                if grade_name not in GRADE_MAP:
                    continue

                price_str = item.get("dpr1", "0").replace(",", "").strip()
                if price_str in ("-", "", "0"):
                    continue

                results.append({
                    "date": target_date,
                    "grade": grade_name,
                    "retail_price": float(price_str),
                    "unit": item.get("unit", "30개"),
                })
        except httpx.HTTPStatusError as e:
            logger.error(f"KAMIS API HTTP error: {e.response.status_code}")
        except Exception as e:
            logger.error(f"KAMIS API error: {e}")

    # Fetch wholesale prices separately
    params["p_product_cls_code"] = "02"  # 도매
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(KAMIS_BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

            items = data.get("data", {}).get("item", [])
            if not items or items == "":
                return results

            for item in items:
                grade_name = item.get("rank", "").strip()
                price_str = item.get("dpr1", "0").replace(",", "").strip()
                if price_str in ("-", "", "0"):
                    continue

                for r in results:
                    if r["grade"] == grade_name:
                        r["wholesale_price"] = float(price_str)
                        break
        except Exception as e:
            logger.error(f"KAMIS wholesale API error: {e}")

    return results


async def fetch_historical_prices(
    start_date: date,
    end_date: date | None = None,
) -> list[dict]:
    """Fetch historical egg prices day by day."""
    if end_date is None:
        end_date = date.today()

    all_results = []
    current = start_date
    while current <= end_date:
        daily = await fetch_daily_prices(current)
        all_results.extend(daily)
        current += timedelta(days=1)

    return all_results
