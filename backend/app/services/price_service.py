import logging
from datetime import date, timedelta

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.price import EggPrice
from app.services.kamis_client import fetch_daily_prices

logger = logging.getLogger(__name__)

GRADES = ["왕란", "특란", "대란", "중란", "소란"]


async def fetch_and_store_prices(db: Session, target_date: date | None = None) -> list[EggPrice]:
    """Fetch prices from KAMIS and store in DB."""
    prices_data = await fetch_daily_prices(target_date)
    stored = []

    for p in prices_data:
        existing = (
            db.query(EggPrice)
            .filter(EggPrice.date == p["date"], EggPrice.grade == p["grade"])
            .first()
        )
        if existing:
            existing.retail_price = p.get("retail_price", existing.retail_price)
            existing.wholesale_price = p.get("wholesale_price", existing.wholesale_price)
            stored.append(existing)
        else:
            egg_price = EggPrice(
                date=p["date"],
                grade=p["grade"],
                retail_price=p.get("retail_price"),
                wholesale_price=p.get("wholesale_price"),
                unit=p.get("unit", "30개"),
            )
            db.add(egg_price)
            stored.append(egg_price)

    db.commit()
    for s in stored:
        db.refresh(s)
    return stored


def get_current_prices(db: Session) -> list[dict]:
    """Get today's (or most recent) prices with daily change.

    Per-grade: picks the most recent row that has a non-null wholesale_price,
    then computes change vs the previous such row.
    """
    results = []
    for grade in GRADES:
        # Get the 2 most recent rows with valid wholesale_price for this grade
        entries = (
            db.query(EggPrice)
            .filter(
                EggPrice.grade == grade,
                EggPrice.wholesale_price.isnot(None),
            )
            .order_by(desc(EggPrice.date))
            .limit(2)
            .all()
        )
        if not entries:
            continue

        current = entries[0]
        entry = {
            "date": current.date,
            "grade": current.grade,
            "wholesale_price": current.wholesale_price,
            "retail_price": current.retail_price,
            "unit": current.unit,
            "daily_change": None,
            "daily_change_pct": None,
        }

        if len(entries) > 1 and current.wholesale_price and entries[1].wholesale_price:
            prev = entries[1]
            change = current.wholesale_price - prev.wholesale_price
            entry["daily_change"] = round(change, 1)
            if prev.wholesale_price > 0:
                entry["daily_change_pct"] = round(change / prev.wholesale_price * 100, 2)

        results.append(entry)
    return results


def get_price_history(db: Session, grade: str, days: int = 180) -> list[EggPrice]:
    """Get historical prices for a grade."""
    since = date.today() - timedelta(days=days)
    return (
        db.query(EggPrice)
        .filter(EggPrice.grade == grade, EggPrice.date >= since)
        .order_by(EggPrice.date)
        .all()
    )
