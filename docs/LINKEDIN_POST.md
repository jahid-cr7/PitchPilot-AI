# LinkedIn Post — PitchPilot AI

## Ready-to-Post Version

---

**I built an AI-powered interview coach.**

Job interviews are high-stakes, but most people practice without objective feedback. You rehearse in front of a mirror, but you can't measure your pacing, filler words, or body language rigorously.

So I built **PitchPilot AI** — a Python/Streamlit app that analyzes your practice interview videos and gives you structured feedback across four dimensions:

- **Body movement** (OpenCV motion analysis)
- **Camera presence** (face detection, framing, distance)
- **Speech clarity** (faster-whisper transcription, WPM, filler words)
- **Answer content** (AI Coach evaluating structure, relevance, and clarity)

It combines everything into a single **0–100 performance score** with strengths, weak points, and a personalized next practice task.

**Key design decisions I'm proud of:**
- **Dual-mode AI Coach** — works with a real LLM API when available, and gracefully falls back to intelligent rule-based scoring when offline. Zero config needed.
- **Demo Mode** — one click loads realistic sample data. Perfect for presentations and interviews.
- **Modular architecture** — each analyzer is independent, so I can swap in better models later without touching the UI.

**Tech stack:** Python, Streamlit, OpenCV, faster-whisper, OpenAI API, SQLite, Pandas

The project is open-source on GitHub with full documentation, architecture diagrams, demo scripts, and an interview guide.

What do you think? Would you use something like this to practice?

---

## GitHub Link

> https://github.com/jahid-cr7/PitchPilot-AI

## Demo Video Link (placeholder)

> [Demo Video — coming soon]

---

## Hashtags

`#Python` `#Streamlit` `#OpenCV` `#MachineLearning` `#AI` `#InterviewPrep` `#CareerDevelopment` `#OpenSource` `#PortfolioProject` `#SoftwareEngineering`

---

## Short Version (for a follow-up comment or secondary post)

> Just shipped PitchPilot AI v1.0 — an AI interview coach built with Python + Streamlit. It analyzes practice videos for body language, speech, and answer quality, then scores you 0–100 with actionable feedback. Demo mode included for instant testing. Link in comments.
