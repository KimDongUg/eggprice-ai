"""Admin service — dashboard KPIs, pred-vs-actual, factor analysis, model management, price management."""

import logging
from datetime import date, datetime, timedelta

from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from app.models.price import EggPrice
from app.models.prediction import Prediction
from app.models.market_data import ModelPerformance, FeedPrice, ExchangeRate, WeatherData, TradingVolume, AvianFluStatus
from app.models.admin import RetrainRequest, PriceCorrectionLog
from app.schemas.admin import (
    KpiCard,
    SurgeAlert,
    DataQualitySummary,
    AdminDashboardResponse,
    PredVsActualItem,
    PredVsActualResponse,
    CorrelationItem,
    FactorErrorScatterItem,
    MarketFactorAnalysisResponse,
    ModelVersionItem,
    DataQualityCheck,
    MonthlyComparisonItem,
    MonthlyComparisonResponse,
    TopErrorItem,
    WeekdayAnalysisItem,
    MonthlyAnalysisItem,
    VolatilityAnalysis,
    ErrorAnalysisResponse,
)

logger = logging.getLogger(__name__)

HORIZONS = [7, 14, 30, 60]


# ── Dashboard KPIs ─────────────────────────────────────
def get_dashboard_kpis(
    db: Session, grade: str, period_days: int = 90, model_version: str | None = None,
    trend_horizon: int | None = None,
) -> AdminDashboardResponse:
    kpis: list[KpiCard] = []
    cutoff = date.today() - timedelta(days=period_days)

    for h in HORIZONS:
        label = f"{h}일" if h <= 30 else "익월"

        q = (
            db.query(Prediction.target_date, Prediction.predicted_price, EggPrice.wholesale_price)
            .join(EggPrice, (Prediction.target_date == EggPrice.date) & (Prediction.grade == EggPrice.grade))
            .filter(
                Prediction.grade == grade,
                Prediction.horizon_days == h,
                Prediction.target_date >= cutoff,
                EggPrice.wholesale_price.isnot(None),
            )
        )
        if model_version:
            q = q.filter(Prediction.model_version == model_version)
        rows = q.all()

        if rows:
            errors = [abs(r.predicted_price - r.wholesale_price) / r.wholesale_price * 100 for r in rows if r.wholesale_price]
            abs_errors = [abs(r.predicted_price - r.wholesale_price) for r in rows if r.wholesale_price]
            current_mape = sum(errors) / len(errors) if errors else None
            current_mae = sum(abs_errors) / len(abs_errors) if abs_errors else None
        else:
            current_mape = None
            current_mae = None
            errors = []

        # Previous period for trend
        prev_cutoff = cutoff - timedelta(days=period_days)
        pq = (
            db.query(Prediction.target_date, Prediction.predicted_price, EggPrice.wholesale_price)
            .join(EggPrice, (Prediction.target_date == EggPrice.date) & (Prediction.grade == EggPrice.grade))
            .filter(
                Prediction.grade == grade,
                Prediction.horizon_days == h,
                Prediction.target_date >= prev_cutoff,
                Prediction.target_date < cutoff,
                EggPrice.wholesale_price.isnot(None),
            )
        )
        if model_version:
            pq = pq.filter(Prediction.model_version == model_version)
        prev_rows = pq.all()
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
            mae=round(current_mae, 0) if current_mae is not None else None,
            prev_mape=round(prev_mape, 2) if prev_mape is not None else None,
            trend=trend,
            sample_count=len(errors),
        ))

    # Accuracy trend (weekly aggregated MAPE)
    trend_cutoff = date.today() - timedelta(days=max(period_days * 2, 180))
    trend_q = (
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
    )
    if model_version:
        trend_q = trend_q.filter(Prediction.model_version == model_version)
    if trend_horizon:
        trend_q = trend_q.filter(Prediction.horizon_days == trend_horizon)
    trend_rows = trend_q.group_by("week").order_by("week").all()
    accuracy_trend = [{"week": str(r.week), "mape": round(float(r.mape), 2)} for r in trend_rows]

    # Error alerts (recent predictions with high error)
    alert_q = (
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
            Prediction.target_date >= date.today() - timedelta(days=min(period_days, 30)),
            EggPrice.wholesale_price.isnot(None),
            EggPrice.wholesale_price > 0,
        )
    )
    if model_version:
        alert_q = alert_q.filter(Prediction.model_version == model_version)
    alert_rows = alert_q.order_by(desc(Prediction.target_date)).limit(100).all()
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

    # Surge/drop detection — find periods where price changed significantly and errors amplified
    surge_alerts: list[SurgeAlert] = []
    try:
        price_rows = (
            db.query(EggPrice.date, EggPrice.wholesale_price)
            .filter(EggPrice.grade == grade, EggPrice.date >= cutoff, EggPrice.wholesale_price.isnot(None))
            .order_by(EggPrice.date)
            .all()
        )
        if len(price_rows) >= 5:
            # Build daily change map and error map
            daily_changes: list[tuple[date, float]] = []
            for i in range(1, len(price_rows)):
                prev_p = price_rows[i - 1].wholesale_price
                curr_p = price_rows[i].wholesale_price
                if prev_p and prev_p > 0:
                    change_pct = (curr_p - prev_p) / prev_p * 100
                    daily_changes.append((price_rows[i].date, change_pct))

            # Build prediction error map for the period
            pred_err_rows = (
                db.query(Prediction.target_date, Prediction.predicted_price, EggPrice.wholesale_price)
                .join(EggPrice, (Prediction.target_date == EggPrice.date) & (Prediction.grade == EggPrice.grade))
                .filter(Prediction.grade == grade, Prediction.target_date >= cutoff,
                        EggPrice.wholesale_price.isnot(None), EggPrice.wholesale_price > 0)
            )
            if model_version:
                pred_err_rows = pred_err_rows.filter(Prediction.model_version == model_version)
            pred_err_rows = pred_err_rows.all()
            err_map: dict[date, float] = {}
            for r in pred_err_rows:
                err_map[r.target_date] = abs(r.predicted_price - r.wholesale_price) / r.wholesale_price * 100

            if daily_changes and err_map:
                abs_changes = sorted([abs(c) for _, c in daily_changes], reverse=True)
                threshold = abs_changes[max(0, len(abs_changes) // 10 - 1)] if abs_changes else 5.0
                threshold = max(threshold, 2.0)

                # Find surge periods (consecutive high-change days)
                surge_dates = [(d, c) for d, c in daily_changes if abs(c) >= threshold]
                normal_errors = [err_map[d] for d, _ in daily_changes if abs(_) < threshold and d in err_map]
                normal_avg = sum(normal_errors) / len(normal_errors) if normal_errors else 0

                if surge_dates and normal_avg > 0:
                    # Group consecutive surge dates
                    groups: list[list[tuple[date, float]]] = []
                    current_group: list[tuple[date, float]] = [surge_dates[0]]
                    for j in range(1, len(surge_dates)):
                        if (surge_dates[j][0] - surge_dates[j - 1][0]).days <= 3:
                            current_group.append(surge_dates[j])
                        else:
                            groups.append(current_group)
                            current_group = [surge_dates[j]]
                    groups.append(current_group)

                    for group in groups[:5]:
                        group_errors = [err_map[d] for d, _ in group if d in err_map]
                        if group_errors:
                            avg_err = sum(group_errors) / len(group_errors)
                            max_change = max(abs(c) for _, c in group)
                            if avg_err > normal_avg * 1.3:
                                surge_alerts.append(SurgeAlert(
                                    period_start=str(group[0][0]),
                                    period_end=str(group[-1][0]),
                                    price_change_pct=round(max_change, 2),
                                    avg_error_pct=round(avg_err, 2),
                                    normal_avg_error_pct=round(normal_avg, 2),
                                    amplification_ratio=round(avg_err / normal_avg, 2),
                                ))
    except Exception as e:
        logger.warning(f"Surge detection failed: {e}")

    # Data quality summary (recent 14 days)
    data_quality = None
    try:
        quality_checks = run_data_quality_checks(db, grade, days=14)
        if quality_checks:
            err_cnt = sum(1 for c in quality_checks if c.severity == "error")
            warn_cnt = sum(1 for c in quality_checks if c.severity == "warning")
            recent = [c.detail for c in quality_checks[:5]]
            data_quality = DataQualitySummary(
                error_count=err_cnt, warning_count=warn_cnt, recent_issues=recent
            )
    except Exception as e:
        logger.warning(f"Data quality check failed: {e}")

    return AdminDashboardResponse(
        grade=grade,
        kpis=kpis,
        accuracy_trend=accuracy_trend,
        error_alerts=error_alerts[:20],
        surge_alerts=surge_alerts,
        data_quality=data_quality,
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


# ── Monthly Comparison ────────────────────────────────
def get_monthly_comparison(
    db: Session, grade: str, horizon_days: int = 7, days: int = 365
) -> MonthlyComparisonResponse:
    from collections import defaultdict

    cutoff = date.today() - timedelta(days=days)

    rows = (
        db.query(Prediction.target_date, Prediction.predicted_price, EggPrice.wholesale_price)
        .join(EggPrice, (Prediction.target_date == EggPrice.date) & (Prediction.grade == EggPrice.grade))
        .filter(
            Prediction.grade == grade,
            Prediction.horizon_days == horizon_days,
            Prediction.target_date >= cutoff,
            EggPrice.wholesale_price.isnot(None),
            EggPrice.wholesale_price > 0,
        )
        .order_by(Prediction.target_date)
        .all()
    )

    monthly: dict[str, list[tuple[float, float]]] = defaultdict(list)
    for r in rows:
        month_key = r.target_date.strftime("%Y-%m")
        monthly[month_key].append((r.predicted_price, r.wholesale_price))

    items = []
    for month, pairs in sorted(monthly.items()):
        preds = [p for p, _ in pairs]
        actuals = [a for _, a in pairs]
        errors = [abs(p - a) / a * 100 for p, a in pairs]
        items.append(MonthlyComparisonItem(
            month=month,
            avg_predicted=round(sum(preds) / len(preds), 0),
            avg_actual=round(sum(actuals) / len(actuals), 0),
            mape=round(sum(errors) / len(errors), 2),
            sample_count=len(pairs),
        ))

    return MonthlyComparisonResponse(grade=grade, horizon_days=horizon_days, items=items)


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

    volume_rows = db.query(TradingVolume.date, TradingVolume.volume_kg).filter(TradingVolume.date >= cutoff).all()
    volume_map = {r.date: r.volume_kg for r in volume_rows}

    flu_rows = db.query(AvianFluStatus.date, AvianFluStatus.case_count).filter(AvianFluStatus.date >= cutoff).all()
    flu_map = {r.date: float(r.case_count) for r in flu_rows}

    factors = {
        "사료가격": feed_map,
        "환율(USD/KRW)": exchange_map,
        "평균기온": weather_map,
        "거래량": volume_map,
        "조류독감": flu_map,
    }
    # Build prediction error map: date → absolute error percentage
    pred_rows = (
        db.query(Prediction.target_date, Prediction.predicted_price, EggPrice.wholesale_price)
        .join(EggPrice, (Prediction.target_date == EggPrice.date) & (Prediction.grade == EggPrice.grade))
        .filter(
            Prediction.grade == grade,
            Prediction.target_date >= cutoff,
            EggPrice.wholesale_price.isnot(None),
            EggPrice.wholesale_price > 0,
        )
        .all()
    )
    error_map: dict[date, float] = {}
    for r in pred_rows:
        err = abs(r.predicted_price - r.wholesale_price) / r.wholesale_price * 100
        d = r.target_date
        if d not in error_map or err > error_map[d]:
            error_map[d] = err

    correlations = []
    scatter_data = []
    factor_error_scatter: list[FactorErrorScatterItem] = []

    try:
        import numpy as np
        common_dates = sorted(price_map.keys())

        for factor_name, factor_map in factors.items():
            paired = [(price_map[d], factor_map[d]) for d in common_dates if d in factor_map and factor_map[d] is not None]
            if len(paired) >= 10:
                p_arr = [x[0] for x in paired]
                f_arr = [x[1] for x in paired]
                corr = float(np.corrcoef(p_arr, f_arr)[0, 1])

                # Error correlation
                error_paired = [(error_map[d], factor_map[d]) for d in common_dates
                                if d in factor_map and factor_map[d] is not None and d in error_map]
                corr_err = None
                if len(error_paired) >= 10:
                    e_arr = [x[0] for x in error_paired]
                    fe_arr = [x[1] for x in error_paired]
                    corr_err = round(float(np.corrcoef(e_arr, fe_arr)[0, 1]), 4)

                correlations.append(CorrelationItem(
                    factor=factor_name,
                    correlation_with_price=round(corr, 4),
                    correlation_with_error=corr_err,
                ))
                for p_val, f_val in paired[-60:]:
                    scatter_data.append({"factor": factor_name, "factor_value": f_val, "price": p_val})
            else:
                correlations.append(CorrelationItem(factor=factor_name))
        # Factor change rate vs prediction error scatter data
        for factor_name, factor_map in factors.items():
            sorted_factor_dates = sorted(d for d in common_dates if d in factor_map and factor_map[d] is not None)
            for i in range(1, len(sorted_factor_dates)):
                d = sorted_factor_dates[i]
                prev_d = sorted_factor_dates[i - 1]
                prev_val = factor_map[prev_d]
                curr_val = factor_map[d]
                if prev_val and prev_val != 0 and d in error_map:
                    change_pct = (curr_val - prev_val) / abs(prev_val) * 100
                    factor_error_scatter.append(FactorErrorScatterItem(
                        factor=factor_name,
                        factor_change_pct=round(change_pct, 2),
                        error_pct=round(error_map[d], 2),
                    ))

    except ImportError:
        for factor_name in factors:
            correlations.append(CorrelationItem(factor=factor_name))

    return MarketFactorAnalysisResponse(
        grade=grade, days=days, correlations=correlations, scatter_data=scatter_data,
        factor_error_scatter=factor_error_scatter,
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
        ModelPerformance.grade == grade, ModelPerformance.is_production.is_(True)
    ).update({"is_production": False})
    updated = db.query(ModelPerformance).filter(
        ModelPerformance.grade == grade, ModelPerformance.model_version == version
    ).update({"is_production": True})
    db.commit()
    return updated > 0


# ── Error Analysis ────────────────────────────────────
def get_error_analysis(
    db: Session, grade: str, horizon_days: int = 7, days: int = 180
) -> ErrorAnalysisResponse:
    import numpy as np
    from collections import defaultdict

    cutoff = date.today() - timedelta(days=days)

    rows = (
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
            Prediction.horizon_days == horizon_days,
            Prediction.target_date >= cutoff,
            EggPrice.wholesale_price.isnot(None),
            EggPrice.wholesale_price > 0,
        )
        .order_by(Prediction.target_date)
        .all()
    )

    # Build error list
    error_items = []
    for r in rows:
        err = r.predicted_price - r.wholesale_price
        err_pct = err / r.wholesale_price * 100
        error_items.append({
            "target_date": r.target_date,
            "predicted_price": r.predicted_price,
            "actual_price": r.wholesale_price,
            "error": round(err, 2),
            "error_pct": round(err_pct, 2),
            "abs_error_pct": abs(err_pct),
            "horizon_days": r.horizon_days,
            "model_version": r.model_version,
        })

    # TOP 50 by absolute error percentage
    top_sorted = sorted(error_items, key=lambda x: x["abs_error_pct"], reverse=True)[:50]
    top_errors = [
        TopErrorItem(
            target_date=str(e["target_date"]),
            predicted_price=e["predicted_price"],
            actual_price=e["actual_price"],
            error=e["error"],
            error_pct=e["error_pct"],
            horizon_days=e["horizon_days"],
            model_version=e["model_version"],
        )
        for e in top_sorted
    ]

    # Weekday analysis
    weekday_names = ["월", "화", "수", "목", "금", "토", "일"]
    weekday_groups: dict[int, list[float]] = defaultdict(list)
    for e in error_items:
        wd = e["target_date"].weekday()
        weekday_groups[wd].append(e["abs_error_pct"])

    weekday_analysis = [
        WeekdayAnalysisItem(
            weekday=wd,
            weekday_name=weekday_names[wd],
            avg_error_pct=round(float(np.mean(vals)), 2),
            sample_count=len(vals),
        )
        for wd, vals in sorted(weekday_groups.items())
    ]

    # Monthly MAPE
    monthly_groups: dict[str, list[float]] = defaultdict(list)
    for e in error_items:
        month_key = e["target_date"].strftime("%Y-%m")
        monthly_groups[month_key].append(e["abs_error_pct"])

    monthly_analysis = [
        MonthlyAnalysisItem(
            month=m,
            mape=round(float(np.mean(vals)), 2),
            sample_count=len(vals),
        )
        for m, vals in sorted(monthly_groups.items())
    ]

    # Volatility analysis: top 10% daily price change days vs normal
    price_rows = (
        db.query(EggPrice.date, EggPrice.wholesale_price)
        .filter(EggPrice.grade == grade, EggPrice.date >= cutoff, EggPrice.wholesale_price.isnot(None))
        .order_by(EggPrice.date)
        .all()
    )

    volatility = None
    if len(price_rows) >= 10:
        daily_changes: dict[date, float] = {}
        for i in range(1, len(price_rows)):
            prev_p = price_rows[i - 1].wholesale_price
            curr_p = price_rows[i].wholesale_price
            if prev_p and prev_p > 0:
                daily_changes[price_rows[i].date] = abs(curr_p - prev_p) / prev_p * 100

        if daily_changes:
            sorted_changes = sorted(daily_changes.values(), reverse=True)
            threshold_idx = max(1, len(sorted_changes) // 10)
            threshold_pct = sorted_changes[threshold_idx - 1]

            volatile_dates = {d for d, c in daily_changes.items() if c >= threshold_pct}
            normal_dates = {d for d, c in daily_changes.items() if c < threshold_pct}

            volatile_errors = [e["abs_error_pct"] for e in error_items if e["target_date"] in volatile_dates]
            normal_errors = [e["abs_error_pct"] for e in error_items if e["target_date"] in normal_dates]

            if volatile_errors and normal_errors:
                volatility = VolatilityAnalysis(
                    volatile_avg_error_pct=round(float(np.mean(volatile_errors)), 2),
                    volatile_sample_count=len(volatile_errors),
                    normal_avg_error_pct=round(float(np.mean(normal_errors)), 2),
                    normal_sample_count=len(normal_errors),
                    threshold_pct=round(threshold_pct, 2),
                )

    return ErrorAnalysisResponse(
        grade=grade,
        horizon_days=horizon_days,
        top_errors=top_errors,
        weekday_analysis=weekday_analysis,
        monthly_analysis=monthly_analysis,
        volatility=volatility,
    )


# ── Price Management ──────────────────────────────────
def upsert_price(db: Session, user_id: int, data) -> EggPrice:
    existing = db.query(EggPrice).filter(
        EggPrice.date == data.date, EggPrice.grade == data.grade
    ).first()

    if existing:
        for field in ("wholesale_price",):
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
        db.query(EggPrice.date, EggPrice.wholesale_price)
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
