"""tests/test_robot_coach.py
===========================
Backend tests for the Robot Coach Lesson endpoint.

Covers:
- Auth requirement
- Cross-user session isolation
- Fallback lesson generation without AI key
- Response structure (spoken_script, practice_steps, subtitles)
"""

from __future__ import annotations

import importlib
import os
import sys
import tempfile
from pathlib import Path

import pytest


@pytest.fixture()
def client(monkeypatch: pytest.MonkeyPatch):
    tmp_dir = tempfile.mkdtemp(prefix="pitchpilot_test_")
    db_path = str(Path(tmp_dir) / "pitchpilot.db")
    upload_dir = str(Path(tmp_dir) / "uploads")

    monkeypatch.setenv("PITCHPILOT_DB_PATH", db_path)
    monkeypatch.setenv("PITCHPILOT_UPLOAD_DIR", upload_dir)
    monkeypatch.setenv("PITCHPILOT_ENV", "development")
    monkeypatch.setenv("PITCHPILOT_JWT_SECRET", "test-secret-do-not-use-in-prod-1234567890abcdef")
    # Ensure no AI key so we test fallback mode
    monkeypatch.setenv("PITCHPILOT_AI_API_KEY", "")

    for mod_name in [
        "api",
        "api.auth",
        "api.config",
        "api.schemas",
        "api.services",
        "api.main",
        "core",
        "core.database",
    ]:
        sys.modules.pop(mod_name, None)

    from fastapi.testclient import TestClient
    from api.main import app

    with TestClient(app) as c:
        yield c


def _register_and_login(client, email: str, password: str, name: str = "Test") -> str:
    r = client.post("/api/v1/auth/register", json={"name": name, "email": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def _create_session_for_user(client, token: str) -> int:
    """Create a minimal saved session by calling the full analysis endpoint with a tiny MP4."""
    # Create a minimal fake MP4 file (just bytes with .mp4 extension)
    fake_mp4 = b"\x00\x00\x00\x20ftypmp42" + b"\x00" * 100
    res = client.post(
        "/api/v1/analyze/full",
        data={
            "question": "Tell me about yourself.",
            "role": "Software Developer",
            "save_session": "true",
        },
        files={"file": ("test.mp4", fake_mp4, "video/mp4")},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200, res.text
    return res.json()["session_id"]


class TestRobotCoachAuth:
    def test_robot_lesson_requires_auth(self, client):
        r = client.post("/api/v1/coach/robot-lesson", json={"session_id": 1})
        assert r.status_code == 401

    def test_robot_lesson_404_for_missing_session(self, client):
        token = _register_and_login(client, "no-session@example.com", "password123")
        r = client.post(
            "/api/v1/coach/robot-lesson",
            json={"session_id": 99999},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert r.status_code == 404
        assert "not found" in r.json()["detail"].lower()


class TestRobotCoachIsolation:
    def test_user_cannot_access_another_users_session(self, client):
        token_a = _register_and_login(client, "user-a@example.com", "password123")
        token_b = _register_and_login(client, "user-b@example.com", "password123")

        # User A creates a session
        sid = _create_session_for_user(client, token_a)
        assert sid is not None

        # User B tries to generate a lesson from A's session
        r = client.post(
            "/api/v1/coach/robot-lesson",
            json={"session_id": sid},
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert r.status_code == 404


class TestRobotCoachFallback:
    def test_fallback_lesson_works_without_ai_key(self, client):
        token = _register_and_login(client, "fallback@example.com", "password123")
        sid = _create_session_for_user(client, token)
        assert sid is not None

        r = client.post(
            "/api/v1/coach/robot-lesson",
            json={"session_id": sid, "lesson_type": "interview", "focus_area": "overall"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert r.status_code == 200, r.text
        data = r.json()

        assert data["status"] == "success"
        lesson = data["lesson"]

        assert lesson["coach_name"] == "Coach Nova"
        assert lesson["lesson_type"] == "interview"
        assert lesson["focus_area"] == "overall"
        assert isinstance(lesson["title"], str) and len(lesson["title"]) > 0
        assert isinstance(lesson["problem_summary"], str) and len(lesson["problem_summary"]) > 0
        assert isinstance(lesson["why_it_matters"], str) and len(lesson["why_it_matters"]) > 0
        assert isinstance(lesson["correct_method"], str) and len(lesson["correct_method"]) > 0
        assert isinstance(lesson["better_example"], str) and len(lesson["better_example"]) > 0

        # Must include spoken_script and practice_steps
        assert isinstance(lesson["spoken_script"], str) and len(lesson["spoken_script"]) > 0
        assert isinstance(lesson["practice_steps"], list) and len(lesson["practice_steps"]) >= 1

        # Subtitles must be present
        subs = lesson["subtitles"]
        assert isinstance(subs, list) and len(subs) >= 1
        for sub in subs:
            assert "time" in sub
            assert "text" in sub

        assert isinstance(lesson["estimated_duration_seconds"], int)
        assert lesson["estimated_duration_seconds"] > 0

    def test_focus_area_variants(self, client):
        token = _register_and_login(client, "focus@example.com", "password123")
        sid = _create_session_for_user(client, token)
        assert sid is not None

        for area in ["answer_structure", "speech", "body_language", "confidence", "overall"]:
            r = client.post(
                "/api/v1/coach/robot-lesson",
                json={"session_id": sid, "focus_area": area},
                headers={"Authorization": f"Bearer {token}"},
            )
            assert r.status_code == 200, f"focus_area={area} failed: {r.text}"
            data = r.json()
            assert data["lesson"]["focus_area"] == area
