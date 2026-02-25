"""Admin service — dashboard KPIs, pred-vs-actual, factor analysis, model management, price management."""

import logging
from datetime import date, datetime, timedelta

from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from app.models.price import EggPrice
from app.models.prediction import Prediction
from app.models.market_data import ModelPerformance, FeedPrice, ExchangeRate, WeatherData
from app.models.admin import RetrainRequest, PriceCorrectionLog
from app.schemas.admin import (
    KpiCard,
    AdminDashboardResponse,
    PredVsActualItem,
    PredVsActualResponse,
    CorrelationItem,
    MarketFactorAnalysisResponse,
    ModelVersionItem,
    RetrainRequestResponse,
    PriceCorrectionResponse,
    DataQualityCheck,
)

logger = logging.getLogger(__name__)

HORIZONS = [7, 14, 30, 60]


# ── Dashboard KPIs ─────────────────────────────────────
def get_dashboard_kpis(db: Session, grade: str) -> AdminDashboardResponse:
    kpis: list[KpiCard] = []
    cutoff = date.today() - timedelta(days=90)

    for h in HORIZONS:
        label = f"{h}일" if h <= 30 else "익월"

        rows = (
            db.query(Prediction.target_date, Prediction.predicted_price, EggPrice.wholesale_price)
            .join(EggPrice, (Prediction.target_date == EggPrice.date) & (Prediction.grade == EggPrice.grade))
            .filter(
                Prediction.grade == grade,
                Prediction.horizon_days == h,
                Prediction.target_date >= cutoff,
                EggPrice.wholesale_price.isnot(None),
            )
            .all()
        )

        if rows:
            errors = [abs(r.predicted_price - r.wholesale_price) / r.wholesale_price * 100 for r in rows if r.wholesale_price]
            current_mape = sum(errors) / len(errors) if errors else None
        else:
            current_mape = None
            errors = []

        # Previous period for trend
        prev_cutoff = cutoff - timedelta(days=90)
        prev_rows = (
            db.query(Prediction.target_date, Prediction.predicted_price, EggPrice.wholesale_price)
            .join(EggPrice, (Prediction.target_date == EggPrice.date) & (Prediction.grade == EggPrice.grade))
            .filter(
                Prediction.grade == grade,
                Prediction.horizon_days == h,
                Prediction.target_date >= prev_cutoff,
                Prediction.target_date < cutoff,
                EggPrice.wholesale_price.isnot(None),
            )
            .all()
        )
        if prev_rows:
            prev_errors = [abs(r.predicted_price - r.wholesale_price) / r.wholesale_price * 100 for r in prev_rows if r.wholesale_price]
            prev_mape = sum(prev_errors) / len(prev_errors) if prev_errors else None
        else:
            prev_mape = None

        trend = "flat"
        if current_mape is not None and prev_mape is not None:
            trend = "down" if current_mape < prev_mape else ("up" if current_mape > prev_mape else "flat")

        kpis.append(KpiCard(
            label=label,
            horizon_days=h,
            mape=round(current_mape, 2) if current_mape is not None else None,
            prev_mape=round(prev_mape, 2) if prev_mape is not None else None,
            trend=trend,
            sample_count=len(errors),
        ))

    # Accuracy trend (weekly aggregated MAPE over last 180 days)
    trend_cutoff = date.today() - timedelta(days=180)
    trend_rows = (
        db.query(
            func.date_trunc("week", Prediction.target_date).label("week"),
            func.avg(
                func.abs(Prediction.predicted_price - EggPrice.wholesale_price) / EggPrice.wholesale_price * 100
            ).label("mape"),
        )
        .join(EggPrice, (Prediction.target_date == EggPrice.date) & (Prediction.grade == EggPrice.grade))
        .filter(
            Prediction.grade == grade,
            Prediction.target_date >= trend_cutoff,
            EggPrice.wholesale_price.isnot(None),
            EggPrice.wholesale_price > 0,
        )
        .group_by("week")
        .order_by("week")
        .all()
    )
    accuracy_trend = [{"week": str(r.week), "mape": round(float(r.mape), 2)} for r in trend_rows]

    # Error alerts (recent predictions with high error)
    alert_rows = (
        db.query(
            Prediction.target_date,
            Prediction.predicted_price,
            EggPrice.wholesale_price,
            Prediction.horizon_days,
            Prediction.model_version,
        )
        .join(EggPrice, (Prediction.target_date == EggPrice.date) & (Prediction.grade == EggPrice.grade))
        .filter(
            Prediction.grade == grade,
            Prediction.target_date >= date.today() - timedelta(days=30),
            EggPrice.wholesale_price.isnot(None),
            EggPrice.wholesale_price > 0,
        )
        .order_by(desc(Prediction.target_date))
        .limit(100)
        .all()
    )
    error_alerts = []
    for r in alert_rows:
        error_pct = abs(r.predicted_price - r.wholesale_price) / r.wholesale_price * 100
        if error_pct > 5:
            error_alerts.append({
                "target_date": str(r.target_date),
                "predicted": r.predicted_price,
                "actual": r.wholesale_price,
                "error_pct": round(error_pct, 2),
                "horizon_days": r.horizon_days,
                "model_version": r.model_version,
            })

    return AdminDashboardResponse(
        grade=grade,
        kpis=kpis,
        accuracy_trend=accuracy_trend,
        error_alerts=error_alerts[:20],
    )


# ── Prediction vs Actual ──────────────────────────────
def get_pred_vs_actual(db: Session, grade: str, horizon_days: int = 7, days: int = 90) -> PredVsActualResponse:
    cutoff = date.today() - timedelta(days=days)
    rows = (
        db.query(
            Prediction.target_date,
            Prediction.predicted_price,
            EggPrice.wholesale_price,
            Prediction.model_version,
        )
        .outerjoin(EggPrice, (Prediction.target_date == EggPrice.date) & (Prediction.grade == EggPrice.grade))
        .filter(
            Prediction.grade == grade,
            Prediction.horizon_days == horizon_days,
            Prediction.target_date >= cutoff,
        )
        .order_by(Prediction.target_date)
        .all()
    )

    items = []
    for r in rows:
        actual = r.wholesale_price
        error = (r.predicted_price - actual) if actual is not None else None
        error_pct = (error / actual * 100) if actual and error is not None else None
        items.append(PredVsActualItem(
            target_date=str(r.target_date),
            predicted_price=r.predicted_price,
            actual_price=actual,
            error=round(error, 2) if error is not None else None,
            error_pct=round(error_pct, 2) if error_pct is not None else None,
            model_version=r.model_version,
        ))

    return PredVsActualResponse(grade=grade, horizon_days=horizon_days, items=items)


# ── Market Factor Correlations ────────────────────────
def get_factor_correlations(db: Session, grade: str, days: int = 180) -> MarketFactorAnalysisResponse:
    cutoff = date.today() - timedelta(days=days)

    prices = (
        db.query(EggPrice.date, EggPrice.wholesale_price)
        .filter(EggPrice.grade == grade, EggPrice.date >= cutoff, EggPrice.wholesale_price.isnot(None))
        .order_by(EggPrice.date)
        .all()
    )
    price_map = {r.date: r.wholesale_price for r in prices}

    feed_rows = db.query(FeedPrice.date, FeedPrice.price).filter(
        FeedPrice.date >= cutoff, FeedPrice.feed_type == "배합사료"
    ).all()
    feed_map = {r.date: r.price for r in feed_rows}

    exchange_rows = db.query(ExchangeRate.date, ExchangeRate.usd_krw).filter(ExchangeRate.date >= cutoff).all()
    exchange_map = {r.date: r.usd_krw for r in exchange_rows}

    weather_rows = db.query(WeatherData.date, WeatherData.avg_temperature).filter(WeatherData.date >= cutoff).all()
    weather_map = {r.date: r.avg_temperature for r in weather_rows}

    factors = {"사료가격": feed_map, "환율(USD/KRW)": exchange_map, "평균기온": weather_map}
    correlations = []
    scatter_data = []

    try:
        import numpy as np
        common_dates = sorted(price_map.keys())
        price_arr = [price_map[d] for d in common_dates]

        for factor_name, factor_map in factors.items():
            paired = [(price_map[d], factor_map[d]) for d in common_dates if d in factor_map and factor_map[d] is not None]
            if len(paired) >= 10:
                p_arr = [x[0] for x in paired]
                f_arr = [x[1] for x in paired]
                corr = float(np.corrcoef(p_arr, f_arr)[0, 1])
                correlations.append(CorrelationItem(
                    factor=factor_name,
                    correlation_with_price=round(corr, 4),
                ))
                for p_val, f_val in paired[-60:]:
                    scatter_data.append({"factor": factor_name, "factor_value": f_val, "price": p_val})
            else:
                correlations.append(CorrelationItem(factor=factor_name))
    except ImportError:
        for factor_name in factors:
            correlations.append(CorrelationItem(factor=factor_name))

    return MarketFactorAnalysisResponse(
        grade=grade, days=days, correlations=correlations, scatter_data=scatter_data
    )


# ── Model Versions ────────────────────────────────────
def get_model_versions(db: Session, grade: str) -> list[ModelVersionItem]:
    rows = (
        db.query(
            ModelPerformance.model_version,
            ModelPerformance.grade,
            func.max(ModelPerformance.eval_date).label("latest_eval_date"),
            func.avg(ModelPerformance.mape).label("avg_mape"),
            func.bool_or(ModelPerformance.is_production).label("is_production"),
            func.count(ModelPerformance.id).label("eval_count"),
        )
        .filter(ModelPerformance.grade == grade)
        .group_by(ModelPerformance.model_version, ModelPerformance.grade)
        .order_by(desc("latest_eval_date"))
        .all()
    )
    return [
        ModelVersionItem(
            model_version=r.model_version,
            grade=r.grade,
            latest_eval_date=str(r.latest_eval_date) if r.latest_eval_date else None,
            avg_mape=round(float(r.avg_mape), 2) if r.avg_mape else None,
            is_production=bool(r.is_production),
            eval_count=r.eval_count,
        )
        for r in rows
    ]


def request_retrain(db: Session, user_id: int, grade: str, reason: str | None) -> RetrainRequest:
    req = RetrainRequest(requested_by=user_id, grade=grade, reason=reason)
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


def get_retrain_requests(db: Session, grade: str | None = None) -> list[RetrainRequest]:
    q = db.query(RetrainRequest)
    if grade:
        q = q.filter(RetrainRequest.grade == grade)
    return q.order_by(desc(RetrainRequest.created_at)).limit(50).all()


def promote_model(db: Session, grade: str, version: str) -> bool:
    db.query(ModelPerformance).filter(
        ModelPerformance.grade == grade, ModelPerformance.is_production == True
    ).update({"is_production": False})
    updated = db.query(ModelPerformance).filter(
        ModelPerformance.grade == grade, ModelPerformance.model_version == version
    ).update({"is_production": True})
    db.commit()
    return updated > 0


# ── Price Management ──────────────────────────────────
def upsert_price(db: Session, user_id: int, data) -> EggPrice:
    existing = db.query(EggPrice).filter(
        EggPrice.date == data.date, EggPrice.grade == data.grade
    ).first()

    if existing:
        for field in ("wholesale_price", "retail_price"):
            new_val = getattr(data, field)
            if new_val is not None:
                old_val = getattr(existing, field)
                if old_val != new_val:
                    log = PriceCorrectionLog(
                        egg_price_id=existing.id,
                        corrected_by=user_id,
                        field=field,
                        old_value=str(old_val) if old_val is not None else None,
                        new_value=str(new_val),
                        reason=data.reason,
                    )
                    db.add(log)
                    setattr(existing, field, new_val)
        db.commit()
        db.refresh(existing)
        return existing
    else:
        price = EggPrice(
            date=data.date,
            grade=data.grade,
            wholesale_price=data.wholesale_price,
            retail_price=data.retail_price,
        )
        db.add(price)
        db.commit()
        db.refresh(price)
        return price


def run_data_quality_checks(db: Session, grade: str, days: int = 30) -> list[DataQualityCheck]:
    checks: list[DataQualityCheck] = []
    cutoff = date.today() - timedelta(days=days)

    # Missing data check
    rows = (
        db.query(EggPrice.date, EggPrice.wholesale_price, EggPrice.retail_price)
        .filter(EggPrice.grade == grade, EggPrice.date >= cutoff)
        .order_by(EggPrice.date)
        .all()
    )

    date_set = {r.date for r in rows}
    d = cutoff
    while d <= date.today():
        if d.weekday() < 5 and d not in date_set:
            checks.append(DataQualityCheck(
                check_type="missing", severity="warning",
                date=str(d), grade=grade,
                detail=f"{d} 데이터 누락",
            ))
        d += timedelta(days=1)

    # Null wholesale price
    for r in rows:
        if r.wholesale_price is None:
            checks.append(DataQualityCheck(
                check_type="missing", severity="error",
                date=str(r.date), grade=grade,
                detail=f"{r.date} 도매가 null",
            ))

    # Outlier check (>20% day-over-day change)
    sorted_rows = sorted(rows, key=lambda x: x.date)
    for i in range(1, len(sorted_rows)):
        prev = sorted_rows[i - 1].wholesale_price
        curr = sorted_rows[i].wholesale_price
        if prev and curr and prev > 0:
            change = abs(curr - prev) / prev * 100
            if change > 20:
                checks.append(DataQualityCheck(
                    check_type="outlier", severity="error",
                    date=str(sorted_rows[i].date), grade=grade,
                    detail=f"{sorted_rows[i].date} 전일 대비 {change:.1f}% 변동",
                ))

    # Gap check (>3 consecutive business days missing)
    sorted_dates = sorted(date_set)
    for i in range(1, len(sorted_dates)):
        gap = (sorted_dates[i] - sorted_dates[i - 1]).days
        if gap > 5:
            checks.append(DataQualityCheck(
                check_type="gap", severity="warning",
                date=str(sorted_dates[i - 1]), grade=grade,
                detail=f"{sorted_dates[i-1]} ~ {sorted_dates[i]} 사이 {gap}일 공백",
            ))

    return checks


def get_correction_logs(db: Session, days: int = 30) -> list[PriceCorrectionLog]:
    cutoff = datetime.utcnow() - timedelta(days=days)
    return (
        db.query(PriceCorrectionLog)
        .filter(PriceCorrectionLog.created_at >= cutoff)
        .order_by(desc(PriceCorrectionLog.created_at))
        .limit(100)
        .all()
    )
