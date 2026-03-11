"""Public accuracy endpoints — no auth required."""

from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.market_data import (
    AvianFluStatus,
    ExchangeRate,
    FeedPrice,
    WeatherData,
)
from app.models.prediction import Prediction
from app.models.price import EggPrice

router = APIRouter(prefix="/accuracy", tags=["accuracy"])


@router.get("/summary")
def accuracy_summary(
    grade: str = Query("특란"),
    region: str = Query("seoul"),
    db: Session = Depends(get_db),
):
    """Public accuracy summary — MAPE for 30/90/180 days."""
    results = {}
    for period_days in [30, 90, 180]:
        cutoff = date.today() - timedelta(days=period_days)
        rows = (
            db.query(Prediction.predicted_price, EggPrice.wholesale_price)
            .join(
                EggPrice,
                (Prediction.target_date == EggPrice.date)
                & (Prediction.grade == EggPrice.grade)
                & (Prediction.region == EggPrice.region),
            )
            .filter(
                Prediction.grade == grade,
                Prediction.region == region,
                Prediction.horizon_days == 7,
                Prediction.target_date >= cutoff,
                EggPrice.wholesale_price.isnot(None),
            )
            .all()
        )
        if rows:
            errors = [
                abs(r.predicted_price - r.wholesale_price) / r.wholesale_price * 100
                for r in rows
                if r.wholesale_price
            ]
            mape = round(sum(errors) / len(errors), 2) if errors else None
            accuracy = round(100 - mape, 2) if mape is not None else None
        else:
            mape = None
            accuracy = None
        results[f"{period_days}d"] = {
            "mape": mape,
            "accuracy": accuracy,
            "sample_count": len(rows),
        }
    return {"grade": grade, "region": region, "periods": results}


@router.get("/history")
def accuracy_history(
    grade: str = Query("특란"),
    region: str = Query("seoul"),
    days: int = Query(90),
    db: Session = Depends(get_db),
):
    """Prediction vs actual price history for public accuracy chart."""
    cutoff = date.today() - timedelta(days=days)
    rows = (
        db.query(
            Prediction.target_date,
            Prediction.predicted_price,
            EggPrice.wholesale_price,
        )
        .join(
            EggPrice,
            (Prediction.target_date == EggPrice.date)
            & (Prediction.grade == EggPrice.grade)
            & (Prediction.region == EggPrice.region),
        )
        .filter(
            Prediction.grade == grade,
            Prediction.region == region,
            Prediction.horizon_days == 7,
            Prediction.target_date >= cutoff,
            EggPrice.wholesale_price.isnot(None),
        )
        .order_by(Prediction.target_date)
        .all()
    )
    items = []
    for r in rows:
        error = abs(r.predicted_price - r.wholesale_price)
        error_pct = (
            round(error / r.wholesale_price * 100, 2) if r.wholesale_price else None
        )
        items.append(
            {
                "date": r.target_date.isoformat(),
                "predicted": r.predicted_price,
                "actual": r.wholesale_price,
                "error": error,
                "error_pct": error_pct,
            }
        )
    return {"grade": grade, "region": region, "items": items}


@router.get("/metrics")
def accuracy_metrics(
    grade: str = Query("특란"),
    db: Session = Depends(get_db),
):
    """MAPE and RMSE model metrics for public display."""
    from app.models.market_data import ModelPerformance

    perf = (
        db.query(ModelPerformance)
        .filter(
            ModelPerformance.grade == grade,
            ModelPerformance.is_production == True,  # noqa: E712
        )
        .order_by(desc(ModelPerformance.eval_date))
        .first()
    )
    if perf:
        return {
            "grade": grade,
            "model_version": perf.model_version,
            "mape": perf.mape,
            "rmse": perf.rmse,
            "mae": perf.mae,
            "directional_accuracy": perf.directional_accuracy,
            "eval_date": perf.eval_date.isoformat() if perf.eval_date else None,
        }
    return {
        "grade": grade,
        "model_version": None,
        "mape": None,
        "rmse": None,
        "mae": None,
        "directional_accuracy": None,
        "eval_date": None,
    }


# ---------------------------------------------------------------------------
# Factor analysis helpers
# ---------------------------------------------------------------------------

def _detect_events(
    prices: list[dict],
    sharp_pct: float = 3.0,
    sharp_window: int = 3,
    sustained_pct: float = 5.0,
    sustained_window: int = 7,
) -> list[dict]:
    """Detect significant price movement events from a sorted price list.

    Each price dict has keys ``date`` (date) and ``price`` (float).
    Returns a list of event dicts with period_start, period_end,
    event_type, and price_change_pct.
    """
    if len(prices) < 2:
        return []

    events: list[dict] = []

    # --- 1. Detect sharp moves (>sharp_pct within sharp_window days) ---
    i = 0
    while i < len(prices) - 1:
        j = i + 1
        # Look ahead up to sharp_window days
        while j < len(prices) and (prices[j]["date"] - prices[i]["date"]).days <= sharp_window:
            j += 1
        j = min(j, len(prices)) - 1
        if j <= i:
            i += 1
            continue

        change_pct = (prices[j]["price"] - prices[i]["price"]) / prices[i]["price"] * 100
        if abs(change_pct) >= sharp_pct:
            event_type = "급등" if change_pct > 0 else "급락"
            events.append({
                "period_start": prices[i]["date"],
                "period_end": prices[j]["date"],
                "event_type": event_type,
                "price_change_pct": round(change_pct, 2),
            })
            i = j + 1
        else:
            i += 1

    # --- 2. Detect sustained trends (>sustained_pct over sustained_window+ days) ---
    if len(prices) >= sustained_window:
        trend_start = 0
        while trend_start < len(prices) - sustained_window:
            # Find the longest monotonic-ish run
            direction = None
            trend_end = trend_start + 1
            while trend_end < len(prices):
                segment_change = (
                    (prices[trend_end]["price"] - prices[trend_end - 1]["price"])
                )
                if direction is None:
                    direction = 1 if segment_change >= 0 else -1
                # Allow minor counter-moves (up to 0.5%) within the trend
                counter_pct = 0.0
                if prices[trend_end - 1]["price"]:
                    counter_pct = segment_change / prices[trend_end - 1]["price"] * 100
                if direction == 1 and counter_pct < -0.5:
                    break
                if direction == -1 and counter_pct > 0.5:
                    break
                trend_end += 1

            trend_end -= 1
            span_days = (prices[trend_end]["date"] - prices[trend_start]["date"]).days
            if span_days >= sustained_window and prices[trend_start]["price"]:
                total_change = (
                    (prices[trend_end]["price"] - prices[trend_start]["price"])
                    / prices[trend_start]["price"]
                    * 100
                )
                if abs(total_change) >= sustained_pct:
                    event_type = "지속상승" if total_change > 0 else "지속하락"
                    # Avoid duplicating an already-detected sharp event at the same period
                    already = any(
                        e["period_start"] == prices[trend_start]["date"]
                        and e["period_end"] == prices[trend_end]["date"]
                        for e in events
                    )
                    if not already:
                        events.append({
                            "period_start": prices[trend_start]["date"],
                            "period_end": prices[trend_end]["date"],
                            "event_type": event_type,
                            "price_change_pct": round(total_change, 2),
                        })
            trend_start = max(trend_start + 1, trend_end)

    # Sort by start date
    events.sort(key=lambda e: e["period_start"])
    return events


def _find_holiday_factor(
    period_start: date,
    period_end: date,
) -> list[dict]:
    """Check if the period overlaps with Korean holidays that affect egg demand.

    Korean lunar holidays shift each year. This uses approximate windows
    (±10 days around the typical date) and the Korean `korean_lunar_calendar`
    is not available, so we hard-code known holidays by year plus fixed ones.
    """
    factors: list[dict] = []
    year = period_start.year

    # ── Known lunar holidays (설날, 추석) — approximate Gregorian dates ──
    # These are the actual 1st day of the lunar month; demand surge starts ~7 days before.
    lunar_holidays: dict[int, list[tuple[str, date, date]]] = {
        2025: [
            ("설날", date(2025, 1, 22), date(2025, 1, 31)),
            ("추석", date(2025, 9, 28), date(2025, 10, 8)),
        ],
        2026: [
            ("설날", date(2026, 2, 7), date(2026, 2, 20)),
            ("추석", date(2026, 9, 18), date(2026, 9, 28)),
        ],
        2027: [
            ("설날", date(2027, 1, 26), date(2027, 2, 8)),
            ("추석", date(2027, 10, 7), date(2027, 10, 17)),
        ],
    }

    for holiday_name, hol_start, hol_end in lunar_holidays.get(year, []):
        # Check overlap
        if period_start <= hol_end and period_end >= hol_start:
            factors.append({
                "name": "명절 수요",
                "description": f"{holiday_name} 연휴 수요 증가",
                "detail": f"{holiday_name} 기간({hol_start.strftime('%m/%d')}~{hol_end.strftime('%m/%d')}) 선물·가정 소비 급증으로 가격 상승 압력",
            })

    # ── Fixed annual holidays ──
    fixed_holidays = [
        ("어버이날/스승의날", date(year, 5, 5), date(year, 5, 18)),
        ("크리스마스/연말", date(year, 12, 20), date(year, 12, 31)),
    ]
    for holiday_name, hol_start, hol_end in fixed_holidays:
        if period_start <= hol_end and period_end >= hol_start:
            factors.append({
                "name": "계절 수요",
                "description": f"{holiday_name} 수요 증가",
                "detail": f"{holiday_name} 시즌 소비 증가에 따른 가격 영향",
            })

    # ── Summer (7-8월) — 산란율 저하, 복날 수요 ──
    summer_start = date(year, 7, 1)
    summer_end = date(year, 8, 31)
    if period_start <= summer_end and period_end >= summer_start:
        factors.append({
            "name": "계절 요인",
            "description": "여름철 산란율 저하 및 복날 수요",
            "detail": "고온으로 인한 산란율 감소 + 복날(삼계탕) 수요 증가",
        })

    return factors


def _find_news_factors(
    db: Session,
    period_start: date,
    period_end: date,
) -> list[dict]:
    """Search news articles for keywords that indicate price factors."""
    from app.models.news import NewsArticle

    factors: list[dict] = []
    lookup_start = period_start - timedelta(days=5)
    lookup_end = period_end + timedelta(days=2)

    articles = (
        db.query(NewsArticle)
        .filter(NewsArticle.published_at.between(lookup_start, lookup_end))
        .all()
    )

    if not articles:
        return factors

    # Keyword patterns → factor mapping
    keyword_factors = [
        {
            "keywords": ["조류인플루엔자", "조류독감", "AI 발생", "AI 확산", "고병원성"],
            "name": "조류인플루엔자",
            "description": "뉴스에서 AI 발생/확산 보도 확인",
        },
        {
            "keywords": ["수입", "수입란", "수입 계란", "긴급 수입", "미국산"],
            "name": "수입 영향",
            "description": "계란 수입 관련 뉴스 보도",
        },
        {
            "keywords": ["사료", "옥수수", "대두박", "사료비"],
            "name": "사료가격",
            "description": "사료 가격 변동 관련 뉴스 보도",
        },
        {
            "keywords": ["산란계", "살처분", "폐사", "감산"],
            "name": "공급 충격",
            "description": "산란계 감소/살처분 관련 뉴스 보도",
        },
    ]

    for kf in keyword_factors:
        matching = [
            a for a in articles
            if any(kw in (a.title or "") or kw in (a.summary or "") for kw in kf["keywords"])
        ]
        if matching:
            titles = [a.title for a in matching[:2]]
            detail = " | ".join(t[:40] for t in titles if t)
            factors.append({
                "name": kf["name"],
                "description": kf["description"],
                "detail": f"관련 기사 {len(matching)}건 — {detail}",
            })

    return factors


def _find_factors(
    db: Session,
    period_start: date,
    period_end: date,
) -> list[dict]:
    """Query market data tables, holidays, and news to find contributing factors."""
    factors: list[dict] = []
    lookup_start = period_start - timedelta(days=3)
    lookup_end = period_end + timedelta(days=1)

    # --- 1. Holiday / Seasonal factors ---
    factors.extend(_find_holiday_factor(period_start, period_end))

    # --- 2. Avian Flu (DB) ---
    flu_rows = (
        db.query(AvianFluStatus)
        .filter(
            AvianFluStatus.date.between(lookup_start, lookup_end),
            AvianFluStatus.is_outbreak.is_(True),
        )
        .all()
    )
    if flu_rows:
        total_cases = sum(r.case_count or 0 for r in flu_rows)
        regions = {r.region for r in flu_rows if r.region}
        region_str = ", ".join(sorted(regions)) if regions else "전국"
        factors.append({
            "name": "조류인플루엔자",
            "description": "기간 중 AI 발생 확인",
            "detail": f"{region_str} 지역 총 {total_cases}건 발생",
        })

    # --- 3. Feed Price ---
    feed_start_rows = (
        db.query(FeedPrice)
        .filter(FeedPrice.date <= period_start, FeedPrice.date >= lookup_start - timedelta(days=7))
        .order_by(desc(FeedPrice.date))
        .all()
    )
    feed_end_rows = (
        db.query(FeedPrice)
        .filter(FeedPrice.date <= lookup_end, FeedPrice.date >= period_start)
        .order_by(desc(FeedPrice.date))
        .all()
    )
    start_by_type: dict[str, float] = {}
    for r in feed_start_rows:
        if r.feed_type not in start_by_type:
            start_by_type[r.feed_type] = r.price
    end_by_type: dict[str, float] = {}
    for r in feed_end_rows:
        if r.feed_type not in end_by_type:
            end_by_type[r.feed_type] = r.price

    for feed_type in start_by_type:
        if feed_type in end_by_type and start_by_type[feed_type]:
            change = (end_by_type[feed_type] - start_by_type[feed_type]) / start_by_type[feed_type] * 100
            if abs(change) >= 2.0:
                direction = "상승" if change > 0 else "하락"
                factors.append({
                    "name": "사료가격",
                    "description": f"{feed_type} 가격 변동",
                    "detail": f"{feed_type} 가격 {abs(change):.1f}% {direction}",
                })

    # --- 4. Exchange Rate ---
    fx_start = (
        db.query(ExchangeRate)
        .filter(ExchangeRate.date <= period_start, ExchangeRate.date >= lookup_start - timedelta(days=7))
        .order_by(desc(ExchangeRate.date))
        .first()
    )
    fx_end = (
        db.query(ExchangeRate)
        .filter(ExchangeRate.date <= lookup_end, ExchangeRate.date >= period_start)
        .order_by(desc(ExchangeRate.date))
        .first()
    )
    if fx_start and fx_end and fx_start.usd_krw:
        fx_change = (fx_end.usd_krw - fx_start.usd_krw) / fx_start.usd_krw * 100
        if abs(fx_change) >= 1.5:
            direction = "상승" if fx_change > 0 else "하락"
            factors.append({
                "name": "환율",
                "description": "원/달러 환율 변동",
                "detail": f"환율 {abs(fx_change):.1f}% {direction} ({fx_start.usd_krw:.0f}→{fx_end.usd_krw:.0f}원)",
            })

    # --- 5. Weather extremes ---
    weather_rows = (
        db.query(
            func.avg(WeatherData.avg_temperature).label("avg_temp"),
            func.max(WeatherData.max_temperature).label("max_temp"),
            func.min(WeatherData.min_temperature).label("min_temp"),
        )
        .filter(WeatherData.date.between(lookup_start, lookup_end))
        .first()
    )
    if weather_rows and weather_rows.avg_temp is not None:
        avg = weather_rows.avg_temp
        max_t = weather_rows.max_temp
        min_t = weather_rows.min_temp
        if max_t is not None and max_t >= 35:
            factors.append({
                "name": "기상이변",
                "description": "폭염 발생",
                "detail": f"기간 중 최고기온 {max_t:.1f}°C 기록",
            })
        elif min_t is not None and min_t <= -15:
            factors.append({
                "name": "기상이변",
                "description": "한파 발생",
                "detail": f"기간 중 최저기온 {min_t:.1f}°C 기록",
            })
        elif avg is not None and (avg >= 30 or avg <= -5):
            label = "고온" if avg >= 30 else "저온"
            factors.append({
                "name": "기상이변",
                "description": f"이상 {label} 지속",
                "detail": f"기간 평균기온 {avg:.1f}°C",
            })

    # --- 6. News-based factor detection ---
    # Deduplicate: skip news factors whose name already appeared from DB data
    existing_names = {f["name"] for f in factors}
    news_factors = _find_news_factors(db, period_start, period_end)
    for nf in news_factors:
        if nf["name"] not in existing_names:
            factors.append(nf)
            existing_names.add(nf["name"])

    return factors


# ---------------------------------------------------------------------------
# /accuracy/factors endpoint
# ---------------------------------------------------------------------------

@router.get("/factors")
def accuracy_factors(
    grade: str = Query("특란"),
    region: str = Query("seoul"),
    days: int = Query(90, ge=7, le=365),
    db: Session = Depends(get_db),
):
    """Analyze price movements and correlate with market data factors."""
    cutoff = date.today() - timedelta(days=days)

    # Fetch price history sorted by date
    price_rows = (
        db.query(EggPrice)
        .filter(
            EggPrice.grade == grade,
            EggPrice.region == region,
            EggPrice.date >= cutoff,
            EggPrice.wholesale_price.isnot(None),
        )
        .order_by(EggPrice.date)
        .all()
    )

    prices = [
        {"date": r.date, "price": r.wholesale_price}
        for r in price_rows
    ]

    # Detect events
    events = _detect_events(prices)

    # For each event, find contributing factors
    result_events = []
    for ev in events:
        factors = _find_factors(db, ev["period_start"], ev["period_end"])
        result_events.append({
            "period_start": ev["period_start"].isoformat(),
            "period_end": ev["period_end"].isoformat(),
            "event_type": ev["event_type"],
            "price_change_pct": ev["price_change_pct"],
            "factors": factors,
        })

    return {
        "grade": grade,
        "region": region,
        "period_days": days,
        "total_price_points": len(prices),
        "events": result_events,
    }
