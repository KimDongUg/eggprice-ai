from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.cache import cache_get, cache_set
from app.core.config import settings
from app.core.database import get_db
from app.core.rate_limit import limiter
from app.models.price import EggPrice
from app.schemas.prediction import (
    ForecastItem,
    ForecastResponse,
    PredictionResponse,
    PredictionSummary,
)
from app.services.prediction_service import get_predictions, run_all_predictions, regenerate_all_fallback_predictions

router = APIRouter(tags=["predictions"])


@router.get("/predictions/forecast", response_model=ForecastResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def forecast(
    request: Request,
    grade: str = "특란",
    region: str = "seoul",
    db: Session = Depends(get_db),
):
    """AI 예측 결과 (지역별)"""
    cache_key = f"forecast:{grade}:{region}"
    hit = cache_get(cache_key)
    if hit is not None:
        return hit

    preds = get_predictions(db, grade, region=region)
    if not preds:
        raise HTTPException(status_code=404, detail="예측 데이터가 없습니다.")

    # Get current price for this region
    latest = (
        db.query(EggPrice)
        .filter(
            EggPrice.grade == grade,
            EggPrice.region == region,
            EggPrice.wholesale_price.isnot(None),
        )
        .order_by(desc(EggPrice.date))
        .first()
    )
    # Fallback to Seoul
    if not latest and region != "seoul":
        latest = (
            db.query(EggPrice)
            .filter(
                EggPrice.grade == grade,
                EggPrice.region == "seoul",
                EggPrice.wholesale_price.isnot(None),
            )
            .order_by(desc(EggPrice.date))
            .first()
        )
    current_price = latest.wholesale_price if latest else None

    # Build forecast items
    items = []
    for p in preds:
        change_pct = 0.0
        if current_price and current_price > 0:
            change_pct = round((p.predicted_price - current_price) / current_price * 100, 1)
        items.append(ForecastItem(
            date=p.target_date,
            price=p.predicted_price,
            confidence_interval=[p.confidence_lower, p.confidence_upper],
            change_percent=change_pct,
        ))

    # Determine trend from 7-day prediction
    trend = "보합"
    alert_msg = None
    if items and current_price:
        pct_7d = items[0].change_percent
        if pct_7d >= 1.0:
            trend = "상승"
            alert_msg = f"향후 7일간 {abs(pct_7d)}% 상승 예상"
        elif pct_7d <= -1.0:
            trend = "하락"
            alert_msg = f"향후 7일간 {abs(pct_7d)}% 하락 예상"
        else:
            alert_msg = "향후 7일간 가격 변동 미미"

    result = ForecastResponse(
        grade=grade,
        current_price=current_price,
        predictions=items,
        trend=trend,
        alert=alert_msg,
    )
    cache_set(cache_key, result.model_dump(mode="json"), ttl=300)
    return result


@router.post("/predictions/refresh", response_model=list[PredictionResponse])
@limiter.limit(settings.RATE_LIMIT_API)
async def refresh_predictions(request: Request, db: Session = Depends(get_db)):
    """전 등급 × 전 지역 예측 재실행"""
    results = run_all_predictions(db)
    if not results:
        raise HTTPException(
            status_code=404,
            detail="모델이 학습되지 않았거나 데이터가 부족합니다.",
        )
    return results


@router.post("/predictions/regenerate")
@limiter.limit(settings.RATE_LIMIT_API)
async def regenerate_predictions(request: Request, db: Session = Depends(get_db)):
    """전 등급 × 전 지역 폴백 예측 재생성 (동일 base_date)"""
    count = regenerate_all_fallback_predictions(db)
    return {"message": f"{count}개 예측 데이터 재생성 완료", "count": count}


@router.get("/predictions/{grade}", response_model=PredictionSummary)
@limiter.limit(settings.RATE_LIMIT_API)
async def predictions_for_grade(
    request: Request,
    grade: str,
    region: str = "seoul",
    db: Session = Depends(get_db),
):
    """특정 등급의 가격 예측 결과 (지역별)"""
    cache_key = f"predictions:{grade}:{region}"
    hit = cache_get(cache_key)
    if hit is not None:
        return hit

    preds = get_predictions(db, grade, region=region)
    result = PredictionSummary(grade=grade, predictions=preds)
    cache_set(cache_key, result.model_dump(mode="json"), ttl=300)
    return result
