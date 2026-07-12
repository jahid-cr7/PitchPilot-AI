"""api/services.py
=================
Thin service wrappers around core PitchPilot AI analyzers.
Keeps API route handlers clean and testable.
"""

from typing import Any, Dict, List, Optional

from core.ai_coach_agent import analyze_answer_with_ai
from core.scoring_engine import calculate_overall_score
from core.question_bank import (
    get_default_role_for_mode,
    get_practice_modes,
    get_questions_for_mode,
    get_random_question,
)


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
