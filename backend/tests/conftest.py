"""Shared test fixtures for the EggPrice AI backend."""

import os
from datetime import date, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Force test settings before importing app modules
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-testing-only")
os.environ.setdefault("KAMIS_API_KEY", "test")
os.environ.setdefault("KAMIS_CERT_ID", "test")
# Disable rate limiting in tests (very high limits)
os.environ.setdefault("RATE_LIMIT_AUTH", "9999/minute")
os.environ.setdefault("RATE_LIMIT_API", "9999/minute")
os.environ.setdefault("ALLOWED_HOSTS", "*")

from app.core.database import Base, get_db
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.alert import Alert
from app.models.market_data import (
    AvianFluStatus,
    ExchangeRate,
    FeedPrice,
    ModelPerformance,
    TradingVolume,
    WeatherData,
)
from app.models.prediction import Prediction
from app.models.price import EggPrice
from app.models.user import User

# ── In-memory SQLite engine for tests ───────────────────

TEST_ENGINE = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSession = sessionmaker(bind=TEST_ENGINE, autoflush=False, autocommit=False)


def _override_get_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_database():
    """Create all tables before each test, drop after. Clear caches."""
    Base.metadata.create_all(bind=TEST_ENGINE)
    yield
    Base.metadata.drop_all(bind=TEST_ENGINE)
    # Clear L1 in-memory cache between tests
    from app.core.cache import _l1
    _l1.clear()


@pytest.fixture()
def db():
    """Provide a transactional DB session for direct DB manipulation in tests."""
    session = TestSession()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client():
    """FastAPI test client with overridden DB dependency."""
    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        # Clear L1 cache populated by warm_cache during lifespan
        from app.core.cache import _l1
        _l1.clear()
        yield c
    app.dependency_overrides.clear()


# ── Seed data helpers ────────────────────────────────────

@pytest.fixture()
def seed_prices(db):
    """Insert 60 days of price data for 대란."""
    today = date.today()
    prices = []
    for i in range(60):
        d = today - timedelta(days=59 - i)
        p = EggPrice(
            date=d,
            grade="대란",
            wholesale_price=5000 + i * 10,
            retail_price=6000 + i * 10,
            unit="30개",
        )
        prices.append(p)
    db.add_all(prices)
    db.commit()
    return prices


@pytest.fixture()
def seed_all_grades(db):
    """Insert price data for all 5 grades."""
    today = date.today()
    grades = ["왕란", "특란", "대란", "중란", "소란"]
    base_prices = [7000, 6500, 6000, 5500, 5000]
    all_prices = []
    for grade, base in zip(grades, base_prices):
        for i in range(30):
            d = today - timedelta(days=29 - i)
            p = EggPrice(
                date=d,
                grade=grade,
                wholesale_price=base - 1000 + i * 5,
                retail_price=base + i * 5,
                unit="30개",
            )
            all_prices.append(p)
    db.add_all(all_prices)
    db.commit()
    return all_prices


@pytest.fixture()
def seed_predictions(db):
    """Insert prediction records for 대란."""
    today = date.today()
    preds = []
    for horizon in [7, 14, 30]:
        p = Prediction(
            base_date=today,
            target_date=today + timedelta(days=horizon),
            grade="대란",
            predicted_price=6200 + horizon * 10,
            confidence_lower=6000 + horizon * 5,
            confidence_upper=6400 + horizon * 15,
            horizon_days=horizon,
            model_version="v2.0-test",
        )
        preds.append(p)
    db.add_all(preds)
    db.commit()
    return preds


@pytest.fixture()
def seed_market_data(db):
    """Insert market data for snapshot testing."""
    today = date.today()
    db.add(TradingVolume(date=today, volume_kg=50000.0))
    db.add(FeedPrice(date=today, feed_type="옥수수", price=350.0, unit="kg"))
    db.add(ExchangeRate(date=today, usd_krw=1320.0))
    db.add(AvianFluStatus(date=today, is_outbreak=False, region="전국", case_count=0))
    db.add(WeatherData(date=today, avg_temperature=15.0))
    db.commit()


@pytest.fixture()
def seed_model_performance(db):
    """Insert model performance record."""
    perf = ModelPerformance(
        model_version="v2.0-test",
        grade="대란",
        eval_date=date.today(),
        mae=85.0,
        rmse=120.0,
        mape=3.5,
        directional_accuracy=75.0,
        is_production=True,
    )
    db.add(perf)
    db.commit()
    return perf


@pytest.fixture()
def seed_user(db):
    """Create a test user and return (user, password)."""
    password = "test_password_123"
    user = User(
        email="test@example.com",
        hashed_password=hash_password(password),
        name="테스터",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user, password


@pytest.fixture()
def auth_header(seed_user):
    """Return an Authorization header dict for the seeded user."""
    user, _ = seed_user
    token = create_access_token(user.id)
    return {"Authorization": f"Bearer {token}"}
