from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class TradingVolumeResponse(BaseModel):
    date: date
    volume_kg: float

    model_config = {"from_attributes": True}


class FeedPriceResponse(BaseModel):
    date: date
    feed_type: str
    price: float
    unit: str

    model_config = {"from_attributes": True}


class ExchangeRateResponse(BaseModel):
    date: date
    usd_krw: float

    model_config = {"from_attributes": True}


class AvianFluResponse(BaseModel):
    date: date
    is_outbreak: bool
    case_count: int
    region: Optional[str] = None

    model_config = {"from_attributes": True}


class WeatherResponse(BaseModel):
    date: date
    avg_temperature: Optional[float] = None
    max_temperature: Optional[float] = None
    min_temperature: Optional[float] = None
    humidity: Optional[float] = None

    model_config = {"from_attributes": True}


class MarketDataSnapshot(BaseModel):
    """Aggregated market data for a single date, matching the spec."""
    date: date
    prices: dict[str, Optional[float]]
    volume: Optional[float] = None
    corn_price: Optional[float] = None
    exchange_rate: Optional[float] = None
    avian_flu: bool = False
    temperature: Optional[float] = None


class ModelPerformanceResponse(BaseModel):
    model_version: str
    grade: str
    eval_date: date
    mae: float
    rmse: float
    mape: float
    directional_accuracy: float
    is_production: bool
    created_at: datetime

    model_config = {"from_attributes": True}
