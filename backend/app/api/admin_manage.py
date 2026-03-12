"""Admin management API — users, community, news, analysis articles."""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_admin_user
from app.models.user import User
from app.models.community import CommunityPost, CommunityComment
from app.models.news import NewsArticle, AnalysisArticle

router = APIRouter(prefix="/admin", tags=["admin-manage"])


# ── Users ─────────────────────────────────────────────


class UserItem(BaseModel):
    id: int
    email: str | None
    name: str | None
    provider: str
    role: str
    is_active: bool
    created_at: str


class UserListResponse(BaseModel):
    items: list[UserItem]
    total: int


@router.get("/users", response_model=UserListResponse)
def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    total = db.query(User).count()
    users = (
        db.query(User)
        .order_by(User.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return UserListResponse(
        items=[
            UserItem(
                id=u.id,
                email=u.email,
                name=u.name,
                provider=u.provider,
                role=u.role,
                is_active=u.is_active,
                created_at=u.created_at.isoformat(),
            )
            for u in users
        ],
        total=total,
    )


class UserRoleUpdate(BaseModel):
    role: str


@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    body: UserRoleUpdate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    if body.role not in ("user", "admin", "analyst"):
        raise HTTPException(400, "유효하지 않은 역할입니다.")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "사용자를 찾을 수 없습니다.")
    user.role = body.role
    db.commit()
    return {"ok": True}


@router.patch("/users/{user_id}/toggle-active")
def toggle_user_active(
    user_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "사용자를 찾을 수 없습니다.")
    user.is_active = not user.is_active
    db.commit()
    return {"ok": True, "is_active": user.is_active}


# ── Community ─────────────────────────────────────────


class CommunityPostItem(BaseModel):
    id: int
    title: str
    author_name: str
    views: int
    comment_count: int
    created_at: str


class CommunityListResponse(BaseModel):
    items: list[CommunityPostItem]
    total: int


@router.get("/community/posts", response_model=CommunityListResponse)
def admin_list_community(
    page: int = Query(1, ge=1),
    per_page: int = Query(30, ge=1, le=100),
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    total = db.query(CommunityPost).count()
    posts = (
        db.query(CommunityPost)
        .order_by(CommunityPost.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    post_ids = [p.id for p in posts]
    comment_counts: dict[int, int] = {}
    if post_ids:
        rows = (
            db.query(CommunityComment.post_id, func.count(CommunityComment.id))
            .filter(CommunityComment.post_id.in_(post_ids))
            .group_by(CommunityComment.post_id)
            .all()
        )
        comment_counts = {pid: cnt for pid, cnt in rows}

    return CommunityListResponse(
        items=[
            CommunityPostItem(
                id=p.id,
                title=p.title,
                author_name=p.author_name,
                views=p.views,
                comment_count=comment_counts.get(p.id, 0),
                created_at=p.created_at.isoformat(),
            )
            for p in posts
        ],
        total=total,
    )


@router.delete("/community/posts/{post_id}", status_code=204)
def admin_delete_community_post(
    post_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "게시글을 찾을 수 없습니다.")
    db.query(CommunityComment).filter(CommunityComment.post_id == post_id).delete()
    db.delete(post)
    db.commit()


@router.delete("/community/comments/{comment_id}", status_code=204)
def admin_delete_comment(
    comment_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    comment = db.query(CommunityComment).filter(CommunityComment.id == comment_id).first()
    if not comment:
        raise HTTPException(404, "댓글을 찾을 수 없습니다.")
    db.delete(comment)
    db.commit()


# ── News ──────────────────────────────────────────────


class NewsItem(BaseModel):
    id: int
    title: str
    category: str
    source_name: str | None
    published_at: str
    has_commentary: bool


class NewsListResponse(BaseModel):
    items: list[NewsItem]
    total: int


@router.get("/news", response_model=NewsListResponse)
def admin_list_news(
    page: int = Query(1, ge=1),
    per_page: int = Query(30, ge=1, le=100),
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    from sqlalchemy import text as sa_text

    # Check if commentary column exists (deferred column may not be in DB yet)
    has_commentary_col = True
    try:
        db.execute(sa_text("SELECT commentary FROM news_articles LIMIT 0"))
    except Exception:
        db.rollback()
        has_commentary_col = False

    total = db.query(NewsArticle).count()
    articles = (
        db.query(NewsArticle)
        .order_by(NewsArticle.published_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    def _has_commentary(a: NewsArticle) -> bool:
        if not has_commentary_col:
            return False
        try:
            return bool(a.commentary)
        except Exception:
            return False

    return NewsListResponse(
        items=[
            NewsItem(
                id=a.id,
                title=a.title,
                category=a.category,
                source_name=a.source_name,
                published_at=a.published_at.isoformat() if a.published_at else "",
                has_commentary=_has_commentary(a),
            )
            for a in articles
        ],
        total=total,
    )


@router.delete("/news/{article_id}", status_code=204)
def admin_delete_news(
    article_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    article = db.query(NewsArticle).filter(NewsArticle.id == article_id).first()
    if not article:
        raise HTTPException(404, "뉴스를 찾을 수 없습니다.")
    db.delete(article)
    db.commit()


# ── Analysis Articles ─────────────────────────────────


class AnalysisItem(BaseModel):
    id: int
    title: str
    category: str
    seo_slug: str | None
    source_name: str | None
    published_at: str


class AnalysisListResponse(BaseModel):
    items: list[AnalysisItem]
    total: int


@router.get("/articles", response_model=AnalysisListResponse)
def admin_list_analysis(
    page: int = Query(1, ge=1),
    per_page: int = Query(30, ge=1, le=100),
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    total = db.query(AnalysisArticle).count()
    articles = (
        db.query(AnalysisArticle)
        .order_by(AnalysisArticle.published_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return AnalysisListResponse(
        items=[
            AnalysisItem(
                id=a.id,
                title=a.title,
                category=a.category,
                seo_slug=a.seo_slug,
                source_name=a.source_name,
                published_at=a.published_at.isoformat() if a.published_at else "",
            )
            for a in articles
        ],
        total=total,
    )


@router.delete("/articles/{article_id}", status_code=204)
def admin_delete_analysis(
    article_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    article = db.query(AnalysisArticle).filter(AnalysisArticle.id == article_id).first()
    if not article:
        raise HTTPException(404, "분석글을 찾을 수 없습니다.")
    db.delete(article)
    db.commit()
