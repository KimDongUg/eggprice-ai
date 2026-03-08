"""News and analysis article models."""

from datetime import datetime

from sqlalchemy import DateTime, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class NewsArticle(Base):
    __tablename__ = "news_articles"
    __table_args__ = (
        Index("ix_news_category", "category"),
        Index("ix_news_published", "published_at"),
        Index("ix_news_slug", "seo_slug", unique=True),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)  # 가격, 산업, 사료
    source: Mapped[str] = mapped_column(String(200), nullable=True)  # 출처 URL
    source_name: Mapped[str] = mapped_column(String(100), nullable=True)  # 출처 이름
    seo_slug: Mapped[str] = mapped_column(String(300), nullable=False, unique=True)
    published_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AnalysisArticle(Base):
    __tablename__ = "analysis_articles"
    __table_args__ = (
        Index("ix_analysis_category", "category"),
        Index("ix_analysis_published", "published_at"),
        Index("ix_analysis_slug", "seo_slug", unique=True),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)  # 주간전망, AI분석, 사료분석, 환율분석
    source: Mapped[str] = mapped_column(String(200), nullable=True)
    source_name: Mapped[str] = mapped_column(String(100), nullable=True)
    seo_slug: Mapped[str] = mapped_column(String(300), nullable=False, unique=True)
    published_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
