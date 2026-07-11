# PitchPilot AI — Project Summary

## Project Name
PitchPilot AI

## One-Line Description
An AI-powered interview and presentation coaching platform that analyzes practice videos for body language, camera presence, speech clarity, and answer content — delivering structured feedback and trackable progress scores.

## Problem Solved
Job seekers, students, and professionals struggle to get objective, actionable feedback on their interview and presentation performance. Friends and family give subjective opinions; hiring coaches are expensive and not always available. PitchPilot AI fills this gap by providing instant, multi-dimensional analysis of practice videos so users can rehearse smarter, identify weak points, and measure improvement over time.

## Target Users
- **Students** preparing for campus placements, internships, and university admission interviews
- **Job seekers** refining answers and building confidence before real interviews
- **Sales teams** rehearsing pitches and tracking delivery improvement
- **Teachers and career centers** offering scalable, repeatable coaching with exportable reports
- **Public speakers** and presenters who want data-driven feedback on their delivery

## Key Features
- **Video Analysis** — Extracts duration, FPS, resolution, and movement score using OpenCV
- **Camera Presence** — Detects face visibility, framing quality, distance, and movement level
- **Speech Analysis** — Transcribes audio with faster-whisper, counts filler words, WPM, and repetitions
- **AI Coach** — Analyzes answer structure, relevance, and clarity with LLM-powered insights; falls back to intelligent rule-based scoring when offline
- **Final Scoring** — Combines all dimensions into a weighted overall score (0–100) with performance level
- **Progress Dashboard** — Tracks improvement over time with trend charts and key metrics
- **Session History** — Saves completed sessions to SQLite with HTML/CSV export
- **Demo Mode** — Loads sample data instantly for presentations and testing without a real video
- **Role-Based Question Bank** — Curated questions across 7 practice modes (Software Dev, AI/ML, Data Analyst, University, Presentation, Sales, Behavioral) with random question picker
- **AI Settings** — Configure AI provider, test connections, and manage temporary API keys securely

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
| **DevOps** | Docker, Docker Compose, GitHub Actions CI |

## AI/ML Components
- **LLM Content Analysis** — OpenAI-compatible API calls with structured JSON output parsing; analyzes transcript for structure, relevance, clarity, and role alignment
- **Intelligent Fallback Engine** — Rule-based NLP analysis when no API key is available; detects introductions, education, experience, closings, role-specific keywords, and sentence variety
- **Prompt Engineering** — System prompt enforces JSON schema; user prompt includes speech metrics for richer context
- **Connection Health Check** — Minimal test request to verify provider connectivity before analysis

## Computer Vision Components
- **Video Motion Analysis** — OpenCV optical flow on sampled frames to compute movement score; ideal for detecting excessive fidgeting or overly stiff posture
- **Face Detection** — Haar Cascade classifier detects face presence, counts visible frames, and computes face visibility percentage
- **Framing Analysis** — Calculates face center position and width/height ratios to classify framing as centered, off-center, or too close/far
- **Distance Feedback** — Maps face size ratios to distance categories (good, too close, too far)
- **Movement Level Classification** — Categorizes face movement as low, medium, or high based on frame-to-frame displacement

## Speech Analysis Components
- **Audio Transcription** — faster-whisper (ONNX) extracts full speech transcript from video audio track
- **Filler Word Detection** — Counts and lists common fillers (um, uh, like, you know, so)
- **Words Per Minute (WPM)** — Calculates speaking pace from word count and audio duration
- **Repetition Detection** — Identifies repeated words that may indicate uncertainty or lack of vocabulary variety
- **Speech Scoring** — Composite score based on pace, filler density, and repetition count

## Database/Reporting Components
- **SQLite Session Storage** — Saves every practice session with full analysis results, transcripts, scores, and metadata
- **Dashboard Analytics** — Aggregates total sessions, average/best/latest scores, and component averages
- **Trend Tracking** — Line chart of overall scores over time to visualize improvement
- **HTML Report Export** — Self-contained, styled HTML document with scores, strengths, weak points, transcript, and next practice task
- **CSV Report Export** — Single-row CSV with all session metrics for spreadsheet analysis or import into other tools

## What Makes It Real-World
- **Production-ready architecture** — Modular core analyzers that can be swapped or upgraded independently (e.g., replace Haar Cascade with MediaPipe, replace rule-based AI with fine-tuned model)
- **Graceful degradation** — Works fully offline with local video, camera, and speech analysis; AI Coach falls back to rule-based scoring without an API key
- **Cross-platform support** — Tested on Ubuntu and Windows with identical behavior
- **Docker & CI ready** — Dockerfile, docker-compose, and GitHub Actions workflow included
- **Security-conscious** — API keys are never persisted; temporary session keys only, environment-variable based configuration
- **Data privacy** — All processing happens locally; videos and transcripts never leave the machine unless user explicitly exports reports
- **Scalable design** — SQLite can be swapped for PostgreSQL; Streamlit frontend can be paired with a FastAPI backend for multi-user deployments

## Ethical Use Note
PitchPilot AI is designed as a **practice and self-improvement tool only**.

- Use it to rehearse and refine your skills ahead of time.
- Do **not** use this tool during live interviews or assessments.
- The goal is to build genuine confidence, not to bypass evaluation.
