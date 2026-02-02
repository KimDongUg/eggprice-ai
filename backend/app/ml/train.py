"""Training script for the EggPriceLSTM model.

Usage:
    python -m app.ml.train
    python -m app.ml.train --grade 대란 --version v2.0

Performance targets:
    MAE ≤ 100원, RMSE ≤ 150원, MAPE ≤ 5%, Directional Accuracy ≥ 70%
"""

import argparse
import json
import logging
import pickle
from datetime import date
from pathlib import Path

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset

from app.core.config import settings
from app.core.database import SessionLocal
from app.ml.model import EggPriceLSTM
from app.ml.preprocessing import (
    SEQUENCE_LENGTH,
    PriceScaler,
    build_features_from_db,
    create_sequences,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).resolve().parent.parent.parent / "trained_models"
BATCH_SIZE = 32
EPOCHS = 100
LEARNING_RATE = 0.001
EARLY_STOPPING_PATIENCE = 10

ALL_GRADES = ["왕란", "특란", "대란", "중란", "소란"]


def compute_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    scaler: PriceScaler,
) -> dict:
    """Compute MAE, RMSE, MAPE, and directional accuracy on original scale.

    Args:
        y_true: (N, 3) scaled target values
        y_pred: (N, 3) scaled predicted values
        scaler: PriceScaler with fitted target_scaler

    Returns:
        dict with mae, rmse, mape, directional_accuracy
    """
    true_orig = scaler.inverse_transform_targets(y_true)
    pred_orig = scaler.inverse_transform_targets(y_pred)

    # MAE
    mae = np.mean(np.abs(true_orig - pred_orig))

    # RMSE
    rmse = np.sqrt(np.mean((true_orig - pred_orig) ** 2))

    # MAPE (avoid division by zero)
    nonzero = true_orig != 0
    if nonzero.any():
        mape = np.mean(np.abs((true_orig[nonzero] - pred_orig[nonzero]) / true_orig[nonzero])) * 100
    else:
        mape = 0.0

    # Directional accuracy: compare sign of changes
    # Use the first horizon (7d) for direction evaluation
    if len(true_orig) > 1:
        true_dir = np.diff(true_orig[:, 0]) > 0
        pred_dir = np.diff(pred_orig[:, 0]) > 0
        dir_acc = np.mean(true_dir == pred_dir) * 100
    else:
        dir_acc = 0.0

    return {
        "mae": round(float(mae), 2),
        "rmse": round(float(rmse), 2),
        "mape": round(float(mape), 2),
        "directional_accuracy": round(float(dir_acc), 2),
    }


def train_model(grade: str = "특란", model_version: str | None = None) -> dict:
    """Train the LSTM model for a specific egg grade.

    Returns:
        dict with training results including final metrics
    """
    if model_version is None:
        model_version = settings.MODEL_VERSION

    logger.info(f"Training model {model_version} for grade={grade}")

    db = SessionLocal()
    try:
        df = build_features_from_db(db, grade)
    finally:
        db.close()

    logger.info(f"Loaded {len(df)} records with 15 features")

    if len(df) < SEQUENCE_LENGTH + 30:
        raise ValueError(
            f"Not enough data. Need at least {SEQUENCE_LENGTH + 30} rows, got {len(df)}"
        )

    scaler = PriceScaler()
    features, targets = scaler.fit_transform(df)

    X, y = create_sequences(features, targets, SEQUENCE_LENGTH)
    logger.info(f"Created {len(X)} training sequences")

    # Train/validation split (80/20, time-ordered)
    split = int(len(X) * 0.8)
    X_train, X_val = X[:split], X[split:]
    y_train, y_val = y[:split], y[split:]

    train_dataset = TensorDataset(torch.FloatTensor(X_train), torch.FloatTensor(y_train))
    val_dataset = TensorDataset(torch.FloatTensor(X_val), torch.FloatTensor(y_val))
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = EggPriceLSTM().to(device)
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=LEARNING_RATE)

    best_val_loss = float("inf")
    patience_counter = 0
    training_history = []

    for epoch in range(EPOCHS):
        # Training
        model.train()
        train_loss = 0.0
        for X_batch, y_batch in train_loader:
            X_batch, y_batch = X_batch.to(device), y_batch.to(device)
            optimizer.zero_grad()
            preds = model(X_batch)
            loss = criterion(preds, y_batch)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * len(X_batch)
        train_loss /= len(train_dataset)

        # Validation
        model.eval()
        val_loss = 0.0
        all_val_preds = []
        all_val_true = []
        with torch.no_grad():
            for X_batch, y_batch in val_loader:
                X_batch, y_batch = X_batch.to(device), y_batch.to(device)
                preds = model(X_batch)
                loss = criterion(preds, y_batch)
                val_loss += loss.item() * len(X_batch)
                all_val_preds.append(preds.cpu().numpy())
                all_val_true.append(y_batch.cpu().numpy())
        val_loss /= len(val_dataset)

        training_history.append({"epoch": epoch + 1, "train_loss": train_loss, "val_loss": val_loss})

        logger.info(
            f"Epoch {epoch+1}/{EPOCHS} — train_loss: {train_loss:.6f}, val_loss: {val_loss:.6f}"
        )

        # Early stopping
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            patience_counter = 0

            # Save best model
            MODELS_DIR.mkdir(parents=True, exist_ok=True)
            model_path = MODELS_DIR / f"egg_price_lstm_{grade}_{model_version}.pt"
            torch.save(model.state_dict(), model_path)
            scaler_path = MODELS_DIR / f"scaler_{grade}_{model_version}.pkl"
            with open(scaler_path, "wb") as f:
                pickle.dump(scaler, f)
            logger.info(f"  → Saved best model (val_loss={val_loss:.6f})")
        else:
            patience_counter += 1
            if patience_counter >= EARLY_STOPPING_PATIENCE:
                logger.info(f"Early stopping at epoch {epoch+1}")
                break

    # Compute final metrics on validation set
    val_preds = np.concatenate(all_val_preds)
    val_true = np.concatenate(all_val_true)
    metrics = compute_metrics(val_true, val_preds, scaler)

    # Save training report
    report = {
        "grade": grade,
        "model_version": model_version,
        "train_date": date.today().isoformat(),
        "total_samples": len(X),
        "train_samples": len(X_train),
        "val_samples": len(X_val),
        "best_val_loss": float(best_val_loss),
        "epochs_trained": len(training_history),
        "metrics": metrics,
        "targets": {
            "mae": "≤ 100",
            "rmse": "≤ 150",
            "mape": "≤ 5%",
            "directional_accuracy": "≥ 70%",
        },
    }

    report_path = MODELS_DIR / f"training_report_{grade}_{model_version}.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    logger.info(f"Training complete. Metrics: {metrics}")
    logger.info(f"Report saved to {report_path}")

    # Check against targets
    if metrics["mae"] > 100:
        logger.warning(f"MAE {metrics['mae']} exceeds target ≤ 100")
    if metrics["rmse"] > 150:
        logger.warning(f"RMSE {metrics['rmse']} exceeds target ≤ 150")
    if metrics["mape"] > 5:
        logger.warning(f"MAPE {metrics['mape']}% exceeds target ≤ 5%")
    if metrics["directional_accuracy"] < 70:
        logger.warning(f"Direction accuracy {metrics['directional_accuracy']}% below target ≥ 70%")

    return report


def train_all_grades(model_version: str | None = None) -> list[dict]:
    """Train models for all egg grades."""
    reports = []
    for grade in ALL_GRADES:
        try:
            report = train_model(grade, model_version)
            reports.append(report)
        except ValueError as e:
            logger.warning(f"Skipping grade {grade}: {e}")
    return reports


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train EggPrice LSTM model")
    parser.add_argument("--grade", default="특란", help="Egg grade to train")
    parser.add_argument("--version", default=None, help="Model version string")
    parser.add_argument("--all", action="store_true", help="Train all grades")
    args = parser.parse_args()

    if args.all:
        train_all_grades(args.version)
    else:
        train_model(args.grade, args.version)
