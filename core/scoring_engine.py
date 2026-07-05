"""
core/scoring_engine.py
======================
Interview performance scoring engine.

Combines video, camera, speech, and AI answer scores into a
single overall performance score with actionable feedback.
"""

from typing import Dict, List, Union


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
WEIGHT_VIDEO = 0.20
WEIGHT_CAMERA = 0.30
WEIGHT_SPEECH = 0.30
WEIGHT_ANSWER = 0.20

# Movement thresholds for video score
MOVEMENT_IDEAL_MAX = 50   # movement_score <= 50 is ideal
MOVEMENT_TOO_HIGH = 80    # movement_score >= 80 is too much


def _calculate_video_score(movement_score: float) -> int:
    """
    Convert raw movement score (0-100) into a video score (0-100).
    Lower/natural movement is better for interviews.
    """
    # Invert: less movement = higher score
    if movement_score <= MOVEMENT_IDEAL_MAX:
        # Natural range — slight bonus for very calm but not static
        return int(100 - (movement_score * 0.6))
    elif movement_score <= MOVEMENT_TOO_HIGH:
        # Getting excessive — linear drop
        return int(70 - ((movement_score - MOVEMENT_IDEAL_MAX) * 1.5))
    else:
        # Far too much movement
        return max(0, int(25 - ((movement_score - MOVEMENT_TOO_HIGH) * 1.0)))


def _performance_level(overall_score: float) -> str:
    """Classify overall score into a performance level."""
    if overall_score >= 90:
        return "Excellent"
    elif overall_score >= 75:
        return "Good"
    elif overall_score >= 60:
        return "Needs Practice"
    else:
        return "Weak"


def _derive_strengths(
    video_score: int, camera_score: int, speech_score: int, answer_score: int
) -> List[str]:
    """Identify strengths from component scores."""
    strengths = []
    if video_score >= 75:
        strengths.append("Good video presence and natural body movement.")
    if camera_score >= 75:
        strengths.append("Strong camera presence — clear framing and good positioning.")
    if speech_score >= 75:
        strengths.append("Clear and confident speech delivery.")
    elif speech_score >= 60:
        strengths.append("Speech is understandable with room for polish.")
    if answer_score >= 75:
        strengths.append("Good answer structure and relevance.")
    if not strengths:
        strengths.append("You completed the practice session — a great first step.")
    return strengths


def _derive_weak_points(
    video_score: int, camera_score: int, speech_score: int, answer_score: int
) -> List[str]:
    """Identify weak points from component scores."""
    weak_points = []
    if video_score < 60:
        weak_points.append("Body movement is either too stiff or too excessive. Aim for natural, confident gestures.")
    if camera_score < 60:
        weak_points.append("Camera positioning needs improvement — work on framing and staying centered.")
    if speech_score < 60:
        weak_points.append("Speech delivery needs work — focus on pace, clarity, and reducing filler words.")
    elif speech_score < 75:
        weak_points.append("Speech is good but can be improved with fewer fillers and more vocal variety.")
    if answer_score < 60:
        weak_points.append("Answer structure could be stronger — use the STAR method or clear frameworks.")
    if not weak_points:
        weak_points.append("No major weak points detected. Keep refining your delivery.")
    return weak_points


def _next_practice_task(
    video_score: int, camera_score: int, speech_score: int
) -> str:
    """Suggest the next practice task based on weakest area."""
    scores = {
        "video": video_score,
        "camera": camera_score,
        "speech": speech_score,
    }
    weakest = min(scores, key=scores.get)

    if weakest == "video" and video_score < 60:
        return "Practice in front of a mirror to develop natural, confident gestures without excessive movement."
    elif weakest == "camera" and camera_score < 60:
        return "Record a short test clip to check your framing, lighting, and distance before your next session."
    elif weakest == "speech" and speech_score < 60:
        return "Do a filler-word drill: record yourself speaking for 60 seconds without using 'um', 'uh', or 'like'."
    elif weakest == "speech":
        return "Practice reading a paragraph aloud at 130-150 WPM to build consistent pacing."
    elif weakest == "camera":
        return "Focus on keeping your eyes on the camera lens and maintaining a steady posture."
    elif weakest == "video":
        return "Add a few hand gestures to emphasize key points while keeping the rest of your body calm."
    else:
        return "Do a full mock interview run and compare your scores to track progress."


def _build_summary(
    overall_score: float,
    performance_level: str,
    strengths: List[str],
    weak_points: List[str],
    next_task: str,
) -> str:
    """Build a human-readable summary paragraph."""
    return (
        f"Overall Performance: {performance_level} ({overall_score:.0f}/100). "
        f"Strengths: {len(strengths)} identified. "
        f"Areas to improve: {len(weak_points)}. "
        f"Next task: {next_task}"
    )


# ---------------------------------------------------------------------------
# Main function
# ---------------------------------------------------------------------------
def calculate_overall_score(
    video_result: dict,
    camera_result: dict,
    speech_result: dict,
    ai_result: dict = None,
) -> Dict[str, Union[str, float, int, list]]:
    """
    Calculate overall interview performance score from analysis results.

    Parameters
    ----------
    video_result : dict
        Result from core.video_analyzer.analyze_video().
    camera_result : dict
        Result from core.camera_analyzer.analyze_camera_presence().
    speech_result : dict
        Result from core.speech_analyzer.analyze_speech().
    ai_result : dict or None, optional
        Result from core.ai_coach_agent.analyze_answer_with_ai().
        If provided, uses ai_result["answer_score"]. Otherwise defaults to 75.

    Returns
    -------
    dict
        A dictionary with:
        - status (str): "success" or "error"
        - video_score (int): 0-100
        - camera_score (int): 0-100
        - speech_score (int): 0-100
        - answer_score (int): 0-100
        - overall_score (float): weighted average 0-100
        - performance_level (str): Excellent / Good / Needs Practice / Weak
        - strengths (list[str])
        - weak_points (list[str])
        - next_practice_task (str)
        - summary (str)
        - message (str)
    """
    try:
        # Validate inputs
        if not video_result or video_result.get("status") != "success":
            return _error_dict("Video analysis result is missing or failed.")
        if not camera_result or camera_result.get("status") != "success":
            return _error_dict("Camera analysis result is missing or failed.")
        if not speech_result or speech_result.get("status") != "success":
            return _error_dict("Speech analysis result is missing or failed.")

        # Extract component scores
        raw_movement = float(video_result.get("movement_score", 0))
        video_score = _calculate_video_score(raw_movement)

        camera_score = int(camera_result.get("camera_score", 0))
        speech_score = int(speech_result.get("speech_score", 0))

        # Use AI answer score if available, otherwise placeholder
        if ai_result and ai_result.get("status") in ("success", "fallback"):
            answer_score = int(ai_result.get("answer_score", 75))
        else:
            answer_score = 75  # placeholder

        # Weighted overall score
        overall_score = (
            video_score * WEIGHT_VIDEO
            + camera_score * WEIGHT_CAMERA
            + speech_score * WEIGHT_SPEECH
            + answer_score * WEIGHT_ANSWER
        )
        overall_score = round(overall_score, 1)

        performance_level = _performance_level(overall_score)
        strengths = _derive_strengths(video_score, camera_score, speech_score, answer_score)
        weak_points = _derive_weak_points(video_score, camera_score, speech_score, answer_score)
        next_task = _next_practice_task(video_score, camera_score, speech_score)
        summary = _build_summary(overall_score, performance_level, strengths, weak_points, next_task)

        return {
            "status": "success",
            "video_score": video_score,
            "camera_score": camera_score,
            "speech_score": speech_score,
            "answer_score": answer_score,
            "overall_score": overall_score,
            "performance_level": performance_level,
            "strengths": strengths,
            "weak_points": weak_points,
            "next_practice_task": next_task,
            "summary": summary,
            "message": "Overall score calculated successfully.",
        }

    except Exception as exc:
        return _error_dict(f"Scoring engine failed: {exc}")


def _error_dict(message: str) -> Dict[str, Union[str, float, int, list]]:
    """Return a clean error dictionary."""
    return {
        "status": "error",
        "video_score": 0,
        "camera_score": 0,
        "speech_score": 0,
        "answer_score": 0,
        "overall_score": 0.0,
        "performance_level": "Unknown",
        "strengths": [],
        "weak_points": [message],
        "next_practice_task": "Run all analyses on the Practice page first.",
        "summary": message,
        "message": message,
    }
