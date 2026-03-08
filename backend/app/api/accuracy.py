"""Public accuracy endpoints — no auth required."""

from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.prediction import Prediction
from app.models.price import EggPrice

router = APIRouter(prefix="/accuracy", tags=["accuracy"])


@router.get("/summary")
def accuracy_summary(
    grade: str = Query("특란"),
    db: Session = Depends(get_db),
):
    """Public accuracy summary — MAPE for 30/90/180 days."""
    results = {}
    for period_days in [30, 90, 180]:
        cutoff = date.today() - timedelta(days=period_days)
        rows = (
            db.query(Prediction.predicted_price, EggPrice.wholesale_price)
            .join(
                EggPrice,
                (Prediction.target_date == EggPrice.date)
                & (Prediction.grade == EggPrice.grade),
            )
            .filter(
                Prediction.grade == grade,
                Prediction.horizon_days == 7,
                Prediction.target_date >= cutoff,
                EggPrice.wholesale_price.isnot(None),
            )
            .all()
        )
        if rows:
            errors = [
                abs(r.predicted_price - r.wholesale_price) / r.wholesale_price * 100
                for r in rows
                if r.wholesale_price
            ]
            mape = round(sum(errors) / len(errors), 2) if errors else None
            accuracy = round(100 - mape, 2) if mape is not None else None
        else:
            mape = None
            accuracy = None
        results[f"{period_days}d"] = {
            "mape": mape,
            "accuracy": accuracy,
            "sample_count": len(rows),
        }
    return {"grade": grade, "periods": results}


@router.get("/history")
def accuracy_history(
    grade: str = Query("특란"),
    days: int = Query(90),
    db: Session = Depends(get_db),
):
    """Prediction vs actual price history for public accuracy chart."""
    cutoff = date.today() - timedelta(days=days)
    rows = (
        db.query(
            Prediction.target_date,
            Prediction.predicted_price,
            EggPrice.wholesale_price,
        )
        .join(
            EggPrice,
            (Prediction.target_date == EggPrice.date)
            & (Prediction.grade == EggPrice.grade),
        )
        .filter(
            Prediction.grade == grade,
            Prediction.horizon_days == 7,
            Prediction.target_date >= cutoff,
            EggPrice.wholesale_price.isnot(None),
        )
        .order_by(Prediction.target_date)
        .all()
    )
    items = []
    for r in rows:
        error = abs(r.predicted_price - r.wholesale_price)
        error_pct = (
            round(error / r.wholesale_price * 100, 2) if r.wholesale_price else None
        )
        items.append(
            {
                "date": r.target_date.isoformat(),
                "predicted": r.predicted_price,
                "actual": r.wholesale_price,
                "error": error,
                "error_pct": error_pct,
            }
        )
    return {"grade": grade, "items": items}


@router.get("/metrics")
def accuracy_metrics(
    grade: str = Query("특란"),
    db: Session = Depends(get_db),
):
    """MAPE and RMSE model metrics for public display."""
    from app.models.market_data import ModelPerformance

    perf = (
        db.query(ModelPerformance)
        .filter(
            ModelPerformance.grade == grade,
            ModelPerformance.is_production == True,  # noqa: E712
        )
        .order_by(desc(ModelPerformance.eval_date))
        .first()
    )
    if perf:
        return {
            "grade": grade,
            "model_version": perf.model_version,
            "mape": perf.mape,
            "rmse": perf.rmse,
            "mae": perf.mae,
            "directional_accuracy": perf.directional_accuracy,
            "eval_date": perf.eval_date.isoformat() if perf.eval_date else None,
        }
    return {
        "grade": grade,
        "model_version": None,
        "mape": None,
        "rmse": None,
        "mae": None,
        "directional_accuracy": None,
        "eval_date": None,
    }
