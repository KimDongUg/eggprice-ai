"""Client for 농림축산검역본부 — Avian Influenza outbreak status.

Uses the AI outbreak public data API (KAHIS).
"""

import logging
from datetime import date

import httpx

logger = logging.getLogger(__name__)

KAHIS_BASE_URL = "https://kahis.go.kr/openApi/apiList/dissList.do"


async def fetch_avian_flu_status(target_date: date | None = None) -> dict:
    """Fetch avian flu outbreak status for a given date.

    Returns dict with keys: date, is_outbreak, case_count, region.
    Falls back to safe defaults if the API is unreachable.
    """
    if target_date is None:
        target_date = date.today()

    result = {
        "date": target_date,
        "is_outbreak": False,
        "case_count": 0,
        "region": None,
    }

    params = {
        "serviceType": "json",
        "diseaseCode": "AI",  # Avian Influenza
        "startDate": target_date.strftime("%Y%m%d"),
        "endDate": target_date.strftime("%Y%m%d"),
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(KAHIS_BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

            items = data.get("data", data.get("items", []))
            if not items:
                return result

            if isinstance(items, list):
                # Count unique cases for the date
                cases = [
                    i for i in items
                    if i.get("occrrncDate", "") == target_date.strftime("%Y%m%d")
                    or i.get("occrrnc_date", "") == target_date.strftime("%Y-%m-%d")
                ]
                if cases:
                    regions = [c.get("sigungu", c.get("region", "")) for c in cases]
                    result["is_outbreak"] = True
                    result["case_count"] = len(cases)
                    result["region"] = ", ".join(filter(None, regions))[:100]

        except httpx.HTTPStatusError as e:
            logger.error(f"KAHIS API HTTP error: {e.response.status_code}")
        except Exception as e:
            logger.warning(f"KAHIS API unavailable: {e}")

    return result


async def fetch_avian_flu_recent(days: int = 30) -> list[dict]:
    """Check if there have been any AI outbreaks in the recent period.

    Returns list of outbreak records. Used for feature engineering — the
    model cares about whether there is an active outbreak window.
    """
    from datetime import timedelta
    results = []
    end = date.today()
    start = end - timedelta(days=days)

    params = {
        "serviceType": "json",
        "diseaseCode": "AI",
        "startDate": start.strftime("%Y%m%d"),
        "endDate": end.strftime("%Y%m%d"),
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(KAHIS_BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

            items = data.get("data", data.get("items", []))
            if isinstance(items, list):
                for item in items:
                    dt_str = item.get("occrrncDate", item.get("occrrnc_date", ""))
                    if dt_str:
                        try:
                            dt = date.fromisoformat(dt_str.replace("/", "-")[:10])
                        except ValueError:
                            continue
                        results.append({
                            "date": dt,
                            "is_outbreak": True,
                            "case_count": 1,
                            "region": item.get("sigungu", item.get("region")),
                        })
        except Exception as e:
            logger.warning(f"KAHIS recent fetch failed: {e}")

    return results
