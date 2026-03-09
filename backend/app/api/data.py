"""Public historical data endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.price import EggPrice

router = APIRouter(prefix="/data", tags=["data"])


@router.get("/yearly")
def yearly_data(
    grade: str = Query("특란"),
    region: str = Query("seoul"),
    db: Session = Depends(get_db),
):
    """Yearly average prices (지역별)."""
    q = (
        db.query(
            extract("year", EggPrice.date).label("year"),
            func.avg(EggPrice.wholesale_price).label("avg_wholesale"),
            func.avg(EggPrice.retail_price).label("avg_retail"),
            func.count(EggPrice.id).label("count"),
        )
        .filter(
            EggPrice.grade == grade,
            EggPrice.region == region,
            EggPrice.wholesale_price.isnot(None),
        )
        .group_by(extract("year", EggPrice.date))
        .order_by(extract("year", EggPrice.date))
    )
    rows = q.all()

    # Fallback to Seoul if no data
    if not rows and region != "seoul":
        rows = (
            db.query(
                extract("year", EggPrice.date).label("year"),
                func.avg(EggPrice.wholesale_price).label("avg_wholesale"),
                func.avg(EggPrice.retail_price).label("avg_retail"),
                func.count(EggPrice.id).label("count"),
            )
            .filter(
                EggPrice.grade == grade,
                EggPrice.region == "seoul",
                EggPrice.wholesale_price.isnot(None),
            )
            .group_by(extract("year", EggPrice.date))
            .order_by(extract("year", EggPrice.date))
            .all()
        )

    return {
        "grade": grade,
        "region": region,
        "items": [
            {
                "year": int(r.year),
                "avg_wholesale": round(float(r.avg_wholesale)) if r.avg_wholesale else None,
                "avg_retail": round(float(r.avg_retail)) if r.avg_retail else None,
                "data_count": r.count,
            }
            for r in rows
        ],
    }


@router.get("/monthly")
def monthly_data(
    grade: str = Query("특란"),
    region: str = Query("seoul"),
    year: int = Query(None),
    db: Session = Depends(get_db),
):
    """Monthly average prices (지역별)."""
    q = db.query(
        extract("year", EggPrice.date).label("year"),
        extract("month", EggPrice.date).label("month"),
        func.avg(EggPrice.wholesale_price).label("avg_wholesale"),
        func.avg(EggPrice.retail_price).label("avg_retail"),
        func.min(EggPrice.wholesale_price).label("min_wholesale"),
        func.max(EggPrice.wholesale_price).label("max_wholesale"),
        func.count(EggPrice.id).label("count"),
    ).filter(
        EggPrice.grade == grade,
        EggPrice.region == region,
        EggPrice.wholesale_price.isnot(None),
    )

    if year:
        q = q.filter(extract("year", EggPrice.date) == year)

    rows = (
        q.group_by(extract("year", EggPrice.date), extract("month", EggPrice.date))
        .order_by(extract("year", EggPrice.date), extract("month", EggPrice.date))
        .all()
    )

    # Fallback to Seoul if no data
    if not rows and region != "seoul":
        q2 = db.query(
            extract("year", EggPrice.date).label("year"),
            extract("month", EggPrice.date).label("month"),
            func.avg(EggPrice.wholesale_price).label("avg_wholesale"),
            func.avg(EggPrice.retail_price).label("avg_retail"),
            func.min(EggPrice.wholesale_price).label("min_wholesale"),
            func.max(EggPrice.wholesale_price).label("max_wholesale"),
            func.count(EggPrice.id).label("count"),
        ).filter(
            EggPrice.grade == grade,
            EggPrice.region == "seoul",
            EggPrice.wholesale_price.isnot(None),
        )
        if year:
            q2 = q2.filter(extract("year", EggPrice.date) == year)
        rows = (
            q2.group_by(extract("year", EggPrice.date), extract("month", EggPrice.date))
            .order_by(extract("year", EggPrice.date), extract("month", EggPrice.date))
            .all()
        )

    return {
        "grade": grade,
        "region": region,
        "items": [
            {
                "year": int(r.year),
                "month": int(r.month),
                "avg_wholesale": round(float(r.avg_wholesale)) if r.avg_wholesale else None,
                "avg_retail": round(float(r.avg_retail)) if r.avg_retail else None,
                "min_wholesale": r.min_wholesale,
                "max_wholesale": r.max_wholesale,
                "data_count": r.count,
            }
            for r in rows
        ],
    }
