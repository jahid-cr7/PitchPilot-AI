# LinkedIn Post — PitchPilot AI Multi-Platform Release

Copy-paste ready. Fill in the GitHub link when ready.

---

## Option A — Technical Focus

Just shipped PitchPilot AI v2.0 — an AI-powered interview coaching platform that now runs on **desktop (Streamlit), web (React), and mobile (Expo)** — all powered by a single **FastAPI** backend.

Here's what it does:
- Upload a practice interview video (MP4)
- Get analyzed across 4 dimensions: body movement, camera presence, speech clarity, and answer content
- Receive a weighted overall score (0–100) with strengths, weak points, and a concrete next practice task
- Track progress on a dashboard and export professional HTML/CSV reports

Tech stack:
- FastAPI + Pydantic for the REST API
- React 18 + Vite + Tailwind CSS + Recharts for the web app
- Expo SDK 57 + React Native for iOS/Android
- Streamlit for the desktop demo
- OpenCV + faster-whisper for local video/speech analysis
- SQLite for session history
- OpenAI-compatible LLM with intelligent rule-based fallback

The architecture is modular — each analyzer is independent, so I can swap Haar Cascade for MediaPipe, or rule-based AI for a fine-tuned model, without touching the UI.

GitHub: [link to be added]

Would love feedback from the Python, React, and mobile dev communities.

#python #fastapi #react #reactnative #expo #ai #interviewprep #opensource #portfolio #buildinpublic

---

## Option B — Product / Impact Focus

I built PitchPilot AI because I needed objective feedback on my interview performance — and friends were too nice to be useful.

Today I'm releasing v2.0: a multi-platform interview coaching app that analyzes practice videos and gives you structured, data-driven feedback.

**How it works:**
1. Record a practice interview video
2. Upload it on web, mobile, or desktop
3. The AI analyzes your body language, camera positioning, speech clarity, and answer structure
4. You get a score, actionable feedback, and a specific task to practice next
5. Track improvement over time and export reports for mentors or coaches

**What makes it real-world:**
- Works fully offline — no API key needed for core features
- Graceful AI fallback — rule-based scoring when LLM isn't available; seamless upgrade when it is
- Cross-platform — practice on your laptop, phone, or tablet
- Modular architecture — easy to extend and maintain

Built with FastAPI, React, Expo, Streamlit, OpenCV, Whisper, and SQLite.

GitHub: [link to be added]

If you're preparing for interviews or know someone who is, I'd love your thoughts.

#interviewprep #careerdevelopment #ai #productivity #jobsearch #tech #buildinpublic

---

## Option C — Short & Punchy

Shipped: PitchPilot AI — practice interview videos, get AI feedback, track progress.

Now on web, mobile, and desktop. Same FastAPI backend. Same SQLite history. Same modular analyzers.

GitHub: [link to be added]

#ai #interviewprep #python #react #fastapi #buildinpublic
