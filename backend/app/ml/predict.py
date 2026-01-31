"""Inference wrapper with MC Dropout for 90% confidence intervals."""

import logging
import pickle
from datetime import date, timedelta
from pathlib import Path

import numpy as np
import torch
from sqlalchemy.orm import Session

from app.core.config import settings
from app.ml.model import EggPriceLSTM
from app.ml.preprocessing import (
    SEQUENCE_LENGTH,
    PriceScaler,
    build_features_from_db,
)

logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).resolve().parent.parent.parent / "trained_models"
MC_DROPOUT_PASSES = 50
# 90% confidence interval → z = 1.645
CI_Z_SCORE = 1.645


def _enable_mc_dropout(model: EggPriceLSTM):
    """Enable dropout layers during inference for MC Dropout."""
    for module in model.modules():
        if isinstance(module, torch.nn.Dropout):
            module.train()


def load_model(grade: str, model_version: str | None = None) -> tuple[EggPriceLSTM, PriceScaler]:
    """Load trained model and scaler from disk."""
    if model_version is None:
        model_version = settings.MODEL_VERSION

    model_path = MODELS_DIR / f"egg_price_lstm_{grade}_{model_version}.pt"
    scaler_path = MODELS_DIR / f"scaler_{grade}_{model_version}.pkl"

    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found: {model_path}")
    if not scaler_path.exists():
        raise FileNotFoundError(f"Scaler file not found: {scaler_path}")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    model = EggPriceLSTM()
    model.load_state_dict(torch.load(model_path, map_location=device, weights_only=True))
    model.to(device)

    with open(scaler_path, "rb") as f:
        scaler = pickle.load(f)

    return model, scaler


def predict_prices(
    db: Session,
    grade: str,
    model_version: str | None = None,
) -> list[dict]:
    """Run prediction with MC Dropout for 90% confidence intervals.

    Returns list of dicts with keys:
        base_date, target_date, grade, predicted_price,
        confidence_lower, confidence_upper, horizon_days, model_version
    """
    if model_version is None:
        model_version = settings.MODEL_VERSION

    model, scaler = load_model(grade, model_version)
    device = next(model.parameters()).device

    # Build features from all DB sources for this grade
    df = build_features_from_db(db, grade)

    if len(df) < SEQUENCE_LENGTH:
        raise ValueError(
            f"Not enough recent data for prediction. Need {SEQUENCE_LENGTH}, got {len(df)}"
        )

    features = scaler.transform_features(df)
    # Take the last SEQUENCE_LENGTH steps as input
    input_seq = features[-SEQUENCE_LENGTH:]
    input_tensor = torch.FloatTensor(input_seq).unsqueeze(0).to(device)

    # MC Dropout: run multiple forward passes with dropout enabled
    model.eval()
    _enable_mc_dropout(model)

    all_preds = []
    with torch.no_grad():
        for _ in range(MC_DROPOUT_PASSES):
            pred = model(input_tensor)  # (1, 3)
            all_preds.append(pred.cpu().numpy())

    all_preds = np.array(all_preds).squeeze()  # (MC_PASSES, 3)

    # Inverse transform to original scale
    preds_original = np.array([
        scaler.inverse_transform_targets(p.reshape(1, -1)).flatten()
        for p in all_preds
    ])

    mean_preds = preds_original.mean(axis=0)
    std_preds = preds_original.std(axis=0)

    # Get the latest date from actual data
    from app.models.price import EggPrice
    latest = (
        db.query(EggPrice)
        .filter(EggPrice.grade == grade, EggPrice.retail_price.isnot(None))
        .order_by(EggPrice.date.desc())
        .first()
    )
    base = latest.date if latest else date.today()

    horizons = [7, 14, 30]
    results = []

    for i, h in enumerate(horizons):
        target = base + timedelta(days=h)
        # 90% CI = mean ± 1.645 * std
        lower = float(mean_preds[i] - CI_Z_SCORE * std_preds[i])
        upper = float(mean_preds[i] + CI_Z_SCORE * std_preds[i])

        results.append({
            "base_date": base,
            "target_date": target,
            "grade": grade,
            "predicted_price": round(float(mean_preds[i]), 1),
            "confidence_lower": round(max(lower, 0), 1),
            "confidence_upper": round(upper, 1),
            "horizon_days": h,
            "model_version": model_version,
        })

    return results
