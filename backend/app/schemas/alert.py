from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr


class AlertCreate(BaseModel):
    email: EmailStr
    grade: str
    condition: Literal["above", "below"]
    threshold_price: float


class AlertResponse(BaseModel):
    id: int
    email: str
    grade: str
    condition: str
    threshold_price: float
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
