"""Tests for price endpoints."""


class TestCurrentPrices:
    def test_current_prices_with_data(self, client, seed_all_grades):
        resp = client.get("/api/v1/prices/current")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        for item in data:
            assert "grade" in item
            assert "retail_price" in item
            assert "date" in item

    def test_current_prices_empty_db(self, client):
        resp = client.get("/api/v1/prices/current")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)


class TestPriceHistory:
    def test_price_history_default(self, client, seed_prices):
        resp = client.get("/api/v1/prices/history?grade=대란&days=30")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) <= 31  # inclusive date boundary
        for item in data:
            assert item["grade"] == "대란"
            assert "retail_price" in item
            assert "date" in item

    def test_price_history_custom_grade(self, client, seed_all_grades):
        resp = client.get("/api/v1/prices/history?grade=특란&days=10")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        for item in data:
            assert item["grade"] == "특란"

    def test_price_history_invalid_days(self, client):
        resp = client.get("/api/v1/prices/history?grade=대란&days=0")
        assert resp.status_code == 422  # Validation error (ge=1)

    def test_price_history_exceeds_max_days(self, client):
        resp = client.get("/api/v1/prices/history?grade=대란&days=999")
        assert resp.status_code == 422  # Validation error (le=365)
