"""api/services.py
=================
Thin service wrappers around core PitchPilot AI analyzers.
Keeps API route handlers clean and testable.
"""

import os
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

from core.ai_coach_agent import analyze_answer_with_ai
from core.scoring_engine import calculate_overall_score
from core.question_bank import (
    get_default_role_for_mode,
    get_practice_modes,
    get_questions_for_mode,
    get_random_question,
)
from core.video_analyzer import analyze_video as _core_analyze_video
from core.camera_analyzer import analyze_camera_presence as _core_analyze_camera
from core.speech_analyzer import analyze_speech as _core_analyze_speech
from core.database import (
    _get_conn,
    _from_json,
    delete_session as _db_delete_session,
    get_all_sessions as _db_get_all_sessions,
    save_practice_session as _db_save_practice_session,
)
from reports.report_generator import generate_html_report, generate_csv_report


from api.config import UPLOAD_DIR

UPLOAD_DIR_PATH = Path(UPLOAD_DIR)


# ---------------------------------------------------------------------------
# AI Coach
# ---------------------------------------------------------------------------
def analyze_answer(
    transcript: str,
    question: str,
    role: str,
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
    model: Optional[str] = None,
) -> Dict[str, Any]:
    """Run AI Coach analysis via the core agent."""
    return analyze_answer_with_ai(
        transcript=transcript,
        question=question,
        role=role,
        api_key=api_key,
        base_url=base_url,
        model=model,
    )


# ---------------------------------------------------------------------------
# Final Score
# ---------------------------------------------------------------------------
def calculate_final_score(
    video_result: dict,
    camera_result: dict,
    speech_result: dict,
    ai_result: Optional[dict] = None,
) -> Dict[str, Any]:
    """Calculate overall performance score via the core engine."""
    return calculate_overall_score(
        video_result=video_result,
        camera_result=camera_result,
        speech_result=speech_result,
        ai_result=ai_result,
    )


# ---------------------------------------------------------------------------
# Video / Camera / Speech
# ---------------------------------------------------------------------------

def _ensure_upload_dir() -> Path:
    UPLOAD_DIR_PATH.mkdir(parents=True, exist_ok=True)
    return UPLOAD_DIR_PATH


def _safe_filename(original: str) -> str:
    ext = Path(original).suffix.lower()
    if ext != ".mp4":
        ext = ".mp4"
    return f"{uuid.uuid4().hex}{ext}"


def save_uploaded_file(content: bytes, original_name: str) -> Path:
    """Save uploaded bytes to a safe temporary path."""
    dest = _ensure_upload_dir() / _safe_filename(original_name)
    dest.write_bytes(content)
    return dest


def delete_temp_file(path: Path) -> None:
    """Best-effort deletion of a temporary file."""
    try:
        if path.exists():
            path.unlink()
    except Exception:
        pass


def analyze_video_file(video_path: str) -> Dict[str, Any]:
    """Run video analysis on a file path."""
    return _core_analyze_video(video_path)


def analyze_camera_file(video_path: str) -> Dict[str, Any]:
    """Run camera presence analysis on a file path."""
    return _core_analyze_camera(video_path)


def analyze_speech_file(video_path: str) -> Dict[str, Any]:
    """Run speech analysis on a file path."""
    return _core_analyze_speech(video_path)


# Public aliases used by api/main.py route handlers.
analyze_video = analyze_video_file
analyze_camera = analyze_camera_file
analyze_speech = analyze_speech_file


# ---------------------------------------------------------------------------
# Full pipeline
# ---------------------------------------------------------------------------

def analyze_full_pipeline(
    video_path: str,
    video_filename: str = "",
    question: str = "Tell me about yourself.",
    role: str = "Software Developer",
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
    model: Optional[str] = None,
    save_session: bool = True,
    user_id: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Run the complete analysis pipeline:
    video -> camera -> speech -> AI coach -> final score.
    Then optionally save the session to the database.
    """
    video_result = _core_analyze_video(video_path)
    camera_result = _core_analyze_camera(video_path)
    speech_result = _core_analyze_speech(video_path)

    ai_result = None
    if speech_result.get("status") == "success":
        ai_result = analyze_answer_with_ai(
            transcript=speech_result.get("transcript", ""),
            question=question,
            role=role,
            api_key=api_key,
            base_url=base_url,
            model=model,
            speech_result=speech_result,
        )

    final_feedback = calculate_overall_score(
        video_result=video_result,
        camera_result=camera_result,
        speech_result=speech_result,
        ai_result=ai_result,
    )

    # Save to history only when requested — never crash the analysis if save fails
    session_id = None
    save_warning = None
    if save_session:
        try:
            ai_result_for_save = dict(ai_result) if ai_result else {}
            ai_result_for_save["interview_question"] = question
            ai_result_for_save["target_role"] = role

            session_id = _db_save_practice_session(
                video_result=dict(video_result),
                camera_result=dict(camera_result),
                speech_result=dict(speech_result),
                ai_result=ai_result_for_save,
                final_feedback=dict(final_feedback),
                video_filename=video_filename,
                user_id=user_id,
            )
        except Exception:
            save_warning = "Analysis completed but could not be saved to history."
    else:
        save_warning = "Save to history is disabled."

    return {
        "status": "success",
        "session_id": session_id,
        "save_warning": save_warning,
        "video_result": video_result,
        "camera_result": camera_result,
        "speech_result": speech_result,
        "ai_result": ai_result or {},
        "final_feedback": final_feedback,
    }


# ---------------------------------------------------------------------------
# Question Bank
# ---------------------------------------------------------------------------
def list_practice_modes() -> List[str]:
    """Return all available practice mode names."""
    return get_practice_modes()


def list_questions(mode: str) -> List[str]:
    """Return questions for a given practice mode."""
    return get_questions_for_mode(mode)


def pick_random_question(mode: str) -> str:
    """Return a random question from a given practice mode."""
    return get_random_question(mode)


def resolve_default_role(mode: str) -> str:
    """Return the default target role for a given practice mode."""
    return get_default_role_for_mode(mode)


# ---------------------------------------------------------------------------
# Database / Session History
# ---------------------------------------------------------------------------
def get_all_sessions(user_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """Return all saved sessions with video_score mapped from movement_score.

    If ``user_id`` is provided, sessions are filtered to that user only.
    """
    sessions = _db_get_all_sessions(limit=999999, user_id=user_id)
    for session in sessions:
        session["video_score"] = session.get("movement_score", 0.0)
    return sessions


def get_session_by_id(
    session_id: int,
    user_id: Optional[int] = None,
) -> Optional[Dict[str, Any]]:
    """Return a single session by ID, or None if not found / not owned by user."""
    conn = _get_conn()
    cursor = conn.cursor()
    if user_id is None:
        cursor.execute(
            "SELECT * FROM practice_sessions WHERE id = ?",
            (session_id,),
        )
    else:
        cursor.execute(
            "SELECT * FROM practice_sessions WHERE id = ? AND user_id = ?",
            (session_id, user_id),
        )
    row = cursor.fetchone()
    conn.close()
    if row is None:
        return None
    session = dict(row)
    session["strengths"] = _from_json(session.get("strengths", "[]"))
    session["weak_points"] = _from_json(session.get("weak_points", "[]"))
    session["video_score"] = session.get("movement_score", 0.0)
    return session


def delete_session(session_id: int, user_id: Optional[int] = None) -> bool:
    """Delete a session by ID (scoped by user_id when provided)."""
    return _db_delete_session(session_id, user_id=user_id)


def get_dashboard_stats(user_id: Optional[int] = None) -> Dict[str, Any]:
    """Compute dashboard stats. If user_id is set, only that user's sessions count."""
    conn = _get_conn()
    cursor = conn.cursor()

    where_clause = ""
    params: tuple = ()
    if user_id is not None:
        where_clause = " WHERE user_id = ?"
        params = (user_id,)

    cursor.execute(f"SELECT COUNT(*) FROM practice_sessions{where_clause}", params)
    total = cursor.fetchone()[0]

    if total == 0:
        conn.close()
        return {
            "total_sessions": 0,
            "average_score": 0.0,
            "best_score": 0.0,
            "latest_score": 0.0,
            "average_video_score": 0.0,
            "average_camera_score": 0.0,
            "average_speech_score": 0.0,
            "average_answer_score": 0.0,
            "recent_sessions": [],
        }

    cursor.execute(
        "SELECT AVG(overall_score), MAX(overall_score), AVG(movement_score), "
        "AVG(camera_score), AVG(speech_score), AVG(answer_score) "
        f"FROM practice_sessions{where_clause}",
        params,
    )
    avg_overall, best, avg_video, avg_camera, avg_speech, avg_answer = cursor.fetchone()

    cursor.execute(
        f"SELECT overall_score FROM practice_sessions{where_clause} "
        "ORDER BY created_at DESC LIMIT 1",
        params,
    )
    latest = cursor.fetchone()[0]

    cursor.execute(
        f"SELECT * FROM practice_sessions{where_clause} "
        "ORDER BY created_at DESC LIMIT 5",
        params,
    )
    rows = cursor.fetchall()
    recent_sessions = []
    for row in rows:
        session = dict(row)
        session["strengths"] = _from_json(session.get("strengths", "[]"))
        session["weak_points"] = _from_json(session.get("weak_points", "[]"))
        session["video_score"] = session.get("movement_score", 0.0)
        recent_sessions.append(session)

    conn.close()

    return {
        "total_sessions": total,
        "average_score": round(avg_overall or 0, 1),
        "best_score": round(best or 0, 1),
        "latest_score": round(latest or 0, 1),
        "average_video_score": round(avg_video or 0, 1),
        "average_camera_score": round(avg_camera or 0, 1),
        "average_speech_score": round(avg_speech or 0, 1),
        "average_answer_score": round(avg_answer or 0, 1),
        "recent_sessions": recent_sessions,
    }


# ---------------------------------------------------------------------------
# User Analytics & Profile
# ---------------------------------------------------------------------------
def _extract_date(created_at: Optional[str]) -> str:
    """Return the YYYY-MM-DD portion of an ISO timestamp; empty string on failure."""
    if not created_at:
        return ""
    # ISO format from datetime.isoformat() starts with YYYY-MM-DD.
    return str(created_at)[:10]


def _empty_user_analytics() -> Dict[str, Any]:
    return {
        "total_sessions": 0,
        "average_score": 0.0,
        "best_score": 0.0,
        "latest_score": 0.0,
        "score_trend": [],
        "skill_averages": {
            "video": 0.0,
            "camera": 0.0,
            "speech": 0.0,
            "answer": 0.0,
        },
        "top_strengths": [],
        "common_weaknesses": [],
        "recent_sessions": [],
    }


def get_user_analytics(user_id: int, limit_trend: int = 30, limit_recent: int = 5) -> Dict[str, Any]:
    """Compute analytics for a single authenticated user.

    Always scoped by ``user_id``; never reads another user's sessions.
    ``limit_trend`` caps the score trend to the most recent N sessions.
    ``limit_recent`` caps the recent_sessions list.
    """
    conn = _get_conn()
    try:
        cursor = conn.cursor()

        cursor.execute(
            "SELECT COUNT(*) FROM practice_sessions WHERE user_id = ?",
            (user_id,),
        )
        total = cursor.fetchone()[0]
        if total == 0:
            return _empty_user_analytics()

        cursor.execute(
            "SELECT AVG(overall_score), MAX(overall_score), "
            "AVG(movement_score), AVG(camera_score), AVG(speech_score), AVG(answer_score) "
            "FROM practice_sessions WHERE user_id = ?",
            (user_id,),
        )
        avg_overall, best, avg_video, avg_camera, avg_speech, avg_answer = cursor.fetchone()

        cursor.execute(
            "SELECT overall_score FROM practice_sessions "
            "WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
            (user_id,),
        )
        latest_row = cursor.fetchone()
        latest = latest_row[0] if latest_row else 0.0

        # Full trend, oldest -> newest so charts read left-to-right.
        cursor.execute(
            "SELECT created_at, overall_score FROM practice_sessions "
            "WHERE user_id = ? ORDER BY created_at ASC LIMIT ?",
            (user_id, limit_trend),
        )
        trend_rows = cursor.fetchall()
        score_trend = [
            {
                "date": _extract_date(row["created_at"]),
                "score": round(row["overall_score"] or 0, 1),
            }
            for row in trend_rows
        ]

        # Recent sessions for the "Recent Activity" table.
        cursor.execute(
            "SELECT * FROM practice_sessions "
            "WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
            (user_id, limit_recent),
        )
        recent_rows = cursor.fetchall()
        recent_sessions: List[Dict[str, Any]] = []
        for row in recent_rows:
            session = dict(row)
            session["strengths"] = _from_json(session.get("strengths", "[]"))
            session["weak_points"] = _from_json(session.get("weak_points", "[]"))
            session["video_score"] = session.get("movement_score", 0.0)
            recent_sessions.append(session)

        # Aggregate strengths / weaknesses across all sessions for this user.
        cursor.execute(
            "SELECT strengths, weak_points FROM practice_sessions WHERE user_id = ?",
            (user_id,),
        )
        strength_counts: Dict[str, int] = {}
        weakness_counts: Dict[str, int] = {}
        for row in cursor.fetchall():
            for item in _from_json(row["strengths"] or "[]") or []:
                if isinstance(item, str) and item.strip():
                    key = item.strip()
                    strength_counts[key] = strength_counts.get(key, 0) + 1
            for item in _from_json(row["weak_points"] or "[]") or []:
                if isinstance(item, str) and item.strip():
                    key = item.strip()
                    weakness_counts[key] = weakness_counts.get(key, 0) + 1

        top_strengths = [k for k, _ in sorted(
            strength_counts.items(), key=lambda kv: (-kv[1], kv[0])
        )[:5]]
        common_weaknesses = [k for k, _ in sorted(
            weakness_counts.items(), key=lambda kv: (-kv[1], kv[0])
        )[:5]]

        return {
            "total_sessions": total,
            "average_score": round(avg_overall or 0, 1),
            "best_score": round(best or 0, 1),
            "latest_score": round(latest or 0, 1),
            "score_trend": score_trend,
            "skill_averages": {
                "video": round(avg_video or 0, 1),
                "camera": round(avg_camera or 0, 1),
                "speech": round(avg_speech or 0, 1),
                "answer": round(avg_answer or 0, 1),
            },
            "top_strengths": top_strengths,
            "common_weaknesses": common_weaknesses,
            "recent_sessions": recent_sessions,
        }
    finally:
        conn.close()


def get_user_profile_summary(user: Dict[str, Any]) -> Dict[str, Any]:
    """Return the profile summary for a user row (as returned by get_user_by_id)."""
    user_id = int(user["id"])
    conn = _get_conn()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT COUNT(*), MAX(created_at) FROM practice_sessions WHERE user_id = ?",
            (user_id,),
        )
        total, latest_ts = cursor.fetchone()
    finally:
        conn.close()

    return {
        "id": user_id,
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "created_at": user.get("created_at"),
        "total_sessions": int(total or 0),
        "latest_session_date": latest_ts if latest_ts else None,
    }


# ---------------------------------------------------------------------------
# Report Generation
# ---------------------------------------------------------------------------
def build_report_filename(session_id: int, extension: str) -> str:
    ext = extension.lstrip(".")
    return f"pitchpilot_session_{session_id}.{ext}"
