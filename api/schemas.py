"""api/schemas.py
================
Pydantic request/response models for the PitchPilot AI API.
"""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Health / Meta
# ---------------------------------------------------------------------------
class HealthResponse(BaseModel):
    status: str


class MetaResponse(BaseModel):
    app: str
    version: str
    status: str


# ---------------------------------------------------------------------------
# AI Coach
# ---------------------------------------------------------------------------
class AnalyzeAnswerRequest(BaseModel):
    transcript: str = Field(..., min_length=1, description="Speech transcript to analyze")
    question: str = Field(default="Tell me about yourself.", description="Interview question")
    role: str = Field(default="Software Developer", description="Target job role")
    api_key: Optional[str] = Field(default=None, description="Optional AI provider API key")
    base_url: Optional[str] = Field(default=None, description="Optional AI provider base URL")
    model: Optional[str] = Field(default=None, description="Optional model name")


class AnalyzeAnswerResponse(BaseModel):
    status: str
    answer_score: int
    content_strengths: List[str]
    content_weak_points: List[str]
    improved_answer: str
    structure_feedback: str
    next_content_task: str
    summary: str
    model_used: str


# ---------------------------------------------------------------------------
# Final Score
# ---------------------------------------------------------------------------
class FinalScoreRequest(BaseModel):
    video_result: Dict[str, Any] = Field(..., description="Result from video analyzer")
    camera_result: Dict[str, Any] = Field(..., description="Result from camera analyzer")
    speech_result: Dict[str, Any] = Field(..., description="Result from speech analyzer")
    ai_result: Optional[Dict[str, Any]] = Field(default=None, description="Result from AI coach")


class FinalScoreResponse(BaseModel):
    status: str
    video_score: int
    camera_score: int
    speech_score: int
    answer_score: int
    overall_score: float
    performance_level: str
    strengths: List[str]
    weak_points: List[str]
    next_practice_task: str
    summary: str
    message: str


# ---------------------------------------------------------------------------
# Question Bank
# ---------------------------------------------------------------------------
class PracticeModesResponse(BaseModel):
    modes: List[str]


class QuestionsResponse(BaseModel):
    mode: str
    questions: List[str]


class RandomQuestionResponse(BaseModel):
    mode: str
    question: str


class DefaultRoleResponse(BaseModel):
    mode: str
    role: str


# ---------------------------------------------------------------------------
# Error
# ---------------------------------------------------------------------------
class ErrorResponse(BaseModel):
    detail: str
