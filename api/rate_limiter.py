"""api/rate_limiter.py
=====================
Lightweight in-memory rate limiter for FastAPI endpoints.

Uses client IP + endpoint key as the limit bucket. Tracks request
timestamps in a simple list and prunes expired entries on every check.

Not suitable for multi-process deployments (no shared state across
workers). For high-scale production, replace with Redis.
"""

from __future__ import annotations

import time
from collections import defaultdict
from functools import wraps
from typing import Callable, Dict, List

from fastapi import HTTPException, Request, status


# ---------------------------------------------------------------------------
# Storage
# ---------------------------------------------------------------------------
_buckets: Dict[str, List[float]] = defaultdict(list)

# ---------------------------------------------------------------------------
# Core logic
# ---------------------------------------------------------------------------
def _key(client_ip: str, endpoint: str) -> str:
    return f"{client_ip}:{endpoint}"


def _clear_buckets() -> None:
    """Clear all rate-limit buckets. Useful for testing."""
    _buckets.clear()


def _is_rate_limited(client_ip: str, endpoint: str, max_requests: int, window_seconds: int) -> bool:
    """Return True if the client has exceeded the rate limit."""
    key = _key(client_ip, endpoint)
    now = time.time()
    cutoff = now - window_seconds

    # Prune expired timestamps and count remaining.
    entries = [ts for ts in _buckets[key] if ts > cutoff]
    _buckets[key] = entries

    if len(entries) >= max_requests:
        return True

    entries.append(now)
    return False


def rate_limit(max_requests: int, window_seconds: int, endpoint_name: str | None = None):
    """FastAPI-compatible decorator that limits requests by client IP.

    Parameters
    ----------
    max_requests : int
        Maximum number of requests allowed in the window.
    window_seconds : int
        Size of the sliding window in seconds.
    endpoint_name : str or None
        Override key for the endpoint. Defaults to the function name.
    """
    def decorator(func: Callable) -> Callable:
        name = endpoint_name or func.__name__

        @wraps(func)
        async def wrapper(*args, **kwargs):
            request: Request | None = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            if request is None:
                request = kwargs.get("request")

            if request is not None:
                client_ip = request.client.host if request.client else "unknown"
                if _is_rate_limited(client_ip, name, max_requests, window_seconds):
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Rate limit exceeded. Please try again later.",
                    )

            return await func(*args, **kwargs)

        return wrapper
    return decorator
