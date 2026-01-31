"""Tests for health check endpoint."""


def test_health_check(client):
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["service"] == "EggPrice AI"
    assert data["version"] == "3.0.0"
