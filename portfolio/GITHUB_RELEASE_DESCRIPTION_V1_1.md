# PitchPilot AI v2.0.0 — Multi-Platform Release

**Release Date:** 2026-07-14

---

## Release Title

PitchPilot AI v2.0.0 — Multi-Platform Interview Coaching: FastAPI Backend + React Web + Expo Mobile + Streamlit Desktop

---

## Highlights

- **FastAPI backend** with full REST API serving all clients
- **React web frontend** — premium dark SaaS UI with animated feedback, charts, and responsive design
- **Expo mobile app** — cross-platform iOS/Android client with video upload, dashboard, and history
- **Streamlit desktop app** — quick demo and testing surface
- **Automatic session persistence** — `POST /api/v1/analyze/full` saves to SQLite and returns `session_id`
- **Graceful save failure** — analysis completes even if the database write fails
- **Unified history & dashboard** — all clients read from the same SQLite database via FastAPI
- **Professional report export** — self-contained HTML and single-row CSV for every saved session

---

## Features

### Core Analysis (All Platforms)
- **Video Analysis** — OpenCV-based motion scoring, duration/FPS/resolution extraction
- **Camera Presence** — Haar Cascade face detection, framing, distance, and movement level
- **Speech Analysis** — faster-whisper transcription, WPM, filler words, repetitions
- **AI Coach** — OpenAI-compatible LLM content analysis with intelligent rule-based fallback
- **Final Scoring** — Weighted aggregation (Video 20%, Camera 30%, Speech 30%, Answer 20%)

### FastAPI Backend
- `POST /api/v1/analyze/full` — end-to-end pipeline with automatic session save
- `GET /api/v1/sessions` — list all saved sessions
- `GET /api/v1/dashboard/stats` — aggregate statistics and recent sessions
- `GET /api/v1/reports/{id}/html` and `/csv` — professional report export
- Question bank endpoints for modes, questions, random picker, and default roles
- CORS enabled for React and mobile development
- Graceful error handling — no stack traces leaked to clients

### React Web Frontend
- Practice page with MP4 dropzone, mode/question selectors, random picker, and animated progress
- Feedback page with score ring, dimension breakdown, strengths/weak points, transcript, and exports
- Dashboard with KPI cards, score progression chart, skill breakdown, and recent activity
- History with filter tabs, session detail panel, report export, and delete confirmation
- Settings for backend URL configuration

### Expo Mobile App
- Practice screen with video picker, progress simulation, and full result display
- Dashboard with pull-to-refresh, KPI grid, skill bars, and recent sessions
- History with session list, detail view, report export, and delete
- Settings for backend URL and connection testing

### Streamlit Desktop App
- Home page with Demo Mode for instant testing
- Full practice, feedback, dashboard, history, and settings pages
- Same core analyzers as the API backend

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend API | FastAPI, Uvicorn, Pydantic |
| Web Frontend | React 18, Vite, TypeScript, Tailwind CSS, Recharts, Framer Motion |
| Mobile App | Expo SDK 57, React Native 0.86, TypeScript |
| Desktop Demo | Streamlit, Python 3.12+ |
| Video / Camera | OpenCV (Haar Cascade, optical flow) |
| Speech | faster-whisper (ONNX runtime) |
| AI Analysis | OpenAI-compatible LLM API (GPT-4o-mini default) |
| Data | SQLite (local session storage) |
| Reports | HTML / CSV export generators |
| DevOps | Docker, Docker Compose, GitHub Actions CI |

---

## Test Checklist

Before using this release, verify:

```bash
# Python compile check
python -m compileall app.py core pages reports api

# React build
cd frontend && npm run build

# Mobile install
cd mobile && npm install

# Backend health
curl http://127.0.0.1:8000/health
```

Then test the full flow:
1. Upload an MP4 via React or mobile
2. Confirm `session_id` is returned
3. Check Dashboard and History reflect the new session
4. Export HTML and CSV reports
5. Verify Streamlit Demo Mode still works

For a complete QA checklist, see [`docs/MULTIPLATFORM_QA_CHECKLIST.md`](docs/MULTIPLATFORM_QA_CHECKLIST.md).

---

## Known Limitations

- Speech analysis requires a local faster-whisper model download on first run (~150 MB).
- Camera analysis uses Haar Cascade, which is fast but less accurate than deep-learning detectors in poor lighting.
- AI Coach defaults to rule-based scoring unless an API key is provided.
- Video upload is limited to MP4 format and 200 MB.
- No user authentication or multi-user support.
- SQLite is local-only; no cloud sync or backup.
- Physical phone requires backend to run with `--host 0.0.0.0` and same Wi-Fi network.

---

## Next Roadmap

- Enhanced speech analytics (sentiment, emotion, pause analysis, multi-language)
- Deep-learning body language (MediaPipe, BlazePose, eye-contact estimation)
- User accounts and authentication
- Real-time practice mode (live webcam + microphone feedback)
- Team dashboard for coaching organizations
- Cloud sync and backup beyond local SQLite

---

## Quick Start

```bash
# Backend
cd ~/PitchPilot\ AI
source .venv/bin/activate
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload

# React web
cd frontend
npm install
npm run dev

# Mobile
cd mobile
npm install
npx expo start -c --lan

# Streamlit desktop
cd ~/PitchPilot\ AI
streamlit run app.py
```

---

## License

MIT License — feel free to use, modify, and distribute.
