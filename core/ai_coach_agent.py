"""
core/ai_coach_agent.py
======================
AI Coach Agent for analyzing interview/presentation transcripts.

Provides content-level coaching:
- Answer score (0-100)
- Content strengths and weak points
- Improved answer suggestion
- Structure feedback
- Next content task

Falls back to rule-based analysis when no AI API key is available
or when the API call fails / returns invalid JSON.
Supports any OpenAI-compatible provider via environment variables.
"""

import json
import os
import re
from typing import Any, Dict, List, Optional, Union

# ---------------------------------------------------------------------------
# Safe import of openai
# ---------------------------------------------------------------------------
OPENAI_AVAILABLE = False
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except Exception:
    pass


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
ENV_API_KEY = "PITCHPILOT_AI_API_KEY"
ENV_BASE_URL = "PITCHPILOT_AI_BASE_URL"
ENV_MODEL = "PITCHPILOT_AI_MODEL"

REQUEST_TIMEOUT = 30  # seconds

MIN_WORDS_FOR_GOOD_ANSWER = 40
MAX_WORDS_FOR_CONCISE = 300

# Keywords to look for in fallback mode
INTRO_KEYWORDS = ["my name is", "i am", "i'm", "hello", "hi", "thank you"]
EDU_KEYWORDS = ["study", "studied", "degree", "university", "college", "school", "graduated", "education", "course", "certification"]
EXP_KEYWORDS = ["worked", "experience", "job", "company", "role", "position", "project", "internship", "managed", "led", "developed", "built", "created"]
END_KEYWORDS = ["thank you", "thanks", "look forward", "excited", "opportunity", "appreciate", "interested", "please", "contact"]
ROLE_KEYWORDS = {
    "software": ["code", "programming", "software", "developer", "engineer", "python", "java", "javascript", "react", "backend", "frontend", "fullstack", "api", "database"],
    "data": ["data", "analysis", "analytics", "machine learning", "ml", "statistics", "sql", "pandas", "visualization", "model", "dataset"],
    "product": ["product", "roadmap", "stakeholder", "user", "feature", "launch", "strategy", "market", "customer", "requirements"],
    "design": ["design", "ui", "ux", "user experience", "interface", "figma", "prototype", "wireframe", "visual", "creative"],
    "marketing": ["marketing", "campaign", "brand", "audience", "seo", "social media", "content", "growth", "lead", "conversion"],
    "sales": ["sales", "revenue", "client", "customer", "quota", "pipeline", "deal", "negotiation", "relationship"],
    "manager": ["team", "leadership", "manage", "mentor", "delegate", "performance", "hiring", "cross-functional", "collaboration"],
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _error_dict(message: str) -> Dict[str, Union[str, int, list]]:
    """Return a clean error dictionary."""
    return {
        "status": "error",
        "answer_score": 0,
        "content_strengths": [],
        "content_weak_points": [message],
        "improved_answer": "",
        "structure_feedback": message,
        "next_content_task": "Run speech analysis first to get a transcript.",
        "summary": message,
        "model_used": "none",
    }


def _detect_keywords(text: str, keywords: List[str]) -> bool:
    """Check if any keyword exists in text (case-insensitive)."""
    lower = text.lower()
    return any(kw.lower() in lower for kw in keywords)


def _count_keyword_matches(text: str, keywords: List[str]) -> int:
    """Count how many unique keywords are found in text."""
    lower = text.lower()
    return sum(1 for kw in keywords if kw.lower() in lower)


def _get_role_keywords(role: str) -> List[str]:
    """Get role-specific keywords for content relevance."""
    role_lower = role.lower()
    for category, keywords in ROLE_KEYWORDS.items():
        if category in role_lower:
            return keywords
    return ["experience", "skills", "project", "team", "work", "goal", "achieve", "learn", "improve"]


# ---------------------------------------------------------------------------
# Rule-based fallback analysis
# ---------------------------------------------------------------------------
def _fallback_analysis(
    transcript: str,
    question: str,
    role: str,
) -> Dict[str, Union[str, int, list]]:
    """
    Rule-based analysis when AI is unavailable.
    Analyzes structure, length, keywords, and relevance.
    """
    text = transcript.strip()
    words = text.split()
    word_count = len(words)
    lower = text.lower()

    score = 50
    strengths: List[str] = []
    weak_points: List[str] = []

    # Length analysis
    if word_count < MIN_WORDS_FOR_GOOD_ANSWER:
        weak_points.append(
            f"Answer is very short ({word_count} words). Aim for at least {MIN_WORDS_FOR_GOOD_ANSWER} words to cover key points."
        )
        score -= 20
    elif word_count < 80:
        weak_points.append("Answer is brief. Consider expanding with a concrete example or achievement.")
        score -= 10
    elif word_count <= MAX_WORDS_FOR_CONCISE:
        strengths.append("Answer length is in a good range — concise yet informative.")
        score += 10
    else:
        weak_points.append(f"Answer is quite long ({word_count} words). Try to be more concise and focused.")
        score -= 5

    # Structure analysis
    has_intro = _detect_keywords(text, INTRO_KEYWORDS)
    has_edu = _detect_keywords(text, EDU_KEYWORDS)
    has_exp = _detect_keywords(text, EXP_KEYWORDS)
    has_end = _detect_keywords(text, END_KEYWORDS)

    if has_intro:
        strengths.append("Good introduction — you opened with a greeting or self-introduction.")
        score += 5
    else:
        weak_points.append("Missing a clear introduction. Start with a brief greeting or who you are.")
        score -= 5

    if has_edu or has_exp:
        if has_edu and has_exp:
            strengths.append("Both education and experience are mentioned — strong content coverage.")
            score += 10
        elif has_exp:
            strengths.append("Work experience is mentioned — good focus on practical background.")
            score += 7
        else:
            strengths.append("Education background is mentioned.")
            score += 5
    else:
        weak_points.append("No clear education or experience details found. Add specific background information.")
        score -= 10

    if has_end:
        strengths.append("Strong closing — you expressed interest or gratitude.")
        score += 5
    else:
        weak_points.append("Missing a strong closing. End with enthusiasm for the role or a thank you.")
        score -= 5

    # Role relevance
    role_keywords = _get_role_keywords(role)
    role_matches = _count_keyword_matches(text, role_keywords)
    if role_matches >= 3:
        strengths.append(f"Answer is well-aligned with the {role} role.")
        score += 10
    elif role_matches >= 1:
        strengths.append(f"Some role-relevant keywords detected for {role}.")
        score += 3
    else:
        weak_points.append(f"Answer seems generic. Try to tailor it more to the {role} role.")
        score -= 5

    # Clarity checks
    sentence_starts = [s.strip().split()[0].lower() for s in re.split(r'[.!?]', text) if s.strip()]
    if sentence_starts:
        from collections import Counter
        most_common = Counter(sentence_starts).most_common(1)[0][1]
        if most_common > len(sentence_starts) * 0.5:
            weak_points.append("Too many sentences start the same way. Vary your sentence structure for better flow.")
            score -= 5

    question_lower = question.lower()
    if "yourself" in question_lower or "introduce" in question_lower:
        if not (has_intro and (has_edu or has_exp)):
            weak_points.append("For a 'tell me about yourself' question, include your background, skills, and interests.")
            score -= 5

    answer_score = max(0, min(100, score))

    improved_parts = []
    if not has_intro:
        improved_parts.append("Start with a brief greeting and your name.")
    if not has_edu and not has_exp:
        improved_parts.append("Mention your relevant education or work background.")
    if role_matches < 2:
        improved_parts.append(f"Connect your skills directly to the {role} role.")
    if not has_end:
        improved_parts.append("Close by expressing enthusiasm for the opportunity.")
    if not improved_parts:
        improved_parts.append("Your structure is solid. Focus on adding specific achievements and metrics.")

    improved_answer = " ".join(improved_parts)

    structure_feedback = (
        f"Structure: {'Introduction ✓' if has_intro else 'Introduction ✗'} | "
        f"{'Background ✓' if (has_edu or has_exp) else 'Background ✗'} | "
        f"{'Closing ✓' if has_end else 'Closing ✗'} | "
        f"Role relevance: {role_matches}/{len(role_keywords)} keywords matched."
    )

    next_task = (
        "Rewrite your answer using the improved structure above. "
        "Then record yourself again and compare the scores."
    )

    summary = (
        f"Answer analysis (rule-based): Score {answer_score}/100. "
        f"Strengths: {len(strengths)}. Weak points: {len(weak_points)}. "
        f"Model: fallback_rules."
    )

    return {
        "status": "fallback",
        "answer_score": answer_score,
        "content_strengths": strengths,
        "content_weak_points": weak_points,
        "improved_answer": improved_answer,
        "structure_feedback": structure_feedback,
        "next_content_task": next_task,
        "summary": summary,
        "model_used": "fallback_rules",
    }


# ---------------------------------------------------------------------------
# AI integration (OpenAI-compatible)
# ---------------------------------------------------------------------------
def _build_system_prompt() -> str:
    """Build the system prompt that enforces JSON output format."""
    return (
        "You are an expert interview coach. Analyze the user's interview answer "
        "and provide structured feedback. You MUST respond with a single valid JSON object "
        "and nothing else. Do not include markdown code blocks, explanations, or extra text.\n\n"
        "Required JSON format:\n"
        '{\n'
        '  "answer_score": <integer 0-100>,\n'
        '  "content_strengths": [<string>, ...],\n'
        '  "content_weak_points": [<string>, ...],\n'
        '  "improved_answer": <string 1-3 sentences>,\n'
        '  "structure_feedback": <string 1 sentence>,\n'
        '  "next_content_task": <string 1 sentence>,\n'
        '  "summary": <string 1-2 sentences>\n'
        '}\n\n'
        "Scoring guidelines:\n"
        "- 90-100: Excellent answer with strong structure, relevance, and specificity.\n"
        "- 75-89: Good answer with minor areas for improvement.\n"
        "- 60-74: Acceptable but missing key elements or lacking specificity.\n"
        "- Below 60: Weak answer — needs significant restructuring.\n"
    )


def _build_user_prompt(
    transcript: str,
    question: str,
    role: str,
    speech_score: int,
    filler_word_count: int,
    wpm: float,
) -> str:
    """Build the user prompt with all available context."""
    return (
        f"Interview Question: {question}\n"
        f"Target Role: {role}\n"
        f"Transcript: {transcript}\n\n"
        f"Speech Metrics:\n"
        f"- Speech Score: {speech_score}/100\n"
        f"- Filler Words: {filler_word_count}\n"
        f"- Words Per Minute: {wpm:.1f}\n\n"
        f"Provide your analysis in the required JSON format."
    )


def _parse_ai_json(raw: str) -> Optional[Dict[str, Any]]:
    """
    Safely parse AI response text into a dictionary.
    Handles markdown code fences and trims whitespace.
    """
    if not raw or not raw.strip():
        return None

    text = raw.strip()

    # Remove markdown code fences if present
    if text.startswith("```"):
        lines = text.splitlines()
        # Drop first and last fence lines
        if len(lines) > 2:
            text = "\n".join(lines[1:-1]).strip()
        else:
            text = text.replace("```", "").strip()

    try:
        parsed = json.loads(text)
        if not isinstance(parsed, dict):
            return None
        # Validate required keys
        required = {
            "answer_score",
            "content_strengths",
            "content_weak_points",
            "improved_answer",
            "structure_feedback",
            "next_content_task",
            "summary",
        }
        if not required.issubset(parsed.keys()):
            return None
        return parsed
    except Exception:
        return None


def _try_ai_analysis(
    transcript: str,
    question: str,
    role: str,
    api_key: str,
    base_url: Optional[str],
    model: str,
    speech_score: int = 0,
    filler_word_count: int = 0,
    wpm: float = 0.0,
) -> Optional[Dict[str, Union[str, int, list]]]:
    """
    Attempt to call an OpenAI-compatible API for transcript analysis.

    Returns None on any failure so the caller can fall back to rule-based analysis.
    """
    if not OPENAI_AVAILABLE:
        return None

    try:
        client_kwargs: Dict[str, Any] = {"api_key": api_key, "timeout": REQUEST_TIMEOUT}
        if base_url:
            client_kwargs["base_url"] = base_url

        client = OpenAI(**client_kwargs)

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": _build_system_prompt()},
                {
                    "role": "user",
                    "content": _build_user_prompt(
                        transcript=transcript,
                        question=question,
                        role=role,
                        speech_score=speech_score,
                        filler_word_count=filler_word_count,
                        wpm=wpm,
                    ),
                },
            ],
            temperature=0.4,
            max_tokens=800,
        )

        raw_content = response.choices[0].message.content
        parsed = _parse_ai_json(raw_content)

        if parsed is None:
            return None

        # Normalize fields
        return {
            "answer_score": int(parsed.get("answer_score", 75)),
            "content_strengths": list(parsed.get("content_strengths", [])),
            "content_weak_points": list(parsed.get("content_weak_points", [])),
            "improved_answer": str(parsed.get("improved_answer", "")),
            "structure_feedback": str(parsed.get("structure_feedback", "")),
            "next_content_task": str(parsed.get("next_content_task", "")),
            "summary": str(parsed.get("summary", "")),
        }

    except Exception:
        # Swallow all API / parsing / timeout errors and trigger fallback
        return None


# ---------------------------------------------------------------------------
# Main function
# ---------------------------------------------------------------------------
def analyze_answer_with_ai(
    transcript: str,
    question: str = "Tell me about yourself.",
    role: str = "Software Developer",
    api_key: Optional[str] = None,
    speech_result: Optional[dict] = None,
) -> Dict[str, Union[str, int, list]]:
    """
    Analyze an interview answer transcript using AI or rule-based fallback.

    Parameters
    ----------
    transcript : str
        The speech transcript to analyze.
    question : str, optional
        The interview question. Defaults to "Tell me about yourself.".
    role : str, optional
        The target job role. Defaults to "Software Developer".
    api_key : str or None, optional
        API key for the AI service. If None, reads from PITCHPILOT_AI_API_KEY env var.
    speech_result : dict or None, optional
        Result from speech analysis to include metrics in the AI prompt.

    Returns
    -------
    dict
        A dictionary with:
        - status (str): "success" (AI) or "fallback" (rule-based) or "error"
        - answer_score (int): 0-100
        - content_strengths (list[str])
        - content_weak_points (list[str])
        - improved_answer (str)
        - structure_feedback (str)
        - next_content_task (str)
        - summary (str)
        - model_used (str)
    """
    if not transcript or not transcript.strip():
        return _error_dict("Transcript is empty. Run speech analysis first.")

    # Resolve config from env vars or parameters
    resolved_key = api_key or os.environ.get(ENV_API_KEY)
    resolved_base_url = os.environ.get(ENV_BASE_URL)
    resolved_model = os.environ.get(ENV_MODEL, "gpt-4o-mini")

    # Extract speech metrics for richer prompt
    speech_score = 0
    filler_count = 0
    wpm = 0.0
    if speech_result:
        speech_score = int(speech_result.get("speech_score", 0))
        filler_count = int(speech_result.get("filler_word_count", 0))
        wpm = float(speech_result.get("words_per_minute", 0.0))

    # Try AI analysis if key is available and openai is installed
    if resolved_key and OPENAI_AVAILABLE:
        ai_result = _try_ai_analysis(
            transcript=transcript,
            question=question,
            role=role,
            api_key=resolved_key,
            base_url=resolved_base_url,
            model=resolved_model,
            speech_score=speech_score,
            filler_word_count=filler_count,
            wpm=wpm,
        )
        if ai_result is not None:
            ai_result["status"] = "success"
            ai_result["model_used"] = resolved_model
            return ai_result

    # Fall back to rule-based analysis
    return _fallback_analysis(transcript, question, role)
