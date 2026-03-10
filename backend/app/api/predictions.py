from datetime import date, timedelta

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


@router.post("/predictions/refresh")
@limiter.limit(settings.RATE_LIMIT_API)
async def refresh_predictions(request: Request, db: Session = Depends(get_db)):
    """전 등급 × 전 지역 예측 재실행 (모델 없으면 폴백 재생성)"""
    results = run_all_predictions(db)
    if results:
        return {"message": f"{len(results)}개 예측 생성 완료 (ML 모델)", "count": len(results)}
    # ML 모델이 없으면 폴백 예측 재생성
    count = regenerate_all_fallback_predictions(db)
    return {"message": f"{count}개 폴백 예측 재생성 완료", "count": count}


@router.post("/predictions/regenerate")
@limiter.limit(settings.RATE_LIMIT_API)
async def regenerate_predictions(request: Request, db: Session = Depends(get_db)):
    """전 등급 × 전 지역 폴백 예측 재생성 (동일 base_date)"""
    count = regenerate_all_fallback_predictions(db)
    return {"message": f"{count}개 예측 데이터 재생성 완료", "count": count}


@router.get("/predictions/analysis")
@limiter.limit(settings.RATE_LIMIT_API)
async def prediction_analysis(
    request: Request,
    grade: str = "특란",
    region: str = "seoul",
    db: Session = Depends(get_db),
):
    """변동성 지수, 구매 권장 시점, 방향성 확률 분석"""
    # Get recent 30-day price history
    cutoff = date.today() - timedelta(days=30)
    prices = (
        db.query(EggPrice.date, EggPrice.wholesale_price)
        .filter(
            EggPrice.grade == grade,
            EggPrice.region == region,
            EggPrice.wholesale_price.isnot(None),
            EggPrice.date >= cutoff,
        )
        .order_by(EggPrice.date)
        .all()
    )

    price_values = [p.wholesale_price for p in prices if p.wholesale_price]

    # Volatility index (coefficient of variation * 100)
    volatility_index = 0.0
    if len(price_values) >= 2:
        mean_price = sum(price_values) / len(price_values)
        variance = sum((p - mean_price) ** 2 for p in price_values) / len(price_values)
        std_dev = variance ** 0.5
        volatility_index = round((std_dev / mean_price) * 100, 2) if mean_price > 0 else 0.0

    volatility_label = "안정" if volatility_index < 2 else "보통" if volatility_index < 5 else "높음"

    # Buy recommendation based on prediction trend
    preds = get_predictions(db, grade, region=region)
    buy_signal = "관망"
    buy_reason = "분석 데이터 부족"

    rise_probability = 50.0
    fall_probability = 50.0

    if preds and price_values:
        current = price_values[-1]
        pred_7d = [p for p in preds if p.horizon_days <= 7]

        # Direction probability from predictions
        up_count = sum(1 for p in pred_7d if p.predicted_price > current)
        rise_probability = round((up_count / len(pred_7d)) * 100, 1) if pred_7d else 50.0
        fall_probability = round(100 - rise_probability, 1)

        # Buy recommendation
        if pred_7d:
            avg_pred_7d = sum(p.predicted_price for p in pred_7d) / len(pred_7d)
            change_7d = (avg_pred_7d - current) / current * 100 if current > 0 else 0

            if change_7d >= 2.0:
                buy_signal = "매수 추천"
                buy_reason = f"7일 내 {change_7d:.1f}% 상승 예상 — 지금 구매가 유리합니다"
            elif change_7d <= -2.0:
                buy_signal = "매수 대기"
                buy_reason = f"7일 내 {abs(change_7d):.1f}% 하락 예상 — 가격이 더 내려갈 수 있습니다"
            elif volatility_index >= 5:
                buy_signal = "주의 관망"
                buy_reason = "가격 변동성이 높아 신중한 판단이 필요합니다"
            else:
                buy_signal = "적정 구매"
                buy_reason = "가격이 안정적이며 큰 변동이 예상되지 않습니다"

    # Risk warnings
    risk_alerts = []
    if volatility_index >= 5:
        risk_alerts.append({"level": "warning", "message": "최근 30일 가격 변동성이 높습니다"})
    if rise_probability >= 70:
        risk_alerts.append({"level": "info", "message": f"상승 확률 {rise_probability}% — 조기 구매를 고려하세요"})
    if fall_probability >= 70:
        risk_alerts.append({"level": "info", "message": f"하락 확률 {fall_probability}% — 구매를 늦추는 것이 유리할 수 있습니다"})

    return {
        "grade": grade,
        "region": region,
        "volatility_index": volatility_index,
        "volatility_label": volatility_label,
        "rise_probability": rise_probability,
        "fall_probability": fall_probability,
        "buy_signal": buy_signal,
        "buy_reason": buy_reason,
        "risk_alerts": risk_alerts,
        "price_count": len(price_values),
    }


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
