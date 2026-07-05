# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v1.0.0] - Initial MVP Release

### Added
- Streamlit MVP interface with multipage navigation (Home, Practice, Feedback, Dashboard, History)
- Video analysis using OpenCV (duration, FPS, resolution, movement score)
- Camera presence analysis using OpenCV Haar Cascade (face visibility, framing, distance, movement level)
- Speech analysis using faster-whisper (transcription, word count, WPM, filler words, repeated words)
- AI Coach with intelligent rule-based fallback mode for offline use
- OpenAI-compatible API-ready design for real LLM-powered content analysis
- Final scoring engine with weighted aggregation (Video 20%, Camera 30%, Speech 30%, Answer 20%)
- SQLite session history with save, browse, and delete functionality
- Dashboard with KPI metrics, trend charts, and component breakdowns
- History page with session inspection and HTML/CSV report export
- Demo Mode — load sample data instantly without uploading a video
- Professional documentation package (README, Architecture, Demo Script, Interview Guide, Roadmap)
- Cross-platform support (Ubuntu and Windows)
- Shared sidebar UI component across all pages
- Ethical-use pledge and fair-use guidelines
