"""tests/test_auth.py
====================
Backend auth tests for register / login / me / protected endpoints.

Isolated from the developer's real SQLite database:
- Points ``PITCHPILOT_DB_PATH`` at a per-test temporary file before any app
  modules are imported.
- Uses ``fastapi.testclient.TestClient`` so no HTTP server is required.

Run:
    pytest -q
"""

from __future__ import annotations

import importlib
import os
import sys
import tempfile
from pathlib import Path

import pytest


# ---------------------------------------------------------------------------
# Test bootstrap — must run before importing api.main / core.database.
# ---------------------------------------------------------------------------
@pytest.fixture()
def client(monkeypatch: pytest.MonkeyPatch):
    tmp_dir = tempfile.mkdtemp(prefix="pitchpilot_test_")
    db_path = str(Path(tmp_dir) / "pitchpilot.db")
    upload_dir = str(Path(tmp_dir) / "uploads")

    monkeypatch.setenv("PITCHPILOT_DB_PATH", db_path)
    monkeypatch.setenv("PITCHPILOT_UPLOAD_DIR", upload_dir)
    monkeypatch.setenv("PITCHPILOT_ENV", "development")
    monkeypatch.setenv("PITCHPILOT_JWT_SECRET", "test-secret-do-not-use-in-prod-1234567890abcdef")

    # Force a clean import of every module that caches the DB path or secret.
    for mod_name in [
        "core.database",
        "api.auth",
        "api.config",
        "api.services",
        "api.main",
    ]:
        sys.modules.pop(mod_name, None)

    from fastapi.testclient import TestClient  # local import after env is set
    from api.main import app  # noqa: WPS433

    with TestClient(app) as c:
        yield c


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _register(client, name="Jahid Hasan", email="jahid@example.com", password="password123"):
    return client.post(
        "/api/v1/auth/register",
        json={"name": name, "email": email, "password": password},
    )


def _login(client, email="jahid@example.com", password="password123"):
    return client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------
def test_health_is_public(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_register_success(client):
    r = _register(client)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["email"] == "jahid@example.com"
    assert body["user"]["name"] == "Jahid Hasan"
    assert "password" not in body["user"]
    assert "password_hash" not in body["user"]


def test_register_duplicate_email(client):
    r1 = _register(client)
    assert r1.status_code == 200
    r2 = _register(client)
    assert r2.status_code == 409
    assert "already" in r2.json()["detail"].lower()


def test_register_rejects_short_password(client):
    r = _register(client, password="123")
    # Pydantic Field(min_length=6) returns 422; the custom guard would return 400.
    # Either is acceptable — both mean "the request was rejected before creating a user".
    assert r.status_code in (400, 422)


def test_login_success(client):
    _register(client)
    r = _login(client)
    assert r.status_code == 200
    body = r.json()
    assert body["access_token"]
    assert body["user"]["email"] == "jahid@example.com"


def test_login_wrong_password(client):
    _register(client)
    r = _login(client, password="not-the-right-one")
    assert r.status_code == 401
    assert "invalid" in r.json()["detail"].lower()


def test_login_unknown_email(client):
    r = _login(client, email="nobody@example.com", password="whatever")
    assert r.status_code == 401


def test_me_with_valid_token(client):
    reg = _register(client)
    token = reg.json()["access_token"]
    r = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    assert r.json()["user"]["email"] == "jahid@example.com"


def test_me_without_token_is_401(client):
    r = client.get("/api/v1/auth/me")
    assert r.status_code == 401


def test_me_with_bogus_token_is_401(client):
    r = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer this.is.not.a.jwt"},
    )
    assert r.status_code == 401


def test_protected_sessions_requires_auth(client):
    r = client.get("/api/v1/sessions")
    assert r.status_code == 401


def test_protected_dashboard_requires_auth(client):
    r = client.get("/api/v1/dashboard/stats")
    assert r.status_code == 401


def test_protected_session_detail_requires_auth(client):
    r = client.get("/api/v1/sessions/1")
    assert r.status_code == 401


def test_protected_report_requires_auth(client):
    r_html = client.get("/api/v1/reports/1/html")
    r_csv = client.get("/api/v1/reports/1/csv")
    assert r_html.status_code == 401
    assert r_csv.status_code == 401


def test_authenticated_sessions_starts_empty(client):
    reg = _register(client)
    token = reg.json()["access_token"]
    r = client.get(
        "/api/v1/sessions",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "success"
    assert body["sessions"] == []


def test_logout_endpoint_is_public(client):
    r = client.post("/api/v1/auth/logout")
    assert r.status_code == 200
    assert r.json()["status"] == "success"
