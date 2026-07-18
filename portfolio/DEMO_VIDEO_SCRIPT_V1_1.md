# PitchPilot AI — Multi-Platform Demo Video Script (v1.1)

A 3–5 minute script for recording a professional portfolio or GitHub demo video covering the full multi-platform stack.

---

## Setup (Before Recording)

1. Start the FastAPI backend:
   ```bash
   cd ~/PitchPilot\ AI
   source .venv/bin/activate
   python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. Start the React frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Start the Expo mobile app (on simulator or phone):
   ```bash
   cd mobile
   npx expo start -c --lan
   ```

4. Have a sample MP4 video ready (under 200 MB).

5. Open browser tabs:
   - `http://localhost:5173` (React frontend)
   - `http://localhost:8501` (Streamlit app)
   - `http://127.0.0.1:8000/docs` (FastAPI Swagger docs)

6. Use screen recording at 1920x1080, large cursor, quiet room.

---

## Script (3–5 Minutes)

---

### 0:00 — Opening Hook

**On screen:** React frontend Home page

**Narration:**
> "Hi, I'm demonstrating PitchPilot AI — an AI-powered interview and presentation coaching platform that now runs on desktop, web, and mobile. Let me show you the full stack in under 5 minutes."

---

### 0:15 — Problem Statement

**On screen:** React Home page hero section

**Narration:**
> "The problem is simple: people preparing for interviews have no objective way to measure their performance. You can practice in a mirror, but you can't rigorously count your filler words, analyze your body movement, or evaluate your answer structure. PitchPilot AI solves that by analyzing practice videos across four dimensions and giving you a structured score with actionable next steps."

---

### 0:30 — Solution Overview

**On screen:** Scroll through React Home page feature cards

**Narration:**
> "The platform evaluates video motion, camera presence, speech clarity, and answer content — then combines everything into a single overall score from 0 to 100. You also get strengths, weak points, and a concrete next practice task. Everything is trackable over time on a dashboard, and you can export professional HTML or CSV reports."

---

### 0:45 — Architecture Overview

**On screen:** Switch to README.md architecture diagram (or verbally describe)

**Narration:**
> "Under the hood, PitchPilot AI uses a FastAPI backend that exposes all core analyzers via REST API. The same backend serves three clients: a Streamlit desktop demo app, a React web frontend, and an Expo mobile app for iOS and Android. All clients share the same SQLite session database, so your history and dashboard stay in sync no matter which device you practice on."

---

### 1:00 — React Web Demo — Practice Flow

**On screen:** React Practice page

**Narration:**
> "Let's start with the React web app. On the Practice page, you select a practice mode — we have seven, covering software development, AI/ML, data analysis, university admissions, presentations, sales, and behavioral interviews. Each mode has curated questions, and you can randomize to keep practice unpredictable. You set your target role, upload an MP4 video, and run the full analysis pipeline."

**Action:** Select a mode, pick a question, set role, upload sample MP4.

**Narration:**
> "The app validates the file — MP4 only, under 200 megabytes — and then runs the pipeline: uploading, video analysis, camera analysis, speech transcription, AI coaching, and final scoring. You see animated progress steps so you know exactly what's happening."

---

### 1:45 — React Web Demo — Feedback

**On screen:** React Feedback page after analysis completes

**Narration:**
> "When analysis finishes, you're taken to the Feedback page. You see an animated overall score ring, a performance badge, and a breakdown across Video, Camera, Speech, and Answer. Scroll down for strengths, weak points, the transcript preview, the AI model used, and a specific next practice task."

**Action:** Scroll through Feedback page.

**Narration:**
> "Notice this green 'Saved to History' badge — that means the backend automatically saved this session to SQLite and returned a session ID. Because of that, the Export HTML and Export CSV buttons are now active. If the save had failed, the analysis would still complete, but you'd see a warning instead of the badge."

---

### 2:10 — React Web Demo — Dashboard & History

**On screen:** React Dashboard page

**Narration:**
> "The Dashboard tracks your progress with KPI cards, a score progression chart, skill breakdown bars, and a recent activity table. Hit the Refresh button and the latest session appears instantly."

**Action:** Click Refresh.

**On screen:** React History page

**Narration:**
> "The History page shows all saved sessions sorted newest-first. Filter by Today, This Week, or All Time. Click any session to see the full detail panel — scores, transcript, strengths, weak points, metadata — and export reports directly from here."

---

### 2:35 — Mobile Demo

**On screen:** Expo mobile app (simulator or phone recording)

**Narration:**
> "The same experience works on mobile. In the Expo app, you pick a practice mode, select or randomize a question, confirm your target role, choose an MP4 video from your device, and run full analysis. The progress steps animate just like the web app."

**Action:** Show mobile Practice → upload → progress → result.

**Narration:**
> "When the analysis completes, you see the overall score, the four dimension scores, strengths, weak points, and transcript. If the session was saved successfully, you get a 'Saved to History' badge, plus buttons to jump straight to the Dashboard or History tabs. You can also export HTML and CSV reports right from your phone."

**Action:** Show mobile Dashboard and History tabs.

---

### 2:55 — FastAPI Docs Demo

**On screen:** FastAPI Swagger UI at `/docs`

**Narration:**
> "The backbone of all three clients is the FastAPI backend. Here in the auto-generated Swagger docs, you can see every endpoint: full analysis upload, session history, dashboard stats, and report export. The `POST /api/v1/analyze/full` endpoint runs the complete pipeline and automatically persists the session to SQLite — returning the session ID so clients can link directly to history and enable exports."

**Action:** Scroll through Swagger docs, highlight `/analyze/full`, `/sessions`, `/dashboard/stats`, `/reports/{id}/html`.

---

### 3:10 — Streamlit Desktop Demo (Brief)

**On screen:** Streamlit app at `localhost:8501`

**Narration:**
> "For quick desktop demos and testing, the original Streamlit app is still included. It has Demo Mode for instant sample data, the same question bank, and full access to video, camera, speech, and AI Coach analyses. It's perfect for offline testing or one-on-one coaching sessions."

**Action:** Click Load Demo Data, briefly show Feedback and Dashboard.

---

### 3:25 — Dashboard / History / Report Demo (Unified)

**On screen:** React Dashboard, then History, then open exported HTML report

**Narration:**
> "Because all clients write to the same SQLite database through the FastAPI backend, your dashboard and history stay synchronized. Whether you practice on web or mobile, the data aggregates here. The HTML report is a self-contained, styled document you can email to a mentor or coach. The CSV gives you raw metrics for spreadsheet tracking."

**Action:** Show exported HTML report in browser, scroll through score grid and transcript.

---

### 3:45 — Closing Portfolio Pitch

**On screen:** Return to React Home page

**Narration:**
> "PitchPilot AI is built with FastAPI, React, Expo, Streamlit, OpenCV, faster-whisper, and SQLite. It works offline for core features, gracefully falls back to rule-based AI when no API key is available, and scales from a personal practice tool to a multi-client coaching platform. The modular architecture means each analyzer can be upgraded independently — swap Haar Cascade for MediaPipe, or rule-based AI for a fine-tuned model — without touching the UI. Check out the code on GitHub."

**On screen:** GitHub URL overlay for 3+ seconds.

---

## Key Phrases to Hit

| Phrase | When to Say |
|--------|-------------|
| "Four dimensions: video, camera, speech, answer" | Solution overview |
| "Weighted overall score from 0 to 100" | Feedback page |
| "FastAPI backend serves Streamlit, React, and Expo" | Architecture |
| "Saved to History badge with session ID" | Feedback result |
| "Graceful degradation — works offline" | AI Coach / closing |
| "Modular architecture — swap analyzers independently" | Closing pitch |
| "Self-contained HTML report for mentors/coaches" | Export demo |

---

## Backup Plan — If Upload Is Slow

If the MP4 upload or analysis takes too long during recording:

1. **Skip the upload** and use the React Feedback page with a previously saved session.
2. **Say:** "In the interest of time, I've already run the analysis. Here's what the Feedback page looks like when complete."
3. Continue showing the Feedback, Dashboard, History, and mobile flows as planned.

---

## Recording Checklist

- [ ] Backend running on `0.0.0.0:8000`
- [ ] Frontend running on `localhost:5173`
- [ ] Streamlit running on `localhost:8501`
- [ ] Mobile app connected to correct backend URL
- [ ] Sample MP4 under 200 MB ready
- [ ] Browser tabs pre-opened
- [ ] Screen recorder at 1920x1080
- [ ] Cursor enlarged
- [ ] Quiet environment
- [ ] Script printed or on second monitor
