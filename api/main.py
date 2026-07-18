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
from pathlib import Path
from typing import Any, Optional

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware

from api import config, schemas, services
from api.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from core.database import (
    create_user as _db_create_user,
    get_user_by_email as _db_get_user_by_email,
    init_db,
)

# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------
app = FastAPI(
    title="PitchPilot AI API",
    description="Backend API for AI-powered interview and presentation coaching.",
    version="1.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
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
# Startup — ensure database and directories are initialized
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def _startup() -> None:
    config.ensure_dirs()
    init_db()


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
async def register(payload: schemas.RegisterRequest) -> schemas.AuthTokenResponse:
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
async def login(payload: schemas.LoginRequest) -> schemas.AuthTokenResponse:
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
async def analyze_full_endpoint(
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
