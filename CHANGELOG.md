# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v1.4.0] - 2026-07-20

### Robot Coach Lesson Mode (Task 58)

### Added
- **Robot Coach Lesson endpoint** — `POST /api/v1/coach/robot-lesson` generates an AI-powered or rule-based video-style lesson from a saved session. Protected by JWT with strict user-scoped session lookup so User A cannot access User B's sessions.
- **Lesson content structure** — Each lesson includes title, coach name (`Coach Nova`), problem summary, why-it-matters explanation, correct method, better example, practice steps, spoken script, subtitles with timestamps, and estimated duration.
- **AI-powered generation** — When `PITCHPILOT_AI_API_KEY` is configured, the backend calls the LLM with a structured JSON prompt using session transcript, weaknesses, strengths, and overall score to produce a personalized lesson.
- **Rule-based fallback** — Five focus-area templates (`answer_structure`, `speech`, `body_language`, `confidence`, `overall`) provide instant offline lessons. The problem summary is personalized with the user's actual weaknesses from the session.
- **React Robot Coach page** (`/robot-coach`) — Video-style lesson screen with dark premium background, animated robot avatar with pulse/speak animation, subtitle player synced to playback, progress bar, play/pause/replay controls, browser text-to-speech (`window.speechSynthesis`), and four lesson cards (What Went Wrong, Why It Matters, Correct Method, Better Example) plus a Practice Steps checklist.
- **Feedback page integration** — "Robot Coach Lesson" button appears on the Feedback page when a `session_id` exists, navigating to `/robot-coach` with the session ID.
- **Mobile Robot Coach card** — Simple glass-morphism card on the mobile Feedback screen with Coach Nova avatar, description, and "Open Robot Coach" button as an entry point.
- **Backend tests** — `tests/test_robot_coach.py` adds 5 tests covering auth requirement (401), cross-user session isolation (404), fallback generation without AI key, response structure (spoken_script, practice_steps, subtitles, duration), and all focus_area variants.
- **Documentation** — `docs/ROBOT_COACH_LESSON.md` covers purpose, endpoint, request/response format, AI vs fallback behavior, frontend playback behavior, mobile simplification, limitations, and future roadmap. `docs/ROBOT_COACH_QA_V1_4.md` provides the full QA checklist for backend endpoints, web flow, mobile card, auth isolation, browser TTS, and fallback mode.
- **E2E tests** — `frontend/e2e/robot-coach.spec.ts` adds 2 lightweight Playwright tests: protected route redirect when logged out, and friendly empty state when no session context is provided.

### Changed
- `frontend/src/pages/FeedbackPage.tsx` — adds "Robot Coach Lesson" button next to export buttons when `sessionId` is present.
- `frontend/src/App.tsx` — adds lazy-loaded `/robot-coach` protected route.
- `README.md` — adds Robot Coach Lesson to the Key Features table and a dedicated "AI Robot Coach Lesson Mode" section with usage flow.
- `RELEASE_NOTES.md` — adds v1.4.0 release notes with summary, feature breakdown, upgrade notes, and known limitations.

---

## [v1.3.0] - 2026-07-19

### Coaching & Goals Stabilization

### Added
- **Personalized coaching plan** — `GET /api/v1/users/me/coaching-plan` returns a rule-based coaching plan derived from the user's practice history (focus area, current level, weekly goal, recommended practice mode/question, action steps, metrics to watch, next milestone). Optional AI-powered coaching note when `PITCHPILOT_AI_API_KEY` is configured.
- **Goals CRUD** — `GET /api/v1/users/me/goals`, `POST /api/v1/users/me/goals`, `PATCH /api/v1/users/me/goals/{id}`, `DELETE /api/v1/users/me/goals/{id}` with full user isolation. Goals track title, target metric, target value, current value, status (`active` | `completed` | `abandoned`), and `completed_at` timestamp.
- **React `/coaching-plan` page** — Protected route with animated cards for focus area, weekly goal, action steps, next milestone, recommended practice, and AI coaching note. Includes inline goal creation form, progress bars, complete/delete actions, and active/completed goal filtering.
- **Mobile `CoachingPlanCard`** — Reusable glass-morphism card on Home and Settings screens. Handles logged-out (login prompt), loading, error, and success states. Deep-links to Practice with the recommended mode and question.
- **Backend tests** — `tests/test_coaching_plan_and_goals.py` adds 17 tests covering coaching plan auth, beginner state, weakness reflection, goals CRUD, update/delete 404s, and cross-user isolation for goals, sessions, and reports.
- **Full-system QA doc** — `docs/FULL_SYSTEM_QA_V1_3.md` with automated command checklist, endpoint coverage matrix, user isolation scenarios, React/mobile static verification, known limitations, and v1.4.0 roadmap.

### Changed
- `frontend/src/pages/DashboardPage.tsx` — adds sidebar link to `/coaching-plan`.
- `frontend/src/components/Sidebar.tsx` — adds "Coaching Plan" nav item with `authOnly: true`.
- `mobile/src/app/index.tsx` — renders `<CoachingPlanCard />` on the Home screen.
- `mobile/src/app/settings.tsx` — renders `<CoachingPlanCard compact />` in the account area.

### Fixed
- `api/schemas.py` — `GoalUpdateRequest.status` pattern corrected to `^(active|completed|abandoned)$`.
- `api/main.py` — all coaching plan and goals endpoints correctly require `Depends(get_current_user)`.

### Production Cleanup (Task 49)
- **React code splitting** — `DashboardPage`, `HistoryPage`, `FeedbackPage`, `CoachingPlanPage`, and `SettingsPage` are now loaded via `React.lazy` + `Suspense`. Added `LoadingScreen` component with "Loading PitchPilot AI..." fallback. Main production chunk reduced from ~779 kB to ~363 kB; Vite chunk-size warning eliminated.
- **FastAPI lifespan migration** — Replaced deprecated `@app.on_event("startup")` with `contextlib.asynccontextmanager` lifespan context manager. Startup behavior (`config.ensure_dirs()` + `init_db()`) is unchanged. pytest deprecation warnings eliminated.

### Docker & Cloud Deployment (Task 50–51)
- **Docker deployment verified** — `docker-compose.prod.yml` validated, API and web images built and tested. Endpoints confirmed working: `/health`, `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/dashboard/stats`, `/api/v1/users/me/coaching-plan`, `/api/v1/users/me/goals`, `/api/v1/users/me/analytics`, `/api/v1/users/me/profile`.
- **`.dockerignore` updated** — Excludes frontend/mobile node_modules, dist, .expo, uploads, media, databases, and cache directories.
- **`docs/DEPLOYMENT_WEB_API.md` updated** — Added v1.3.0 protected endpoints, Docker verification commands, first-build-slow troubleshooting.
- **Cloud deployment planning documentation added** — New `docs/CLOUD_DEPLOYMENT_PLAN.md` covers VPS + Docker Compose (recommended), Render, Railway, Fly.io, and AWS/GCP/Azure high-level options. Includes architecture diagram, environment variables, Ubuntu deployment commands, HTTPS setup (Caddy/nginx/Cloudflare), backup strategy, and production safety checklist.

### VPS Production Package (Task 52)
- **`docker-compose.vps.yml`** — New production compose file with integrated Caddy reverse proxy (automatic HTTPS), API container (internal 8000), and web container (internal 80). Only ports 80/443 are exposed publicly.
- **`deployment/Caddyfile`** — Ready-to-use Caddy config with placeholder domains, reverse proxy routes, security headers, compression, and request body size limits.
- **Backup scripts** — `scripts/backup_sqlite.sh` (container-safe SQLite backup with auto-cleanup), `scripts/backup_uploads.sh` (volume tar.gz backup), `scripts/restore_sqlite.sh` (interactive restore with confirmation).
- **`scripts/deploy_vps.sh`** — One-command deployment helper that pulls git changes, validates compose, builds/starts containers, waits for health, and shows status.
- **`.env.production.example`** — Added `PUBLIC_WEB_DOMAIN` and `PUBLIC_API_DOMAIN` for deployment script integration.

### Security Hardening (Task 53)
- **API rate limiting** — New `api/rate_limiter.py` with lightweight in-memory per-IP rate limiting. Limits: `POST /auth/register` and `POST /auth/login` = 10 req/min; `POST /api/v1/analyze/full` = 5 req/hour. Returns HTTP 429 when exceeded.
- **JWT secret production safety** — API refuses to start in production if `PITCHPILOT_JWT_SECRET` is missing, blank, or set to a known placeholder (`dev-insecure-secret-change-me`, `replace_me`, etc.). Runtime check runs inside the lifespan startup hook.
- **CORS production safety** — Startup warning emitted when `PITCHPILOT_CORS_ORIGINS` is still at localhost defaults in production. Wildcard (`*`) is already stripped automatically.
- **Upload security verified** — Allowed extensions `.mp4`/`.mov` only, max size from `PITCHPILOT_MAX_UPLOAD_MB`, UUID-based safe filenames, temp files cleaned up in `try/except/finally`, no file paths exposed in responses.
- **Caddy security headers enhanced** — Added `Strict-Transport-Security` (HSTS) and `Permissions-Policy` to both frontend and API blocks in `deployment/Caddyfile`.
- **`.env.production.example` updated** — Added stronger warnings for JWT secret, CORS domains, and upload limit alignment with Caddy.
- **Security tests** — New `tests/test_security_hardening.py` with 12 tests covering unsafe JWT rejection, blank JWT rejection, CORS wildcard stripping, non-video upload rejection, empty upload rejection, auth requirements across 6 endpoints, and rate limiting on register/login.
- **`tests/conftest.py`** — Added autouse fixture to clear rate limiter buckets between tests, preventing cross-test interference.
- **Security documentation** — New `docs/SECURITY_HARDENING.md` with JWT rules, CORS setup, upload restrictions, rate limits, HTTPS headers, `.env` safety, deployment checklist, and incident response steps.

### VPS Launch Runbook (Task 54)
- **`docs/VPS_LAUNCH_RUNBOOK.md`** — Complete launch checklist covering: pre-launch requirements (VPS, domain, DNS, Docker, `.env`, secrets, Caddy, firewall), DNS propagation verification, UFW firewall commands, deployment commands (git pull, compose validation, `deploy_vps.sh`), health checks (API, frontend, register/login, dashboard, upload, coaching plan, goals), automated backup cron setup, rollback procedures (code revert + DB restore), weekly monitoring checklist (container status, disk usage, backups, restarts), and a common launch errors reference table with causes and fixes.

### CI/CD Release Pipeline (Task 55)
- **`.github/workflows/ci.yml`** — Replaced basic smoke-test workflow with a comprehensive 4-job CI pipeline:
  - `backend-tests` — Python 3.12 setup, system deps (`ffmpeg`, `libgl1`), pip dependency caching, `compileall` check, and full `pytest` suite (51 tests) with safe test environment variables.
  - `frontend-build` — Node.js 20, npm caching via `package-lock.json`, `npm ci`, and `npm run build`.
  - `mobile-typecheck` — Node.js 20, npm caching, `npm ci`, and `npx tsc --noEmit`.
  - `docker-config` — Validates both `docker-compose.prod.yml` and `docker-compose.vps.yml` without building images.
- **`README.md`** — Added GitHub Actions CI badge to the header.
- **`docs/VPS_LAUNCH_RUNBOOK.md`** — Added CI passing check to the pre-launch checklist.

---

## [v1.3.1] - 2026-07-20

### Playwright E2E Tests (Task 56)

### Added
- **Playwright E2E test suite** — `frontend/e2e/` with three spec files:
  - `auth.spec.ts` — homepage, register, login page loads; protected dashboard redirects to login when logged out.
  - `auth-flow.spec.ts` — full user journey: register → auto-login → dashboard → logout → re-login → logout → verify redirect.
  - `coaching-plan.spec.ts` — open `/coaching-plan`, verify empty/default state, create goal, complete goal, delete goal.
- **`frontend/playwright.config.ts`** — Chromium-only, `baseURL: http://127.0.0.1:5173`, `webServer` with `npm run dev`, CI-safe timeouts and retries.
- **Frontend package scripts** — `"test:e2e": "playwright test"` and `"test:e2e:ui": "playwright test --ui"`.
- **Stable test selectors** — Minimal `data-testid` attributes added to login email/password inputs, register name/email/password inputs, logout button, and coaching goal form fields (title, metric, target, save). `GradientButton` now forwards `React.ButtonHTMLAttributes` so `data-testid` propagates correctly.
- **CI E2E job** — `.github/workflows/ci.yml` gains an `e2e-tests` job that starts the FastAPI backend, installs Playwright Chromium, and runs the full E2E suite on every push/PR. Uses safe test environment variables and uploads the Playwright report on failure.
- **Documentation** — New `docs/E2E_TESTING.md` with prerequisites, local run instructions (Terminal 1 backend + Terminal 2 frontend), environment variables, test design principles, CI notes, troubleshooting table, and known limitations (no video upload E2E yet).

### Changed
- `README.md` — Added E2E testing section with run commands and reference to `docs/E2E_TESTING.md`.

---

## [v1.2.0] - 2026-07-19

### Authentication Release

### Added
- **User accounts** — email + password registration and login endpoints (`POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`) with `bcrypt` password hashing (passwords never persisted in plaintext)
- **JWT auth (HS256)** — signed access tokens issued by the API, verified via a shared `Depends(get_current_user)` dependency; token lifetime configurable via `PITCHPILOT_JWT_EXPIRES_MINUTES` (default 24 h)
- **User-scoped sessions** — `sessions` table gains a `user_id` FK; every read/write filters by the caller's id so User A cannot see, modify, export, or delete User B's data
- **Protected endpoints** — `POST /api/v1/analyze/full`, `GET/DELETE /api/v1/sessions[/{id}]`, `GET /api/v1/dashboard/stats`, `GET /api/v1/reports/{session_id}/{html,csv}` now require `Authorization: Bearer <token>`
- **Public endpoints preserved** — `GET /health`, `GET /`, and all `GET /api/v1/questions/…` routes stay open so the Practice page loads before login
- **React auth** — `AuthProvider` + `useAuth()` context, `<ProtectedRoute>` guard, `LoginPage`, `RegisterPage`, session-expired banner; JWT persisted in `localStorage` under `pitchpilot_auth_token`; shared API client auto-attaches the header via `setAuthTokenProvider` and logs users out on any 401
- **Mobile auth** — Expo `AuthContext` mirrors the web behavior with `AsyncStorage` persistence, premium dark Login/Register screens, and a Logout action in Settings; `pitchpilotApi.ts` injects `Authorization` on `apiFetch` and `analyzeFullVideo` and clears storage on 401
- **Config** — `PITCHPILOT_JWT_SECRET` and `PITCHPILOT_JWT_EXPIRES_MINUTES` in `.env.example` and `.env.production.example`; production API refuses to boot with the default insecure secret
- **Docs** — new `docs/AUTH_QA_CHECKLIST.md`, expanded auth sections in `README.md` and `docs/DEPLOYMENT_WEB_API.md`
- **Tests** — `tests/test_auth.py` covers registration, login, `/auth/me`, wrong password, duplicate email, expired/invalid tokens, and cross-user session isolation

### Changed
- `frontend/src/pages/PracticePage.tsx` — modes/questions now load for guests; **Run Full Analysis** redirects to `/login` with an inline message when the user is unauthenticated instead of blocking the whole page
- `mobile/src/api/pitchpilotApi.ts` — `analyzeFullVideo` now takes a platform-aware asset (`File` on Expo web, `{ uri, name, type }` on native) and always appends `question`, `role` (defaults to `General`), and `save_session`; backend error `detail` is surfaced in the UI instead of the generic `HTTP 400`
- `mobile/src/app/practice.tsx` — filters mode ids containing `/` (e.g. `AI/ML Interview`) so a single unmapped mode never blanks the screen; drops the client-side "role required" hard-error since the client now falls back to `General`

### Fixed
- Practice page no longer shows `Failed to load practice modes.` for unauthenticated visitors (public endpoints stay public)
- Mobile web `POST /api/v1/analyze/full` no longer returns `400 Bad Request` — the multipart body now carries a real filename on both web (`File` / typed `Blob`) and native (`{ uri, name, type }`)

### Security
- Passwords hashed with `bcrypt` (cost factor from `passlib` default)
- JWTs signed with HS256 using `PITCHPILOT_JWT_SECRET`; production start-up hard-fails on the placeholder secret
- CORS behavior unchanged: `PITCHPILOT_ENV=production` still refuses `*`

---


### Mobile Polish Release

### Added
- **Premium mobile UI redesign** — Dark navy SaaS aesthetic with cyan/blue accents, glass cards, gradient buttons, score ring, and custom bottom tab navigation
- **Safe-area and scroll fixes** — `paddingBottom: 100` on all screens to clear tab bar; iOS home indicator support (`paddingBottom: 24`, height `84`)
- **Keyboard avoidance** — Practice screen wraps ScrollView in `KeyboardAvoidingView` so the Target Role input stays visible when typing
- **Web preview centering** — `_layout.tsx` renders the app in a centered `maxWidth: 480` container on desktop browsers
- **Report export / share** — Feedback and History screens now use `expo-sharing` + `expo-file-system` for real native share sheets (web triggers browser download)
- **Settings persistence** — Save Practice History and Speech Analysis toggles are stored in AsyncStorage and survive app restarts
- **Save Practice History wired to backend** — Mobile sends `save_session` boolean to `POST /api/v1/analyze/full`; backend respects it and skips SQLite save when false
- **AI Interview coming-soon badge** — Purple "Soon" badge on the AI Interview tab; tapping it shows a friendly Alert instead of pretending to work
- **Speech Analysis toggle rename** — Formerly "Real-time Audio Analysis" (misleading); now accurately labeled "Speech Analysis" with helper text explaining it analyzes uploaded video audio
- **Mobile screenshot checklist** — `portfolio/MOBILE_SCREENSHOT_CHECKLIST.md` with 6 required shots, capture instructions, and DevTools viewport recommendations
- **Mobile screenshot folder docs** — `portfolio/screenshots/mobile/README.md` with expected filenames, sizes, and security reminders

### Changed
- Updated `README.md` with Mobile App Preview section and placeholder screenshot paths
- Updated `mobile/README.md` with premium UI overview, settings/export explanations, and known limitations

---

## [v2.0.0] - 2026-07-14

### Added
- **FastAPI backend** with full REST API exposing all core analyzers
  - `POST /api/v1/analyze/full` — end-to-end video analysis pipeline
  - `GET /api/v1/sessions` — list all saved sessions
  - `GET /api/v1/dashboard/stats` — aggregate dashboard statistics
  - `GET /api/v1/reports/{id}/html` and `/csv` — report export
  - Session history CRUD, question bank, AI coach, and final scoring endpoints
- **React web frontend** — premium dark SaaS UI built with Vite, TypeScript, Tailwind CSS, Recharts, and Framer Motion
  - Practice page with MP4 dropzone, mode/question selectors, random question button, and simulated progress animation
  - Feedback page with animated score ring, dimension breakdown, strengths/weak points, transcript preview, and AI model display
  - Dashboard with KPI cards, score progression chart, skill breakdown, and recent activity table
  - History with filter tabs, session detail panel, and report export
  - Settings for backend URL configuration
- **Expo mobile app** — cross-platform iOS/Android client
  - Practice screen with video picker, progress simulation, and full analysis result display
  - Dashboard with pull-to-refresh, KPI grid, skill bars, and recent sessions
  - History with session list, detail view, report export, and delete
  - Settings for backend URL and connection test
- **Save-to-history flow** — `POST /api/v1/analyze/full` automatically saves completed sessions to SQLite and returns `session_id`
- **Graceful save failure** — if database write fails, analysis still completes with `session_id: null` and `save_warning`
- **Multi-platform QA checklist** (`docs/MULTIPLATFORM_QA_CHECKLIST.md`) covering Streamlit, React, Mobile, and Backend

### Changed
- Updated `README.md` with multi-platform architecture diagram and run commands for all four surfaces
- Updated `mobile/README.md` with detailed backend URL matrix for emulator and physical phone
- Updated `portfolio/PROJECT_SUMMARY.md` to reflect web app, mobile app, and API backend support

---

## [v1.0.0] - 2026-07-12

### Added
- Streamlit MVP interface with multipage navigation (Home, Practice, Feedback, Dashboard, History, Settings)
- Video analysis using OpenCV (duration, FPS, resolution, movement score via optical flow)
- Camera presence analysis using OpenCV Haar Cascade (face visibility, framing, distance, movement level)
- Speech analysis using faster-whisper (transcription, word count, WPM, filler words, repeated words)
- AI Coach with intelligent rule-based fallback mode for offline use
- OpenAI-compatible API-ready design for real LLM-powered content analysis with structured JSON output
- Final scoring engine with weighted aggregation (Video 20%, Camera 30%, Speech 30%, Answer 20%)
- SQLite session history with save, browse, delete, and export functionality
- Dashboard with KPI metrics, trend charts, and component breakdowns
- History page with session inspection and HTML/CSV report export
- Demo Mode — load sample data instantly without uploading a video
- Role-based question bank with 7 curated practice modes (Software Dev, AI/ML, Data Analyst, University, Presentation, Sales, Behavioral)
- Random question picker for unpredictable practice sessions
- AI Settings page for configuring provider, testing connections, and managing temporary API keys
- Docker and Docker Compose support for containerized local deployment
- GitHub Actions CI workflow for automated compile checks and smoke tests on every push and PR
- Deployment configuration and documentation (DEPLOYMENT.md, docs/DOCKER.md)
- QA/smoke test support (`scripts/smoke_test.py`) verifying file structure, imports, database init, AI fallback, scoring engine, and report generation
- Portfolio demo package (`portfolio/`) with project summary, interview pitch guide, demo flow, resume bullets, and screenshot checklist
- Professional documentation package (README, Architecture, Demo Script, Interview Guide, Roadmap, QA Checklist, Final Checklist)
- Cross-platform support (Ubuntu and Windows)
- Shared sidebar UI component across all pages with custom CSS injection
- Ethical-use pledge and fair-use guidelines
- Security-conscious API key handling (environment variables and temporary session storage only, never persisted to disk)
