"""
core/question_bank.py
=====================
Interview question bank with role-based practice modes.

Provides curated question lists for different interview types,
plus utility functions for mode selection and random question picking.
"""

from __future__ import annotations

import random
from typing import Dict, List


# ---------------------------------------------------------------------------
# Question bank data
# ---------------------------------------------------------------------------
_QUESTION_BANK: Dict[str, Dict[str, List[str]]] = {
    "Software Developer Interview": {
        "role": "Software Developer",
        "questions": [
            "Tell me about yourself.",
            "Why do you want to work at our company?",
            "Describe a challenging bug you fixed and how you approached it.",
            "Explain the difference between REST and GraphQL.",
            "How do you handle tight deadlines and conflicting priorities?",
            "Walk me through your most complex project.",
            "What is your approach to code review and mentoring junior developers?",
            "Describe a time you had to refactor a large codebase. What was your strategy?",
        ],
    },
    "AI/ML Interview": {
        "role": "Machine Learning Engineer",
        "questions": [
            "Tell me about yourself.",
            "Explain the bias-variance tradeoff.",
            "Walk me through how you would build a recommendation system from scratch.",
            "What is the difference between supervised, unsupervised, and reinforcement learning?",
            "Describe a time your model failed in production and how you fixed it.",
            "How do you handle imbalanced datasets?",
            "Explain gradient descent and its variants.",
            "What metrics would you use to evaluate a classification model?",
        ],
    },
    "Data Analyst Interview": {
        "role": "Data Analyst",
        "questions": [
            "Tell me about yourself.",
            "Walk me through a data analysis project you are proud of.",
            "How do you ensure data quality and integrity?",
            "Explain the difference between INNER JOIN and LEFT JOIN.",
            "Describe a time you used data to influence a business decision.",
            "How do you handle missing or corrupted data?",
            "What visualization tools do you prefer and why?",
            "Explain cohort analysis and when you would use it.",
        ],
    },
    "University Admission Interview": {
        "role": "University Applicant",
        "questions": [
            "Tell me about yourself.",
            "Why do you want to study at this university?",
            "What are your academic strengths and weaknesses?",
            "Describe a time you overcame a significant challenge.",
            "What are your long-term career goals?",
            "Why did you choose this major or program?",
            "Describe a leadership experience you have had.",
            "How do you plan to contribute to the campus community?",
        ],
    },
    "Presentation Practice": {
        "role": "Presenter",
        "questions": [
            "Introduce yourself and your topic in 60 seconds.",
            "Explain your main idea to someone with no background in your field.",
            "What is the key takeaway you want your audience to remember?",
            "Describe the problem your work addresses and why it matters.",
            "How would you handle a challenging question from the audience?",
            "Summarize your project or research in three sentences.",
            "Why should the audience care about your topic?",
            "What is the next step or call to action after your presentation?",
        ],
    },
    "Sales Pitch Practice": {
        "role": "Sales Representative",
        "questions": [
            "Tell me about yourself.",
            "Pitch our product to a skeptical prospect in 90 seconds.",
            "How do you handle objections about price?",
            "Describe a time you turned a 'no' into a 'yes'.",
            "What is your approach to building long-term client relationships?",
            "How do you prioritize leads in a busy pipeline?",
            "Walk me through your discovery call process.",
            "Why do you want to work in sales?",
        ],
    },
    "Behavioral Interview": {
        "role": "Professional",
        "questions": [
            "Tell me about yourself.",
            "Describe a time you worked under pressure.",
            "Give an example of a conflict you had with a teammate and how you resolved it.",
            "Tell me about a time you failed and what you learned.",
            "Describe a situation where you had to adapt quickly to change.",
            "Give an example of a goal you set and how you achieved it.",
            "Describe a time you went above and beyond for a customer or colleague.",
            "Tell me about a time you had to persuade someone to see things your way.",
        ],
    },
}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def get_practice_modes() -> List[str]:
    """Return a sorted list of available practice mode names."""
    return sorted(_QUESTION_BANK.keys())


def get_questions_for_mode(mode: str) -> List[str]:
    """
    Return the list of questions for a given practice mode.

    Falls back to Software Developer Interview questions if mode is unknown.
    """
    entry = _QUESTION_BANK.get(mode)
    if entry is None:
        entry = _QUESTION_BANK.get("Software Developer Interview", {})
    return list(entry.get("questions", []))


def get_random_question(mode: str) -> str:
    """
    Return a random question from the given practice mode.

    Falls back to Software Developer Interview questions if mode is unknown.
    """
    questions = get_questions_for_mode(mode)
    if questions:
        return random.choice(questions)
    return "Tell me about yourself."


def get_default_role_for_mode(mode: str) -> str:
    """
    Return the default target role for a given practice mode.

    Falls back to Software Developer if mode is unknown.
    """
    entry = _QUESTION_BANK.get(mode)
    if entry is None:
        entry = _QUESTION_BANK.get("Software Developer Interview", {})
    return str(entry.get("role", "Software Developer"))
