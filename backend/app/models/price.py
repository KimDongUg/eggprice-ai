from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class EggPrice(Base):
    __tablename__ = "egg_prices"
    __table_args__ = (
        UniqueConstraint("date", "grade", "region", name="uq_date_grade_region"),
        Index("ix_eggprice_grade_date", "grade", "date"),
        Index("ix_eggprice_region", "region"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    grade: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    region: Mapped[str] = mapped_column(String(20), nullable=False, default="seoul", server_default="seoul")
    wholesale_price: Mapped[float] = mapped_column(Float, nullable=True)
    retail_price: Mapped[float] = mapped_column(Float, nullable=True)
    unit: Mapped[str] = mapped_column(String(20), default="30개")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
