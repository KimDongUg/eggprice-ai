import logging
from datetime import date, timedelta

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

KAMIS_BASE_URL = "https://www.kamis.or.kr/service/price/xml.do"

# 계란 품목코드 (KAMIS API는 카테고리 단위로 반환, item_code로 필터)
ITEM_CATEGORY_CODE = "500"  # 축산물
EGG_ITEM_CODE = "9903"  # 계란 (API 응답 내 item_code)

# KAMIS kind_code → 등급 매핑 (30구 도매 기준)
EGG_KIND_MAP = {
    "22": "왕란",
    "23": "특란",
    "24": "대란",
    "25": "중란",
    "26": "소란",
}

# KAMIS 지역 코드 매핑
REGION_CODE_MAP = {
    "seoul": "1101",
    "busan": "2100",
    "daegu": "2200",
    "gwangju": "2401",
    "daejeon": "2501",
}

# 해외 서버에서 KAMIS 접근 시 느릴 수 있으므로 충분한 타임아웃 설정
KAMIS_TIMEOUT = 60.0
KAMIS_MAX_RETRIES = 2


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
        "p_regday": target_date.strftime("%Y-%m-%d"),
        "p_convert_kg_yn": "N",
        "p_country_code": country_code,
    }

    results = []
    transport = httpx.AsyncHTTPTransport(retries=KAMIS_MAX_RETRIES)
    async with httpx.AsyncClient(
        timeout=KAMIS_TIMEOUT, follow_redirects=True, transport=transport,
    ) as client:
        try:
            logger.info(f"KAMIS API call: date={target_date}, region={region}, id={settings.KAMIS_API_ID}")
            response = await client.get(KAMIS_BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

            raw_data = data.get("data", {})
            logger.info(f"KAMIS response: type={type(raw_data).__name__}, error_code={raw_data.get('error_code') if isinstance(raw_data, dict) else 'N/A'}")

            # KAMIS API가 data를 list로 반환하는 경우 처리
            if isinstance(raw_data, list):
                items = []
                for entry in raw_data:
                    if isinstance(entry, dict) and "item" in entry:
                        entry_items = entry["item"]
                        if isinstance(entry_items, list):
                            items.extend(entry_items)
                        elif isinstance(entry_items, dict):
                            items.append(entry_items)
            else:
                items = raw_data.get("item", [])

            if not items or items == "":
                logger.warning(f"No data returned from KAMIS for {target_date}, region={region}")
                return results

            egg_count = 0
            for item in items:
                if item.get("item_code") != EGG_ITEM_CODE:
                    continue
                egg_count += 1
                kind_code = item.get("kind_code", "")
                grade = EGG_KIND_MAP.get(kind_code)
                if not grade:
                    continue

                price_str = item.get("dpr1", "0").replace(",", "").strip()
                if price_str in ("-", "", "0"):
                    continue

                results.append({
                    "date": target_date,
                    "grade": grade,
                    "wholesale_price": float(price_str),
                    "unit": "30개",
                })

            logger.info(f"KAMIS: {len(items)} total items, {egg_count} egg items, {len(results)} with price for {target_date} region={region}")
        except httpx.TimeoutException as e:
            logger.error(f"KAMIS API timeout ({KAMIS_TIMEOUT}s): {e}")
        except httpx.HTTPStatusError as e:
            logger.error(f"KAMIS API HTTP error: {e.response.status_code}")
        except Exception as e:
            logger.error(f"KAMIS API error: {type(e).__name__}: {e}")

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
