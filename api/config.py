"""api/config.py
===============
Production-ready configuration loaded from environment variables.

Uses python-dotenv (already in requirements.txt) to optionally load a .env file.
All values have safe defaults so the app runs out of the box in development.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env file if present (no-op in production where env vars are injected)
load_dotenv()


def _env_bool(key: str, default: bool = False) -> bool:
    val = os.getenv(key, "").lower().strip()
    if val in ("1", "true", "yes", "on"):
        return True
    if val in ("0", "false", "no", "off"):
        return False
    return default


def _env_list(key: str, default: list[str] | None = None) -> list[str]:
    val = os.getenv(key, "").strip()
    if not val:
        return default or []
    return [item.strip() for item in val.split(",") if item.strip()]


# ---------------------------------------------------------------------------
# Core settings
# ---------------------------------------------------------------------------
ENV: str = os.getenv("PITCHPILOT_ENV", "development").lower()
IS_DEVELOPMENT: bool = ENV in ("development", "dev", "local", "test")
IS_PRODUCTION: bool = not IS_DEVELOPMENT

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DB_PATH: str = os.getenv("PITCHPILOT_DB_PATH", str(PROJECT_ROOT / "data" / "pitchpilot.db"))
UPLOAD_DIR: str = os.getenv("PITCHPILOT_UPLOAD_DIR", str(PROJECT_ROOT / "uploads" / "api"))

# ---------------------------------------------------------------------------
# Upload safety
# ---------------------------------------------------------------------------
MAX_UPLOAD_MB: int = int(os.getenv("PITCHPILOT_MAX_UPLOAD_MB", "200"))
MAX_UPLOAD_BYTES: int = MAX_UPLOAD_MB * 1024 * 1024
ALLOWED_UPLOAD_EXTENSIONS: set[str] = {".mp4", ".mov"}

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
CORS_ORIGINS: list[str] = _env_list("PITCHPILOT_CORS_ORIGINS")

if IS_DEVELOPMENT and not CORS_ORIGINS:
    # Convenient local default — permissive origins for dev only.
    CORS_ORIGINS = ["*"]

if IS_PRODUCTION:
    # In production, never allow the wildcard origin. If someone passes "*"
    # via env, strip it and fall back to an explicit safe default so the API
    # is not accidentally left open.
    CORS_ORIGINS = [o for o in CORS_ORIGINS if o != "*"]
    if not CORS_ORIGINS:
        CORS_ORIGINS = ["http://localhost:3000"]

# ---------------------------------------------------------------------------
# AI Provider
# ---------------------------------------------------------------------------
AI_API_KEY: str | None = os.getenv("PITCHPILOT_AI_API_KEY") or None
AI_BASE_URL: str | None = os.getenv("PITCHPILOT_AI_BASE_URL") or None
AI_MODEL: str | None = os.getenv("PITCHPILOT_AI_MODEL") or None

# ---------------------------------------------------------------------------
# Derived helpers
# ---------------------------------------------------------------------------


def ensure_dirs() -> None:
    """Create upload and data directories if they don't exist."""
    Path(UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
