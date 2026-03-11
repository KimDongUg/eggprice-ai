"""News API endpoints — DB-backed public listing."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.news import NewsArticle

router = APIRouter(prefix="/news", tags=["news"])


@router.get("/")
def list_news(
    category: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Public news listing from DB."""
    q = db.query(NewsArticle)
    count_q = db.query(func.count(NewsArticle.id))

    if category:
        q = q.filter(NewsArticle.category == category)
        count_q = count_q.filter(NewsArticle.category == category)

    total = count_q.scalar()
    items = (
        q.order_by(desc(NewsArticle.published_at))
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
                "commentary": a.commentary,
                "published_at": a.published_at.isoformat() if a.published_at else None,
                "seo_slug": a.seo_slug,
            }
            for a in items
        ],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.post("/crawl")
async def trigger_crawl(db: Session = Depends(get_db)):
    """Manually trigger news + analysis crawl."""
    import traceback
    from app.services.news_crawler import crawl_all
    try:
        result = await crawl_all(db)
        return {"status": "ok", "crawled": result}
    except Exception as e:
        return {"status": "error", "detail": str(e), "traceback": traceback.format_exc()}


@router.post("/backfill-commentary")
def backfill_commentary(db: Session = Depends(get_db)):
    """기존 기사 중 해설이 없는 것에 일괄 해설 생성."""
    from app.services.news_commentary import generate_commentary

    articles = db.query(NewsArticle).filter(
        (NewsArticle.commentary.is_(None)) | (NewsArticle.commentary == "")
    ).all()

    count = 0
    for a in articles:
        a.commentary = generate_commentary(a.title, a.summary or a.title, a.category)
        count += 1

    if count > 0:
        db.commit()

    return {"status": "ok", "updated": count}


@router.get("/{slug}")
def get_news_article(slug: str, db: Session = Depends(get_db)):
    """Get single news article by slug."""
    article = db.query(NewsArticle).filter(NewsArticle.seo_slug == slug).first()
    if not article:
        raise HTTPException(status_code=404, detail="기사를 찾을 수 없습니다.")
    return {
        "id": article.id,
        "title": article.title,
        "summary": article.summary,
        "content": article.content,
        "commentary": article.commentary,
        "category": article.category,
        "source": article.source,
        "source_name": article.source_name,
        "published_at": article.published_at.isoformat() if article.published_at else None,
        "seo_slug": article.seo_slug,
    }
