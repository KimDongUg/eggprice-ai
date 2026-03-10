from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


# ── Dashboard ──────────────────────────────────────────
class KpiCard(BaseModel):
    label: str
    horizon_days: int
    mape: Optional[float] = None
    mae: Optional[float] = None
    prev_mape: Optional[float] = None
    trend: Optional[str] = None  # "up" | "down" | "flat"
    sample_count: int = 0


class SurgeAlert(BaseModel):
    period_start: str
    period_end: str
    price_change_pct: float
    avg_error_pct: float
    normal_avg_error_pct: float
    amplification_ratio: float  # how much worse errors are during surge


class DataQualitySummary(BaseModel):
    error_count: int = 0
    warning_count: int = 0
    recent_issues: list[str] = []


class AdminDashboardResponse(BaseModel):
    grade: str
    kpis: list[KpiCard]
    accuracy_trend: list[dict]
    error_alerts: list[dict]
    surge_alerts: list[SurgeAlert] = []
    data_quality: Optional[DataQualitySummary] = None


# ── Prediction vs Actual ──────────────────────────────
class PredVsActualItem(BaseModel):
    target_date: str
    predicted_price: float
    actual_price: Optional[float] = None
    error: Optional[float] = None
    error_pct: Optional[float] = None
    model_version: str


class PredVsActualResponse(BaseModel):
    grade: str
    horizon_days: int
    items: list[PredVsActualItem]


# ── Monthly Comparison ────────────────────────────────
class MonthlyComparisonItem(BaseModel):
    month: str  # "YYYY-MM"
    avg_predicted: float
    avg_actual: float
    mape: float
    sample_count: int


class MonthlyComparisonResponse(BaseModel):
    grade: str
    horizon_days: int
    items: list[MonthlyComparisonItem]


# ── Market Factor Analysis ────────────────────────────
class CorrelationItem(BaseModel):
    factor: str
    correlation_with_price: Optional[float] = None
    correlation_with_error: Optional[float] = None


class FactorErrorScatterItem(BaseModel):
    factor: str
    factor_change_pct: float
    error_pct: float


class MarketFactorAnalysisResponse(BaseModel):
    grade: str
    days: int
    correlations: list[CorrelationItem]
    scatter_data: list[dict]
    factor_error_scatter: list[FactorErrorScatterItem] = []


# ── Model Management ──────────────────────────────────
class ModelVersionItem(BaseModel):
    model_version: str
    grade: str
    latest_eval_date: Optional[str] = None
    avg_mape: Optional[float] = None
    is_production: bool
    eval_count: int = 0

    model_config = {"from_attributes": True}


class RetrainRequestCreate(BaseModel):
    grade: str
    reason: Optional[str] = None


class RetrainRequestResponse(BaseModel):
    id: int
    requested_by: int
    grade: str
    reason: Optional[str] = None
    status: str
    model_version: Optional[str] = None
    result_mape: Optional[float] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── Price Management ──────────────────────────────────
class ManualPriceInput(BaseModel):
    date: date
    grade: str
    wholesale_price: Optional[float] = None
    reason: Optional[str] = None


class PriceCorrectionResponse(BaseModel):
    id: int
    egg_price_id: int
    corrected_by: int
    field: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    reason: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class DataQualityCheck(BaseModel):
    check_type: str  # "missing" | "outlier" | "gap"
    severity: str  # "warning" | "error"
    date: Optional[str] = None
    grade: Optional[str] = None
    detail: str


# ── Error Analysis ───────────────────────────────────
class TopErrorItem(BaseModel):
    target_date: str
    predicted_price: float
    actual_price: float
    error: float
    error_pct: float
    horizon_days: int
    model_version: str


class WeekdayAnalysisItem(BaseModel):
    weekday: int  # 0=Mon … 6=Sun
    weekday_name: str
    avg_error_pct: float
    sample_count: int


class MonthlyAnalysisItem(BaseModel):
    month: str  # "YYYY-MM"
    mape: float
    sample_count: int


class VolatilityAnalysis(BaseModel):
    volatile_avg_error_pct: float
    volatile_sample_count: int
    normal_avg_error_pct: float
    normal_sample_count: int
    threshold_pct: float


class ErrorAnalysisResponse(BaseModel):
    grade: str
    horizon_days: int
    top_errors: list[TopErrorItem]
    weekday_analysis: list[WeekdayAnalysisItem]
    monthly_analysis: list[MonthlyAnalysisItem]
    volatility: Optional[VolatilityAnalysis] = None
