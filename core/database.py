"""
core/database.py
================
SQLite database layer for PitchPilot AI session history.

Stores completed practice sessions so users can track improvement over time.
Cross-platform: uses pathlib for database path resolution.
"""

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
DB_DIR = Path(__file__).resolve().parent.parent / "data"
DB_DIR.mkdir(exist_ok=True)
DB_PATH = DB_DIR / "pitchpilot.db"


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------
CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS practice_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    video_filename TEXT,
    interview_question TEXT,
    target_role TEXT,
    transcript TEXT,
    duration_seconds REAL,
    fps REAL,
    resolution TEXT,
    movement_score REAL,
    face_visible_percent REAL,
    framing TEXT,
    distance_feedback TEXT,
    camera_movement_level TEXT,
    camera_score INTEGER,
    word_count INTEGER,
    words_per_minute REAL,
    filler_word_count INTEGER,
    repeated_word_count INTEGER,
    speech_score INTEGER,
    answer_score INTEGER,
    overall_score REAL,
    performance_level TEXT,
    strengths TEXT,
    weak_points TEXT,
    next_practice_task TEXT,
    summary TEXT,
    ai_model_used TEXT
);
"""


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_conn() -> sqlite3.Connection:
    """Open a SQLite connection with row factory for dict-like access."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def _safe_get(d: Optional[Dict[str, Any]], key: str, default: Any = None) -> Any:
    """Safely extract a value from a dict that may be None."""
    if d is None:
        return default
    return d.get(key, default)


def _to_json(obj: Any) -> str:
    """Serialize an object to a JSON string."""
    if obj is None:
        return "[]"
    return json.dumps(obj)


def _from_json(text: str) -> Any:
    """Deserialize a JSON string back to a Python object."""
    if not text:
        return []
    try:
        return json.loads(text)
    except Exception:
        return []


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def init_db() -> None:
    """Initialize the database and create tables if they do not exist."""
    try:
        conn = _get_conn()
        conn.execute(CREATE_TABLE_SQL)
        conn.commit()
        conn.close()
    except Exception as exc:
        raise RuntimeError(f"Failed to initialize database: {exc}")


def save_practice_session(
    video_result: Optional[dict],
    camera_result: Optional[dict],
    speech_result: Optional[dict],
    ai_result: Optional[dict],
    final_feedback: Optional[dict],
    video_filename: str = "",
) -> int:
    """
    Save a completed practice session to the database.

    Parameters
    ----------
    video_result : dict or None
    camera_result : dict or None
    speech_result : dict or None
    ai_result : dict or None
    final_feedback : dict or None
    video_filename : str

    Returns
    -------
    int
        The ID of the newly inserted session.
    """
    conn = _get_conn()
    cursor = conn.cursor()

    # Build row from available results
    row = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "video_filename": video_filename,
        "interview_question": _safe_get(ai_result, "interview_question", "") or _safe_get(speech_result, "interview_question", ""),
        "target_role": _safe_get(ai_result, "target_role", "") or _safe_get(speech_result, "target_role", ""),
        "transcript": _safe_get(speech_result, "transcript", ""),
        "duration_seconds": _safe_get(video_result, "duration_seconds", 0.0),
        "fps": _safe_get(video_result, "fps", 0.0),
        "resolution": _safe_get(video_result, "resolution", ""),
        "movement_score": _safe_get(video_result, "movement_score", 0.0),
        "face_visible_percent": _safe_get(camera_result, "face_visible_percent", 0.0),
        "framing": _safe_get(camera_result, "framing", ""),
        "distance_feedback": _safe_get(camera_result, "distance_feedback", ""),
        "camera_movement_level": _safe_get(camera_result, "movement_level", ""),
        "camera_score": _safe_get(camera_result, "camera_score", 0),
        "word_count": _safe_get(speech_result, "word_count", 0),
        "words_per_minute": _safe_get(speech_result, "words_per_minute", 0.0),
        "filler_word_count": _safe_get(speech_result, "filler_word_count", 0),
        "repeated_word_count": _safe_get(speech_result, "repeated_word_count", 0),
        "speech_score": _safe_get(speech_result, "speech_score", 0),
        "answer_score": _safe_get(final_feedback, "answer_score", 0),
        "overall_score": _safe_get(final_feedback, "overall_score", 0.0),
        "performance_level": _safe_get(final_feedback, "performance_level", ""),
        "strengths": _to_json(_safe_get(final_feedback, "strengths", [])),
        "weak_points": _to_json(_safe_get(final_feedback, "weak_points", [])),
        "next_practice_task": _safe_get(final_feedback, "next_practice_task", ""),
        "summary": _safe_get(final_feedback, "summary", ""),
        "ai_model_used": _safe_get(ai_result, "model_used", ""),
    }

    columns = ", ".join(row.keys())
    placeholders = ", ".join(f":{k}" for k in row.keys())

    cursor.execute(
        f"INSERT INTO practice_sessions ({columns}) VALUES ({placeholders})",
        row,
    )
    session_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return session_id


def get_all_sessions(limit: int = 50) -> List[Dict[str, Any]]:
    """
    Retrieve all saved sessions ordered newest first.

    Parameters
    ----------
    limit : int
        Maximum number of sessions to return.

    Returns
    -------
    list[dict]
    """
    conn = _get_conn()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM practice_sessions ORDER BY created_at DESC LIMIT ?",
        (limit,),
    )
    rows = cursor.fetchall()
    conn.close()

    sessions = []
    for row in rows:
        session = dict(row)
        session["strengths"] = _from_json(session.get("strengths", "[]"))
        session["weak_points"] = _from_json(session.get("weak_points", "[]"))
        sessions.append(session)
    return sessions


def get_latest_session() -> Optional[Dict[str, Any]]:
    """Return the most recently saved session, or None if the table is empty."""
    sessions = get_all_sessions(limit=1)
    return sessions[0] if sessions else None


def get_dashboard_stats() -> Dict[str, Any]:
    """
    Compute aggregate statistics for the dashboard.

    Returns
    -------
    dict
        total_sessions, avg_overall_score, best_score, latest_score,
        avg_speech_score, avg_camera_score.
    """
    conn = _get_conn()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM practice_sessions")
    total = cursor.fetchone()[0]

    if total == 0:
        conn.close()
        return {
            "total_sessions": 0,
            "avg_overall_score": 0.0,
            "best_score": 0.0,
            "latest_score": 0.0,
            "avg_speech_score": 0.0,
            "avg_camera_score": 0.0,
        }

    cursor.execute(
        "SELECT AVG(overall_score), MAX(overall_score), AVG(speech_score), AVG(camera_score) "
        "FROM practice_sessions"
    )
    avg_overall, best, avg_speech, avg_camera = cursor.fetchone()

    cursor.execute(
        "SELECT overall_score FROM practice_sessions ORDER BY created_at DESC LIMIT 1"
    )
    latest = cursor.fetchone()[0]

    conn.close()

    return {
        "total_sessions": total,
        "avg_overall_score": round(avg_overall or 0, 1),
        "best_score": round(best or 0, 1),
        "latest_score": round(latest or 0, 1),
        "avg_speech_score": round(avg_speech or 0, 1),
        "avg_camera_score": round(avg_camera or 0, 1),
    }


def delete_session(session_id: int) -> bool:
    """
    Delete a session by ID.

    Parameters
    ----------
    session_id : int

    Returns
    -------
    bool
        True if a row was deleted.
    """
    conn = _get_conn()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM practice_sessions WHERE id = ?", (session_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted
