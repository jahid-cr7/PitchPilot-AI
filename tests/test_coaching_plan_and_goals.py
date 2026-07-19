"""tests/test_coaching_plan_and_goals.py
==========================================
Backend tests for coaching plan, goals CRUD, and cross-user isolation.

Covers:
- GET /api/v1/users/me/coaching-plan
- GET /api/v1/users/me/goals
- POST /api/v1/users/me/goals
- PATCH /api/v1/users/me/goals/{goal_id}
- DELETE /api/v1/users/me/goals/{goal_id}
- Cross-user isolation for goals and reports

Uses the same temp-DB + fresh-import strategy as the other test files.
"""

from __future__ import annotations

import sys
import tempfile
from pathlib import Path

import pytest


@pytest.fixture()
def client(monkeypatch: pytest.MonkeyPatch):
    tmp_dir = tempfile.mkdtemp(prefix="pitchpilot_test_cg_")
    db_path = str(Path(tmp_dir) / "pitchpilot.db")
    upload_dir = str(Path(tmp_dir) / "uploads")

    monkeypatch.setenv("PITCHPILOT_DB_PATH", db_path)
    monkeypatch.setenv("PITCHPILOT_UPLOAD_DIR", upload_dir)
    monkeypatch.setenv("PITCHPILOT_ENV", "development")
    monkeypatch.setenv(
        "PITCHPILOT_JWT_SECRET",
        "test-secret-do-not-use-in-prod-1234567890abcdef",
    )

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


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _register(client, name="Alice", email="alice@example.com", password="password123"):
    return client.post(
        "/api/v1/auth/register",
        json={"name": name, "email": email, "password": password},
    )


def _auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _save_session_for_user(
    user_id: int,
    *,
    overall: float = 75.0,
    movement: float = 70.0,
    camera: int = 72,
    speech: int = 74,
    answer: int = 78,
    strengths=None,
    weak_points=None,
    filename: str = "video.mp4",
    question: str = "Tell me about yourself.",
    role: str = "Software Developer",
):
    """Persist a fake practice session directly."""
    from core.database import save_practice_session

    video_result = {
        "duration_seconds": 60.0,
        "fps": 30.0,
        "resolution": "1920x1080",
        "movement_score": movement,
    }
    camera_result = {
        "face_visible_percent": 90.0,
        "framing": "Good",
        "distance_feedback": "OK",
        "movement_level": "Low",
        "camera_score": camera,
    }
    speech_result = {
        "transcript": "hello world",
        "word_count": 30,
        "words_per_minute": 120.0,
        "filler_word_count": 2,
        "repeated_word_count": 0,
        "speech_score": speech,
        "interview_question": question,
        "target_role": role,
    }
    ai_result = {
        "interview_question": question,
        "target_role": role,
        "model_used": "test-model",
    }
    final_feedback = {
        "answer_score": answer,
        "overall_score": overall,
        "performance_level": "Good",
        "strengths": strengths or [],
        "weak_points": weak_points or [],
        "next_practice_task": "Practice more.",
        "summary": "Nice work.",
    }
    return save_practice_session(
        video_result=video_result,
        camera_result=camera_result,
        speech_result=speech_result,
        ai_result=ai_result,
        final_feedback=final_feedback,
        video_filename=filename,
        user_id=user_id,
    )


# ---------------------------------------------------------------------------
# Coaching Plan
# ---------------------------------------------------------------------------
def test_coaching_plan_requires_auth(client):
    r = client.get("/api/v1/users/me/coaching-plan")
    assert r.status_code == 401


def test_coaching_plan_for_new_user_is_beginner(client):
    reg = _register(client)
    token = reg.json()["access_token"]
    r = client.get("/api/v1/users/me/coaching-plan", headers=_auth_header(token))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "success"
    assert body["current_level"] == "Beginner"
    assert "first practice session" in body["weekly_goal"].lower()
    assert body["focus_area"] == "Start your first practice session"


def test_coaching_plan_reflects_user_weaknesses(client):
    reg = _register(client)
    token = reg.json()["access_token"]
    user_id = reg.json()["user"]["id"]

    _save_session_for_user(
        user_id,
        overall=55.0,
        speech=50,
        camera=60,
        answer=55,
        weak_points=["Filler words", "Poor pacing", "Weak structure"],
    )

    r = client.get("/api/v1/users/me/coaching-plan", headers=_auth_header(token))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "success"
    assert body["current_level"] == "Developing"
    assert "filler" in body["focus_area"].lower() or "structure" in body["focus_area"].lower()
    assert body["action_steps"]
    assert body["metrics_to_watch"]
    assert body["next_milestone"]


# ---------------------------------------------------------------------------
# Goals CRUD
# ---------------------------------------------------------------------------
def test_goals_list_requires_auth(client):
    r = client.get("/api/v1/users/me/goals")
    assert r.status_code == 401


def test_create_goal_requires_auth(client):
    r = client.post(
        "/api/v1/users/me/goals",
        json={"title": "Test", "target_metric": "score", "target_value": 80.0},
    )
    assert r.status_code == 401


def test_create_and_list_goal(client):
    reg = _register(client)
    token = reg.json()["access_token"]

    r_create = client.post(
        "/api/v1/users/me/goals",
        json={
            "title": "Reach 80 overall",
            "target_metric": "overall_score",
            "target_value": 80.0,
            "current_value": 55.0,
        },
        headers=_auth_header(token),
    )
    assert r_create.status_code == 201, r_create.text
    body = r_create.json()
    assert body["status"] == "success"
    assert body["goal"]["title"] == "Reach 80 overall"
    assert body["goal"]["target_metric"] == "overall_score"
    assert body["goal"]["target_value"] == 80.0
    assert body["goal"]["current_value"] == 55.0
    assert body["goal"]["status"] == "active"

    r_list = client.get("/api/v1/users/me/goals", headers=_auth_header(token))
    assert r_list.status_code == 200, r_list.text
    goals = r_list.json()["goals"]
    assert len(goals) == 1
    assert goals[0]["title"] == "Reach 80 overall"


def test_update_goal(client):
    reg = _register(client)
    token = reg.json()["access_token"]

    r_create = client.post(
        "/api/v1/users/me/goals",
        json={"title": "Old title", "target_metric": "score", "target_value": 80.0},
        headers=_auth_header(token),
    )
    goal_id = r_create.json()["goal"]["id"]

    r_patch = client.patch(
        f"/api/v1/users/me/goals/{goal_id}",
        json={"title": "New title", "current_value": 70.0, "status": "completed"},
        headers=_auth_header(token),
    )
    assert r_patch.status_code == 200, r_patch.text
    body = r_patch.json()
    assert body["goal"]["title"] == "New title"
    assert body["goal"]["current_value"] == 70.0
    assert body["goal"]["status"] == "completed"
    assert body["goal"]["completed_at"] is not None


def test_delete_goal(client):
    reg = _register(client)
    token = reg.json()["access_token"]

    r_create = client.post(
        "/api/v1/users/me/goals",
        json={"title": "To delete", "target_metric": "score", "target_value": 80.0},
        headers=_auth_header(token),
    )
    goal_id = r_create.json()["goal"]["id"]

    r_del = client.delete(
        f"/api/v1/users/me/goals/{goal_id}",
        headers=_auth_header(token),
    )
    assert r_del.status_code == 200, r_del.text
    assert "deleted" in r_del.json()["message"].lower()

    r_list = client.get("/api/v1/users/me/goals", headers=_auth_header(token))
    assert len(r_list.json()["goals"]) == 0


def test_update_nonexistent_goal_is_404(client):
    reg = _register(client)
    token = reg.json()["access_token"]
    r = client.patch(
        "/api/v1/users/me/goals/9999",
        json={"title": "Nope"},
        headers=_auth_header(token),
    )
    assert r.status_code == 404


def test_delete_nonexistent_goal_is_404(client):
    reg = _register(client)
    token = reg.json()["access_token"]
    r = client.delete(
        "/api/v1/users/me/goals/9999",
        headers=_auth_header(token),
    )
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# Cross-user isolation
# ---------------------------------------------------------------------------
def test_user_a_cannot_see_user_b_goals(client):
    reg_a = _register(client, name="Alice", email="alice@example.com")
    reg_b = _register(client, name="Bob", email="bob@example.com")
    token_a = reg_a.json()["access_token"]
    token_b = reg_b.json()["access_token"]

    # Bob creates a goal.
    r_create = client.post(
        "/api/v1/users/me/goals",
        json={"title": "Bob's secret", "target_metric": "score", "target_value": 99.0},
        headers=_auth_header(token_b),
    )
    goal_id = r_create.json()["goal"]["id"]

    # Alice's list is empty.
    r_list = client.get("/api/v1/users/me/goals", headers=_auth_header(token_a))
    assert r_list.status_code == 200
    assert r_list.json()["goals"] == []

    # Alice cannot update Bob's goal.
    r_patch = client.patch(
        f"/api/v1/users/me/goals/{goal_id}",
        json={"title": "Hacked"},
        headers=_auth_header(token_a),
    )
    assert r_patch.status_code == 404

    # Alice cannot delete Bob's goal.
    r_del = client.delete(
        f"/api/v1/users/me/goals/{goal_id}",
        headers=_auth_header(token_a),
    )
    assert r_del.status_code == 404

    # Bob still has his goal.
    r_list_b = client.get("/api/v1/users/me/goals", headers=_auth_header(token_b))
    assert len(r_list_b.json()["goals"]) == 1


def test_user_a_cannot_see_user_b_sessions(client):
    reg_a = _register(client, name="Alice", email="alice@example.com")
    reg_b = _register(client, name="Bob", email="bob@example.com")
    token_a = reg_a.json()["access_token"]
    user_b_id = reg_b.json()["user"]["id"]

    _save_session_for_user(user_b_id, overall=99.0)

    r = client.get("/api/v1/sessions", headers=_auth_header(token_a))
    assert r.status_code == 200
    assert r.json()["sessions"] == []


def test_reports_are_protected_by_owner(client):
    reg_a = _register(client, name="Alice", email="alice@example.com")
    reg_b = _register(client, name="Bob", email="bob@example.com")
    token_a = reg_a.json()["access_token"]
    token_b = reg_b.json()["access_token"]
    user_b_id = reg_b.json()["user"]["id"]

    session_id = _save_session_for_user(user_b_id, overall=88.0)

    # Alice cannot export Bob's report.
    r_html = client.get(
        f"/api/v1/reports/{session_id}/html",
        headers=_auth_header(token_a),
    )
    r_csv = client.get(
        f"/api/v1/reports/{session_id}/csv",
        headers=_auth_header(token_a),
    )
    assert r_html.status_code == 404
    assert r_csv.status_code == 404

    # Bob can export his own report.
    r_html_b = client.get(
        f"/api/v1/reports/{session_id}/html",
        headers=_auth_header(token_b),
    )
    assert r_html_b.status_code == 200
    assert r_html_b.json()["status"] == "success"
    assert "<html" in r_html_b.json()["content"].lower()


# ---------------------------------------------------------------------------
# Endpoint coverage sanity checks
# ---------------------------------------------------------------------------
def test_dashboard_stats_requires_auth(client):
    r = client.get("/api/v1/dashboard/stats")
    assert r.status_code == 401


def test_profile_requires_auth(client):
    r = client.get("/api/v1/users/me/profile")
    assert r.status_code == 401


def test_analytics_requires_auth(client):
    r = client.get("/api/v1/users/me/analytics")
    assert r.status_code == 401
