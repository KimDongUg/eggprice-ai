from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class PredictionResponse(BaseModel):
    id: int
    base_date: date
    target_date: date
    grade: str
    predicted_price: float
    confidence_lower: float
    confidence_upper: float
    horizon_days: int
    model_version: str
    created_at: datetime

    model_config = {"from_attributes": True}


class PredictionSummary(BaseModel):
    grade: str
    predictions: list[PredictionResponse]


class ForecastItem(BaseModel):
    """Single forecast point matching the spec response format."""
    date: date
    price: float
    confidence_interval: list[float]
    change_percent: float


class ForecastResponse(BaseModel):
    """Full forecast response matching the spec API design."""
    grade: str
    current_price: Optional[float] = None
    predictions: list[ForecastItem]
    trend: str  # '상승', '하락', '보합'
    alert: Optional[str] = None
