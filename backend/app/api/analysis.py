"""Public analysis endpoints — market analysis articles."""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db

router = APIRouter(prefix="/analysis", tags=["analysis"])

_SAMPLE_ANALYSES = [
    {
        "id": 1,
        "title": "이번주 계란 가격 전망 (3월 2주차)",
        "summary": "AI 분석 기반 이번 주 계란 가격 방향성과 주요 변동 요인을 분석합니다.",
        "category": "주간전망",
        "published_at": "2026-03-08T09:00:00",
        "seo_slug": "weekly-egg-forecast-march-week2",
    },
    {
        "id": 2,
        "title": "조류독감(AI) 영향 분석 리포트",
        "summary": "2026년 조류독감 발생 현황이 계란 가격에 미치는 영향을 심층 분석합니다.",
        "category": "AI분석",
        "published_at": "2026-03-06T10:00:00",
        "seo_slug": "avian-flu-impact-analysis-2026",
    },
    {
        "id": 3,
        "title": "사료 가격 영향 분석",
        "summary": "국제 옥수수·대두박 가격 변동이 국내 계란 생산비와 시세에 미치는 영향을 분석합니다.",
        "category": "사료분석",
        "published_at": "2026-03-04T14:00:00",
        "seo_slug": "feed-price-impact-analysis",
    },
    {
        "id": 4,
        "title": "환율 변동과 계란 가격 상관관계",
        "summary": "원/달러 환율 변동이 사료 수입가와 계란 시세에 미치는 영향을 분석합니다.",
        "category": "환율분석",
        "published_at": "2026-03-02T11:00:00",
        "seo_slug": "exchange-rate-egg-price-correlation",
    },
]


@router.get("/")
def list_analyses(
    category: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Public analysis articles listing."""
    items = _SAMPLE_ANALYSES
    if category:
        items = [a for a in items if a["category"] == category]
    total = len(items)
    start = (page - 1) * limit
    end = start + limit
    return {"items": items[start:end], "total": total, "page": page, "limit": limit}
