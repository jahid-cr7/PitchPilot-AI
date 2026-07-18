"""
core/database.py
================
SQLite database layer for PitchPilot AI session history.

Stores completed practice sessions so users can track improvement over time.
Cross-platform: uses pathlib for database path resolution.
"""

import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
_db_env = os.getenv("PITCHPILOT_DB_PATH", "")
if _db_env:
    DB_PATH = Path(_db_env)
    DB_DIR = DB_PATH.parent
else:
    DB_DIR = Path(__file__).resolve().parent.parent / "data"
    DB_PATH = DB_DIR / "pitchpilot.db"

DB_DIR.mkdir(parents=True, exist_ok=True)


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
    ai_model_used TEXT,
    user_id INTEGER
);
"""

CREATE_USERS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
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
def _ensure_user_id_column(conn: sqlite3.Connection) -> None:
    """
    Migration-safe: add user_id column to practice_sessions if it does not exist.
    Existing rows will have user_id = NULL, preserving history from before auth.
    """
    cursor = conn.execute("PRAGMA table_info(practice_sessions)")
    columns = {row[1] for row in cursor.fetchall()}
    if "user_id" not in columns:
        conn.execute("ALTER TABLE practice_sessions ADD COLUMN user_id INTEGER")


def init_db() -> None:
    """Initialize the database and create tables if they do not exist."""
    try:
        conn = _get_conn()
        conn.execute(CREATE_TABLE_SQL)
        conn.execute(CREATE_USERS_TABLE_SQL)
        _ensure_user_id_column(conn)
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
    user_id: Optional[int] = None,
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
        "user_id": user_id,
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


def get_all_sessions(limit: int = 50, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    Retrieve saved sessions ordered newest first.

    Parameters
    ----------
    limit : int
        Maximum number of sessions to return.
    user_id : int or None
        If provided, only return sessions owned by this user. If None, return
        every session (used by legacy Streamlit paths and admin tooling).

    Returns
    -------
    list[dict]
    """
    conn = _get_conn()
    cursor = conn.cursor()
    if user_id is None:
        cursor.execute(
            "SELECT * FROM practice_sessions ORDER BY created_at DESC LIMIT ?",
            (limit,),
        )
    else:
        cursor.execute(
            "SELECT * FROM practice_sessions WHERE user_id = ? "
            "ORDER BY created_at DESC LIMIT ?",
            (user_id, limit),
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


def delete_session(session_id: int, user_id: Optional[int] = None) -> bool:
    """
    Delete a session by ID. If user_id is provided, only delete sessions owned
    by that user (used by the authenticated API). If None, delete unconditionally
    (used by legacy Streamlit code paths).

    Parameters
    ----------
    session_id : int
    user_id : int or None

    Returns
    -------
    bool
        True if a row was deleted.
    """
    conn = _get_conn()
    cursor = conn.cursor()
    if user_id is None:
        cursor.execute("DELETE FROM practice_sessions WHERE id = ?", (session_id,))
    else:
        cursor.execute(
            "DELETE FROM practice_sessions WHERE id = ? AND user_id = ?",
            (session_id, user_id),
        )
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------
def create_user(name: str, email: str, password_hash: str) -> Dict[str, Any]:
    """
    Insert a new user. Raises ValueError if the email is already taken.

    Returns the created user row (without password_hash).
    """
    email_norm = email.strip().lower()
    name_clean = name.strip()
    created_at = datetime.now(timezone.utc).isoformat()

    conn = _get_conn()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (name, email, password_hash, created_at) "
            "VALUES (?, ?, ?, ?)",
            (name_clean, email_norm, password_hash, created_at),
        )
        user_id = cursor.lastrowid
        conn.commit()
    except sqlite3.IntegrityError as exc:
        raise ValueError("Email already registered") from exc
    finally:
        conn.close()

    return {
        "id": user_id,
        "name": name_clean,
        "email": email_norm,
        "created_at": created_at,
    }


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Return a full user row (including password_hash) by email, or None."""
    conn = _get_conn()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, name, email, password_hash, created_at FROM users "
        "WHERE email = ?",
        (email.strip().lower(),),
    )
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    """Return a user row (without password_hash) by id, or None."""
    conn = _get_conn()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, name, email, created_at FROM users WHERE id = ?",
        (user_id,),
    )
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None
