from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class EggPrice(Base):
    __tablename__ = "egg_prices"
    __table_args__ = (UniqueConstraint("date", "grade", name="uq_date_grade"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    grade: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    wholesale_price: Mapped[float] = mapped_column(Float, nullable=True)
    retail_price: Mapped[float] = mapped_column(Float, nullable=True)
    unit: Mapped[str] = mapped_column(String(20), default="30개")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
