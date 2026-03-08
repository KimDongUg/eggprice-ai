"""Public analysis endpoints — DB-backed market analysis articles."""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.news import AnalysisArticle

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.get("/")
def list_analyses(
    category: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Public analysis articles listing from DB."""
    q = db.query(AnalysisArticle)
    count_q = db.query(func.count(AnalysisArticle.id))

    if category:
        q = q.filter(AnalysisArticle.category == category)
        count_q = count_q.filter(AnalysisArticle.category == category)

    total = count_q.scalar()
    items = (
        q.order_by(desc(AnalysisArticle.published_at))
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return {
        "items": [
            {
                "id": a.id,
                "title": a.title,
                "summary": a.summary,
                "category": a.category,
                "source": a.source,
                "source_name": a.source_name,
                "published_at": a.published_at.isoformat() if a.published_at else None,
                "seo_slug": a.seo_slug,
            }
            for a in items
        ],
        "total": total,
        "page": page,
        "limit": limit,
    }
