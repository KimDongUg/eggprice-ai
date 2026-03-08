"""News API endpoints — public listing."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db

router = APIRouter(prefix="/news", tags=["news"])


# Placeholder data until news_articles DB table is ready
_SAMPLE_NEWS = [
    {
        "id": 1,
        "title": "2026년 3월 계란 가격 동향 분석",
        "summary": "최근 사료 가격 상승과 조류독감 우려로 인해 계란 가격이 상승세를 보이고 있습니다.",
        "category": "가격",
        "published_at": "2026-03-07T09:00:00",
        "seo_slug": "2026-march-egg-price-trend",
    },
    {
        "id": 2,
        "title": "조류인플루엔자 발생 현황과 계란 시장 영향",
        "summary": "전국 양계 농가의 방역 강화 조치와 함께 계란 공급 감소 우려가 커지고 있습니다.",
        "category": "산업",
        "published_at": "2026-03-05T10:30:00",
        "seo_slug": "avian-flu-egg-market-impact",
    },
    {
        "id": 3,
        "title": "사료 가격 상승이 계란 생산비에 미치는 영향",
        "summary": "옥수수와 대두박 가격의 지속적인 상승으로 양계 농가의 생산비 부담이 증가하고 있습니다.",
        "category": "사료",
        "published_at": "2026-03-03T14:00:00",
        "seo_slug": "feed-price-impact-egg-production",
    },
    {
        "id": 4,
        "title": "소비자 물가와 계란 소매가격 추이",
        "summary": "물가 상승 추세 속에서 계란은 여전히 가성비 높은 단백질 공급원으로 소비가 유지되고 있습니다.",
        "category": "가격",
        "published_at": "2026-03-01T08:00:00",
        "seo_slug": "consumer-price-egg-retail-trend",
    },
    {
        "id": 5,
        "title": "양계 산업 구조 변화와 2026년 전망",
        "summary": "대규모 농장 중심의 산업 재편이 가속화되면서 중소 농가의 경쟁력 강화 방안이 논의되고 있습니다.",
        "category": "산업",
        "published_at": "2026-02-28T11:00:00",
        "seo_slug": "poultry-industry-restructuring-2026",
    },
]


@router.get("/")
def list_news(
    category: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Public news listing."""
    items = _SAMPLE_NEWS
    if category:
        items = [n for n in items if n["category"] == category]
    total = len(items)
    start = (page - 1) * limit
    end = start + limit
    return {"items": items[start:end], "total": total, "page": page, "limit": limit}


@router.get("/{slug}")
def get_news_article(slug: str, db: Session = Depends(get_db)):
    """Get single news article by slug."""
    for item in _SAMPLE_NEWS:
        if item["seo_slug"] == slug:
            return item
    raise HTTPException(status_code=404, detail="기사를 찾을 수 없습니다.")
