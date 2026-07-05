# Release Notes — PitchPilot AI v1.0.0

**Release Date:** July 2026

---

## Summary

PitchPilot AI v1.0.0 is the initial MVP release of an AI-powered interview and presentation coaching platform. It analyzes practice videos across four dimensions — body movement, camera presence, speech clarity, and answer content — and delivers structured feedback with a single overall performance score.

---

## Main Features

| Feature | Status | Description |
|---------|--------|-------------|
| Video Analysis | ✅ Ready | OpenCV-based motion and metadata extraction |
| Camera Presence | ✅ Ready | Face detection, framing, distance, and movement scoring |
| Speech Analysis | ✅ Ready | faster-whisper transcription with filler-word and pacing metrics |
| AI Coach | ✅ Ready | Rule-based fallback + OpenAI-compatible API integration |
| Final Scoring | ✅ Ready | Weighted overall score (0–100) with performance level |
| Dashboard | ✅ Ready | Trend charts, KPIs, and component breakdowns from SQLite |
| Session History | ✅ Ready | Save, browse, delete, and export sessions |
| Report Export | ✅ Ready | HTML and CSV report generation |
| Demo Mode | ✅ Ready | One-click sample data loading for instant testing |
| Documentation | ✅ Ready | Architecture, demo script, interview guide, and roadmap |

---

## How to Run

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

## Known Limitations

- Speech analysis requires a local faster-whisper model download on first run (~150 MB).
- Camera analysis uses Haar Cascade, which is fast but less accurate than deep-learning detectors in poor lighting.
- AI Coach defaults to rule-based scoring unless a `PITCHPILOT_AI_API_KEY` environment variable is provided.
- Video upload is limited to MP4 format.
- No user authentication or multi-user support in this release.
- SQLite is local-only; there is no cloud sync or backup.

---

## Ethical-Use Note

PitchPilot AI is designed as a **practice and self-improvement tool only**.

- Use it to rehearse and refine your skills ahead of time.
- Do **not** use this tool during live interviews or assessments.
- The goal is to build genuine confidence, not to bypass evaluation.

---

## What's Next

See [docs/ROADMAP.md](docs/ROADMAP.md) for the full development roadmap. Upcoming areas of focus include:

- Enhanced speech analytics (sentiment, emotion, pause analysis)
- Deep-learning body language analysis (MediaPipe, BlazePose)
- User accounts and authentication
- FastAPI backend for programmatic API access
- Docker containerization and cloud deployment guides
- Team dashboard for coaching organizations

---

## Feedback & Support

- Open an issue on GitHub for bugs or feature requests.
- See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on contributing code.
- Read [docs/INTERVIEW_GUIDE.md](docs/INTERVIEW_GUIDE.md) if you're presenting this project in an interview.

---

**Thank you for trying PitchPilot AI!**
