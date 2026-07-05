# Roadmap

This document outlines the planned evolution of PitchPilot AI from MVP to production.

---

## Phase 1 — MVP (Completed)

- Video analysis (OpenCV metadata + motion)
- Camera presence analysis (Haar Cascade face detection)
- Speech analysis (faster-whisper transcription)
- AI Coach with rule-based fallback
- Final scoring engine (weighted aggregation)
- SQLite session history
- Dashboard with trend charts
- HTML/CSV report export
- Demo Mode

---

## Phase 2 — Enhanced AI Integration

- [ ] **Real AI provider integration** — Support for multiple LLM providers (OpenAI, Anthropic, local Ollama)
- [ ] **Prompt versioning** — Track and compare different prompt templates for the AI Coach
- [ ] **Streaming responses** — Show AI Coach feedback as it generates instead of waiting for full response
- [ ] **Answer templates** — Provide STAR method, CAR method, and other framework suggestions

---

## Phase 3 — Advanced Speech Analytics

- [ ] **Sentiment analysis** — Detect confidence, hesitation, and enthusiasm in speech
- [ ] **Emotion detection** — Map vocal tone to emotional states (nervous, calm, excited)
- [ ] **Pause analysis** — Measure strategic pauses vs. dead air
- [ ] **Pacing feedback** — Highlight sections that are too fast or too slow
- [ ] **Multi-language support** — Transcribe and analyze non-English interviews

---

## Phase 4 — Better Body Language Analysis

- [ ] **MediaPipe integration** — Replace Haar Cascade with BlazePose for accurate face and body keypoints
- [ ] **Eye contact estimation** — Detect gaze direction relative to camera
- [ ] **Gesture recognition** — Identify helpful vs. distracting hand movements
- [ ] **Posture scoring** — Detect slouching, leaning, or unstable positioning
- [ ] **Real-time preview** — Live webcam feedback during practice (not just post-analysis)

---

## Phase 5 — User Management & Accounts

- [ ] **User registration / login** — Local accounts or OAuth (Google, GitHub)
- [ ] **Session ownership** — Associate saved sessions with user IDs
- [ ] **Profile settings** — Default role, preferred interview question categories
- [ ] **Privacy controls** — Option to delete all data, export personal data

---

## Phase 6 — FastAPI Backend

- [ ] **REST API** — Expose analyzers and scoring as HTTP endpoints
- [ ] **Async processing** — Background Celery tasks for long-running video analysis
- [ ] **API authentication** — API keys for third-party integrations
- [ ] **Webhook support** — Notify external systems when analysis completes
- [ ] **Mobile client ready** — React Native or Flutter app can consume the API

---

## Phase 7 — Docker & Deployment

- [ ] **Dockerfile** — Containerize the Streamlit app
- [ ] **docker-compose.yml** — One-command local setup with volumes for uploads and data
- [ ] **CI/CD pipeline** — GitHub Actions for testing and building
- [ ] **Cloud deployment guides** — AWS, GCP, Azure, and Render deployment documentation
- [ ] **Environment configuration** — `.env` templates for production settings

---

## Phase 8 — Team & Enterprise Features

- [ ] **Team dashboard** — Managers can view aggregated team performance
- [ ] **Benchmarking** — Compare individual scores against team averages
- [ ] **Coaching assignments** — Assign specific practice tasks to team members
- [ ] **Custom scoring weights** — Adjust video/camera/speech/answer weights per organization
- [ ] **White-label support** — Custom branding for coaching companies

---

## Phase 9 — Ecosystem & Integrations

- [ ] **Calendar integration** — Schedule practice sessions (Google Calendar, Outlook)
- [ ] **Video platform imports** — Analyze videos from YouTube, Loom, or Zoom recordings
- [ ] **ATS integration** — Link practice sessions to job applications (LinkedIn, Greenhouse)
- [ ] **Community features** — Share anonymized transcripts for peer feedback
- [ ] **Gamification** — Streaks, badges, and progress milestones

---

## Long-Term Vision

> **PitchPilot AI becomes the standard practice companion for job candidates worldwide.**
>
> From a single practice video to a complete coaching platform, the goal is to make high-quality interview feedback accessible to everyone — regardless of budget, location, or technical skill.

---

## How to Contribute

1. Pick a feature from the roadmap above.
2. Open an issue to discuss your approach.
3. Fork the repository and create a feature branch.
4. Submit a pull request with tests and documentation updates.

All contributions are welcome, whether they are code, documentation, design, or feature ideas.
