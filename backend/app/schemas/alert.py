import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, model_validator


class AlertCreate(BaseModel):
    email: EmailStr
    phone: str | None = None
    grade: str
    condition: Literal["above", "below"]
    threshold_price: float
    notify_email: bool = True
    notify_sms: bool = False

    @model_validator(mode="after")
    def check_notification_method(self):
        if not self.notify_email and not self.notify_sms:
            raise ValueError("이메일 또는 문자 중 하나 이상의 알림 수단을 선택해야 합니다.")
        if self.notify_sms and not self.phone:
            raise ValueError("문자 알림을 선택한 경우 전화번호를 입력해야 합니다.")
        if self.phone:
            cleaned = re.sub(r"[\s\-]", "", self.phone)
            if not re.match(r"^01[016789]\d{7,8}$", cleaned):
                raise ValueError("올바른 휴대폰 번호 형식이 아닙니다. (예: 010-1234-5678)")
        return self


class AlertResponse(BaseModel):
    id: int
    email: str
    phone: str | None = None
    grade: str
    condition: str
    threshold_price: float
    notify_email: bool
    notify_sms: bool
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
