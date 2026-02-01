"""Initialize local SQLite DB with sample data for fast development.

Usage:
    cd backend
    python init_sample_data.py

Generates:
    - EggPrice:         180 days x 5 grades = 900 records
    - Prediction:        30 days x 5 grades = 150 records
    - Market data:       90 days x 5 tables = 450 records
    - ModelPerformance:   5 grades x 5 evals = 25 records
"""

import random
import sys
from datetime import date, timedelta

from app.core.database import Base, SessionLocal, engine
from app.models.price import EggPrice
from app.models.prediction import Prediction
from app.models.market_data import (
    AvianFluStatus,
    ExchangeRate,
    FeedPrice,
    ModelPerformance,
    TradingVolume,
    WeatherData,
)

# ── Config ──────────────────────────────────────────────
GRADES = ["왕란", "특란", "대란", "중란", "소란"]
BASE_RETAIL = {"왕란": 7800, "특란": 7200, "대란": 6500, "중란": 5800, "소란": 5200}
BASE_WHOLESALE = {"왕란": 6500, "특란": 6000, "대란": 5400, "중란": 4800, "소란": 4200}

PRICE_DAYS = 180
PREDICTION_DAYS = 30
MARKET_DAYS = 90

today = date.today()

# ── DB setup ────────────────────────────────────────────
Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Check if data already exists
existing = db.query(EggPrice).count()
if existing > 0:
    print(f"Database already has {existing} price records.")
    ans = input("Reset and re-seed? (y/N): ").strip().lower()
    if ans != "y":
        print("Aborted.")
        db.close()
        sys.exit(0)
    # Clear all tables
    for model in [EggPrice, Prediction, TradingVolume, FeedPrice,
                  ExchangeRate, AvianFluStatus, WeatherData, ModelPerformance]:
        db.query(model).delete()
    db.commit()
    print("Cleared existing data.")

# ── 1. Egg Prices (180 days x 5 grades = 900) ──────────
print("Seeding egg prices...")
for grade in GRADES:
    retail = BASE_RETAIL[grade]
    wholesale = BASE_WHOLESALE[grade]
    for i in range(PRICE_DAYS):
        d = today - timedelta(days=PRICE_DAYS - 1 - i)
        drift = i * 1.5 + random.gauss(0, 80)
        db.add(EggPrice(
            date=d,
            grade=grade,
            retail_price=round(retail + drift),
            wholesale_price=round(wholesale + drift * 0.8),
            unit="30개",
        ))
db.flush()
print(f"  -> {PRICE_DAYS * len(GRADES)} price records")

# ── 2. Predictions (30 days x 5 grades = 150) ──────────
print("Seeding predictions...")
for grade in GRADES:
    current_retail = BASE_RETAIL[grade] + (PRICE_DAYS - 1) * 1.5
    for days in range(1, PREDICTION_DAYS + 1):
        change = random.uniform(-1.5, 3.0) / 100
        predicted = round(current_retail * (1 + change * days / 30))
        db.add(Prediction(
            base_date=today,
            target_date=today + timedelta(days=days),
            grade=grade,
            predicted_price=predicted,
            confidence_lower=round(predicted * 0.97),
            confidence_upper=round(predicted * 1.03),
            horizon_days=days,
            model_version="v2.0",
        ))
db.flush()
print(f"  -> {PREDICTION_DAYS * len(GRADES)} prediction records")

# ── 3. Market Data (90 days) ───────────────────────────
print("Seeding market data...")
for i in range(MARKET_DAYS):
    d = today - timedelta(days=MARKET_DAYS - 1 - i)

    db.add(TradingVolume(
        date=d,
        volume_kg=round(45000 + random.gauss(0, 3000), 1),
    ))
    db.add(FeedPrice(
        date=d,
        feed_type="옥수수",
        price=round(340 + i * 0.3 + random.gauss(0, 10), 1),
        unit="kg",
    ))
    db.add(ExchangeRate(
        date=d,
        usd_krw=round(1310 + random.gauss(0, 20), 1),
    ))
    db.add(AvianFluStatus(
        date=d,
        is_outbreak=(70 < i < 80),
        region="전국",
        case_count=3 if (70 < i < 80) else 0,
    ))
    base_temp = 2 + (i / MARKET_DAYS) * 10
    db.add(WeatherData(
        date=d,
        avg_temperature=round(base_temp + random.gauss(0, 3), 1),
    ))
db.flush()
print(f"  -> {MARKET_DAYS * 5} market data records")

# ── 4. Model Performance (5 grades x 5 evals) ─────────
print("Seeding model performance...")
for grade in GRADES:
    for i in range(5):
        d = today - timedelta(days=30 * (4 - i))
        db.add(ModelPerformance(
            model_version="v2.0",
            grade=grade,
            eval_date=d,
            mae=round(70 + random.gauss(0, 15), 1),
            rmse=round(110 + random.gauss(0, 20), 1),
            mape=round(3.5 + random.gauss(0, 0.8), 2),
            directional_accuracy=round(72 + random.gauss(0, 5), 1),
            is_production=(i == 4),
        ))
db.flush()
print(f"  -> {len(GRADES) * 5} performance records")

# ── Commit ──────────────────────────────────────────────
db.commit()
db.close()

total = PRICE_DAYS * len(GRADES) + PREDICTION_DAYS * len(GRADES) + MARKET_DAYS * 5 + len(GRADES) * 5
print(f"\nDone! {total} records seeded into local database.")
print("Run: uvicorn app.main:app --reload --port 8000")
