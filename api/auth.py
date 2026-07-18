"""api/auth.py
==============
Authentication helpers for the PitchPilot AI API.

- Password hashing via ``bcrypt``.
- JWT access tokens signed with ``PITCHPILOT_JWT_SECRET``.
- FastAPI ``get_current_user`` dependency that resolves the caller to a user row
  based on the ``Authorization: Bearer <token>`` header.

Design notes
------------
- Passwords are hashed with bcrypt using its native ``hashpw`` / ``checkpw`` API.
  We never persist plain passwords and never log tokens or secrets.
- Tokens are stateless JWTs. Logout is handled on the client (drop the token).
- The JWT secret comes exclusively from an environment variable. In dev, a
  weak default is used only if the env is missing so the app still boots for
  local development.
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from core.database import get_user_by_id

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
JWT_SECRET: str = os.getenv(
    "PITCHPILOT_JWT_SECRET",
    "dev-insecure-secret-change-me",
)
JWT_ALGORITHM = "HS256"
JWT_EXPIRES_MINUTES = int(os.getenv("PITCHPILOT_JWT_EXPIRES_MINUTES", "1440"))

# ``auto_error=False`` so we can return a clean JSON 401 instead of the default
# FastAPI ``Not authenticated`` response with WWW-Authenticate metadata.
_bearer_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False,
)


# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------
def hash_password(plain_password: str) -> str:
    """Hash a plain password with bcrypt and return the utf-8 encoded hash."""
    if not plain_password:
        raise ValueError("Password must not be empty.")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(plain_password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Return True if the plain password matches the stored bcrypt hash."""
    if not plain_password or not password_hash:
        return False
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            password_hash.encode("utf-8"),
        )
    except (ValueError, TypeError):
        return False


# ---------------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------------
def create_access_token(user_id: int, extra_claims: Optional[Dict[str, Any]] = None) -> str:
    """Create a signed JWT access token for the given user id."""
    now = datetime.now(timezone.utc)
    payload: Dict[str, Any] = {
        "sub": str(user_id),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=JWT_EXPIRES_MINUTES)).timestamp()),
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT access token. Raises 401 on any failure."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or malformed authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------
def get_current_user(
    token: Optional[str] = Depends(_bearer_scheme),
) -> Dict[str, Any]:
    """Resolve the caller's user row from a Bearer token. Raises 401 otherwise."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    sub = payload.get("sub")
    try:
        user_id = int(sub) if sub is not None else None
    except (TypeError, ValueError):
        user_id = None

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token subject.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = get_user_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
