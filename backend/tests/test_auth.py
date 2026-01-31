"""Tests for authentication endpoints."""


class TestRegister:
    def test_register_success(self, client):
        resp = client.post("/api/v1/auth/register", json={
            "email": "new@example.com",
            "password": "strong_pass_123",
            "name": "홍길동",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == "new@example.com"
        assert data["name"] == "홍길동"
        assert data["is_active"] is True
        assert "id" in data

    def test_register_duplicate_email(self, client, seed_user):
        resp = client.post("/api/v1/auth/register", json={
            "email": "test@example.com",
            "password": "another_pass",
            "name": "복제인간",
        })
        assert resp.status_code == 409

    def test_register_invalid_email(self, client):
        resp = client.post("/api/v1/auth/register", json={
            "email": "not-an-email",
            "password": "pass123",
        })
        assert resp.status_code == 422


class TestLogin:
    def test_login_success(self, client, seed_user):
        _, password = seed_user
        resp = client.post("/api/v1/auth/login", json={
            "email": "test@example.com",
            "password": password,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client, seed_user):
        resp = client.post("/api/v1/auth/login", json={
            "email": "test@example.com",
            "password": "wrong_password",
        })
        assert resp.status_code == 401

    def test_login_nonexistent_user(self, client):
        resp = client.post("/api/v1/auth/login", json={
            "email": "nobody@example.com",
            "password": "whatever",
        })
        assert resp.status_code == 401


class TestRefreshToken:
    def test_refresh_token_success(self, client, seed_user):
        _, password = seed_user
        login_resp = client.post("/api/v1/auth/login", json={
            "email": "test@example.com",
            "password": password,
        })
        refresh_token = login_resp.json()["refresh_token"]

        resp = client.post("/api/v1/auth/refresh", json={
            "refresh_token": refresh_token,
        })
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    def test_refresh_with_access_token_fails(self, client, seed_user):
        _, password = seed_user
        login_resp = client.post("/api/v1/auth/login", json={
            "email": "test@example.com",
            "password": password,
        })
        access_token = login_resp.json()["access_token"]

        resp = client.post("/api/v1/auth/refresh", json={
            "refresh_token": access_token,
        })
        assert resp.status_code == 401

    def test_refresh_with_invalid_token(self, client):
        resp = client.post("/api/v1/auth/refresh", json={
            "refresh_token": "completely.invalid.token",
        })
        assert resp.status_code == 401


class TestGetMe:
    def test_get_me_authenticated(self, client, seed_user, auth_header):
        user, _ = seed_user
        resp = client.get("/api/v1/auth/me", headers=auth_header)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == user.email
        assert data["name"] == user.name

    def test_get_me_unauthenticated(self, client):
        resp = client.get("/api/v1/auth/me")
        assert resp.status_code in (401, 403)  # No credentials
