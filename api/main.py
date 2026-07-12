"""api/main.py
=============
FastAPI application for the PitchPilot AI backend API.

Provides REST endpoints for:
- AI Coach transcript analysis
- Final performance scoring
- Question bank queries

Run locally:
    python -m uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
"""

import traceback
from typing import Any

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from api import schemas, services

# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------
app = FastAPI(
    title="PitchPilot AI API",
    description="Backend API for AI-powered interview and presentation coaching.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS — allow React / Vue / mobile dev servers
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8081",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8081",
    ],
    allow_credentials=True,
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
# Meta
# ---------------------------------------------------------------------------
@app.get("/", response_model=schemas.MetaResponse)
async def root() -> schemas.MetaResponse:
    return schemas.MetaResponse(
        app="PitchPilot AI API",
        version="1.0.0",
        status="running",
    )


@app.get("/health", response_model=schemas.HealthResponse)
async def health() -> schemas.HealthResponse:
    return schemas.HealthResponse(status="ok")


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
# Final Score
# ---------------------------------------------------------------------------
@app.post(
    "/api/v1/score/final",
    response_model=schemas.FinalScoreResponse,
    responses={500: {"model": schemas.ErrorResponse}},
)
async def final_score(payload: schemas.FinalScoreRequest) -> schemas.FinalScoreResponse:
    """
    Calculate the overall performance score from analysis results.

    Requires video, camera, and speech results. AI result is optional.
    """
    try:
        result = services.calculate_final_score(
            video_result=payload.video_result,
            camera_result=payload.camera_result,
            speech_result=payload.speech_result,
            ai_result=payload.ai_result,
        )
        return schemas.FinalScoreResponse(**result)
    except HTTPException:
        raise
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scoring failed: {exc}",
        )


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
