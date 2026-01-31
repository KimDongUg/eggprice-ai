"""Tests for alert endpoints."""


class TestCreateAlert:
    def test_create_alert_success(self, client):
        resp = client.post("/api/v1/alerts", json={
            "email": "user@example.com",
            "grade": "대란",
            "condition": "below",
            "threshold_price": 5000.0,
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == "user@example.com"
        assert data["grade"] == "대란"
        assert data["condition"] == "below"
        assert data["threshold_price"] == 5000.0
        assert data["is_active"] is True

    def test_create_alert_above_condition(self, client):
        resp = client.post("/api/v1/alerts", json={
            "email": "user@example.com",
            "grade": "특란",
            "condition": "above",
            "threshold_price": 7000.0,
        })
        assert resp.status_code == 201
        assert resp.json()["condition"] == "above"

    def test_create_alert_invalid_email(self, client):
        resp = client.post("/api/v1/alerts", json={
            "email": "not-valid",
            "grade": "대란",
            "condition": "below",
            "threshold_price": 5000.0,
        })
        assert resp.status_code == 422

    def test_create_alert_invalid_condition(self, client):
        resp = client.post("/api/v1/alerts", json={
            "email": "user@example.com",
            "grade": "대란",
            "condition": "invalid",
            "threshold_price": 5000.0,
        })
        assert resp.status_code == 422


class TestListAlerts:
    def test_list_alerts_by_email(self, client):
        # Create two alerts
        client.post("/api/v1/alerts", json={
            "email": "user@example.com",
            "grade": "대란",
            "condition": "below",
            "threshold_price": 5000.0,
        })
        client.post("/api/v1/alerts", json={
            "email": "user@example.com",
            "grade": "특란",
            "condition": "above",
            "threshold_price": 7000.0,
        })

        resp = client.get("/api/v1/alerts?email=user@example.com")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2

    def test_list_alerts_empty(self, client):
        resp = client.get("/api/v1/alerts?email=nobody@example.com")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_alerts_missing_email(self, client):
        resp = client.get("/api/v1/alerts")
        assert resp.status_code == 422


class TestDeleteAlert:
    def test_delete_alert_success(self, client):
        create_resp = client.post("/api/v1/alerts", json={
            "email": "user@example.com",
            "grade": "대란",
            "condition": "below",
            "threshold_price": 5000.0,
        })
        alert_id = create_resp.json()["id"]

        resp = client.delete(f"/api/v1/alerts/{alert_id}")
        assert resp.status_code == 200

        # Verify it's gone
        list_resp = client.get("/api/v1/alerts?email=user@example.com")
        assert len(list_resp.json()) == 0

    def test_delete_nonexistent_alert(self, client):
        resp = client.delete("/api/v1/alerts/99999")
        assert resp.status_code == 404
