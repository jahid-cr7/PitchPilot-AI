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
# Video / Camera / Speech / Full
# ---------------------------------------------------------------------------
class VideoAnalysisResponse(BaseModel):
    status: str
    duration_seconds: float = 0
    fps: float = 0
    resolution: str = ""
    movement_score: float = 0
    total_frames: int = 0
    width: int = 0
    height: int = 0
    sample_frame_count: int = 0
    message: str = ""


class CameraAnalysisResponse(BaseModel):
    status: str
    face_visible_percent: float = 0
    framing: str = ""
    distance_feedback: str = ""
    movement_level: str = ""
    camera_score: int = 0
    face_detected: bool = False
    sampled_frames: int = 0
    faces_detected: int = 0
    warnings: List[str] = []
    message: str = ""


class SpeechAnalysisResponse(BaseModel):
    status: str
    word_count: int = 0
    words_per_minute: float = 0
    filler_word_count: int = 0
    repeated_word_count: int = 0
    speech_score: int = 0
    transcript: str = ""
    duration_seconds: float = 0
    filler_words_found: List[str] = []
    repeated_words: List[str] = []
    warnings: List[str] = []
    message: str = ""


class FullAnalysisResponse(BaseModel):
    status: str
    session_id: Optional[int] = None
    save_warning: Optional[str] = None
    video_result: Dict[str, Any] = {}
    camera_result: Dict[str, Any] = {}
    speech_result: Dict[str, Any] = {}
    ai_result: Dict[str, Any] = {}
    final_feedback: Dict[str, Any] = {}


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
# Session History
# ---------------------------------------------------------------------------
class SessionSummary(BaseModel):
    id: int
    created_at: str
    video_filename: str = ""
    interview_question: str = ""
    target_role: str = ""
    overall_score: float = 0.0
    video_score: float = 0.0
    camera_score: int = 0
    speech_score: int = 0
    answer_score: int = 0
    performance_level: str = ""


class SessionDetail(BaseModel):
    id: int
    created_at: str
    video_filename: str = ""
    interview_question: str = ""
    target_role: str = ""
    transcript: str = ""
    duration_seconds: float = 0.0
    fps: float = 0.0
    resolution: str = ""
    movement_score: float = 0.0
    video_score: float = 0.0
    face_visible_percent: float = 0.0
    framing: str = ""
    distance_feedback: str = ""
    camera_movement_level: str = ""
    camera_score: int = 0
    word_count: int = 0
    words_per_minute: float = 0.0
    filler_word_count: int = 0
    repeated_word_count: int = 0
    speech_score: int = 0
    answer_score: int = 0
    overall_score: float = 0.0
    performance_level: str = ""
    strengths: List[str] = []
    weak_points: List[str] = []
    next_practice_task: str = ""
    summary: str = ""
    ai_model_used: str = ""


class SessionsListResponse(BaseModel):
    status: str
    sessions: List[SessionSummary]


class SessionDetailResponse(BaseModel):
    status: str
    session: SessionDetail


class DeleteSessionResponse(BaseModel):
    status: str
    message: str


class DashboardStatsResponse(BaseModel):
    status: str
    total_sessions: int
    average_score: float
    best_score: float
    latest_score: float
    average_video_score: float
    average_camera_score: float
    average_speech_score: float
    average_answer_score: float
    recent_sessions: List[SessionSummary]


# ---------------------------------------------------------------------------
# User Analytics & Profile
# ---------------------------------------------------------------------------
class SkillAverages(BaseModel):
    video: float = 0.0
    camera: float = 0.0
    speech: float = 0.0
    answer: float = 0.0


class ScoreTrendPoint(BaseModel):
    date: str
    score: float


class UserAnalyticsResponse(BaseModel):
    status: str = "success"
    total_sessions: int
    average_score: float
    best_score: float
    latest_score: float
    score_trend: List[ScoreTrendPoint]
    skill_averages: SkillAverages
    top_strengths: List[str]
    common_weaknesses: List[str]
    recent_sessions: List[SessionSummary]


class UserProfileResponse(BaseModel):
    status: str = "success"
    id: int
    name: str
    email: str
    created_at: Optional[str] = None
    total_sessions: int
    latest_session_date: Optional[str] = None


class ReportExportResponse(BaseModel):
    status: str
    filename: str
    content: str


# ---------------------------------------------------------------------------
# Error
# ---------------------------------------------------------------------------
class ErrorResponse(BaseModel):
    detail: str


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120, description="Display name")
    email: str = Field(..., min_length=3, max_length=254, description="Email address")
    password: str = Field(..., min_length=6, max_length=200, description="Plain password")


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=254)
    password: str = Field(..., min_length=1, max_length=200)


class UserPublic(BaseModel):
    id: int
    name: str
    email: str
    created_at: Optional[str] = None


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class MeResponse(BaseModel):
    user: UserPublic


class LogoutResponse(BaseModel):
    status: str
    message: str


# ---------------------------------------------------------------------------
# Coaching Plan
# ---------------------------------------------------------------------------
class CoachingPlanStep(BaseModel):
    step: str


class CoachingPlanResponse(BaseModel):
    status: str = "success"
    focus_area: str
    current_level: str
    weekly_goal: str
    recommended_practice_mode: str
    recommended_question: str
    action_steps: List[str]
    metrics_to_watch: List[str]
    next_milestone: str
    ai_note: Optional[str] = None


# ---------------------------------------------------------------------------
# User Goals
# ---------------------------------------------------------------------------
class GoalCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    target_metric: str = Field(..., min_length=1, max_length=100)
    target_value: float = Field(..., gt=0)
    current_value: float = Field(default=0.0, ge=0)


class GoalUpdateRequest(BaseModel):
    title: Optional[str] = Field(default=None, max_length=200)
    target_metric: Optional[str] = Field(default=None, max_length=100)
    target_value: Optional[float] = Field(default=None, gt=0)
    current_value: Optional[float] = Field(default=None, ge=0)
    status: Optional[str] = Field(default=None, pattern=r"^(active|completed|abandoned)$")


class GoalResponse(BaseModel):
    id: int
    user_id: int
    title: str
    target_metric: str
    target_value: float
    current_value: float
    status: str
    created_at: str
    completed_at: Optional[str] = None


class GoalsListResponse(BaseModel):
    status: str = "success"
    goals: List[GoalResponse]


class GoalDetailResponse(BaseModel):
    status: str = "success"
    goal: GoalResponse


class GoalDeleteResponse(BaseModel):
    status: str = "success"
    message: str


# ---------------------------------------------------------------------------
# Robot Coach Lesson
# ---------------------------------------------------------------------------
class RobotLessonRequest(BaseModel):
    session_id: int = Field(..., gt=0, description="Saved session ID to base the lesson on")
    lesson_type: str = Field(default="interview", pattern=r"^(interview|presentation)$")
    focus_area: str = Field(
        default="overall",
        pattern=r"^(answer_structure|speech|body_language|confidence|overall)$",
    )


class SubtitleItem(BaseModel):
    time: int
    text: str


class RobotLesson(BaseModel):
    title: str
    coach_name: str
    lesson_type: str
    focus_area: str
    problem_summary: str
    why_it_matters: str
    correct_method: str
    better_example: str
    practice_steps: List[str]
    spoken_script: str
    subtitles: List[SubtitleItem]
    estimated_duration_seconds: int


class RobotLessonResponse(BaseModel):
    status: str
    lesson: RobotLesson
