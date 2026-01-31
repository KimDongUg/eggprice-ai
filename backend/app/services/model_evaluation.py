"""Model evaluation, A/B testing, and automatic retraining service.

Compares candidate model vs production model.
Auto-promotes if candidate outperforms on key metrics.
Triggers retraining when MAPE > threshold or on monthly schedule.
"""

import json
import logging
from datetime import date, timedelta
from pathlib import Path

import numpy as np
import torch
from torch.utils.data import DataLoader, TensorDataset
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.metrics import model_mape_gauge
from app.models.market_data import ModelPerformance
from app.ml.model import EggPriceLSTM
from app.ml.predict import load_model
from app.ml.preprocessing import (
    SEQUENCE_LENGTH,
    PriceScaler,
    build_features_from_db,
    create_sequences,
)
from app.ml.train import compute_metrics, train_model, MODELS_DIR, ALL_GRADES

logger = logging.getLogger(__name__)


def evaluate_model_on_recent_data(
    db: Session,
    grade: str,
    model_version: str,
    eval_days: int = 30,
) -> dict | None:
    """Evaluate a trained model on the most recent data.

    Loads the last `eval_days` worth of data, creates sequences,
    runs inference, and computes metrics.
    """
    try:
        model, scaler = load_model(grade, model_version)
    except FileNotFoundError:
        logger.warning(f"Model {model_version} for {grade} not found")
        return None

    device = next(model.parameters()).device
    df = build_features_from_db(db, grade)

    if len(df) < SEQUENCE_LENGTH + eval_days:
        logger.warning(f"Not enough data for evaluation of {grade}")
        return None

    # Use only the last eval_days of data for evaluation
    eval_df = df.tail(SEQUENCE_LENGTH + eval_days)
    features = scaler.transform_features(eval_df)

    # Build targets from price column
    price = eval_df["price"].values
    targets = np.full((len(price), 3), np.nan)
    for i in range(len(price)):
        if i + 7 < len(price):
            targets[i, 0] = price[i + 7]
        if i + 14 < len(price):
            targets[i, 1] = price[i + 14]
        if i + 30 < len(price):
            targets[i, 2] = price[i + 30]

    valid_mask = ~np.isnan(targets).any(axis=1)
    features_valid = features[valid_mask]
    targets_valid = targets[valid_mask]

    if len(features_valid) < SEQUENCE_LENGTH + 1:
        return None

    # Scale targets using the scaler's target_scaler
    scaled_targets = scaler.target_scaler.transform(targets_valid)

    X, y = create_sequences(features_valid, scaled_targets, SEQUENCE_LENGTH)
    if len(X) == 0:
        return None

    dataset = TensorDataset(torch.FloatTensor(X), torch.FloatTensor(y))
    loader = DataLoader(dataset, batch_size=32)

    model.eval()
    all_preds = []
    all_true = []
    with torch.no_grad():
        for X_batch, y_batch in loader:
            X_batch = X_batch.to(device)
            preds = model(X_batch)
            all_preds.append(preds.cpu().numpy())
            all_true.append(y_batch.numpy())

    all_preds = np.concatenate(all_preds)
    all_true = np.concatenate(all_true)

    metrics = compute_metrics(all_true, all_preds, scaler)
    return metrics


def store_performance(
    db: Session,
    model_version: str,
    grade: str,
    metrics: dict,
    is_production: bool = False,
):
    """Store model performance metrics in the database."""
    perf = ModelPerformance(
        model_version=model_version,
        grade=grade,
        eval_date=date.today(),
        mae=metrics["mae"],
        rmse=metrics["rmse"],
        mape=metrics["mape"],
        directional_accuracy=metrics["directional_accuracy"],
        is_production=is_production,
    )
    db.add(perf)
    db.commit()
    db.refresh(perf)

    # Update Prometheus gauge
    if is_production:
        model_mape_gauge.labels(grade=grade).set(metrics["mape"])

    return perf


def get_production_metrics(db: Session, grade: str) -> ModelPerformance | None:
    """Get the latest production model performance for a grade."""
    return (
        db.query(ModelPerformance)
        .filter(ModelPerformance.grade == grade, ModelPerformance.is_production == True)
        .order_by(desc(ModelPerformance.eval_date))
        .first()
    )


def compare_models(
    db: Session,
    grade: str,
    candidate_version: str,
) -> dict:
    """A/B test: compare candidate model against production model.

    Returns comparison result with recommendation.
    """
    prod_metrics_record = get_production_metrics(db, grade)
    candidate_metrics = evaluate_model_on_recent_data(db, grade, candidate_version)

    if candidate_metrics is None:
        return {"status": "error", "reason": "Could not evaluate candidate model"}

    result = {
        "grade": grade,
        "candidate_version": candidate_version,
        "candidate_metrics": candidate_metrics,
        "production_metrics": None,
        "recommendation": "promote",  # default if no production model exists
    }

    if prod_metrics_record:
        prod_metrics = {
            "mae": prod_metrics_record.mae,
            "rmse": prod_metrics_record.rmse,
            "mape": prod_metrics_record.mape,
            "directional_accuracy": prod_metrics_record.directional_accuracy,
        }
        result["production_version"] = prod_metrics_record.model_version
        result["production_metrics"] = prod_metrics

        # Candidate must be better on at least 3 of 4 metrics
        improvements = 0
        if candidate_metrics["mae"] < prod_metrics["mae"]:
            improvements += 1
        if candidate_metrics["rmse"] < prod_metrics["rmse"]:
            improvements += 1
        if candidate_metrics["mape"] < prod_metrics["mape"]:
            improvements += 1
        if candidate_metrics["directional_accuracy"] > prod_metrics["directional_accuracy"]:
            improvements += 1

        result["improvements"] = improvements
        result["recommendation"] = "promote" if improvements >= 3 else "keep_current"

    # Store candidate evaluation
    store_performance(db, candidate_version, grade, candidate_metrics, is_production=False)

    return result


def promote_model(db: Session, grade: str, version: str):
    """Mark a model version as the production model."""
    # Demote current production
    current_prod = (
        db.query(ModelPerformance)
        .filter(ModelPerformance.grade == grade, ModelPerformance.is_production == True)
        .all()
    )
    for p in current_prod:
        p.is_production = False

    # Promote new version
    candidate = (
        db.query(ModelPerformance)
        .filter(ModelPerformance.model_version == version, ModelPerformance.grade == grade)
        .order_by(desc(ModelPerformance.eval_date))
        .first()
    )
    if candidate:
        candidate.is_production = True

    db.commit()
    logger.info(f"Promoted model {version} to production for grade={grade}")


def check_and_retrain_if_needed(db: Session):
    """Check if retraining is needed based on MAPE threshold or schedule.

    Called by the monthly scheduler job.
    """
    for grade in ALL_GRADES:
        logger.info(f"Checking retrain need for grade={grade}")

        # Evaluate current production model on recent data
        current_version = settings.MODEL_VERSION
        metrics = evaluate_model_on_recent_data(db, grade, current_version)

        if metrics is None:
            logger.info(f"  No model/data to evaluate for {grade}, training fresh")
            _retrain_and_evaluate(db, grade)
            continue

        store_performance(db, current_version, grade, metrics, is_production=True)
        logger.info(f"  Current model MAPE: {metrics['mape']}%")

        if metrics["mape"] > settings.MAPE_RETRAIN_THRESHOLD:
            logger.info(f"  MAPE {metrics['mape']}% > threshold {settings.MAPE_RETRAIN_THRESHOLD}%, retraining")
            _retrain_and_evaluate(db, grade)
        else:
            # Check if it's been too long since last training
            report_path = MODELS_DIR / f"training_report_{grade}_{current_version}.json"
            if report_path.exists():
                with open(report_path) as f:
                    report = json.load(f)
                train_date = date.fromisoformat(report["train_date"])
                days_since = (date.today() - train_date).days
                if days_since >= settings.RETRAIN_INTERVAL_DAYS:
                    logger.info(f"  {days_since} days since last train, retraining")
                    _retrain_and_evaluate(db, grade)
                else:
                    logger.info(f"  Model OK (MAPE={metrics['mape']}%, {days_since}d old)")
            else:
                logger.info(f"  No training report found, retraining")
                _retrain_and_evaluate(db, grade)


def _retrain_and_evaluate(db: Session, grade: str):
    """Train a new candidate model and run A/B comparison."""
    # Generate new version string
    candidate_version = f"v{date.today().strftime('%Y%m%d')}"

    try:
        train_model(grade, candidate_version)
    except ValueError as e:
        logger.warning(f"Cannot retrain {grade}: {e}")
        return

    result = compare_models(db, grade, candidate_version)
    logger.info(f"A/B test result for {grade}: {result['recommendation']}")

    if result["recommendation"] == "promote":
        promote_model(db, grade, candidate_version)
        logger.info(f"Promoted {candidate_version} for {grade}")
    else:
        logger.info(f"Keeping current model for {grade}")
