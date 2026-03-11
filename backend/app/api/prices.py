from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.core.cache import cache_get, cache_set
from app.core.config import settings
from app.core.database import get_db
from app.core.rate_limit import limiter
from app.schemas.price import PriceWithChange
from app.services.price_commentary import generate_price_commentary
from app.services.price_service import get_current_prices, get_price_history

router = APIRouter(tags=["prices"])


@router.get("/prices/current", response_model=list[PriceWithChange])
@limiter.limit(settings.RATE_LIMIT_API)
async def current_prices(
    request: Request,
    region: str = Query("seoul", description="지역 코드"),
    db: Session = Depends(get_db),
):
    """현재 가격 조회 (지역별)"""
    cache_key = f"prices:current:{region}"
    hit = cache_get(cache_key)
    if hit is not None:
        return hit

    result = get_current_prices(db, region=region)

    cache_set(cache_key, result, ttl=180)
    return result


@router.get("/prices/history")
@limiter.limit(settings.RATE_LIMIT_API)
async def price_history(
    request: Request,
    grade: str = Query(default="특란", description="계란 등급"),
    days: int = Query(default=90, ge=1, le=365, description="조회 기간 (일)"),
    region: str = Query(default="seoul", description="지역 코드"),
    compact: bool = Query(default=False, description="경량 응답 (d/r/w 필드만)"),
    db: Session = Depends(get_db),
):
    """과거 가격 조회 (지역별)"""
    cache_key = f"prices:history:{grade}:{days}:{region}:{'c' if compact else 'f'}"
    hit = cache_get(cache_key)
    if hit is not None:
        return hit

    result = get_price_history(db, grade, days, region=region)

    if compact:
        serialized = [
            {
                "d": str(r.date),
                "w": int(r.wholesale_price or 0),
            }
            for r in result
        ]
    else:
        serialized = [
            {
                "id": r.id, "date": str(r.date), "grade": r.grade,
                "wholesale_price": r.wholesale_price,
                "unit": r.unit, "created_at": str(r.created_at),
            }
            for r in result
        ]

    cache_set(cache_key, serialized, ttl=300)
    return serialized


@router.get("/prices/today-summary")
@limiter.limit(settings.RATE_LIMIT_API)
async def today_summary(
    request: Request,
    grade: str = Query(default="특란"),
    region: str = Query(default="seoul"),
    db: Session = Depends(get_db),
):
    """오늘 가격 요약 + 통계 + 자동 해설"""
    cache_key = f"prices:today-summary:{grade}:{region}"
    hit = cache_get(cache_key)
    if hit is not None:
        return hit

    # 현재 가격
    current = get_current_prices(db, region=region)
    grade_data = next((p for p in current if p["grade"] == grade), None)
    if not grade_data:
        return {"error": "해당 등급의 가격 데이터가 없습니다."}

    price = grade_data["wholesale_price"]
    change = grade_data.get("daily_change")
    change_pct = grade_data.get("daily_change_pct")

    # 7일/30일 히스토리 통계
    history_7d = get_price_history(db, grade, 7, region=region)
    history_30d = get_price_history(db, grade, 30, region=region)

    prices_7d = [r.wholesale_price for r in history_7d if r.wholesale_price]
    prices_30d = [r.wholesale_price for r in history_30d if r.wholesale_price]

    avg_7d = sum(prices_7d) / len(prices_7d) if prices_7d else None
    avg_30d = sum(prices_30d) / len(prices_30d) if prices_30d else None
    min_7d = min(prices_7d) if prices_7d else None
    max_7d = max(prices_7d) if prices_7d else None
    min_30d = min(prices_30d) if prices_30d else None
    max_30d = max(prices_30d) if prices_30d else None

    region_label = {
        "seoul": "서울", "busan": "부산", "daegu": "대구",
        "gwangju": "광주", "daejeon": "대전",
    }.get(region, region)

    # 해설 생성
    commentary = generate_price_commentary(
        price=price,
        change=change,
        change_pct=change_pct,
        avg_7d=avg_7d,
        avg_30d=avg_30d,
        grade=grade,
        region=region_label,
    )

    result = {
        "date": grade_data["date"],
        "region": region,
        "region_label": region_label,
        "grade": grade,
        "price": price,
        "unit": grade_data["unit"],
        "change": change,
        "change_pct": change_pct,
        "stats": {
            "avg_7d": round(avg_7d) if avg_7d else None,
            "avg_30d": round(avg_30d) if avg_30d else None,
            "min_7d": min_7d,
            "max_7d": max_7d,
            "min_30d": min_30d,
            "max_30d": max_30d,
        },
        "commentary": commentary,
    }

    cache_set(cache_key, result, ttl=600)
    return result
