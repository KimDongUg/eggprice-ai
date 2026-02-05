from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    grade: Mapped[str] = mapped_column(String(10), nullable=False)
    # 'condition' is a PostgreSQL reserved word, so we quote it explicitly
    condition: Mapped[str] = mapped_column("condition", String(10), nullable=False)
    threshold_price: Mapped[float] = mapped_column(Float, nullable=False)
    notify_email: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_sms: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
