# PitchPilot AI — Interview Pitch Guide

Use these scripts to introduce PitchPilot AI during company interviews, portfolio reviews, or networking conversations. Adapt the length and depth to the time you have.

---

## 30-Second Explanation

> "PitchPilot AI is a Python and Streamlit app that analyzes practice interview videos. It evaluates body language, camera presence, speech clarity, and answer content — then gives you a structured score and actionable feedback. It works offline for most features, has a demo mode for quick testing, and tracks your progress over time in a SQLite database."

**Best for:** Elevator pitches, quick introductions, resume walkthroughs.

---

## 1-Minute Explanation

> "I built PitchPilot AI to solve a real problem: people struggle to get objective feedback on their interview performance. The app is a Streamlit-based coaching platform. You upload an MP4 video, and it runs three local analyses: OpenCV for motion and face detection, faster-whisper for speech transcription and filler-word counting, and a scoring engine that weights all dimensions into a 0–100 overall score. Then the AI Coach analyzes your answer structure and relevance — using a real LLM if you have an API key, or an intelligent rule-based fallback if you don't. Everything is saved to SQLite so you can track trends, and you can export HTML or CSV reports. The architecture is modular, so each analyzer can be upgraded independently."

**Best for:** Phone screens, initial interviews, recruiter conversations.

---

## 2-Minute Explanation

> "PitchPilot AI is an end-to-end interview coaching platform I built as an MVP. The core idea is that practice without feedback is just repetition — so I built a system that gives you multi-dimensional, data-driven feedback on every practice session.
>
> Here's how it works: you upload an MP4 practice video on the Practice page. The app runs Video Analysis with OpenCV — extracting duration, FPS, resolution, and a movement score using optical flow. Then Camera Presence analysis detects your face with Haar Cascade, checks framing and distance, and scores your on-camera positioning. Speech Analysis uses faster-whisper to transcribe the audio, count words, calculate WPM, detect filler words like 'um' and 'uh', and flag repeated words.
>
> After that, the AI Coach takes your transcript, the interview question, and your target role, and analyzes content structure, relevance, and clarity. If you have an OpenAI-compatible API key, it calls an LLM with a structured JSON prompt. If not, it gracefully falls back to a rule-based engine I built that checks for introductions, education, experience, closings, role-specific keywords, and sentence variety.
>
> Finally, the scoring engine combines everything — Video 20%, Camera 30%, Speech 30%, Answer 20% — into an overall score with strengths, weak points, and a specific next practice task. You can save the session to SQLite, view trend charts on the Dashboard, browse history, and export professional HTML or CSV reports.
>
> The whole app is cross-platform, Dockerized, and has GitHub Actions CI. It's designed so each core module is independent — I can swap Haar Cascade for MediaPipe, or the rule-based AI for a fine-tuned model, without touching the UI."

**Best for:** Technical interviews, portfolio deep-dives, hiring manager rounds.

---

## Technical Explanation

> "From a technical standpoint, PitchPilot AI is a modular Python application with a Streamlit frontend and a set of independent analyzer modules.
>
> **Video analyzer** (`core/video_analyzer.py`) uses OpenCV to read video metadata and sample frames. It computes a movement score via optical flow magnitude averaging — lower is calmer, which is ideal for interviews.
>
> **Camera analyzer** (`core/camera_analyzer.py`) uses OpenCV's Haar Cascade classifier to detect faces across sampled frames. It computes face visibility percentage, centering ratios, distance feedback based on face-size-to-frame ratios, and movement level from face-center displacement.
>
> **Speech analyzer** (`core/speech_analyzer.py`) extracts the audio track with moviepy and transcribes it using faster-whisper on ONNX runtime. It then counts words, calculates WPM, detects filler words from a predefined list, and identifies repeated words.
>
> **AI Coach** (`core/ai_coach_agent.py`) is the most complex module. It builds a structured system prompt that enforces JSON output, constructs a user prompt with transcript + speech metrics, and calls an OpenAI-compatible chat completion API. If the call fails or no key is configured, it falls back to `_fallback_analysis()`, a rule-based NLP function that scores answers on length, structure, keyword presence, and role relevance.
>
> **Scoring engine** (`core/scoring_engine.py`) applies weighted aggregation: Video 20%, Camera 30%, Speech 30%, Answer 20%. It derives strengths and weak points from threshold comparisons, suggests a next practice task based on the weakest dimension, and builds a human-readable summary.
>
> **Database** (`core/database.py`) uses SQLite with a `practice_sessions` table. The History page browses, inspects, and deletes sessions. The Dashboard queries aggregates and trends. Reports are generated as self-contained HTML and single-row CSV.
>
> **UI** (`core/ui_utils.py`) provides shared CSS injection, sidebar navigation, metric cards, section cards, status badges, empty states, and workflow step indicators — giving the app a consistent SaaS-style look across all pages."

**Best for:** Technical deep-dive interviews, engineering manager discussions, code-review-style conversations.

---

## Business/Product Explanation

> "PitchPilot AI addresses a clear market need: affordable, scalable interview coaching. Hiring coaches cost hundreds of dollars per hour. Peer feedback is subjective and often too gentle to be useful. PitchPilot gives users structured, repeatable, data-driven feedback for free.
>
> The product is designed as an MVP with clear expansion paths. Today it's a single-user Streamlit app. Tomorrow it could become:
> - A **B2C SaaS** subscription with user accounts, cloud storage, and advanced AI analytics
> - A **B2B tool** for universities and career centers to coach thousands of students with team dashboards
> - An **API platform** where HR teams integrate coaching analytics into their existing assessment pipelines
>
> The business model would likely be freemium: free local analysis, premium features for cloud AI, advanced speech emotion detection, team dashboards, and white-label reports. The ethical-use positioning also builds trust — this is a practice tool, not a cheating tool, which makes it easier to partner with educational institutions."

**Best for:** Product manager interviews, startup pitch contexts, business-focused discussions.

---

## Challenges Solved

1. **Offline-first design with optional AI** — The biggest challenge was making the app fully functional without any API key, while still supporting real LLM analysis when available. I solved this by building a robust rule-based fallback engine that produces comparable feedback structure, so the user experience is identical in both modes.

2. **Cross-platform video and audio processing** — OpenCV and audio extraction libraries behave differently on Ubuntu and Windows. I abstracted all file-path handling with `pathlib`, standardized video codec expectations to MP4, and wrapped analyzer calls in try/except blocks with clear error messages.

3. **Modular architecture with shared state** — Streamlit's session state is simple but can become messy across pages. I centralized UI components in `core/ui_utils.py`, stored analysis results in `st.session_state`, and ensured each analyzer module returns a consistent dictionary format with `status`, `message`, and metrics.

4. **Structured LLM output parsing** — LLMs don't always return clean JSON. I wrote `_parse_ai_json()` to strip markdown code fences, validate required keys, and gracefully fall back to rule-based scoring if parsing fails.

5. **Scoring fairness across dimensions** — Movement score is inverted (lower is better), while camera and speech scores are direct. I normalized each dimension to 0–100 and applied domain-specific thresholds so the weighted overall score feels fair and actionable.

---

## Future Improvements

- **Enhanced body language analysis** — Replace Haar Cascade with MediaPipe or BlazePose for more accurate pose, gesture, and eye-contact detection
- **Speech emotion and sentiment** — Add sentiment analysis, emotion detection, and pause-pattern analysis to the speech module
- **Real AI provider integration with prompt versioning** — Support multiple providers (OpenAI, Anthropic, local LLMs) with versioned prompts and A/B testing
- **User accounts and authentication** — Multi-user support with login, cloud session sync, and personalized dashboards
- **FastAPI backend** — Decouple analysis from the frontend for async processing, API access, and mobile app support
- **Team dashboard** — Aggregate coaching data across users for managers, teachers, and career counselors
- **Live practice mode** — Real-time camera and microphone analysis without requiring a pre-recorded video
