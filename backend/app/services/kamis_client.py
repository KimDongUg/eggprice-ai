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

# KAMIS 지역 코드 매핑
REGION_CODE_MAP = {
    "seoul": "1101",
    "busan": "2100",
    "daegu": "2200",
    "gwangju": "2401",
    "daejeon": "2501",
}


async def fetch_daily_prices(
    target_date: date | None = None,
    region: str = "seoul",
) -> list[dict]:
    """Fetch egg prices from KAMIS API for a specific date and region."""
    if target_date is None:
        target_date = date.today()

    country_code = REGION_CODE_MAP.get(region, "1101")

    params = {
        "action": "dailyPriceByCategoryList",
        "p_cert_key": settings.KAMIS_API_KEY,
        "p_cert_id": settings.KAMIS_API_ID,
        "p_returntype": "json",
        "p_product_cls_code": "02",  # 도매
        "p_item_category_code": ITEM_CATEGORY_CODE,
        "p_item_code": ITEM_CODE,
        "p_kind_code": KIND_CODE,
        "p_regday": target_date.strftime("%Y-%m-%d"),
        "p_convert_kg_yn": "N",
        "p_country_code": country_code,
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
                    "wholesale_price": float(price_str),
                    "unit": item.get("unit", "30개"),
                })
        except httpx.HTTPStatusError as e:
            logger.error(f"KAMIS API HTTP error: {e.response.status_code}")
        except Exception as e:
            logger.error(f"KAMIS API error: {e}")

    return results


async def fetch_regional_current_prices(region: str) -> list[dict]:
    """Fetch current prices for a specific region from KAMIS.

    Returns data in the same format as get_current_prices() service.
    """
    today = date.today()
    # Try today first, then yesterday (weekends/holidays may have no data)
    for offset in range(0, 4):
        target = today - timedelta(days=offset)
        prices = await fetch_daily_prices(target, region=region)
        if prices:
            return prices
    return []


async def fetch_historical_prices(
    start_date: date,
    end_date: date | None = None,
    region: str = "seoul",
) -> list[dict]:
    """Fetch historical egg prices day by day."""
    if end_date is None:
        end_date = date.today()

    all_results = []
    current = start_date
    while current <= end_date:
        daily = await fetch_daily_prices(current, region=region)
        all_results.extend(daily)
        current += timedelta(days=1)

    return all_results
