from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, get_admin_user
from app.models.page_view import PageView
from app.models.user import User

router = APIRouter(prefix="/page-views", tags=["page-views"])


class PageViewCreate(BaseModel):
    path: str = Field(..., min_length=1, max_length=500)


class PageViewResponse(BaseModel):
    ok: bool = True


@router.post("", response_model=PageViewResponse)
def record_page_view(
    body: PageViewCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Record a page view for the current logged-in user. Admins are excluded."""
    if user.role == "admin":
        return PageViewResponse()

    pv = PageView(user_id=user.id, path=body.path)
    db.add(pv)
    db.commit()
    return PageViewResponse()


# ── Admin: analytics ─────────────────────────────────


class UserPageStat(BaseModel):
    user_id: int
    email: str | None
    name: str | None
    provider: str
    total_views: int
    pages: list[dict]  # [{path, count}]


class PageViewStats(BaseModel):
    total_users: int
    total_views: int
    users: list[UserPageStat]


@router.get("/stats", response_model=PageViewStats)
def get_page_view_stats(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Admin-only: get page view statistics per user."""
    # Per-user total views
    user_totals = (
        db.query(
            PageView.user_id,
            func.count(PageView.id).label("total_views"),
        )
        .group_by(PageView.user_id)
        .order_by(func.count(PageView.id).desc())
        .all()
    )

    user_ids = [r.user_id for r in user_totals]
    users_map = {}
    if user_ids:
        users = db.query(User).filter(User.id.in_(user_ids)).all()
        users_map = {u.id: u for u in users}

    # Per-user per-path counts
    path_counts = (
        db.query(
            PageView.user_id,
            PageView.path,
            func.count(PageView.id).label("cnt"),
        )
        .group_by(PageView.user_id, PageView.path)
        .order_by(PageView.user_id, func.count(PageView.id).desc())
        .all()
    )

    path_map: dict[int, list[dict]] = {}
    for row in path_counts:
        path_map.setdefault(row.user_id, []).append(
            {"path": row.path, "count": row.cnt}
        )

    result_users = []
    for row in user_totals:
        u = users_map.get(row.user_id)
        result_users.append(
            UserPageStat(
                user_id=row.user_id,
                email=u.email if u else None,
                name=u.name if u else None,
                provider=u.provider if u else "unknown",
                total_views=row.total_views,
                pages=path_map.get(row.user_id, []),
            )
        )

    total_views = sum(r.total_views for r in user_totals)
    return PageViewStats(
        total_users=len(user_totals),
        total_views=total_views,
        users=result_users,
    )
