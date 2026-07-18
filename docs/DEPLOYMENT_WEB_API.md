# PitchPilot AI — Web + API Deployment Guide

This guide covers deploying the **FastAPI backend** and **React frontend** together using Docker Compose for production, plus local development commands.

---

## Quick Start (Production Docker)

```bash
# 1. Copy the production environment template
cp .env.production.example .env

# 2. Edit .env with your real values (especially AI_API_KEY and CORS_ORIGINS)
nano .env

# 3. Build and start both services
docker compose -f docker-compose.prod.yml up --build -d

# 4. Check health
curl http://localhost:8000/health
curl http://localhost:3000
```

| Service | URL | Purpose |
|---------|-----|---------|
| API | `http://localhost:8000` | FastAPI backend |
| Web | `http://localhost:3000` | React frontend (nginx) |
| API Docs | `http://localhost:8000/docs` | Interactive Swagger UI |

---

## Local Development (No Docker)

### Backend

```bash
# 1. Activate virtual environment
source .venv/bin/activate

# 2. Run with auto-reload
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://127.0.0.1:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server will be available at `http://localhost:5173` and proxies `/api` to the backend automatically (see `vite.config.ts`).

---

## Environment Variables

### Backend (`PITCHPILOT_*`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PITCHPILOT_ENV` | `development` | `development` or `production`. Controls CORS strictness. |
| `PITCHPILOT_DB_PATH` | `./data/pitchpilot.db` | SQLite database file path. |
| `PITCHPILOT_UPLOAD_DIR` | `./uploads/api` | Temporary directory for uploaded videos. |
| `PITCHPILOT_CORS_ORIGINS` | `*` (dev only) | Comma-separated list of allowed frontend origins. **Required in production.** |
| `PITCHPILOT_MAX_UPLOAD_MB` | `200` | Maximum uploaded file size in megabytes. |
| `PITCHPILOT_AI_API_KEY` | — | OpenAI-compatible API key (Gemini keys work via the OpenAI-compatible endpoint). |
| `PITCHPILOT_AI_BASE_URL` | — | Provider base URL. Default template targets Gemini: `https://generativelanguage.googleapis.com/v1beta/openai/`. For OpenAI use `https://api.openai.com/v1`. |
| `PITCHPILOT_AI_MODEL` | — | Model name (e.g., `gemini-3.5-flash`, `gpt-4o-mini`). |
| `PITCHPILOT_JWT_SECRET` | `dev-insecure-secret-change-me` (dev only) | HMAC-SHA256 signing key for auth JWTs. **Required and must be replaced in production.** |
| `PITCHPILOT_JWT_EXPIRES_MINUTES` | `1440` | Token lifetime in minutes (default 24 h). |

### Frontend (`VITE_*`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://127.0.0.1:8000` | Backend API URL. Baked into the bundle at **build time**. |

> **Important:** `VITE_API_BASE_URL` is baked into the frontend at Docker build time. If you change the API domain later, you must rebuild the frontend image.

---

## CORS Configuration

### Development

If `PITCHPILOT_ENV` is `development` and `PITCHPILOT_CORS_ORIGINS` is empty, CORS defaults to `allow_origins=["*"]`. This is convenient for local dev but **unsafe for production**.

### Production

Set explicit origins:

```bash
PITCHPILOT_ENV=production
PITCHPILOT_CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

The backend will reject requests from any origin not in this list.

> **Safety net:** when `PITCHPILOT_ENV=production`, the API refuses `*` as an
> origin even if it appears in `PITCHPILOT_CORS_ORIGINS`. If no valid origins
> remain, it falls back to `http://localhost:3000` so the service is never
> left with a wildcard in production.

---

## Authentication (JWT)

Starting in **v1.2.0**, the backend requires JWT auth for all analysis, session, dashboard, and report endpoints.

### Setup

1. Generate a strong secret:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(64))"
   ```
2. Put it in `.env`:
   ```bash
   PITCHPILOT_JWT_SECRET=<paste output above>
   PITCHPILOT_JWT_EXPIRES_MINUTES=1440
   ```
3. Restart the API container / process.

> **Production safety net:** if `PITCHPILOT_ENV=production` and the secret is missing or left as `dev-insecure-secret-change-me`, the API refuses to start. Never ship the default secret to production.

### Auth endpoints (public — no token needed to call them)

| Method | Path | Body | Returns |
|--------|------|------|---------|
| `POST` | `/auth/register` | `{ name, email, password }` | `{ access_token, token_type, user }` |
| `POST` | `/auth/login`    | `{ email, password }`         | `{ access_token, token_type, user }` |
| `POST` | `/auth/logout`   | (Authorization header)         | `{ status: "ok" }` |
| `GET`  | `/auth/me`       | (Authorization header)         | `{ id, name, email, created_at }` |

### Protected endpoints (require `Authorization: Bearer <token>`)

- `POST /api/v1/analyze/full`
- `GET /api/v1/sessions`
- `GET /api/v1/sessions/{session_id}`
- `DELETE /api/v1/sessions/{session_id}`
- `GET /api/v1/dashboard/stats`
- `GET /api/v1/reports/{session_id}/html`
- `GET /api/v1/reports/{session_id}/csv`

Every row these endpoints read/write is scoped to `user_id = current_user.id`. Users cannot query, modify, or export another user's sessions.

### Public endpoints (no token needed)

- `GET /health`, `GET /`
- `GET /api/v1/questions/modes`
- `GET /api/v1/questions/{mode}`
- `GET /api/v1/questions/{mode}/random`
- `GET /api/v1/questions/{mode}/default-role`

Practice modes and questions load before login so guests can browse the Practice page. **Run Full Analysis** is guarded client-side and server-side and requires a valid JWT.

### Frontend `Authorization` header

- **React (`frontend/`):** `AuthContext` persists the JWT in `localStorage` (`pitchpilot_auth_token`) and wires `pitchpilotApi.setAuthTokenProvider` so every request auto-attaches `Authorization: Bearer <token>`. HTTP 401 clears local state and redirects to `/login`.
- **Expo mobile (`mobile/`):** `AuthContext` persists the JWT in `AsyncStorage` (`pitchpilot_auth_token`). The shared `pitchpilotApi.ts` reads it via `setAuthTokenProvider` and attaches the header to `apiFetch` and `analyzeFullVideo`. A 401 clears storage and bounces the user through the login screen.
- **Do not** set a `Content-Type: multipart/form-data` header manually — let `fetch` compute the boundary. The only auth header the client sets is `Authorization`.

### Common auth errors and fixes

| Symptom | Likely cause | Fix |
|---|---|---|
| `401 Not authenticated` on protected route | Missing/expired JWT or the `Authorization` header did not reach the backend | Log in again; check DevTools → Network for the `Authorization` header on the failing request. |
| `401 Invalid token` after a rebuild | `PITCHPILOT_JWT_SECRET` changed → old tokens no longer verify | Log out and back in; keep the secret stable across deploys. |
| Frontend loops between `/login` and `/dashboard` | `VITE_API_BASE_URL` points at a host the browser cannot reach → every request errors, treated as unauthenticated | Set `VITE_API_BASE_URL` to the browser-facing API URL and rebuild the web image. |
| Mobile web `HTTP 400: Bad Request` on Run Analysis | Multipart upload missing filename or `question`/`role` fields | Update to the current mobile client (uses `File` on web / `{ uri, name, type }` on native); required form fields are always sent. |
| `500` from `/auth/register` in production | Refuses to boot because default `PITCHPILOT_JWT_SECRET` is still in `.env` | Replace with a random 64-byte URL-safe secret and restart. |
| `403 Forbidden` viewing another user's session | Intentional — sessions are user-scoped | Log in as the owning user; there is no cross-user access by design. |

---

## Upload Safety

| Setting | Default | What It Does |
|---------|---------|--------------|
| Max size | `200` MB | Rejects files larger than `PITCHPILOT_MAX_UPLOAD_MB` with HTTP 413. |
| Allowed types | `.mp4`, `.mov` | Rejects any other extension with HTTP 400. |
| Temp cleanup | automatic | Uploaded files are deleted after analysis completes or on error. |
| Upload dir | configurable | Set `PITCHPILOT_UPLOAD_DIR` to control where temp files land. |

---

## SQLite Volume Note

The production compose uses a named Docker volume for SQLite:

```yaml
volumes:
  pitchpilot-data:
```

This means:
- ✅ Database survives container restarts and rebuilds.
- ⚠️ If you delete the volume (`docker volume rm pitchpilot-data`), all history is gone.
- 💡 For backup, copy `/app/data/pitchpilot.db` from the container or mount a host path instead.

To mount a host path for easier backup access:

```yaml
volumes:
  - ./data:/app/data
```

---

## Common Errors & Fixes

### "Network error" from frontend

- Check that the API container is running: `docker compose -f docker-compose.prod.yml ps`
- Verify `PITCHPILOT_CORS_ORIGINS` includes the frontend origin.
- Check browser DevTools Network tab for CORS preflight failures.

### "File too large" (HTTP 413)

- Increase `PITCHPILOT_MAX_UPLOAD_MB` in `.env`.
- Also check nginx `client_max_body_size` if you customized `frontend/nginx.conf`.

### "Only .mp4, .mov files are supported" (HTTP 400)

- The backend now accepts both `.mp4` and `.mov`. If you get this error, verify the file extension.

### Database permission errors inside Docker

- Ensure the `data` directory is writable by the container user.
- The `Dockerfile.api` creates `/app/data` explicitly. If using a host bind mount, run:
  ```bash
  mkdir -p data && chmod 777 data
  ```

### Frontend shows blank page after deployment

- `VITE_API_BASE_URL` must be the **browser-facing** URL, not the internal Docker network URL.
- Example: if you expose the API on `https://api.mydomain.com`, set `VITE_API_BASE_URL=https://api.mydomain.com` before building.

### Health check fails

- The API container has a `HEALTHCHECK` that polls `/health`.
- If it keeps failing, check logs: `docker logs pitchpilot-api`
- Common cause: faster-whisper model downloading on first startup (can take a minute).

---

## File Overview

| File | Purpose |
|------|---------|
| `Dockerfile.api` | FastAPI backend container |
| `frontend/Dockerfile` | React frontend container (multi-stage build) |
| `frontend/nginx.conf` | Nginx static server config for SPA routing |
| `docker-compose.prod.yml` | Production orchestration (API + Web + volumes) |
| `.env.production.example` | Production environment template |
| `frontend/.env.example` | Frontend dev environment template |
| `frontend/.env.production.example` | Frontend build environment template |
| `api/config.py` | Backend settings loaded from environment variables |
| `docs/DEPLOYMENT_WEB_API.md` | This guide |

---

## Rebuild After Code Changes

```bash
# Rebuild both services
docker compose -f docker-compose.prod.yml up --build -d

# Rebuild only API
docker compose -f docker-compose.prod.yml up --build -d api

# Rebuild only frontend (e.g., after changing VITE_API_BASE_URL)
docker compose -f docker-compose.prod.yml up --build -d web
```

---

## Stop Everything

```bash
docker compose -f docker-compose.prod.yml down

# To also delete persistent volumes (WARNING: deletes all history)
docker compose -f docker-compose.prod.yml down -v
```
