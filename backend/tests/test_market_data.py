"""Tests for market data endpoints."""

from datetime import date


class TestMarketSnapshot:
    def test_snapshot_with_data(self, client, seed_all_grades, seed_market_data):
        resp = client.get("/api/v1/market/snapshot")
        assert resp.status_code == 200
        data = resp.json()
        assert "date" in data
        assert "prices" in data
        assert isinstance(data["prices"], dict)
        assert "volume" in data
        assert "corn_price" in data
        assert "exchange_rate" in data
        assert "avian_flu" in data
        assert "temperature" in data

    def test_snapshot_specific_date(self, client, seed_all_grades, seed_market_data):
        today = date.today().isoformat()
        resp = client.get(f"/api/v1/market/snapshot?target_date={today}")
        assert resp.status_code == 200

    def test_snapshot_empty_db(self, client):
        resp = client.get("/api/v1/market/snapshot")
        assert resp.status_code == 200
        data = resp.json()
        # All values should be None/false when no data
        assert data["volume"] is None
        assert data["avian_flu"] is False


class TestModelPerformance:
    def test_model_performance_list(self, client, seed_model_performance):
        resp = client.get("/api/v1/models/performance?grade=대란")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]["model_version"] == "v2.0-test"
        assert data[0]["mae"] == 85.0

    def test_model_performance_empty_grade(self, client):
        resp = client.get("/api/v1/models/performance?grade=왕란")
        assert resp.status_code == 200
        assert resp.json() == []


class TestCurrentModelPerformance:
    def test_current_model(self, client, seed_model_performance):
        resp = client.get("/api/v1/models/current?grade=대란")
        assert resp.status_code == 200
        data = resp.json()
        assert data["is_production"] is True
        assert data["grade"] == "대란"

    def test_current_model_none(self, client):
        resp = client.get("/api/v1/models/current?grade=대란")
        assert resp.status_code == 200
        assert resp.json() is None


class TestAnalyticsFactors:
    def test_analytics_factors(self, client, seed_prices, seed_market_data):
        resp = client.get("/api/v1/analytics/factors?grade=대란")
        assert resp.status_code == 200
        data = resp.json()
        assert data["grade"] == "대란"
        assert "factors" in data
        assert isinstance(data["factors"], list)
        # Should have at least the avian flu factor
        factor_names = [f["factor"] for f in data["factors"]]
        assert "조류독감" in factor_names
        for factor in data["factors"]:
            assert factor["direction"] in ["상승", "하락", "중립"]
