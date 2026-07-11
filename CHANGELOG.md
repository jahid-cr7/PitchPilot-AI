# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
