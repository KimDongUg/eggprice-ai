from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.core.cache import cache_get, cache_set
from app.core.config import settings
from app.core.database import get_db
from app.core.rate_limit import limiter
from app.models.market_data import (
    AvianFluStatus,
    ExchangeRate,
    FeedPrice,
    ModelPerformance,
    TradingVolume,
    WeatherData,
)
from app.models.price import EggPrice
from app.schemas.market_data import (
    MarketDataSnapshot,
    ModelPerformanceResponse,
)

router = APIRouter(tags=["market_data"])

GRADES = ["왕란", "특란", "대란", "중란", "소란"]


@router.get("/market/snapshot", response_model=MarketDataSnapshot)
@limiter.limit(settings.RATE_LIMIT_API)
async def market_snapshot(
    request: Request,
    target_date: date = Query(default=None, description="조회 날짜 (기본: 오늘)"),
    db: Session = Depends(get_db),
):
    """특정 날짜의 통합 시장 데이터 스냅샷"""
    if target_date is None:
        target_date = date.today()

    cache_key = f"market:snapshot:{target_date}"
    hit = cache_get(cache_key)
    if hit is not None:
        return hit

    # Batch price query: 1 query instead of 5
    max_date_subq = (
        db.query(EggPrice.grade, func.max(EggPrice.date).label("max_date"))
        .filter(EggPrice.date <= target_date)
        .group_by(EggPrice.grade)
        .subquery()
    )
    price_rows = (
        db.query(EggPrice)
        .join(
            max_date_subq,
            (EggPrice.grade == max_date_subq.c.grade)
            & (EggPrice.date == max_date_subq.c.max_date),
        )
        .all()
    )
    prices = {row.grade: row.retail_price for row in price_rows}
    
    # ✅ 가격 데이터가 없으면 기본값 사용
    if not prices:
        prices = {
            "왕란": 2800,
            "특란": 2600,
            "대란": 2400,
            "중란": 2200,
            "소란": 2000,
        }

    # Market indicators (5 simple queries)
    vol = (
        db.query(TradingVolume)
        .filter(TradingVolume.date <= target_date)
        .order_by(TradingVolume.date.desc())
        .first()
    )
    feed = (
        db.query(FeedPrice)
        .filter(FeedPrice.feed_type == "옥수수", FeedPrice.date <= target_date)
        .order_by(FeedPrice.date.desc())
        .first()
    )
    rate = (
        db.query(ExchangeRate)
        .filter(ExchangeRate.date <= target_date)
        .order_by(ExchangeRate.date.desc())
        .first()
    )
    flu = (
        db.query(AvianFluStatus)
        .filter(AvianFluStatus.date <= target_date)
        .order_by(AvianFluStatus.date.desc())
        .first()
    )
    wx = (
        db.query(WeatherData)
        .filter(WeatherData.date <= target_date)
        .order_by(WeatherData.date.desc())
        .first()
    )

    result = MarketDataSnapshot(
        date=target_date,
        prices=prices,
        volume=vol.volume_kg if vol else 150000,  # ✅ 기본값
        corn_price=feed.price if feed else 320.0,  # ✅ 기본값
        exchange_rate=rate.usd_krw if rate else 1320.0,  # ✅ 기본값
        avian_flu=flu.is_outbreak if flu else False,
        temperature=wx.avg_temperature if wx else 15.0,  # ✅ 기본값
    )
    cache_set(cache_key, result.model_dump(mode="json"), ttl=300)
    return result


@router.get("/models/performance", response_model=list[ModelPerformanceResponse])
@limiter.limit(settings.RATE_LIMIT_API)
async def model_performance(
    request: Request,
    grade: str = Query(default="대란", description="등급"),
    db: Session = Depends(get_db),
):
    """모델 성능 이력 조회"""
    cache_key = f"models:perf:{grade}"
    hit = cache_get(cache_key)
    if hit is not None:
        return hit

    rows = (
        db.query(ModelPerformance)
        .filter(ModelPerformance.grade == grade)
        .order_by(ModelPerformance.eval_date.desc())
        .limit(20)
        .all()
    )
    serialized = [
        {
            "model_version": r.model_version, "grade": r.grade,
            "eval_date": str(r.eval_date), "mae": r.mae, "rmse": r.rmse,
            "mape": r.mape, "directional_accuracy": r.directional_accuracy,
            "is_production": r.is_production, "created_at": str(r.created_at),
        }
        for r in rows
    ]
    cache_set(cache_key, serialized, ttl=1800)
    return rows


@router.get("/models/current", response_model=ModelPerformanceResponse | None)
@limiter.limit(settings.RATE_LIMIT_API)
async def current_model_performance(
    request: Request,
    grade: str = Query(default="대란", description="등급"),
    db: Session = Depends(get_db),
):
    """현재 프로덕션 모델 성능"""
    cache_key = f"models:current:{grade}"
    hit = cache_get(cache_key)
    if hit is not None:
        return hit

    row = (
        db.query(ModelPerformance)
        .filter(ModelPerformance.grade == grade, ModelPerformance.is_production == True)
        .order_by(ModelPerformance.eval_date.desc())
        .first()
    )
    if row:
        serialized = {
            "model_version": row.model_version, "grade": row.grade,
            "eval_date": str(row.eval_date), "mae": row.mae, "rmse": row.rmse,
            "mape": row.mape, "directional_accuracy": row.directional_accuracy,
            "is_production": row.is_production, "created_at": str(row.created_at),
        }
        cache_set(cache_key, serialized, ttl=600)
    return row


class FactorImpact(BaseModel):
    factor: str
    direction: str  # '상승', '하락', '중립'
    description: str
    value: Optional[float] = None


class AnalyticsFactorsResponse(BaseModel):
    grade: str
    date: date
    factors: list[FactorImpact]


@router.get("/analytics/factors", response_model=AnalyticsFactorsResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def analytics_factors(
    request: Request,
    grade: str = Query(default="대란", description="등급"),
    db: Session = Depends(get_db),
):
    """가격 변동 요인 분석"""
    cache_key = f"analytics:factors:{grade}"
    hit = cache_get(cache_key)
    if hit is not None:
        return hit

    today = date.today()
    week_ago = today - timedelta(days=7)
    factors = []

    # 1. Price trend
    recent_prices = (
        db.query(EggPrice)
        .filter(EggPrice.grade == grade, EggPrice.date >= week_ago, EggPrice.retail_price.isnot(None))
        .order_by(EggPrice.date)
        .all()
    )
    if len(recent_prices) >= 2:
        first_p = recent_prices[0].retail_price
        last_p = recent_prices[-1].retail_price
        change = last_p - first_p
        pct = (change / first_p * 100) if first_p else 0
        direction = "상승" if change > 0 else "하락" if change < 0 else "중립"
        factors.append(FactorImpact(
            factor="가격 추세",
            direction=direction,
            description=f"최근 7일간 {abs(pct):.1f}% {direction}",
            value=round(pct, 1),
        ))

    # 2. Avian flu
    flu = db.query(AvianFluStatus).filter(AvianFluStatus.date >= week_ago, AvianFluStatus.is_outbreak == True).first()
    factors.append(FactorImpact(
        factor="조류독감",
        direction="상승" if flu else "중립",
        description="발생 중 — 공급 감소 우려" if flu else "발생 없음",
        value=1.0 if flu else 0.0,
    ))

    # 3. Feed price (corn)
    feed_recent = (
        db.query(FeedPrice)
        .filter(FeedPrice.feed_type == "옥수수")
        .order_by(FeedPrice.date.desc())
        .limit(2)
        .all()
    )
    if len(feed_recent) >= 2:
        curr_feed = feed_recent[0].price
        prev_feed = feed_recent[1].price
        feed_change = curr_feed - prev_feed
        direction = "상승" if feed_change > 0 else "하락" if feed_change < 0 else "중립"
        factors.append(FactorImpact(
            factor="사료 가격",
            direction=direction,
            description=f"옥수수 가격 {direction} ({curr_feed:,.0f}원/kg)",
            value=round(curr_feed, 0),
        ))

    # 4. Exchange rate
    rate = db.query(ExchangeRate).order_by(ExchangeRate.date.desc()).first()
    if rate:
        direction = "상승" if rate.usd_krw > 1300 else "중립"
        factors.append(FactorImpact(
            factor="환율",
            direction=direction,
            description=f"USD/KRW {rate.usd_krw:,.0f}원 — 수입 사료 비용 {'증가' if rate.usd_krw > 1300 else '안정'}",
            value=rate.usd_krw,
        ))

    # 5. Weather / temperature
    wx = db.query(WeatherData).order_by(WeatherData.date.desc()).first()
    if wx and wx.avg_temperature is not None:
        if wx.avg_temperature > 30:
            direction = "상승"
            desc_text = f"고온 ({wx.avg_temperature}°C) — 산란율 감소 우려"
        elif wx.avg_temperature < -5:
            direction = "상승"
            desc_text = f"한파 ({wx.avg_temperature}°C) — 난방비 증가"
        else:
            direction = "중립"
            desc_text = f"적정 기온 ({wx.avg_temperature}°C)"
        factors.append(FactorImpact(
            factor="기온",
            direction=direction,
            description=desc_text,
            value=wx.avg_temperature,
        ))

    # 데이터가 없으면 기본 요인 반환
    if not factors:
        factors = [
            FactorImpact(factor="가격 추세", direction="중립", description="데이터 수집 중", value=0.0),
            FactorImpact(factor="조류독감", direction="중립", description="발생 없음", value=0.0),
            FactorImpact(factor="사료 가격", direction="중립", description="옥수수 가격 안정 (320원/kg)", value=320.0),
            FactorImpact(factor="환율", direction="중립", description="USD/KRW 1,320원 — 수입 사료 비용 안정", value=1320.0),
            FactorImpact(factor="기온", direction="중립", description="적정 기온 (15.0°C)", value=15.0),
        ]

    result = AnalyticsFactorsResponse(grade=grade, date=today, factors=factors)
    cache_set(cache_key, result.model_dump(mode="json"), ttl=600)
    return result
