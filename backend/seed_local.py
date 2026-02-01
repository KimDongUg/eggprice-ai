"""Seed local SQLite DB with realistic sample data for development."""

import random
from datetime import date, timedelta

from app.core.database import SessionLocal, Base, engine
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

Base.metadata.create_all(bind=engine)
db = SessionLocal()

today = date.today()
GRADES = ["왕란", "특란", "대란", "중란", "소란"]
BASE_RETAIL = {"왕란": 7800, "특란": 7200, "대란": 6500, "중란": 5800, "소란": 5200}
BASE_WHOLESALE = {"왕란": 6500, "특란": 6000, "대란": 5400, "중란": 4800, "소란": 4200}

# ── 1. Egg Prices (180 days) ────────────────────────────
print("Seeding egg prices...")
for grade in GRADES:
    retail = BASE_RETAIL[grade]
    wholesale = BASE_WHOLESALE[grade]
    for i in range(180):
        d = today - timedelta(days=179 - i)
        # Simulate gradual trend + noise
        drift = i * 1.5 + random.gauss(0, 80)
        p = EggPrice(
            date=d,
            grade=grade,
            wholesale_price=round(wholesale + drift * 0.8),
            retail_price=round(retail + drift),
            unit="30개",
        )
        db.add(p)
db.flush()
print(f"  -> {180 * len(GRADES)} price records")

# ── 2. Predictions (7/14/30 day for each grade) ────────
print("Seeding predictions...")
for grade in GRADES:
    current_retail = BASE_RETAIL[grade] + 180 * 1.5
    for horizon in [7, 14, 30]:
        change = random.uniform(-2, 4) / 100
        predicted = round(current_retail * (1 + change))
        p = Prediction(
            base_date=today,
            target_date=today + timedelta(days=horizon),
            grade=grade,
            predicted_price=predicted,
            confidence_lower=round(predicted * 0.97),
            confidence_upper=round(predicted * 1.03),
            horizon_days=horizon,
            model_version="v2.0",
        )
        db.add(p)
db.flush()
print(f"  -> {len(GRADES) * 3} prediction records")

# ── 3. Market Data (90 days) ───────────────────────────
print("Seeding market data...")
for i in range(90):
    d = today - timedelta(days=89 - i)

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
        is_outbreak=(i > 70 and i < 80),  # outbreak window
        region="전국",
        case_count=3 if (i > 70 and i < 80) else 0,
    ))
    # Temperature: seasonal (winter → spring)
    base_temp = 2 + (i / 90) * 10  # ~2°C → ~12°C
    db.add(WeatherData(
        date=d,
        avg_temperature=round(base_temp + random.gauss(0, 3), 1),
    ))
db.flush()
print(f"  -> {90 * 5} market data records")

# ── 4. Model Performance ──────────────────────────────
print("Seeding model performance...")
for grade in GRADES:
    for i in range(5):
        d = today - timedelta(days=30 * (4 - i))
        perf = ModelPerformance(
            model_version="v2.0",
            grade=grade,
            eval_date=d,
            mae=round(70 + random.gauss(0, 15), 1),
            rmse=round(110 + random.gauss(0, 20), 1),
            mape=round(3.5 + random.gauss(0, 0.8), 2),
            directional_accuracy=round(72 + random.gauss(0, 5), 1),
            is_production=(i == 4),  # latest is production
        )
        db.add(perf)
db.flush()
print(f"  -> {len(GRADES) * 5} performance records")

db.commit()
db.close()
print("\nDone! Local database seeded successfully.")
