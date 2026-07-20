"""api/services.py
=================
Thin service wrappers around core PitchPilot AI analyzers.
Keeps API route handlers clean and testable.
"""

import json
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
    create_user_goal as _db_create_user_goal,
    delete_session as _db_delete_session,
    delete_user_goal as _db_delete_user_goal,
    get_all_sessions as _db_get_all_sessions,
    get_user_goal_by_id as _db_get_user_goal_by_id,
    get_user_goals as _db_get_user_goals,
    save_practice_session as _db_save_practice_session,
    update_user_goal as _db_update_user_goal,
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


# ---------------------------------------------------------------------------
# Coaching Plan Generator
# ---------------------------------------------------------------------------
def _coaching_focus_from_weakness(weakness: str) -> str:
    w = weakness.lower()
    if "filler" in w or "um" in w or "uh" in w:
        return "Reduce filler words"
    if "pace" in w or "speed" in w or "wpm" in w or "fast" in w:
        return "Improve speaking pace"
    if "eye contact" in w or "gaze" in w:
        return "Improve eye contact"
    if "framing" in w or "position" in w:
        return "Improve camera framing"
    if "structure" in w or "star" in w or "content" in w or "clarity" in w:
        return "Strengthen answer structure"
    if "movement" in w or "body language" in w or "gesture" in w:
        return "Control body language"
    if "confidence" in w or "nervous" in w:
        return "Build confidence"
    if "rambl" in w or "concise" in w or "brief" in w:
        return "Be more concise"
    if "repetition" in w or "repeated" in w:
        return "Reduce word repetition"
    if "pause" in w or "silence" in w:
        return "Use pauses effectively"
    return "General answer improvement"


def _determine_level(avg_score: float) -> str:
    if avg_score >= 85:
        return "Advanced"
    if avg_score >= 65:
        return "Intermediate"
    if avg_score >= 40:
        return "Developing"
    return "Beginner"


def _recommend_mode(weakness: str, top_strengths: list) -> str:
    w = weakness.lower()
    if "structure" in w or "content" in w or "star" in w:
        return "Behavioral Interview"
    if "filler" in w or "pace" in w or "speech" in w:
        return "Presentation Practice"
    if "confidence" in w or "rambl" in w:
        return "Sales Pitch Practice"
    if "eye contact" in w or "framing" in w or "movement" in w or "body" in w:
        return "Presentation Practice"
    if not top_strengths:
        return "Behavioral Interview"
    return "Behavioral Interview"


def _recommend_question(mode: str) -> str:
    from core.question_bank import get_random_question as _core_random
    try:
        return _core_random(mode)
    except Exception:
        return "Tell me about a time you solved a difficult problem."


def _build_weekly_goal(focus_area: str, level: str) -> str:
    if "filler" in focus_area.lower():
        if level == "Advanced":
            return "Complete 3 practice sessions with fewer than 3 filler words each."
        if level == "Intermediate":
            return "Complete 3 practice sessions with fewer than 8 filler words each."
        return "Complete 3 practice sessions and identify your top 3 filler words."
    if "pace" in focus_area.lower():
        return "Complete 3 sessions with speaking pace between 120-150 WPM."
    if "eye contact" in focus_area.lower():
        return "Complete 3 sessions maintaining 70%+ eye contact in each."
    if "framing" in focus_area.lower():
        return "Complete 2 sessions with correct framing and stable camera position."
    if "structure" in focus_area.lower():
        return "Complete 3 sessions using STAR structure for every answer."
    if "body language" in focus_area.lower():
        return "Complete 2 sessions with controlled, purposeful gestures."
    if "confidence" in focus_area.lower():
        return "Complete 3 sessions rated 7+ on confidence score."
    if "concise" in focus_area.lower():
        return "Complete 3 sessions with answers under 90 seconds each."
    if "repetition" in focus_area.lower():
        return "Complete 3 sessions with fewer than 3 repeated words each."
    if "pause" in focus_area.lower():
        return "Complete 2 sessions with intentional pauses after each key point."
    return "Complete 3 practice sessions this week to build consistency."


def _build_metrics_to_watch(focus_area: str) -> list:
    base = ["answer_score"]
    f = focus_area.lower()
    if "filler" in f:
        base.insert(0, "filler_word_count")
    if "pace" in f:
        base.append("words_per_minute")
    if "eye contact" in f or "framing" in f:
        base.append("camera_score")
    if "body language" in f or "movement" in f:
        base.append("video_score")
    if "structure" in f or "content" in f:
        base.append("answer_score")
    if "confidence" in f:
        base.append("camera_score")
    if "concise" in f:
        base.append("word_count")
    if "repetition" in f:
        base.append("repeated_word_count")
    if "pause" in f:
        base.append("words_per_minute")
    base.append("overall_score")
    seen = []
    for m in base:
        if m not in seen:
            seen.append(m)
    return seen


def _build_action_steps(focus_area: str, level: str) -> list:
    steps = []
    f = focus_area.lower()
    if "filler" in f:
        steps.append("Pause for 1 second before answering.")
        steps.append("Record yourself and count filler words after each session.")
        if level == "Beginner" or level == "Developing":
            steps.append("Practice speaking slowly with a timer — 60 seconds per answer.")
        else:
            steps.append("Substitute filler words with silence or a connecting phrase.")
    if "pace" in f:
        steps.append("Use a metronome app to target 130-150 WPM.")
        steps.append("Record and review your pace after each session.")
    if "eye contact" in f:
        steps.append("Place your camera at eye level.")
        steps.append("Look at the camera lens, not the screen.")
    if "framing" in f:
        steps.append("Position your face in the top third of the frame.")
        steps.append("Ensure good lighting on your face, not behind you.")
    if "structure" in f:
        steps.append("Use STAR structure for every answer.")
        steps.append("Write 3 bullet points before recording.")
    if "body language" in f:
        steps.append("Keep hands visible and use open gestures.")
        steps.append("Minimize swaying or rocking while speaking.")
    if "confidence" in f:
        steps.append("Practice power posing for 2 minutes before recording.")
        steps.append("Start each answer with a confident opening sentence.")
    if "concise" in f:
        steps.append("Set a 90-second time limit per answer.")
        steps.append("Practice summarizing your main point in one sentence.")
    if "repetition" in f:
        steps.append("Pause and think before using transition words.")
        steps.append("Vary your vocabulary — avoid repeating the same phrase.")
    if "pause" in f:
        steps.append("Insert a 1-second pause after every key point.")
        steps.append("Use silence for emphasis, not filler words.")
    if not steps:
        steps.append("Review your last 3 sessions and identify patterns.")
        steps.append("Practice one targeted skill per session.")
    return steps


def _build_next_milestone(focus_area: str, level: str, avg_score: float) -> str:
    if level == "Advanced":
        return f"Maintain {max(85, int(avg_score))}+ overall score across 5 sessions."
    if level == "Intermediate":
        return f"Reach 80+ overall score in 3 sessions."
    if level == "Developing":
        return f"Improve overall score by 10 points in the next 3 sessions."
    return "Complete your first 3 sessions to establish a baseline score."


def _try_ai_coaching_note(analytics: dict) -> str | None:
    """Attempt to generate an AI coaching note if provider is configured."""
    try:
        from api.config import AI_API_KEY, AI_BASE_URL, AI_MODEL
        if not AI_API_KEY:
            return None
        from core.ai_coach_agent import analyze_answer_with_ai
        avg = analytics.get("average_score", 0)
        weaknesses = analytics.get("common_weaknesses", [])
        strengths = analytics.get("top_strengths", [])
        w_text = ", ".join(weaknesses[:3]) if weaknesses else "none identified"
        s_text = ", ".join(strengths[:3]) if strengths else "none identified"
        prompt = (
            f"User analytics: average_score={avg}, weaknesses=[{w_text}], strengths=[{s_text}]. "
            "Give a brief, personalized coaching tip (2-3 sentences) to help them improve."
        )
        result = analyze_answer_with_ai(
            transcript=prompt,
            question="Provide a coaching tip based on the user's analytics.",
            role="Coach",
            api_key=AI_API_KEY,
            base_url=AI_BASE_URL,
            model=AI_MODEL,
        )
        return result.get("summary") or result.get("improved_answer") or None
    except Exception:
        return None


def generate_coaching_plan(user_id: int) -> Dict[str, Any]:
    """Generate a rule-based personalized coaching plan from user analytics."""
    analytics = get_user_analytics(user_id)
    total = analytics.get("total_sessions", 0)
    avg_score = analytics.get("average_score", 0.0)
    weaknesses = analytics.get("common_weaknesses", [])
    strengths = analytics.get("top_strengths", [])
    skill_avgs = analytics.get("skill_averages", {})

    if total == 0:
        return {
            "focus_area": "Start your first practice session",
            "current_level": "Beginner",
            "weekly_goal": "Complete your first practice session to establish a baseline.",
            "recommended_practice_mode": "Behavioral Interview",
            "recommended_question": "Tell me about yourself.",
            "action_steps": [
                "Choose a practice mode and record a 2-minute answer.",
                "Review your feedback and identify one thing to improve.",
                "Practice again focusing on that one improvement.",
            ],
            "metrics_to_watch": ["overall_score"],
            "next_milestone": "Complete 3 sessions to unlock personalized coaching.",
            "ai_note": None,
        }

    # Find the weakest skill area
    skill_scores = {
        "video": skill_avgs.get("video", 0),
        "camera": skill_avgs.get("camera", 0),
        "speech": skill_avgs.get("speech", 0),
        "answer": skill_avgs.get("answer", 0),
    }
    weakest_skill = min(skill_scores, key=skill_scores.get)
    lowest_score = skill_scores[weakest_skill]

    level = _determine_level(avg_score)

    # Determine focus area from weaknesses and weakest skill
    if weaknesses:
        focus_area = _coaching_focus_from_weakness(weaknesses[0])
    elif weakest_skill == "speech" and lowest_score < 70:
        focus_area = "Reduce filler words"
    elif weakest_skill == "camera" and lowest_score < 70:
        focus_area = "Improve eye contact"
    elif weakest_skill == "video" and lowest_score < 70:
        focus_area = "Control body language"
    elif weakest_skill == "answer" and lowest_score < 70:
        focus_area = "Strengthen answer structure"
    else:
        focus_area = "Polish overall delivery"

    mode = _recommend_mode(focus_area if weaknesses else "", strengths)
    question = _recommend_question(mode)
    weekly_goal = _build_weekly_goal(focus_area, level)
    metrics = _build_metrics_to_watch(focus_area)
    steps = _build_action_steps(focus_area, level)
    milestone = _build_next_milestone(focus_area, level, avg_score)
    ai_note = _try_ai_coaching_note(analytics)

    return {
        "focus_area": focus_area,
        "current_level": level,
        "weekly_goal": weekly_goal,
        "recommended_practice_mode": mode,
        "recommended_question": question,
        "action_steps": steps,
        "metrics_to_watch": metrics,
        "next_milestone": milestone,
        "ai_note": ai_note,
    }


# ---------------------------------------------------------------------------
# Robot Coach Lesson Generator
# ---------------------------------------------------------------------------
_ROBOT_LESSON_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "answer_structure": {
        "title": "How to Structure Your Answer Better",
        "problem_summary": "Your answer lacked a clear structure and did not guide the listener through your points.",
        "why_it_matters": "Interviewers form opinions in the first 30 seconds. A clear structure helps them follow your story and remember your key points.",
        "correct_method": "Use the STAR method: Situation, Task, Action, Result. State the context briefly, explain what you had to do, describe the specific actions you took, and finish with a measurable outcome.",
        "better_example": "In my last project, our team faced a 40% drop in user engagement (Situation). I was tasked with identifying the root cause and proposing a fix within two weeks (Task). I ran user interviews, analyzed funnel data, and pitched a redesign to leadership (Action). Engagement recovered by 35% within one month (Result).",
        "practice_steps": [
            "Pick one past experience and write it in STAR format.",
            "Time yourself: each section should be 20-30 seconds.",
            "Record yourself delivering the story, then review the structure.",
            "Remove any detail that does not support the Result.",
        ],
    },
    "speech": {
        "title": "Speak With Clarity and Control",
        "problem_summary": "Your speech contained filler words, uneven pace, or repetition that distracted from your message.",
        "why_it_matters": "Clear speech builds credibility. When listeners focus on your 'ums' instead of your ideas, your expertise is hidden.",
        "correct_method": "Pause instead of filler. Aim for 120-150 words per minute. Emphasize key words and use short pauses between points to let ideas land.",
        "better_example": "I led the migration… <pause> …reducing load time by 60 percent. The key challenge was data consistency… <pause> …which we solved with a dual-write strategy.",
        "practice_steps": [
            "Record a 60-second answer and count your filler words.",
            "Practice the same answer three times, replacing every filler with a 1-second pause.",
            "Use a metronome app to target 130 WPM.",
            "Review your recording and note one sentence that sounded unclear. Rewrite and re-record it.",
        ],
    },
    "body_language": {
        "title": "Control Your Body Language on Camera",
        "problem_summary": "Your video showed excessive movement, poor framing, or low face visibility that reduced your on-camera presence.",
        "why_it_matters": "Body language conveys confidence before you speak. Unstable framing and hidden faces make you look unprepared.",
        "correct_method": "Center your face in the top third of the frame. Keep your camera at eye level. Use open hand gestures below shoulder height and plant your feet to reduce sway.",
        "better_example": "A strong on-camera delivery starts with a stable base. Place your hands on the table, then lift them only to emphasize key points. Look directly into the camera lens as if it were the interviewer's eyes.",
        "practice_steps": [
            "Set your camera at eye level and check framing before every session.",
            "Record a 30-second introduction without moving your feet.",
            "Practice one purposeful hand gesture per key point.",
            "Review the recording and note every time you look away from the lens.",
        ],
    },
    "confidence": {
        "title": "Build Confidence in Your Delivery",
        "problem_summary": "Your delivery appeared hesitant, with soft volume, uncertain phrasing, or downward gaze that signals low confidence.",
        "why_it_matters": "Confidence is contagious. When you sound sure of yourself, the interviewer feels sure of you too.",
        "correct_method": "Start every answer with a strong opening sentence. Maintain eye contact with the camera. Speak slightly louder than feels natural and finish statements with a downward vocal inflection.",
        "better_example": "I am confident I can lead this initiative because I have done it twice before. In my previous role I grew the team from three to eight engineers and shipped the feature two weeks early.",
        "practice_steps": [
            "Write three powerful opening sentences for common questions.",
            "Practice them in front of a mirror while looking at your own eyes.",
            "Record yourself and check that the last word of each sentence sounds decisive.",
            "Do a 2-minute power pose before your next practice session.",
        ],
    },
    "overall": {
        "title": "Elevate Your Overall Interview Performance",
        "problem_summary": "Your overall performance was inconsistent across dimensions. Small improvements in structure, speech, and presence will add up quickly.",
        "why_it_matters": "Interviewers score holistically. A balanced performance across all dimensions is more memorable than one standout area and several weak ones.",
        "correct_method": "Focus on one dimension per practice session. Start with the lowest-scoring area, apply the specific technique, then integrate it into a full mock interview.",
        "better_example": "A polished interview answer combines STAR structure, 130 WPM pace, steady eye contact, and a confident close. Each element reinforces the others.",
        "practice_steps": [
            "Identify your lowest-scoring dimension from the feedback page.",
            "Run a 5-minute focused practice on that dimension alone.",
            "Run a full mock interview and compare the new score to your baseline.",
            "Repeat weekly until all dimensions score 70 or above.",
        ],
    },
}


def _robot_lesson_subtitles(script: str) -> List[Dict[str, Any]]:
    """Split spoken script into rough subtitle chunks (~4 seconds each)."""
    sentences = [s.strip() for s in script.split(".") if s.strip()]
    subtitles = []
    t = 0
    for sentence in sentences:
        subtitles.append({"time": t, "text": sentence + "."})
        t += 4
    return subtitles


def _try_ai_robot_lesson(session: dict, focus_area: str, lesson_type: str) -> Optional[Dict[str, Any]]:
    """Attempt AI-powered robot lesson generation. Returns None on failure."""
    try:
        from api.config import AI_API_KEY, AI_BASE_URL, AI_MODEL
        if not AI_API_KEY:
            return None
        from core.ai_coach_agent import OpenAI, OPENAI_AVAILABLE, _extract_message_text
        if not OPENAI_AVAILABLE:
            return None

        client_kwargs: Dict[str, Any] = {"api_key": AI_API_KEY, "timeout": 30}
        if AI_BASE_URL:
            client_kwargs["base_url"] = AI_BASE_URL
        client = OpenAI(**client_kwargs)

        transcript = session.get("transcript", "")
        weaknesses = session.get("weak_points", [])
        strengths = session.get("strengths", [])
        overall = session.get("overall_score", 0)

        system = (
            "You are Coach Nova, an expert interview and presentation coach. "
            "Generate a robot coach lesson in strict JSON format. No markdown, no extra text.\n\n"
            "Required JSON format:\n"
            '{\n'
            '  "title": <string>,\n'
            '  "problem_summary": <string 1-2 sentences>,\n'
            '  "why_it_matters": <string 1-2 sentences>,\n'
            '  "correct_method": <string 2-3 sentences>,\n'
            '  "better_example": <string 2-4 sentences>,\n'
            '  "practice_steps": [<string>, <string>, <string>, <string>],\n'
            '  "spoken_script": <string 4-8 sentences spoken as Coach Nova>\n'
            '}\n'
        )
        user = (
            f"Lesson type: {lesson_type}\n"
            f"Focus area: {focus_area}\n"
            f"Overall score: {overall}/100\n"
            f"Weaknesses: {weaknesses}\n"
            f"Strengths: {strengths}\n"
            f"Transcript excerpt: {transcript[:500]}\n\n"
            "Generate the JSON lesson now."
        )

        response = client.chat.completions.create(
            model=AI_MODEL or "gpt-4o-mini",
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.5,
            max_tokens=900,
        )
        raw = _extract_message_text(response)
        if not raw:
            return None

        # Strip markdown fences
        text = raw.strip()
        if text.startswith("```"):
            lines = text.splitlines()
            if len(lines) > 2:
                text = "\n".join(lines[1:-1]).strip()
            else:
                text = text.replace("```", "").strip()

        parsed = json.loads(text)
        if not isinstance(parsed, dict):
            return None

        return {
            "title": str(parsed.get("title", "Robot Coach Lesson")),
            "problem_summary": str(parsed.get("problem_summary", "")),
            "why_it_matters": str(parsed.get("why_it_matters", "")),
            "correct_method": str(parsed.get("correct_method", "")),
            "better_example": str(parsed.get("better_example", "")),
            "practice_steps": list(parsed.get("practice_steps", [])),
            "spoken_script": str(parsed.get("spoken_script", "")),
        }
    except Exception:
        return None


def generate_robot_lesson(
    session_id: int,
    user_id: int,
    lesson_type: str,
    focus_area: str,
) -> Dict[str, Any]:
    """Generate a robot coach lesson from a user's saved session."""
    session = get_session_by_id(session_id, user_id=user_id)
    if session is None:
        raise ValueError("Session not found.")

    # Try AI first
    ai_result = _try_ai_robot_lesson(session, focus_area, lesson_type)

    if ai_result:
        template = ai_result
    else:
        template = dict(_ROBOT_LESSON_TEMPLATES.get(focus_area, _ROBOT_LESSON_TEMPLATES["overall"]))
        # Personalize fallback with session weaknesses
        weaknesses = session.get("weak_points", [])
        if weaknesses:
            template["problem_summary"] = (
                f"Your session feedback highlighted: {weaknesses[0]}. "
                + template["problem_summary"]
            )

    spoken_script = template.get("spoken_script", "")
    if not spoken_script:
        spoken_script = (
            f"Hi, I'm Coach Nova. Let's work on your {focus_area.replace('_', ' ')}. "
            f"{template['problem_summary']} "
            f"{template['why_it_matters']} "
            f"Here's the right way: {template['correct_method']} "
            f"For example: {template['better_example']} "
            "Now, here are your practice steps."
        )

    subtitles = _robot_lesson_subtitles(spoken_script)
    estimated = len(subtitles) * 4

    lesson_data = {
        "title": template["title"],
        "coach_name": "Coach Nova",
        "lesson_type": lesson_type,
        "focus_area": focus_area,
        "problem_summary": template["problem_summary"],
        "why_it_matters": template["why_it_matters"],
        "correct_method": template["correct_method"],
        "better_example": template["better_example"],
        "practice_steps": template["practice_steps"],
        "spoken_script": spoken_script,
        "subtitles": subtitles,
        "estimated_duration_seconds": estimated,
    }

    # Save to database
    from core.database import save_robot_lesson as _db_save_robot_lesson
    lesson_id = _db_save_robot_lesson(
        user_id=user_id,
        session_id=session_id,
        title=lesson_data["title"],
        coach_name=lesson_data["coach_name"],
        lesson_type=lesson_data["lesson_type"],
        focus_area=lesson_data["focus_area"],
        problem_summary=lesson_data["problem_summary"],
        why_it_matters=lesson_data["why_it_matters"],
        correct_method=lesson_data["correct_method"],
        better_example=lesson_data["better_example"],
        practice_steps=lesson_data["practice_steps"],
        spoken_script=lesson_data["spoken_script"],
        subtitles=lesson_data["subtitles"],
        estimated_duration_seconds=lesson_data["estimated_duration_seconds"],
    )

    return {
        "status": "success",
        "lesson_id": lesson_id,
        "lesson": lesson_data,
    }


# ---------------------------------------------------------------------------
# Robot Lesson CRUD (thin wrappers)
# ---------------------------------------------------------------------------
def get_robot_lessons_service(user_id: int) -> List[Dict[str, Any]]:
    from core.database import get_robot_lessons as _db_get_robot_lessons
    return _db_get_robot_lessons(user_id)


def get_robot_lesson_service(lesson_id: int, user_id: int) -> Optional[Dict[str, Any]]:
    from core.database import get_robot_lesson_by_id as _db_get_robot_lesson_by_id
    return _db_get_robot_lesson_by_id(lesson_id, user_id)


def delete_robot_lesson_service(lesson_id: int, user_id: int) -> bool:
    from core.database import delete_robot_lesson as _db_delete_robot_lesson
    return _db_delete_robot_lesson(lesson_id, user_id)


# ---------------------------------------------------------------------------
# Goal CRUD (thin wrappers)
# ---------------------------------------------------------------------------
def create_user_goal_service(
    user_id: int,
    title: str,
    target_metric: str,
    target_value: float,
    current_value: float = 0.0,
) -> Dict[str, Any]:
    return _db_create_user_goal(
        user_id=user_id,
        title=title,
        target_metric=target_metric,
        target_value=target_value,
        current_value=current_value,
    )


def get_user_goals_service(user_id: int) -> list:
    return _db_get_user_goals(user_id)


def get_user_goal_service(goal_id: int, user_id: int) -> Optional[Dict[str, Any]]:
    return _db_get_user_goal_by_id(goal_id, user_id)


def update_user_goal_service(
    goal_id: int,
    user_id: int,
    title: str | None = None,
    target_metric: str | None = None,
    target_value: float | None = None,
    current_value: float | None = None,
    status: str | None = None,
) -> Optional[Dict[str, Any]]:
    return _db_update_user_goal(
        goal_id=goal_id,
        user_id=user_id,
        title=title,
        target_metric=target_metric,
        target_value=target_value,
        current_value=current_value,
        status=status,
    )


def delete_user_goal_service(goal_id: int, user_id: int) -> bool:
    return _db_delete_user_goal(goal_id, user_id)
