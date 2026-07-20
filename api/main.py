"""api/main.py
=============
FastAPI application for the PitchPilot AI backend API.

Provides REST endpoints for:
- AI Coach transcript analysis
- Final performance scoring
- Video / Camera / Speech analysis (file upload)
- Full pipeline analysis
- Question bank queries
- Session history, dashboard, and report export

Run locally:
    python -m uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
"""

import traceback
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Optional

from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware

from api import config, schemas, services
from api.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from api.rate_limiter import rate_limit
from core.database import (
    create_user as _db_create_user,
    get_user_by_email as _db_get_user_by_email,
    init_db,
)

# ---------------------------------------------------------------------------
# Production safety checks
# ---------------------------------------------------------------------------
_INSECURE_SECRETS: set[str] = {
    "",
    "dev-insecure-secret-change-me",
    "replace_me",
    "replace_me_with_a_long_random_string",
    "secret",
    "password",
}


def _assert_safe_jwt_secret() -> None:
    """Refuse to start in production with a weak or placeholder JWT secret."""
    from api.auth import JWT_SECRET

    if config.IS_PRODUCTION and (not JWT_SECRET or JWT_SECRET.strip() in _INSECURE_SECRETS):
        raise RuntimeError(
            "FATAL: PITCHPILOT_JWT_SECRET is missing or insecure in production. "
            "Generate a strong secret with: python -c \"import secrets; print(secrets.token_urlsafe(64))\""
        )


def _assert_safe_cors() -> None:
    """Warn if production CORS origins are still at unsafe defaults."""
    if not config.IS_PRODUCTION:
        return
    origins = config.CORS_ORIGINS
    unsafe = {"http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"}
    if set(origins) <= unsafe:
        import warnings

        warnings.warn(
            "WARNING: PITCHPILOT_CORS_ORIGINS is still set to localhost defaults in production. "
            "Update it to your real frontend domain(s) before exposing the API publicly.",
            stacklevel=2,
        )


# ---------------------------------------------------------------------------
# Lifespan — startup / shutdown hooks
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database and directories on startup. Run safety checks."""
    _assert_safe_jwt_secret()
    _assert_safe_cors()
    config.ensure_dirs()
    init_db()
    yield


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------
app = FastAPI(
    title="PitchPilot AI API",
    description="Backend API for AI-powered interview and presentation coaching.",
    version="1.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — configurable via PITCHPILOT_CORS_ORIGINS
# ---------------------------------------------------------------------------
# In production, only allow specific origins.
# In development, default to ["*"] if no origins are configured.
_cors_origins = config.CORS_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Exception handler — never leak stack traces or raw objects to clients
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def _generic_exception_handler(_request: Any, exc: Exception) -> Any:
    """Log the full traceback server-side; return a clean 500 to the client."""
    traceback.print_exc()
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="An unexpected error occurred. Please try again later.",
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _validate_upload(file: UploadFile) -> None:
    """Validate uploaded file: must be MP4/MOV, non-empty, and under max size."""
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is missing.",
        )
    ext = Path(file.filename).suffix.lower()
    if ext not in config.ALLOWED_UPLOAD_EXTENSIONS:
        allowed = ", ".join(config.ALLOWED_UPLOAD_EXTENSIONS)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only {allowed} files are supported.",
        )


async def _read_upload(file: UploadFile) -> bytes:
    """Read uploaded file content and validate size."""
    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )
    if len(content) > config.MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {config.MAX_UPLOAD_MB} MB.",
        )
    return content


def _run_and_cleanup(path: Path, analyzer) -> Any:
    """Run a core analyzer on a file path and clean up afterwards."""
    try:
        return analyzer(str(path))
    finally:
        services.delete_temp_file(path)


# ---------------------------------------------------------------------------
# Meta
# ---------------------------------------------------------------------------
@app.get("/", response_model=schemas.MetaResponse)
async def root() -> schemas.MetaResponse:
    return schemas.MetaResponse(
        app="PitchPilot AI API",
        version="1.1.0",
        status="running",
    )


@app.get("/health", response_model=schemas.HealthResponse)
async def health() -> schemas.HealthResponse:
    return schemas.HealthResponse(status="ok")


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------
def _user_public(user: dict) -> schemas.UserPublic:
    """Strip password_hash before returning a user row to any client."""
    return schemas.UserPublic(
        id=int(user["id"]),
        name=user["name"],
        email=user["email"],
        created_at=user.get("created_at"),
    )


@app.post(
    "/api/v1/auth/register",
    response_model=schemas.AuthTokenResponse,
    responses={
        400: {"model": schemas.ErrorResponse},
        409: {"model": schemas.ErrorResponse},
    },
)
@rate_limit(max_requests=10, window_seconds=60, endpoint_name="auth_register")
async def register(
    request: Request,
    payload: schemas.RegisterRequest,
) -> schemas.AuthTokenResponse:
    """Register a new user account and return an access token."""
    email = payload.email.strip().lower()
    name = payload.name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name must not be empty.",
        )
    if "@" not in email or "." not in email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address.",
        )
    if len(payload.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long.",
        )

    if _db_get_user_by_email(email) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    try:
        password_hash = hash_password(payload.password)
        user = _db_create_user(name=name, email=email, password_hash=password_hash)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        )

    token = create_access_token(user_id=int(user["id"]))
    return schemas.AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        user=_user_public(user),
    )


@app.post(
    "/api/v1/auth/login",
    response_model=schemas.AuthTokenResponse,
    responses={401: {"model": schemas.ErrorResponse}},
)
@rate_limit(max_requests=10, window_seconds=60, endpoint_name="auth_login")
async def login(
    request: Request,
    payload: schemas.LoginRequest,
) -> schemas.AuthTokenResponse:
    """Authenticate an existing user and return an access token."""
    user = _db_get_user_by_email(payload.email)
    if user is None or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(user_id=int(user["id"]))
    return schemas.AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        user=_user_public(user),
    )


@app.get(
    "/api/v1/auth/me",
    response_model=schemas.MeResponse,
    responses={401: {"model": schemas.ErrorResponse}},
)
async def me(user: dict = Depends(get_current_user)) -> schemas.MeResponse:
    """Return the currently authenticated user."""
    return schemas.MeResponse(user=_user_public(user))


@app.post(
    "/api/v1/auth/logout",
    response_model=schemas.LogoutResponse,
)
async def logout() -> schemas.LogoutResponse:
    """
    Logout is client-side for stateless JWT: the frontend must drop the token.
    This endpoint exists so the frontend can hit a single canonical URL.
    """
    return schemas.LogoutResponse(
        status="success",
        message="Client should discard the access token.",
    )


# ---------------------------------------------------------------------------
# AI Coach
# ---------------------------------------------------------------------------
@app.post(
    "/api/v1/ai/analyze-answer",
    response_model=schemas.AnalyzeAnswerResponse,
    responses={500: {"model": schemas.ErrorResponse}},
)
async def analyze_answer(payload: schemas.AnalyzeAnswerRequest) -> schemas.AnalyzeAnswerResponse:
    """
    Analyze an interview answer transcript using AI or rule-based fallback.

    If *api_key* is omitted the core agent falls back to the offline rule-based engine.
    """
    try:
        result = services.analyze_answer(
            transcript=payload.transcript,
            question=payload.question,
            role=payload.role,
            api_key=payload.api_key,
            base_url=payload.base_url,
            model=payload.model,
        )
        return schemas.AnalyzeAnswerResponse(**result)
    except HTTPException:
        raise
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI analysis failed: {exc}",
        )


# ---------------------------------------------------------------------------
# Video Analysis
# ---------------------------------------------------------------------------
@app.post(
    "/api/v1/analyze/video",
    response_model=schemas.VideoAnalysisResponse,
    responses={
        400: {"model": schemas.ErrorResponse},
        413: {"model": schemas.ErrorResponse},
        500: {"model": schemas.ErrorResponse},
    },
)
async def analyze_video_endpoint(file: UploadFile = File(...)) -> schemas.VideoAnalysisResponse:
    """Upload an MP4 video and run video analysis (duration, FPS, resolution, movement)."""
    _validate_upload(file)
    content = await _read_upload(file)
    path = services.save_uploaded_file(content, file.filename or "video.mp4")
    try:
        result = services.analyze_video(str(path))
        return schemas.VideoAnalysisResponse(**result)
    except HTTPException:
        services.delete_temp_file(path)
        raise
    except Exception as exc:
        traceback.print_exc()
        services.delete_temp_file(path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Video analysis failed: {exc}",
        )
    finally:
        services.delete_temp_file(path)


# ---------------------------------------------------------------------------
# Camera Analysis
# ---------------------------------------------------------------------------
@app.post(
    "/api/v1/analyze/camera",
    response_model=schemas.CameraAnalysisResponse,
    responses={
        400: {"model": schemas.ErrorResponse},
        413: {"model": schemas.ErrorResponse},
        500: {"model": schemas.ErrorResponse},
    },
)
async def analyze_camera_endpoint(file: UploadFile = File(...)) -> schemas.CameraAnalysisResponse:
    """Upload an MP4 video and run camera presence analysis (face visibility, framing, distance)."""
    _validate_upload(file)
    content = await _read_upload(file)
    path = services.save_uploaded_file(content, file.filename or "video.mp4")
    try:
        result = services.analyze_camera(str(path))
        return schemas.CameraAnalysisResponse(**result)
    except HTTPException:
        services.delete_temp_file(path)
        raise
    except Exception as exc:
        traceback.print_exc()
        services.delete_temp_file(path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Camera analysis failed: {exc}",
        )
    finally:
        services.delete_temp_file(path)


# ---------------------------------------------------------------------------
# Speech Analysis
# ---------------------------------------------------------------------------
@app.post(
    "/api/v1/analyze/speech",
    response_model=schemas.SpeechAnalysisResponse,
    responses={
        400: {"model": schemas.ErrorResponse},
        413: {"model": schemas.ErrorResponse},
        500: {"model": schemas.ErrorResponse},
    },
)
async def analyze_speech_endpoint(file: UploadFile = File(...)) -> schemas.SpeechAnalysisResponse:
    """Upload an MP4 video and run speech analysis (transcription, WPM, fillers, repetitions)."""
    _validate_upload(file)
    content = await _read_upload(file)
    path = services.save_uploaded_file(content, file.filename or "video.mp4")
    try:
        result = services.analyze_speech(str(path))
        return schemas.SpeechAnalysisResponse(**result)
    except HTTPException:
        services.delete_temp_file(path)
        raise
    except Exception as exc:
        traceback.print_exc()
        services.delete_temp_file(path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech analysis failed: {exc}",
        )
    finally:
        services.delete_temp_file(path)


# ---------------------------------------------------------------------------
# Full Pipeline
# ---------------------------------------------------------------------------
@app.post(
    "/api/v1/analyze/full",
    response_model=schemas.FullAnalysisResponse,
    responses={
        400: {"model": schemas.ErrorResponse},
        413: {"model": schemas.ErrorResponse},
        500: {"model": schemas.ErrorResponse},
    },
)
@rate_limit(max_requests=5, window_seconds=3600, endpoint_name="analyze_full")
async def analyze_full_endpoint(
    request: Request,
    file: UploadFile = File(...),
    question: str = Form(default="Tell me about yourself."),
    role: str = Form(default="Software Developer"),
    api_key: Optional[str] = Form(default=None),
    base_url: Optional[str] = Form(default=None),
    model: Optional[str] = Form(default=None),
    save_session: bool = Form(default=True),
    user: dict = Depends(get_current_user),
) -> schemas.FullAnalysisResponse:
    """
    Upload an MP4 video and run the complete analysis pipeline:
    video -> camera -> speech -> AI coach -> final score.

    Requires authentication. The saved session is scoped to the caller's user id.
    Rate limited to 5 requests per hour per IP.
    """
    _validate_upload(file)
    content = await _read_upload(file)
    path = services.save_uploaded_file(content, file.filename or "video.mp4")
    try:
        result = services.analyze_full_pipeline(
            video_path=str(path),
            video_filename=file.filename or "video.mp4",
            question=question,
            role=role,
            api_key=api_key,
            base_url=base_url,
            model=model,
            save_session=save_session,
            user_id=int(user["id"]),
        )
        return schemas.FullAnalysisResponse(**result)
    except HTTPException:
        services.delete_temp_file(path)
        raise
    except Exception as exc:
        traceback.print_exc()
        services.delete_temp_file(path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Full analysis failed: {exc}",
        )
    finally:
        services.delete_temp_file(path)


# ---------------------------------------------------------------------------
# Question Bank
# ---------------------------------------------------------------------------
@app.get("/api/v1/questions/modes", response_model=schemas.PracticeModesResponse)
async def practice_modes() -> schemas.PracticeModesResponse:
    return schemas.PracticeModesResponse(modes=services.list_practice_modes())


@app.get("/api/v1/questions/{mode}", response_model=schemas.QuestionsResponse)
async def questions_for_mode(mode: str) -> schemas.QuestionsResponse:
    return schemas.QuestionsResponse(
        mode=mode,
        questions=services.list_questions(mode),
    )


@app.get("/api/v1/questions/{mode}/random", response_model=schemas.RandomQuestionResponse)
async def random_question(mode: str) -> schemas.RandomQuestionResponse:
    return schemas.RandomQuestionResponse(
        mode=mode,
        question=services.pick_random_question(mode),
    )


@app.get("/api/v1/questions/{mode}/default-role", response_model=schemas.DefaultRoleResponse)
async def default_role(mode: str) -> schemas.DefaultRoleResponse:
    return schemas.DefaultRoleResponse(
        mode=mode,
        role=services.resolve_default_role(mode),
    )


# ---------------------------------------------------------------------------
# Session History
# ---------------------------------------------------------------------------
@app.get(
    "/api/v1/sessions",
    response_model=schemas.SessionsListResponse,
    responses={401: {"model": schemas.ErrorResponse}, 500: {"model": schemas.ErrorResponse}},
)
async def list_sessions(
    user: dict = Depends(get_current_user),
) -> schemas.SessionsListResponse:
    """Return all saved practice sessions for the authenticated user."""
    sessions = services.get_all_sessions(user_id=int(user["id"]))
    return schemas.SessionsListResponse(status="success", sessions=sessions)


@app.get(
    "/api/v1/sessions/{session_id}",
    response_model=schemas.SessionDetailResponse,
    responses={
        401: {"model": schemas.ErrorResponse},
        404: {"model": schemas.ErrorResponse},
        500: {"model": schemas.ErrorResponse},
    },
)
async def get_session(
    session_id: int,
    user: dict = Depends(get_current_user),
) -> schemas.SessionDetailResponse:
    """Return full details for a single saved session owned by the caller."""
    session = services.get_session_by_id(session_id, user_id=int(user["id"]))
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )
    return schemas.SessionDetailResponse(status="success", session=session)


@app.delete(
    "/api/v1/sessions/{session_id}",
    response_model=schemas.DeleteSessionResponse,
    responses={
        401: {"model": schemas.ErrorResponse},
        404: {"model": schemas.ErrorResponse},
        500: {"model": schemas.ErrorResponse},
    },
)
async def delete_session_endpoint(
    session_id: int,
    user: dict = Depends(get_current_user),
) -> schemas.DeleteSessionResponse:
    """Delete a saved practice session owned by the caller."""
    deleted = services.delete_session(session_id, user_id=int(user["id"]))
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )
    return schemas.DeleteSessionResponse(
        status="success",
        message="Session deleted successfully.",
    )


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------
@app.get(
    "/api/v1/dashboard/stats",
    response_model=schemas.DashboardStatsResponse,
    responses={401: {"model": schemas.ErrorResponse}, 500: {"model": schemas.ErrorResponse}},
)
async def dashboard_stats(
    user: dict = Depends(get_current_user),
) -> schemas.DashboardStatsResponse:
    """Return aggregate dashboard statistics for the authenticated user."""
    stats = services.get_dashboard_stats(user_id=int(user["id"]))
    return schemas.DashboardStatsResponse(status="success", **stats)


# ---------------------------------------------------------------------------
# User Analytics & Profile
# ---------------------------------------------------------------------------
@app.get(
    "/api/v1/users/me/analytics",
    response_model=schemas.UserAnalyticsResponse,
    responses={401: {"model": schemas.ErrorResponse}, 500: {"model": schemas.ErrorResponse}},
)
async def user_analytics(
    user: dict = Depends(get_current_user),
) -> schemas.UserAnalyticsResponse:
    """Return progress analytics for the authenticated user only.

    Never reads another user's sessions: every query is scoped by user_id.
    """
    data = services.get_user_analytics(user_id=int(user["id"]))
    return schemas.UserAnalyticsResponse(status="success", **data)


@app.get(
    "/api/v1/users/me/profile",
    response_model=schemas.UserProfileResponse,
    responses={401: {"model": schemas.ErrorResponse}, 500: {"model": schemas.ErrorResponse}},
)
async def user_profile(
    user: dict = Depends(get_current_user),
) -> schemas.UserProfileResponse:
    """Return account profile + lightweight activity summary for the caller."""
    data = services.get_user_profile_summary(user)
    return schemas.UserProfileResponse(status="success", **data)


# ---------------------------------------------------------------------------
# Report Export
# ---------------------------------------------------------------------------
@app.get(
    "/api/v1/reports/{session_id}/html",
    response_model=schemas.ReportExportResponse,
    responses={
        401: {"model": schemas.ErrorResponse},
        404: {"model": schemas.ErrorResponse},
        500: {"model": schemas.ErrorResponse},
    },
)
async def export_html_report(
    session_id: int,
    user: dict = Depends(get_current_user),
) -> schemas.ReportExportResponse:
    """Export an HTML report for a saved session owned by the caller."""
    session = services.get_session_by_id(session_id, user_id=int(user["id"]))
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )
    try:
        content = services.generate_html_report(session)
        filename = services.build_report_filename(session_id, "html")
        return schemas.ReportExportResponse(
            status="success",
            filename=filename,
            content=content,
        )
    except Exception:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate HTML report.",
        )


@app.get(
    "/api/v1/reports/{session_id}/csv",
    response_model=schemas.ReportExportResponse,
    responses={
        401: {"model": schemas.ErrorResponse},
        404: {"model": schemas.ErrorResponse},
        500: {"model": schemas.ErrorResponse},
    },
)
async def export_csv_report(
    session_id: int,
    user: dict = Depends(get_current_user),
) -> schemas.ReportExportResponse:
    """Export a CSV report for a saved session owned by the caller."""
    session = services.get_session_by_id(session_id, user_id=int(user["id"]))
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )
    try:
        content = services.generate_csv_report(session)
        filename = services.build_report_filename(session_id, "csv")
        return schemas.ReportExportResponse(
            status="success",
            filename=filename,
            content=content,
        )
    except Exception:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate CSV report.",
        )


# ---------------------------------------------------------------------------
# Coaching Plan
# ---------------------------------------------------------------------------
@app.get(
    "/api/v1/users/me/coaching-plan",
    response_model=schemas.CoachingPlanResponse,
    responses={401: {"model": schemas.ErrorResponse}},
)
async def coaching_plan(
    user: dict = Depends(get_current_user),
) -> schemas.CoachingPlanResponse:
    """Return a personalized coaching plan based on the user's practice history."""
    plan = services.generate_coaching_plan(user_id=int(user["id"]))
    return schemas.CoachingPlanResponse(status="success", **plan)


# ---------------------------------------------------------------------------
# Robot Coach Lesson
# ---------------------------------------------------------------------------
@app.post(
    "/api/v1/coach/robot-lesson",
    response_model=schemas.RobotLessonResponse,
    responses={
        400: {"model": schemas.ErrorResponse},
        401: {"model": schemas.ErrorResponse},
        404: {"model": schemas.ErrorResponse},
        500: {"model": schemas.ErrorResponse},
    },
)
async def robot_lesson(
    payload: schemas.RobotLessonRequest,
    user: dict = Depends(get_current_user),
) -> schemas.RobotLessonResponse:
    """Generate a robot coach lesson from a saved session owned by the caller."""
    try:
        result = services.generate_robot_lesson(
            session_id=payload.session_id,
            user_id=int(user["id"]),
            lesson_type=payload.lesson_type,
            focus_area=payload.focus_area,
        )
        return schemas.RobotLessonResponse(**result)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Robot lesson generation failed: {exc}",
        )


# ---------------------------------------------------------------------------
# User Goals
# ---------------------------------------------------------------------------
@app.get(
    "/api/v1/users/me/goals",
    response_model=schemas.GoalsListResponse,
    responses={401: {"model": schemas.ErrorResponse}},
)
async def list_goals(
    user: dict = Depends(get_current_user),
) -> schemas.GoalsListResponse:
    """List all goals for the authenticated user."""
    goals = services.get_user_goals_service(user_id=int(user["id"]))
    return schemas.GoalsListResponse(goals=[schemas.GoalResponse(**g) for g in goals])


@app.post(
    "/api/v1/users/me/goals",
    response_model=schemas.GoalDetailResponse,
    status_code=status.HTTP_201_CREATED,
    responses={400: {"model": schemas.ErrorResponse}, 401: {"model": schemas.ErrorResponse}},
)
async def create_goal(
    payload: schemas.GoalCreateRequest,
    user: dict = Depends(get_current_user),
) -> schemas.GoalDetailResponse:
    """Create a new goal for the authenticated user."""
    goal = services.create_user_goal_service(
        user_id=int(user["id"]),
        title=payload.title,
        target_metric=payload.target_metric,
        target_value=payload.target_value,
        current_value=payload.current_value,
    )
    return schemas.GoalDetailResponse(goal=schemas.GoalResponse(**goal))


@app.patch(
    "/api/v1/users/me/goals/{goal_id}",
    response_model=schemas.GoalDetailResponse,
    responses={401: {"model": schemas.ErrorResponse}, 404: {"model": schemas.ErrorResponse}},
)
async def update_goal(
    goal_id: int,
    payload: schemas.GoalUpdateRequest,
    user: dict = Depends(get_current_user),
) -> schemas.GoalDetailResponse:
    """Update an existing goal owned by the authenticated user."""
    kwargs = {k: v for k, v in payload.model_dump().items() if v is not None}
    goal = services.update_user_goal_service(
        goal_id=goal_id,
        user_id=int(user["id"]),
        **kwargs,
    )
    if goal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found.",
        )
    return schemas.GoalDetailResponse(goal=schemas.GoalResponse(**goal))


@app.delete(
    "/api/v1/users/me/goals/{goal_id}",
    response_model=schemas.GoalDeleteResponse,
    responses={401: {"model": schemas.ErrorResponse}, 404: {"model": schemas.ErrorResponse}},
)
async def delete_goal(
    goal_id: int,
    user: dict = Depends(get_current_user),
) -> schemas.GoalDeleteResponse:
    """Delete a goal owned by the authenticated user."""
    deleted = services.delete_user_goal_service(goal_id=goal_id, user_id=int(user["id"]))
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found.",
        )
    return schemas.GoalDeleteResponse(
        status="success",
        message="Goal deleted successfully.",
    )
