# Release Notes — PitchPilot AI v1.3.0

**Release Date:** 2026-07-19
**Codename:** Coaching & Goals Stabilization

---

## Summary

PitchPilot AI v1.3.0 stabilizes the authentication foundation from v1.2.0 with personalized coaching plans, user goals, and comprehensive full-system QA. Every practice session now feeds into a rule-based coaching engine that recommends focus areas, weekly goals, and action steps. Users can create, track, complete, and delete goals from the React web app, while the mobile app surfaces a read-only coaching plan card with smart deep-linking to practice.

---

## What's New in v1.3.0

### Backend
- **Personalized coaching plan** — `GET /api/v1/users/me/coaching-plan` analyzes the user's session history to generate: focus area, current level (Beginner → Advanced), weekly goal, recommended practice mode/question, action steps, metrics to watch, and next milestone. Optionally enriches the plan with an AI-generated coaching note when an API key is available.
- **Goals CRUD** — Full lifecycle management via `GET /api/v1/users/me/goals`, `POST /api/v1/users/me/goals`, `PATCH /api/v1/users/me/goals/{id}`, `DELETE /api/v1/users/me/goals/{id}`. Goals are scoped by `user_id` and support `active`, `completed`, and `abandoned` statuses.
- **Cross-user isolation hardened** — New tests verify that User A cannot read, update, delete, or export User B's goals, sessions, or reports. All endpoints return `404` (not `403`) for cross-user access to avoid leaking existence.
- **Test coverage expanded** — 39 backend tests (up from 23) covering auth, analytics, coaching plan, goals, and isolation.

### React (frontend/)
- **New `/coaching-plan` page** — Premium dark UI with animated cards, inline goal creation, progress bars, complete/delete actions, and active/completed filtering. Protected by `<ProtectedRoute>`.
- **Sidebar navigation** — "Coaching Plan" link added to the sidebar with `authOnly: true`.
- **Dashboard integration** — Quick link from Dashboard to Coaching Plan.

### Mobile (mobile/)
- **CoachingPlanCard component** — Glass-morphism card displayed on Home and Settings. Four states: logged-out prompt, loading spinner, friendly error, and full coaching plan with "Start Recommended Practice" deep-link.
- **TypeScript clean** — `npx tsc --noEmit` passes with zero errors.

### Docs
- **Full-system QA report** — `docs/FULL_SYSTEM_QA_V1_3.md` documents every command, endpoint, test result, known limitation, and the v1.4.0 technical roadmap.

---

## Upgrade Notes

1. Existing SQLite databases from v1.2.x will be migrated on first boot to add the `user_goals` table (migration-safe via `init_db`).
2. Rebuild the React frontend after upgrading:
   ```bash
   cd frontend && npm run build
   ```
3. If you deploy via Docker Compose, rebuild both images:
   ```bash
   docker compose -f docker-compose.prod.yml up --build -d
   ```

---

## Known Limitations

- React production bundle chunk-size warning (~779 kB unminified). Non-breaking; optimization scheduled for v1.4.0.
- FastAPI `@app.on_event("startup")` deprecation warnings. Non-breaking; lifespan migration scheduled for v1.4.0.
- Mobile goals management is read-only (view coaching plan). Full CRUD on mobile is planned for v1.4.0.
- Speech analysis still requires a local faster-whisper model download on first run (~150 MB).
- Camera analysis uses Haar Cascade (fast but less accurate than deep-learning detectors).
- No cloud sync or multi-device backup; SQLite remains local-only.

---

# Release Notes — PitchPilot AI v1.2.0

**Release Date:** 2026-07-19
**Codename:** Authentication Release

---

## Summary

PitchPilot AI v1.2.0 introduces a complete authentication layer across the FastAPI backend, the React web app, and the Expo mobile app. Every practice session, dashboard chart, and exported report is now scoped to the logged-in user — you can safely deploy PitchPilot AI to a shared environment without users seeing each other's data.

---

## What's New in v1.2.0

### Backend
- **User accounts** with `email` + `password` — passwords hashed with `bcrypt`, never stored in plaintext
- **JWT auth (HS256)** signed with `PITCHPILOT_JWT_SECRET`, default 24 h lifetime configurable via `PITCHPILOT_JWT_EXPIRES_MINUTES`
- **New endpoints:** `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- **User-scoped sessions:** the `sessions` table now carries a `user_id` FK; every session, dashboard stat, and report is filtered by the caller's id
- **Protected routes:** `POST /api/v1/analyze/full`, `GET/DELETE /api/v1/sessions[/{id}]`, `GET /api/v1/dashboard/stats`, `GET /api/v1/reports/{session_id}/{html,csv}`
- **Still public:** `GET /health`, `GET /`, and all `GET /api/v1/questions/…` routes so the Practice page loads before login
- **Prod safety net:** the API refuses to boot when `PITCHPILOT_ENV=production` and `PITCHPILOT_JWT_SECRET` is left at the placeholder value

### React (frontend/)
- `AuthProvider` + `useAuth()` context with `<ProtectedRoute>` guard
- `LoginPage` and `RegisterPage` with inline error handling and post-login redirect
- JWT persisted in `localStorage` under `pitchpilot_auth_token`
- Shared API client auto-attaches `Authorization: Bearer <token>`; 401 clears state and returns the user to `/login` with a session-expired banner
- Practice page now loads modes/questions for guests and defers auth-gating to **Run Full Analysis**

### Mobile (mobile/)
- `AuthProvider` mirrors the web behavior with `AsyncStorage` persistence
- Premium dark Login and Register screens plus a Logout action in Settings
- `pitchpilotApi.ts` injects the `Authorization` header on every protected request and clears storage on 401
- Fixed multipart upload for `POST /api/v1/analyze/full` on Expo web and native (real filename always sent; `fetch` sets its own multipart boundary)

### Docs
- New [`docs/AUTH_QA_CHECKLIST.md`](docs/AUTH_QA_CHECKLIST.md) — end-to-end auth QA script (register/login/logout, protected 401, cross-user isolation, mobile & web upload)
- Expanded auth sections in [`README.md`](README.md#authentication--user-accounts) and [`docs/DEPLOYMENT_WEB_API.md`](docs/DEPLOYMENT_WEB_API.md#authentication-jwt)

### Tests
- `tests/test_auth.py` — 16 tests covering registration, login, `/auth/me`, wrong password, duplicate email, invalid/expired tokens, and cross-user session isolation

---

## Upgrade Notes

1. Add these to your `.env`:
   ```bash
   PITCHPILOT_JWT_SECRET=$(python -c "import secrets; print(secrets.token_urlsafe(64))")
   PITCHPILOT_JWT_EXPIRES_MINUTES=1440
   ```
2. Existing SQLite databases from v1.1.x will be migrated on first boot to add the `users` table and the `sessions.user_id` FK. Sessions created before the upgrade have `user_id = NULL` and are visible only to admins via direct SQL. Fresh installs are unaffected.
3. Rebuild the React frontend after upgrading so the auth pages ship with the bundle:
   ```bash
   cd frontend && npm run build
   ```
4. If you deploy via Docker Compose, rebuild both images: `docker compose -f docker-compose.prod.yml up --build -d`.

---

## Breaking Changes

- `POST /api/v1/analyze/full` now returns `401` without a valid JWT (previously anonymous). All API consumers must obtain a token from `/auth/login` and send `Authorization: Bearer <token>`.
- `GET /api/v1/sessions*`, `GET /api/v1/dashboard/stats`, and the report export endpoints likewise now require auth.
- The Streamlit desktop app remains unchanged; it talks to the analyzer modules directly, not to the HTTP API.

---


# Release Notes — PitchPilot AI v1.1.1

**Release Date:** 2026-07-16

---

## Summary

PitchPilot AI v1.1.1 is a **mobile polish release** focused on making the Expo mobile app production-ready for portfolio demos and screenshots. The premium dark UI is now fully implemented, all previously fake/visual-only features are wired or honestly labeled, and report export works via native share sheets.

---

## What's New in v1.1.1

### Premium Mobile UI
- Dark navy SaaS aesthetic (`#081225` background, cyan `#35d7ff` accents)
- Glass-morphism cards with borders and shadows
- Animated score ring using `react-native-svg`
- Gradient buttons with icon support
- Custom bottom tab bar with active indicator and icon backgrounds

### Safe Area & Scroll Polish
- All screens include `paddingBottom: 100` to clear the tab bar
- iOS home indicator handled (`paddingBottom: 24`, height `84`)
- Practice screen uses `KeyboardAvoidingView` to prevent keyboard overlap
- Web preview centers the app in a `maxWidth: 480` container

### Real Export / Share
- HTML and CSV reports can be shared via the native system share sheet on iOS/Android
- Web preview triggers automatic browser download
- Uses `expo-sharing` + `expo-file-system`

### Settings Persistence
- Save Practice History toggle — stored in AsyncStorage, sent to backend as `save_session`
- Speech Analysis toggle — stored in AsyncStorage (backend always runs speech analysis currently; toggle is UI-honest)
- Backend URL — persisted via AsyncStorage as before

### Honest UI (No Fake Behavior)
- AI Interview tab shows a purple "Soon" badge and Alert on tap — does not pretend to work
- Speech Analysis toggle is accurately labeled with helper text explaining it analyzes uploaded video audio
- Export buttons are disabled when no `session_id` exists

### Mobile Screenshot Package
- `portfolio/MOBILE_SCREENSHOT_CHECKLIST.md` — 6 required shots with capture instructions
- `portfolio/screenshots/mobile/README.md` — expected filenames, sizes, security reminders, and capture status table
- Screenshot image files are prepared for capture; see the checklist for step-by-step instructions

---

# Release Notes — PitchPilot AI v2.0.0

**Release Date:** 2026-07-14

---

## Summary

PitchPilot AI v2.0.0 is a major multi-platform release. In addition to the original Streamlit desktop demo, the project now ships with a **FastAPI backend**, a **React web frontend**, and an **Expo mobile app** — all sharing the same core AI analyzers and SQLite session database.

Users can now practice on desktop (Streamlit), browser (React), or phone (Expo), and every completed full analysis is automatically saved to history with exportable HTML/CSV reports.

---

## What's New in v2.0.0

### FastAPI Backend
- Full REST API exposing video, camera, speech, AI coach, and scoring analyzers
- `POST /api/v1/analyze/full` runs the complete pipeline and automatically saves the session
- `GET /api/v1/sessions`, `/dashboard/stats`, and `/reports/{id}/html|csv` for history and export
- Graceful failure handling — analysis completes even if the database save fails
- CORS enabled for React and mobile development

### React Web Frontend
- Premium dark SaaS UI built with Vite, TypeScript, Tailwind CSS, Recharts, and Framer Motion
- End-to-end practice flow: upload MP4 → run full analysis → view animated feedback → export reports
- Dashboard with score progression charts, skill breakdown, and recent activity
- History with filter tabs, session detail, and refresh
- Responsive layout for desktop and mobile web

### Expo Mobile App
- Cross-platform iOS/Android client with file-based routing
- Video upload, progress simulation, and full result display
- Dashboard and History with pull-to-refresh
- Settings for backend URL configuration and connection testing

### Multi-Platform Session Sync
- Any client that calls `POST /api/v1/analyze/full` creates a session in the shared SQLite database
- Dashboard and History reflect the latest data regardless of which client created it
- Report exports work from web, mobile, or Streamlit

---

## v1.0.0 Feature Recap

---

## Main Features

| Feature | Status | Description |
|---------|--------|-------------|
| Video Analysis | ✅ Ready | OpenCV-based motion analysis, duration/FPS/resolution extraction |
| Camera Presence | ✅ Ready | Haar Cascade face detection, framing, distance, and movement scoring |
| Speech Analysis | ✅ Ready | faster-whisper transcription with WPM, filler words, and repetition metrics |
| AI Coach | ✅ Ready | LLM-powered content analysis with intelligent rule-based fallback for offline use |
| Final Scoring | ✅ Ready | Weighted overall score (Video 20%, Camera 30%, Speech 30%, Answer 20%) |
| Dashboard | ✅ Ready | KPI cards, trend charts, and component breakdowns from SQLite history |
| Session History | ✅ Ready | Save, browse, inspect, delete, and export completed sessions |
| Report Export | ✅ Ready | Self-contained HTML and single-row CSV report generation |
| Demo Mode | ✅ Ready | One-click sample data loading for instant testing and presentations |
| Role-Based Question Bank | ✅ Ready | 7 curated practice modes with random question picker |
| AI Settings | ✅ Ready | Configure provider, test connections, and manage temporary API keys |
| Docker & CI | ✅ Ready | Dockerfile, docker-compose, and GitHub Actions workflow |
| Portfolio Package | ✅ Ready | Interview pitches, demo flow, resume bullets, and screenshot checklist |

---

## AI Capabilities

- **LLM Content Analysis** — OpenAI-compatible API integration with structured JSON output parsing; analyzes transcripts for structure, relevance, clarity, and role alignment
- **Intelligent Fallback Engine** — Custom rule-based NLP analysis that operates fully offline; detects introductions, education, experience, closings, role-specific keywords, and sentence variety
- **Prompt Engineering** — System prompt enforces JSON schema; user prompt includes speech metrics for richer contextual analysis
- **Connection Health Check** — Minimal test request to verify AI provider connectivity before analysis
- **Secure Key Handling** — API keys are never persisted to disk, SQLite, or logs; only environment variables or temporary session storage
- **Provider Flexibility** — Supports any OpenAI-compatible endpoint via configurable base URL, model name, and API key

---

## Computer Vision Features

- **Video Motion Analysis** — OpenCV optical flow on sampled frames to compute movement score; ideal for detecting excessive fidgeting or overly stiff posture
- **Face Detection** — Haar Cascade classifier detects face presence across sampled frames and computes face visibility percentage
- **Framing Analysis** — Calculates face center position and width/height ratios to classify framing as centered, off-center, too close, or too far
- **Distance Feedback** — Maps face size ratios to distance categories (good, too close, too far)
- **Movement Level Classification** — Categorizes face movement as low, medium, or high based on frame-to-frame displacement
- **Camera Score** — Composite 0–100 score combining visibility, framing, distance, and stability

---

## Speech Analysis Features

- **Audio Transcription** — faster-whisper (ONNX runtime) extracts full speech transcript from video audio track
- **Filler Word Detection** — Counts and lists common fillers: um, uh, like, you know, so
- **Words Per Minute (WPM)** — Calculates speaking pace from word count and audio duration
- **Repetition Detection** — Identifies repeated words that may indicate uncertainty or lack of vocabulary variety
- **Speech Scoring** — Composite 0–100 score based on pace, filler density, and repetition count
- **Warning System** — Surface-level alerts for excessive fillers, very slow/fast pace, or high repetition

---

## Question Bank & Practice Modes

Seven curated practice modes, each with 8 role-specific questions:

1. **Software Developer Interview** — Technical and behavioral questions for engineering roles
2. **AI/ML Interview** — Bias-variance, recommendation systems, model evaluation, gradient descent
3. **Data Analyst Interview** — SQL, visualization, data quality, cohort analysis
4. **University Admission Interview** — Academic strengths, challenges, career goals, leadership
5. **Presentation Practice** — Main idea explanation, audience handling, key takeaways
6. **Sales Pitch Practice** — Objection handling, discovery calls, pipeline prioritization
7. **Behavioral Interview** — STAR-method questions about pressure, conflict, failure, adaptation

- **Random Question Picker** — "🎲 Random" button selects an unpredictable question from the current mode
- **Target Role Auto-Fill** — Each mode pre-populates the target role input (customizable)

---

## Dashboard, History & Reports

- **Progress Dashboard** — Total sessions, average/best/latest scores, component averages; trend line chart and bar charts for Video, Camera, Speech, Answer breakdown
- **Session History** — Browse all saved sessions with metadata, transcript, strengths, weak points, and next practice task
- **HTML Report Export** — Self-contained, styled HTML document with score grid, session details, speech/camera tables, strengths, weak points, next task, summary, and transcript
- **CSV Report Export** — Single-row CSV with 20+ session metrics for spreadsheet analysis
- **Session Management** — Delete sessions with confirmation checkbox (permanent, from SQLite)

---

## Docker, CI & Deployment Support

- **Dockerfile** — Containerized Streamlit app with Python 3.12 base image
- **docker-compose.yml** — One-command local setup with port mapping and volume mounts
- **GitHub Actions CI** — Automated compile-check and smoke test on every push and pull request to `main`/`master`
- **Deployment Documentation** — [DEPLOYMENT.md](DEPLOYMENT.md) covers local run, Streamlit Cloud, Railway, Render, Heroku, and VPS deployment
- **Environment Configuration** — `.env.example` and `.streamlit/secrets.toml.example` for secure secret management
- **Cross-Platform** — Tested and documented for Ubuntu and Windows

---

## Documentation & Portfolio

- **README.md** — Full project overview with installation, usage, architecture, and feature list
- **CHANGELOG.md** — Version history following Keep a Changelog format
- **RELEASE_NOTES.md** — This document
- **DEPLOYMENT.md** — Platform-specific deployment instructions
- **docs/ARCHITECTURE.md** — System design and data flow diagrams
- **docs/DEMO_SCRIPT.md** — 3-minute demo script
- **docs/INTERVIEW_GUIDE.md** — Talking points and Q&A for interviews
- **docs/ROADMAP.md** — Future development phases
- **docs/QA_CHECKLIST.md** — Pre-push manual QA checklist
- **docs/FINAL_CHECKLIST.md** — Release readiness checklist
- **portfolio/PROJECT_SUMMARY.md** — One-page project summary for recruiters
- **portfolio/INTERVIEW_PITCH.md** — 30s, 1m, 2m, technical, and business pitch scripts
- **portfolio/DEMO_FLOW.md** — Step-by-step demo walkthrough with talking points
- **portfolio/RESUME_BULLETS.md** — CV bullets, LinkedIn posts, GitHub description, portfolio copy
- **portfolio/SCREENSHOT_LIST.md** — Required screenshot checklist with capture instructions

---

## Known Limitations

- Speech analysis requires a local faster-whisper model download on first run (~150 MB).
- Camera analysis uses Haar Cascade, which is fast but less accurate than deep-learning detectors in poor lighting.
- AI Coach defaults to rule-based scoring unless a `PITCHPILOT_AI_API_KEY` environment variable is provided.
- Video upload is limited to MP4 format.
- No user authentication or multi-user support in this release.
- SQLite is local-only; there is no cloud sync or backup.
- Docker local build may depend on Docker Hub network availability.

---

## Ethical-Use Note

PitchPilot AI is designed as a **practice and self-improvement tool only**.

- Use it to rehearse and refine your skills ahead of time.
- Do **not** use this tool during live interviews or assessments.
- The goal is to build genuine confidence, not to bypass evaluation.

---

## Future Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) for the full development roadmap. Highlights:

- **Enhanced speech analytics** — Sentiment analysis, emotion detection, pause-pattern analysis, multi-language support
- **Deep-learning body language** — MediaPipe/BlazePose integration, eye contact estimation, gesture recognition, posture scoring
- **User accounts and authentication** — Local accounts or OAuth (Google, GitHub)
- **FastAPI backend** — REST API, async processing, webhook support, mobile-client ready
- **Team dashboard** — Aggregated team performance, benchmarking, coaching assignments
- **Real-time practice mode** — Live webcam and microphone feedback without pre-recorded video

---

## System Requirements

- **Python:** 3.12 or higher
- **OS:** Ubuntu (primary), Windows (tested), macOS (expected to work)
- **RAM:** 4 GB minimum, 8 GB recommended
- **Disk:** ~200 MB for app + dependencies; additional ~150 MB for faster-whisper model on first run
- **Optional:** `ffmpeg` for audio extraction; `libgl1` for OpenCV on Linux

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/jahid-cr7/PitchPilot-AI.git
cd PitchPilot-AI

# 2. Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate   # Linux/macOS
# .venv\Scripts\activate    # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the app
streamlit run app.py
```

The app will open at `http://localhost:8501`.

---

## Feedback & Support

- **Bugs & Features:** Open an issue on GitHub
- **Contributing:** See [CONTRIBUTING.md](CONTRIBUTING.md)
- **Interview Prep:** Read [docs/INTERVIEW_GUIDE.md](docs/INTERVIEW_GUIDE.md) and [portfolio/INTERVIEW_PITCH.md](portfolio/INTERVIEW_PITCH.md)
- **Demo Prep:** Follow [portfolio/DEMO_FLOW.md](portfolio/DEMO_FLOW.md)

---

**Thank you for trying PitchPilot AI!**
