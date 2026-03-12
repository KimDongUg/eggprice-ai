from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, cast, Date, extract
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


# ── Admin: visitor statistics (charts) ───────────────


class DailyStat(BaseModel):
    date: str
    unique_visitors: int
    page_views: int


class HourlyStat(BaseModel):
    hour: int
    page_views: int


class PopularPage(BaseModel):
    path: str
    views: int
    unique_visitors: int


class VisitorStatsResponse(BaseModel):
    # Summary
    today_visitors: int
    today_views: int
    yesterday_visitors: int
    yesterday_views: int
    total_visitors: int
    total_views: int
    # Charts
    daily: list[DailyStat]
    hourly: list[HourlyStat]
    popular_pages: list[PopularPage]


@router.get("/visitor-stats", response_model=VisitorStatsResponse)
def get_visitor_stats(
    days: int = Query(30, ge=1, le=365),
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Admin-only: comprehensive visitor statistics with daily/hourly trends."""
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)
    since = today_start - timedelta(days=days)

    # ── Today / Yesterday summary ──
    today_visitors = (
        db.query(func.count(func.distinct(PageView.user_id)))
        .filter(PageView.created_at >= today_start)
        .scalar()
    ) or 0
    today_views = (
        db.query(func.count(PageView.id))
        .filter(PageView.created_at >= today_start)
        .scalar()
    ) or 0
    yesterday_visitors = (
        db.query(func.count(func.distinct(PageView.user_id)))
        .filter(PageView.created_at >= yesterday_start, PageView.created_at < today_start)
        .scalar()
    ) or 0
    yesterday_views = (
        db.query(func.count(PageView.id))
        .filter(PageView.created_at >= yesterday_start, PageView.created_at < today_start)
        .scalar()
    ) or 0

    # ── Total ──
    total_visitors = (
        db.query(func.count(func.distinct(PageView.user_id))).scalar()
    ) or 0
    total_views = db.query(func.count(PageView.id)).scalar() or 0

    # ── Daily trend ──
    daily_rows = (
        db.query(
            cast(PageView.created_at, Date).label("day"),
            func.count(func.distinct(PageView.user_id)).label("uv"),
            func.count(PageView.id).label("pv"),
        )
        .filter(PageView.created_at >= since)
        .group_by(cast(PageView.created_at, Date))
        .order_by(cast(PageView.created_at, Date))
        .all()
    )

    # Fill missing days with zeros
    daily_map = {str(r.day): {"uv": r.uv, "pv": r.pv} for r in daily_rows}
    daily: list[DailyStat] = []
    for i in range(days + 1):
        d = (since + timedelta(days=i)).date()
        ds = str(d)
        entry = daily_map.get(ds, {"uv": 0, "pv": 0})
        daily.append(DailyStat(date=ds, unique_visitors=entry["uv"], page_views=entry["pv"]))

    # ── Hourly distribution (last N days) ──
    hourly_rows = (
        db.query(
            extract("hour", PageView.created_at).label("hr"),
            func.count(PageView.id).label("pv"),
        )
        .filter(PageView.created_at >= since)
        .group_by(extract("hour", PageView.created_at))
        .order_by(extract("hour", PageView.created_at))
        .all()
    )
    hourly_map = {int(r.hr): r.pv for r in hourly_rows}
    hourly = [HourlyStat(hour=h, page_views=hourly_map.get(h, 0)) for h in range(24)]

    # ── Popular pages ──
    popular_rows = (
        db.query(
            PageView.path,
            func.count(PageView.id).label("views"),
            func.count(func.distinct(PageView.user_id)).label("uv"),
        )
        .filter(PageView.created_at >= since)
        .group_by(PageView.path)
        .order_by(func.count(PageView.id).desc())
        .limit(20)
        .all()
    )
    popular_pages = [
        PopularPage(path=r.path, views=r.views, unique_visitors=r.uv)
        for r in popular_rows
    ]

    return VisitorStatsResponse(
        today_visitors=today_visitors,
        today_views=today_views,
        yesterday_visitors=yesterday_visitors,
        yesterday_views=yesterday_views,
        total_visitors=total_visitors,
        total_views=total_views,
        daily=daily,
        hourly=hourly,
        popular_pages=popular_pages,
    )
