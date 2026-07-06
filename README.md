# PitchPilot AI

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12+-blue.svg" alt="Python 3.12+">
  <img src="https://img.shields.io/badge/Streamlit-1.58.0-ff4b4b.svg" alt="Streamlit">
  <img src="https://img.shields.io/badge/OpenCV-4.13-green.svg" alt="OpenCV">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License">
</p>

**AI Interview & Presentation Coach** — Practice smarter, get structured feedback, and track your improvement over time.

---

## Short Description

PitchPilot AI is an end-to-end coaching platform that analyzes practice interview and presentation videos. It evaluates body movement, camera presence, speech clarity, and answer content — then combines everything into a single overall performance score with actionable next steps.

> **Demo Mode included** — Try the full UI and feature set instantly without uploading a video.

---

## Demo

<!-- TODO: Replace with your screen recording GIF or video link -->
```
[DEMO VIDEO PLACEHOLDER]
- Upload a video on the Practice page
- Run Video, Camera, and Speech analyses
- Review AI Coach feedback
- Generate final score and save the session
```

> **Demo video:** [Coming soon — add your Loom/YouTube link here]
>
> **GitHub Repository:** https://github.com/jahid-cr7/PitchPilot-AI

---

## Startup-Style UI

PitchPilot AI features a polished, SaaS-style interface designed for portfolio demos and company interviews:

- **Gradient hero section** with clear CTAs
- **Step indicators** for the guided practice workflow
- **Styled metric cards** with soft shadows and hover effects
- **Status badges** (MVP, Offline Fallback, API-Ready, Ethical Practice Tool)
- **Professional empty states** with action suggestions
- **Section cards** with borders and consistent spacing
- **Responsive layout** that works on desktop and mobile

The UI uses custom CSS injected safely via Streamlit and follows modern SaaS design patterns.

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Video Analysis** | Extracts duration, FPS, resolution, and movement score using OpenCV |
| **Camera Presence** | Detects face visibility, framing, distance, and movement level |
| **Speech Analysis** | Transcribes audio with faster-whisper, counts filler words, WPM, and repetitions |
| **AI Coach** | Analyzes answer structure, relevance, and clarity — with rule-based fallback when no API key is set |
| **Final Scoring** | Combines all dimensions into a weighted overall score (0–100) with performance level |
| **Dashboard** | Tracks progress over time with trend charts and key metrics |
| **Session History** | Saves completed sessions to SQLite with HTML/CSV export |
| **Demo Mode** | Loads sample data instantly for presentations and testing |
| **Role-Based Question Bank** | Curated interview questions across 7 practice modes (Software Dev, AI/ML, Data Analyst, University, Presentation, Sales, Behavioral) with random question picker |
| **AI Settings** | Configure AI provider, test connections, and manage temporary API keys |

---

## Screenshots

<!-- Screenshots will be added after release -->
> **Screenshots will be added after release.**

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend / App** | Streamlit, Python 3.12+ |
| **Video / Camera** | OpenCV (Haar Cascade face detection, optical flow) |
| **Speech** | faster-whisper (ONNX runtime) |
| **AI Analysis** | OpenAI-compatible LLM API (GPT-4o-mini by default) |
| **Data** | SQLite (local session storage) |
| **Dashboard** | Pandas, Streamlit native charts |
| **Reports** | HTML / CSV export generators |
| **Server** | Uvicorn (prepared for FastAPI backend expansion) |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Streamlit Frontend                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Practice │  │ Feedback │  │Dashboard │  │ History  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
└───────┼─────────────┼─────────────┼─────────────┼──────────┘
        │             │             │             │
        └─────────────┴──────┬──────┴─────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        ┌─────▼─────┐  ┌────▼────┐  ┌──────▼──────┐
        │  OpenCV   │  │faster-  │  │ OpenAI API  │
        │ Video/Cam │  │whisper  │  │  (optional) │
        └───────────┘  └─────────┘  └─────────────┘
                             │
                        ┌────▼────┐
                        │ SQLite  │
                        │ History │
                        └─────────┘
```

For a detailed breakdown, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## How It Works

1. **Upload** an MP4 video on the **Practice** page.
2. **Run analyses** — Video (motion), Camera (face presence), Speech (transcription).
3. **Review feedback** on the **Feedback** page with per-dimension metrics.
4. **Run AI Coach** — Enter the interview question and target role. The AI evaluates your transcript for structure, relevance, and clarity.
5. **Generate final score** — Combines all scores into an overall rating with strengths, weak points, and a next practice task.
6. **Save session** — Stores everything in SQLite for history and trend tracking.
7. **Export** — Download HTML or CSV reports from the **History** page.

---

## Installation

### Ubuntu

```bash
# 1. Clone the repository
git clone https://github.com/jahid-cr7/PitchPilot-AI.git
cd PitchPilot-AI

# 2. Create a virtual environment
python3 -m venv .venv

# 3. Activate it
source .venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Run the app
streamlit run app.py
```

### Windows

```powershell
# 1. Clone the repository
git clone https://github.com/jahid-cr7/PitchPilot-AI.git
cd PitchPilot-AI

# 2. Create a virtual environment
python -m venv .venv

# 3. Activate it
.venv\Scripts\activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Run the app
streamlit run app.py
```

The app will open automatically at `http://localhost:8501`.

---

## Deployment

### Local

```bash
streamlit run app.py
```

The app opens at `http://localhost:8501`.

### Cloud / Production

- See [DEPLOYMENT.md](DEPLOYMENT.md) for full deployment instructions.
- Configure secrets using your deployment platform's secrets manager (e.g., Streamlit Cloud Secrets, Railway Variables, Render Environment).
- **Never commit real API keys to Git.**

---

## How to Use Demo Mode

Perfect for interviews, presentations, or testing without a real video:

1. Open the app and go to the **Home** page.
2. Click **"🚀 Load Demo Data"**.
3. Navigate to **Feedback** to see sample analysis results.
4. Explore the **Dashboard** for trend charts.
5. Visit **History** to view how sessions are stored and exported.

---

## How to Use a Real AI API Key

The AI Coach works out of the box in **fallback (rule-based) mode**. To enable real AI-powered analysis:

1. Obtain an API key from OpenAI or any OpenAI-compatible provider.
2. Set the environment variable before running the app:

```bash
export PITCHPILOT_AI_API_KEY="sk-..."
export PITCHPILOT_AI_MODEL="gpt-4o-mini"   # optional
export PITCHPILOT_AI_BASE_URL=""            # optional, for custom providers
```

3. Restart the app. The AI Coach will now call the LLM API instead of using rule-based scoring.

---

## Project Structure

```
PitchPilot AI/
├── app.py                      # Landing page with overview & Demo Mode
├── core/
│   ├── __init__.py
│   ├── video_analyzer.py       # OpenCV video metadata & motion analysis
│   ├── camera_analyzer.py      # OpenCV face detection & presence scoring
│   ├── speech_analyzer.py      # faster-whisper transcription & speech metrics
│   ├── ai_coach_agent.py       # LLM integration + rule-based fallback
│   ├── scoring_engine.py       # Weighted overall score calculation
│   ├── database.py             # SQLite session storage
│   ├── ui_utils.py             # Shared sidebar & UI components
│   └── question_bank.py        # Role-based interview question bank
├── pages/
│   ├── 1_Practice.py           # Video upload, practice mode & analysis runner
│   ├── 2_Feedback.py           # Results, AI Coach, final scoring
│   ├── 3_Dashboard.py          # Progress charts & KPIs
│   ├── 4_History.py            # Browse, export, delete sessions
│   └── 5_Settings.py           # AI provider configuration & health check
├── reports/
│   ├── __init__.py
│   └── report_generator.py     # HTML & CSV report generators
├── docs/
│   ├── ARCHITECTURE.md            # System design & data flow
│   ├── DEMO_SCRIPT.md             # 3-minute demo script
│   ├── INTERVIEW_GUIDE.md         # Talking points & Q&A
│   ├── ROADMAP.md                 # Future improvements
│   ├── CV_PROJECT_DESCRIPTION.md  # Copy-paste CV descriptions
│   ├── LINKEDIN_POST.md           # Ready-to-post LinkedIn content
│   ├── SCREENSHOT_GUIDE.md        # Screenshot checklist for portfolio
│   └── VIDEO_DEMO_SCRIPT.md       # 60s and 3-minute video scripts
├── uploads/                    # Uploaded MP4 files (ignored by git)
├── data/                       # SQLite database (ignored by git)
├── requirements.txt
├── README.md
└── .gitignore
```

---

## Quality Check

Before pushing to GitHub, recording a demo, or presenting in an interview, run the automated smoke test:

```bash
python scripts/smoke_test.py
```

This script verifies:
- Required files and folders exist
- All core modules import successfully
- SQLite database initializes correctly
- AI Coach fallback mode works without an API key
- AI connection test returns gracefully
- Scoring engine computes a valid overall score
- Report generator produces non-empty HTML and CSV output

For a full manual checklist, see [docs/QA_CHECKLIST.md](docs/QA_CHECKLIST.md).

---

## Ethical Use Note

PitchPilot AI is designed as a **practice and self-improvement tool only**.

- Use it to rehearse and refine your skills ahead of time.
- Do **not** use this tool during live interviews or assessments.
- The goal is to build genuine confidence, not to bypass evaluation.

---

## Current Limitations

- Speech analysis requires a local faster-whisper model download on first run (~150 MB).
- Camera analysis uses Haar Cascade (fast but less accurate than deep-learning detectors).
- AI Coach requires an external API key for LLM-powered analysis; otherwise uses rule-based fallback.
- No user authentication or multi-user support in the MVP.
- Video analysis is limited to MP4 format.

---

## Future Improvements

See [docs/ROADMAP.md](docs/ROADMAP.md) for the full roadmap. Highlights:

- Real AI provider integration with prompt versioning
- Enhanced speech analytics (sentiment, emotion, pause analysis)
- Deep-learning body language analysis (MediaPipe, BlazePose)
- User accounts and authentication
- FastAPI backend for API access
- Docker & cloud deployment
- Team dashboard for coaching organizations

---

## Interview Talking Points

**If you have 30 seconds:**
> "PitchPilot AI is a Python/Streamlit app that analyzes practice interview videos. It evaluates body language, camera presence, speech clarity, and answer content — then gives you a score and actionable feedback. It works offline for most features and has a demo mode for quick testing."

**If you have 2 minutes:**
> "I built PitchPilot AI as an MVP to solve a real problem: people struggle to get objective feedback on their interview performance. The app takes an MP4 video, runs OpenCV for motion and face detection, faster-whisper for transcription, and an LLM for content analysis. If no API key is available, it gracefully falls back to rule-based scoring. Everything is stored in SQLite so users can track progress over time. The architecture is modular — each analyzer is independent, so I can swap in better models later without rewriting the UI."

---

## License

MIT License — feel free to use, modify, and distribute.

---

<p align="center">
  Built with ❤️ for job seekers and public speakers everywhere.
</p>
