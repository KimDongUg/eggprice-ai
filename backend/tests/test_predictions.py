"""Tests for prediction endpoints."""


class TestForecast:
    def test_forecast_with_data(self, client, seed_prices, seed_predictions):
        resp = client.get("/api/v1/predictions/forecast?grade=대란")
        assert resp.status_code == 200
        data = resp.json()
        assert data["grade"] == "대란"
        assert "current_price" in data
        assert "predictions" in data
        assert "trend" in data
        assert data["trend"] in ["상승", "하락", "보합"]
        for item in data["predictions"]:
            assert "date" in item
            assert "price" in item
            assert "confidence_interval" in item
            assert "change_percent" in item

    def test_forecast_no_data(self, client):
        resp = client.get("/api/v1/predictions/forecast?grade=대란")
        assert resp.status_code == 404


class TestPredictionsForGrade:
    def test_predictions_for_grade(self, client, seed_predictions):
        resp = client.get("/api/v1/predictions/대란")
        assert resp.status_code == 200
        data = resp.json()
        assert data["grade"] == "대란"
        assert isinstance(data["predictions"], list)

    def test_predictions_empty_grade(self, client):
        resp = client.get("/api/v1/predictions/왕란")
        assert resp.status_code == 200
        data = resp.json()
        assert data["predictions"] == []
