from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.core.cache import cache_get, cache_set
from app.core.config import settings
from app.core.database import get_db
from app.core.rate_limit import limiter
from app.schemas.price import PriceResponse, PriceWithChange
from app.services.price_service import get_current_prices, get_price_history

router = APIRouter(tags=["prices"])


@router.get("/prices/current", response_model=list[PriceWithChange])
@limiter.limit(settings.RATE_LIMIT_API)
async def current_prices(request: Request, db: Session = Depends(get_db)):
    """현재 가격 조회"""
    cache_key = "prices:current"
    hit = cache_get(cache_key)
    if hit is not None:
        return hit

    result = get_current_prices(db)
    cache_set(cache_key, result, ttl=180)
    return result


@router.get("/prices/history")
@limiter.limit(settings.RATE_LIMIT_API)
async def price_history(
    request: Request,
    grade: str = Query(default="대란", description="계란 등급"),
    days: int = Query(default=90, ge=1, le=365, description="조회 기간 (일)"),
    compact: bool = Query(default=False, description="경량 응답 (d/r/w 필드만)"),
    db: Session = Depends(get_db),
):
    """과거 가격 조회 (compact=true 시 경량 응답)"""
    cache_key = f"prices:history:{grade}:{days}:{'c' if compact else 'f'}"
    hit = cache_get(cache_key)
    if hit is not None:
        return hit

    result = get_price_history(db, grade, days)

    if compact:
        serialized = [
            {
                "d": str(r.date),
                "r": int(r.retail_price or 0),
                "w": int(r.wholesale_price or 0),
            }
            for r in result
        ]
    else:
        serialized = [
            {
                "id": r.id, "date": str(r.date), "grade": r.grade,
                "wholesale_price": r.wholesale_price, "retail_price": r.retail_price,
                "unit": r.unit, "created_at": str(r.created_at),
            }
            for r in result
        ]

    cache_set(cache_key, serialized, ttl=300)
    return serialized
