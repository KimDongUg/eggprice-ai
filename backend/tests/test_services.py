"""Tests for backend services (price, alert, prediction, model evaluation)."""

from datetime import date, timedelta
from unittest.mock import AsyncMock, patch

import pytest

from app.models.alert import Alert
from app.models.market_data import ModelPerformance
from app.models.prediction import Prediction
from app.models.price import EggPrice
from app.schemas.alert import AlertCreate
from app.services.alert_service import (
    check_and_send_alerts,
    create_alert,
    delete_alert,
    get_active_alerts,
    get_alerts_by_email,
)
from app.services.model_evaluation import (
    compare_models,
    get_production_metrics,
    promote_model,
    store_performance,
)
from app.services.prediction_service import get_predictions, run_predictions
from app.services.price_service import get_current_prices, get_price_history


# ── Price Service ─────────────────────────────────────────


class TestGetCurrentPrices:
    def test_returns_all_grades(self, db, seed_all_grades):
        result = get_current_prices(db)
        grades = [r["grade"] for r in result]
        for g in ["왕란", "특란", "대란", "중란", "소란"]:
            assert g in grades

    def test_includes_daily_change(self, db, seed_all_grades):
        result = get_current_prices(db)
        for r in result:
            assert "daily_change" in r
            assert "daily_change_pct" in r
            # With 30 days of ascending data, daily change should be positive
            if r["daily_change"] is not None:
                assert r["daily_change"] == 5.0  # each day increases by 5

    def test_empty_db_returns_empty(self, db):
        result = get_current_prices(db)
        assert result == []

    def test_single_day_no_change(self, db):
        """With only one day of data, daily_change should be None."""
        db.add(EggPrice(
            date=date.today(), grade="대란",
            retail_price=6000, wholesale_price=5000, unit="30개",
        ))
        db.commit()
        result = get_current_prices(db)
        assert len(result) == 1
        assert result[0]["daily_change"] is None


class TestGetPriceHistory:
    def test_returns_correct_grade(self, db, seed_prices):
        result = get_price_history(db, "대란", days=30)
        assert all(p.grade == "대란" for p in result)

    def test_respects_days_limit(self, db, seed_prices):
        """get_price_history uses date >= (today - timedelta(days)),
        so requesting 10 days can return up to 11 records (inclusive boundary)."""
        result = get_price_history(db, "대란", days=10)
        assert len(result) <= 11

    def test_ordered_by_date(self, db, seed_prices):
        result = get_price_history(db, "대란", days=60)
        dates = [p.date for p in result]
        assert dates == sorted(dates)

    def test_empty_for_missing_grade(self, db, seed_prices):
        result = get_price_history(db, "왕란", days=30)
        assert result == []


# ── Alert Service ─────────────────────────────────────────


class TestAlertService:
    def test_create_alert(self, db):
        data = AlertCreate(
            email="test@example.com",
            grade="대란",
            condition="below",
            threshold_price=5000.0,
        )
        alert = create_alert(db, data)
        assert alert.id is not None
        assert alert.email == "test@example.com"
        assert alert.is_active is True

    def test_get_alerts_by_email(self, db):
        for grade in ["대란", "특란"]:
            create_alert(db, AlertCreate(
                email="user@test.com", grade=grade,
                condition="below", threshold_price=5000.0,
            ))
        # Different email
        create_alert(db, AlertCreate(
            email="other@test.com", grade="대란",
            condition="above", threshold_price=7000.0,
        ))

        alerts = get_alerts_by_email(db, "user@test.com")
        assert len(alerts) == 2
        assert all(a.email == "user@test.com" for a in alerts)

    def test_delete_alert_success(self, db):
        alert = create_alert(db, AlertCreate(
            email="test@example.com", grade="대란",
            condition="below", threshold_price=5000.0,
        ))
        assert delete_alert(db, alert.id) is True
        # Verify deleted
        remaining = get_alerts_by_email(db, "test@example.com")
        assert len(remaining) == 0

    def test_delete_nonexistent_returns_false(self, db):
        assert delete_alert(db, 99999) is False

    def test_get_active_alerts_excludes_inactive(self, db):
        alert = create_alert(db, AlertCreate(
            email="test@example.com", grade="대란",
            condition="below", threshold_price=5000.0,
        ))
        # Manually deactivate
        alert.is_active = False
        db.commit()

        active = get_active_alerts(db)
        assert len(active) == 0


class TestCheckAndSendAlerts:
    @pytest.mark.asyncio
    async def test_triggers_below_alert(self, db):
        create_alert(db, AlertCreate(
            email="user@test.com", grade="대란",
            condition="below", threshold_price=6000.0,
        ))
        predictions = [{"grade": "대란", "predicted_price": 5500.0}]

        with patch("app.services.alert_service.send_alert_email", new_callable=AsyncMock) as mock_send:
            await check_and_send_alerts(db, predictions)
            mock_send.assert_called_once_with(
                "user@test.com", "대란", 5500.0, "below", 6000.0
            )

    @pytest.mark.asyncio
    async def test_triggers_above_alert(self, db):
        create_alert(db, AlertCreate(
            email="user@test.com", grade="대란",
            condition="above", threshold_price=6000.0,
        ))
        predictions = [{"grade": "대란", "predicted_price": 6500.0}]

        with patch("app.services.alert_service.send_alert_email", new_callable=AsyncMock) as mock_send:
            await check_and_send_alerts(db, predictions)
            mock_send.assert_called_once()

    @pytest.mark.asyncio
    async def test_no_trigger_when_condition_not_met(self, db):
        create_alert(db, AlertCreate(
            email="user@test.com", grade="대란",
            condition="below", threshold_price=5000.0,
        ))
        predictions = [{"grade": "대란", "predicted_price": 5500.0}]

        with patch("app.services.alert_service.send_alert_email", new_callable=AsyncMock) as mock_send:
            await check_and_send_alerts(db, predictions)
            mock_send.assert_not_called()

    @pytest.mark.asyncio
    async def test_ignores_different_grade(self, db):
        create_alert(db, AlertCreate(
            email="user@test.com", grade="특란",
            condition="below", threshold_price=6000.0,
        ))
        predictions = [{"grade": "대란", "predicted_price": 5000.0}]

        with patch("app.services.alert_service.send_alert_email", new_callable=AsyncMock) as mock_send:
            await check_and_send_alerts(db, predictions)
            mock_send.assert_not_called()


# ── Prediction Service ────────────────────────────────────


class TestGetPredictions:
    def test_returns_latest_predictions(self, db, seed_predictions):
        result = get_predictions(db, "대란")
        assert len(result) == 3
        horizons = [p.horizon_days for p in result]
        assert horizons == [7, 14, 30]

    def test_returns_empty_for_no_data(self, db):
        result = get_predictions(db, "대란")
        assert result == []

    def test_returns_only_latest_base_date(self, db):
        """When multiple base dates exist, only the latest should be returned."""
        today = date.today()
        yesterday = today - timedelta(days=1)

        for base in [yesterday, today]:
            for h in [7, 14, 30]:
                db.add(Prediction(
                    base_date=base,
                    target_date=base + timedelta(days=h),
                    grade="대란",
                    predicted_price=6200.0,
                    confidence_lower=6000.0,
                    confidence_upper=6400.0,
                    horizon_days=h,
                    model_version="v-test",
                ))
        db.commit()

        result = get_predictions(db, "대란")
        assert len(result) == 3
        assert all(p.base_date == today for p in result)


class TestRunPredictions:
    def test_handles_missing_model_file(self, db, seed_prices):
        """Should return empty list when model file doesn't exist."""
        result = run_predictions(db, "대란")
        assert result == []

    def test_handles_insufficient_data(self, db):
        """Should return empty list when not enough price data."""
        db.add(EggPrice(
            date=date.today(), grade="대란",
            retail_price=6000, wholesale_price=5000, unit="30개",
        ))
        db.commit()
        result = run_predictions(db, "대란")
        assert result == []


# ── Model Evaluation Service ──────────────────────────────


class TestStorePerformance:
    def test_stores_metrics(self, db):
        metrics = {
            "mae": 85.0,
            "rmse": 120.0,
            "mape": 3.5,
            "directional_accuracy": 75.0,
        }
        perf = store_performance(db, "v-test", "대란", metrics, is_production=True)
        assert perf.id is not None
        assert perf.mae == 85.0
        assert perf.is_production is True

    def test_stores_non_production(self, db):
        metrics = {"mae": 90.0, "rmse": 130.0, "mape": 4.0, "directional_accuracy": 72.0}
        perf = store_performance(db, "v-candidate", "대란", metrics, is_production=False)
        assert perf.is_production is False


class TestGetProductionMetrics:
    def test_returns_production_model(self, db, seed_model_performance):
        result = get_production_metrics(db, "대란")
        assert result is not None
        assert result.is_production is True
        assert result.model_version == "v2.0-test"

    def test_returns_none_when_no_production(self, db):
        result = get_production_metrics(db, "대란")
        assert result is None


class TestPromoteModel:
    def test_promote_demotes_current(self, db, seed_model_performance):
        # Store a candidate
        metrics = {"mae": 80.0, "rmse": 110.0, "mape": 3.0, "directional_accuracy": 78.0}
        store_performance(db, "v-new", "대란", metrics, is_production=False)

        promote_model(db, "대란", "v-new")

        # Old production should be demoted
        old = db.query(ModelPerformance).filter(
            ModelPerformance.model_version == "v2.0-test",
            ModelPerformance.grade == "대란",
        ).first()
        assert old.is_production is False

        # New should be promoted
        new = db.query(ModelPerformance).filter(
            ModelPerformance.model_version == "v-new",
            ModelPerformance.grade == "대란",
        ).first()
        assert new.is_production is True

    def test_promote_when_no_existing_production(self, db):
        metrics = {"mae": 85.0, "rmse": 120.0, "mape": 3.5, "directional_accuracy": 75.0}
        store_performance(db, "v-first", "대란", metrics, is_production=False)

        promote_model(db, "대란", "v-first")

        record = db.query(ModelPerformance).filter(
            ModelPerformance.model_version == "v-first",
        ).first()
        assert record.is_production is True


class TestCompareModels:
    def test_returns_error_when_candidate_cant_evaluate(self, db):
        """compare_models should return error when candidate model can't be loaded."""
        result = compare_models(db, "대란", "nonexistent-version")
        assert result["status"] == "error"

    def test_promotes_when_no_production_exists(self, db, seed_prices, seed_market_data):
        """When there's no production model, recommendation should be 'promote'
        if candidate can be evaluated. We mock the evaluation."""
        with patch("app.services.model_evaluation.evaluate_model_on_recent_data") as mock_eval:
            mock_eval.return_value = {
                "mae": 80.0, "rmse": 110.0, "mape": 3.0, "directional_accuracy": 78.0,
            }
            result = compare_models(db, "대란", "v-candidate")
            assert result["recommendation"] == "promote"
            assert result["production_metrics"] is None

    def test_keeps_current_when_candidate_worse(self, db, seed_model_performance):
        """When candidate is worse on most metrics, keep current."""
        with patch("app.services.model_evaluation.evaluate_model_on_recent_data") as mock_eval:
            # Candidate is worse on all metrics
            mock_eval.return_value = {
                "mae": 200.0, "rmse": 250.0, "mape": 8.0, "directional_accuracy": 50.0,
            }
            result = compare_models(db, "대란", "v-bad")
            assert result["recommendation"] == "keep_current"

    def test_promotes_when_candidate_better(self, db, seed_model_performance):
        """When candidate is better on >= 3 metrics, recommend promote."""
        with patch("app.services.model_evaluation.evaluate_model_on_recent_data") as mock_eval:
            # Candidate is better on all 4 metrics (production: mae=85, rmse=120, mape=3.5, da=75)
            mock_eval.return_value = {
                "mae": 70.0, "rmse": 100.0, "mape": 2.5, "directional_accuracy": 80.0,
            }
            result = compare_models(db, "대란", "v-better")
            assert result["recommendation"] == "promote"
            assert result["improvements"] == 4
