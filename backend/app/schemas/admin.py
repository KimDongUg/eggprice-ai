from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


# ── Dashboard ──────────────────────────────────────────
class KpiCard(BaseModel):
    label: str
    horizon_days: int
    mape: Optional[float] = None
    prev_mape: Optional[float] = None
    trend: Optional[str] = None  # "up" | "down" | "flat"
    sample_count: int = 0


class AdminDashboardResponse(BaseModel):
    grade: str
    kpis: list[KpiCard]
    accuracy_trend: list[dict]
    error_alerts: list[dict]


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


# ── Market Factor Analysis ────────────────────────────
class CorrelationItem(BaseModel):
    factor: str
    correlation_with_price: Optional[float] = None
    correlation_with_error: Optional[float] = None


class MarketFactorAnalysisResponse(BaseModel):
    grade: str
    days: int
    correlations: list[CorrelationItem]
    scatter_data: list[dict]


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
    retail_price: Optional[float] = None
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
