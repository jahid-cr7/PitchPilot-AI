"""
scripts/smoke_test.py
=====================
Lightweight smoke test for PitchPilot AI.

Run before GitHub push, demo video, or company interview:
    python scripts/smoke_test.py

Exit codes:
    0 — all checks passed
    1 — one or more checks failed
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Ensure project root is on Python path so `core` and `reports` are importable
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

REQUIRED_DIRS = [
    "core",
    "pages",
    "reports",
    "docs",
    "data",
]

REQUIRED_FILES = [
    "app.py",
    "requirements.txt",
    "README.md",
    "core/video_analyzer.py",
    "core/camera_analyzer.py",
    "core/speech_analyzer.py",
    "core/ai_coach_agent.py",
    "core/scoring_engine.py",
    "core/database.py",
    "core/ui_utils.py",
    "core/question_bank.py",
    "pages/1_Practice.py",
    "pages/2_Feedback.py",
    "pages/3_Dashboard.py",
    "pages/4_History.py",
    "pages/5_Settings.py",
    "reports/report_generator.py",
]

failed = 0
passed = 0


def _ok(label: str) -> None:
    global passed
    passed += 1
    print(f"  ✅ {label}")


def _fail(label: str, detail: str = "") -> None:
    global failed
    failed += 1
    msg = f"  ❌ {label}"
    if detail:
        msg += f" — {detail}"
    print(msg)


def check(label: str, condition: bool, detail: str = "") -> None:
    if condition:
        _ok(label)
    else:
        _fail(label, detail)


# ---------------------------------------------------------------------------
# 1. Project structure
# ---------------------------------------------------------------------------
print("\n📁 Project Structure")
for d in REQUIRED_DIRS:
    path = PROJECT_ROOT / d
    check(f"Directory exists: {d}/", path.exists() and path.is_dir(), str(path))

for f in REQUIRED_FILES:
    path = PROJECT_ROOT / f
    check(f"File exists: {f}", path.exists() and path.is_file(), str(path))

# ---------------------------------------------------------------------------
# 2. Imports
# ---------------------------------------------------------------------------
print("\n📦 Core Imports")

try:
    from core import video_analyzer

    _ok("import core.video_analyzer")
except Exception as exc:
    _fail("import core.video_analyzer", str(exc))

try:
    from core import camera_analyzer

    _ok("import core.camera_analyzer")
except Exception as exc:
    _fail("import core.camera_analyzer", str(exc))

try:
    from core import speech_analyzer

    _ok("import core.speech_analyzer")
except Exception as exc:
    _fail("import core.speech_analyzer", str(exc))

try:
    from core import ai_coach_agent

    _ok("import core.ai_coach_agent")
except Exception as exc:
    _fail("import core.ai_coach_agent", str(exc))

try:
    from core import scoring_engine

    _ok("import core.scoring_engine")
except Exception as exc:
    _fail("import core.scoring_engine", str(exc))

try:
    from core import database

    _ok("import core.database")
except Exception as exc:
    _fail("import core.database", str(exc))

try:
    from core import ui_utils

    _ok("import core.ui_utils")
except Exception as exc:
    _fail("import core.ui_utils", str(exc))

try:
    from core import question_bank

    _ok("import core.question_bank")
except Exception as exc:
    _fail("import core.question_bank", str(exc))

try:
    from reports import report_generator

    _ok("import reports.report_generator")
except Exception as exc:
    _fail("import reports.report_generator", str(exc))

# ---------------------------------------------------------------------------
# 3. Database
# ---------------------------------------------------------------------------
print("\n🗄️  Database")
try:
    database.init_db()
    db_path = PROJECT_ROOT / "data" / "pitchpilot.db"
    check("SQLite database created", db_path.exists(), str(db_path))
except Exception as exc:
    _fail("SQLite database creation", str(exc))

# ---------------------------------------------------------------------------
# 4. AI Coach Fallback
# ---------------------------------------------------------------------------
print("\n🤖 AI Coach Fallback")
try:
    result = ai_coach_agent.analyze_answer_with_ai(
        transcript="Hello, I am a software developer with five years of experience.",
        question="Tell me about yourself.",
        role="Software Developer",
    )
    check(
        "analyze_answer_with_ai() returns status fallback or success",
        result.get("status") in ("success", "fallback"),
        f"got status={result.get('status')}",
    )
    check(
        "answer_score exists and is numeric",
        isinstance(result.get("answer_score"), (int, float)),
        f"got {type(result.get('answer_score'))}",
    )
except Exception as exc:
    _fail("AI Coach fallback test", str(exc))

# ---------------------------------------------------------------------------
# 5. AI Connection (no key)
# ---------------------------------------------------------------------------
print("\n🔌 AI Connection (no API key)")
try:
    conn_result = ai_coach_agent.test_ai_connection()
    check(
        "test_ai_connection() returns without crashing",
        isinstance(conn_result, dict) and "status" in conn_result,
        str(conn_result),
    )
    check(
        "status is fallback or error when no key",
        conn_result.get("status") in ("fallback", "error"),
        f"got status={conn_result.get('status')}",
    )
except Exception as exc:
    _fail("AI connection test", str(exc))

# ---------------------------------------------------------------------------
# 6. Scoring Engine
# ---------------------------------------------------------------------------
print("\n🏆 Scoring Engine")
try:
    sample_video = {
        "status": "success",
        "duration_seconds": 60.0,
        "fps": 30.0,
        "resolution": "1920x1080",
        "movement_score": 35.0,
    }
    sample_camera = {
        "status": "success",
        "face_visible_percent": 95.0,
        "framing": "centered",
        "distance_feedback": "good_distance",
        "movement_level": "low",
        "camera_score": 82,
    }
    sample_speech = {
        "status": "success",
        "word_count": 95,
        "words_per_minute": 142.0,
        "filler_word_count": 2,
        "repeated_word_count": 1,
        "speech_score": 78,
    }
    sample_ai = {
        "status": "fallback",
        "answer_score": 80,
    }

    score_result = scoring_engine.calculate_overall_score(
        sample_video, sample_camera, sample_speech, sample_ai
    )
    check(
        "calculate_overall_score() returns status success",
        score_result.get("status") == "success",
        f"got status={score_result.get('status')}",
    )
    check(
        "overall_score exists and is numeric",
        isinstance(score_result.get("overall_score"), (int, float)),
        f"got {type(score_result.get('overall_score'))}",
    )
except Exception as exc:
    _fail("Scoring engine test", str(exc))

# ---------------------------------------------------------------------------
# 7. Report Generator
# ---------------------------------------------------------------------------
print("\n📥 Report Generator")
try:
    sample_session = {
        "id": 1,
        "created_at": "2026-07-06T10:00:00+00:00",
        "interview_question": "Tell me about yourself.",
        "target_role": "Software Developer",
        "overall_score": 79.5,
        "performance_level": "Good",
        "movement_score": 35.0,
        "camera_score": 82,
        "speech_score": 78,
        "answer_score": 80,
        "word_count": 95,
        "words_per_minute": 142.0,
        "filler_word_count": 2,
        "repeated_word_count": 1,
        "duration_seconds": 60.0,
        "resolution": "1920x1080",
        "face_visible_percent": 95.0,
        "framing": "centered",
        "distance_feedback": "good_distance",
        "ai_model_used": "fallback_rules",
        "strengths": ["Good structure."],
        "weak_points": ["Could be more specific."],
        "next_practice_task": "Practice pacing.",
        "summary": "Overall Performance: Good (79/100).",
        "transcript": "Hello, I am a software developer.",
    }

    html_report = report_generator.generate_html_report(sample_session)
    check(
        "HTML report is non-empty string",
        isinstance(html_report, str) and len(html_report) > 0,
        f"length={len(html_report) if isinstance(html_report, str) else 'N/A'}",
    )

    csv_report = report_generator.generate_csv_report(sample_session)
    check(
        "CSV report is non-empty string",
        isinstance(csv_report, str) and len(csv_report) > 0,
        f"length={len(csv_report) if isinstance(csv_report, str) else 'N/A'}",
    )
except Exception as exc:
    _fail("Report generator test", str(exc))

# ---------------------------------------------------------------------------
# 8. Question Bank
# ---------------------------------------------------------------------------
print("\n🎯 Question Bank")
try:
    modes = question_bank.get_practice_modes()
    check(
        "get_practice_modes() returns non-empty list",
        len(modes) >= 7,
        f"got {len(modes)} modes",
    )

    for mode in modes:
        questions = question_bank.get_questions_for_mode(mode)
        check(
            f"mode '{mode}' has at least 8 questions",
            len(questions) >= 8,
            f"got {len(questions)}",
        )

    random_q = question_bank.get_random_question(modes[0])
    check(
        "get_random_question() returns a non-empty string",
        isinstance(random_q, str) and len(random_q) > 0,
        f"got {random_q!r}",
    )

    role = question_bank.get_default_role_for_mode(modes[0])
    check(
        "get_default_role_for_mode() returns a non-empty string",
        isinstance(role, str) and len(role) > 0,
        f"got {role!r}",
    )
except Exception as exc:
    _fail("Question bank test", str(exc))

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
print("\n" + "=" * 50)
total = passed + failed
if failed == 0:
    print(f"✅ PitchPilot AI smoke test passed. ({passed}/{total} checks)")
    sys.exit(0)
else:
    print(f"❌ PitchPilot AI smoke test failed. ({failed}/{total} checks failed)")
    sys.exit(1)
