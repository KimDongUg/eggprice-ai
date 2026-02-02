from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class PriceBase(BaseModel):
    date: date
    grade: str
    wholesale_price: Optional[float] = None
    retail_price: Optional[float] = None
    unit: str = "30개"


class PriceResponse(PriceBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class PriceWithChange(PriceBase):
    daily_change: Optional[float] = None
    daily_change_pct: Optional[float] = None

    model_config = {"from_attributes": True}


class PriceHistoryCompact(BaseModel):
    """Lightweight history response — smaller payload."""
    d: str        # date
    r: int        # retail_price
    w: int        # wholesale_price

    model_config = {"from_attributes": True}


class PriceHistoryParams(BaseModel):
    grade: str = "특란"
    days: int = 90
