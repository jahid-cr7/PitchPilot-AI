# Demo Script

A 3-minute walkthrough for interviews, presentations, or GitHub showcases.

---

## Setup (before you start)

1. Run the app: `streamlit run app.py`
2. Open browser to `http://localhost:8501`
3. Ensure you are on the **Home** page

---

## Script (3 minutes)

### 0:00 — Opening Hook

> "Hi, I'm [Your Name]. I built PitchPilot AI — an AI-powered interview coach that analyzes your practice videos and gives you structured feedback. Let me show you how it works in under 3 minutes."

### 0:15 — Home Page & Overview

**What to click:** Scroll down the Home page.

**What to say:**
> "Here's the landing page. It gives an overview of the project, the tech stack, and an ethical-use pledge. The app is built with Streamlit, OpenCV for video analysis, faster-whisper for speech transcription, and an optional LLM API for content coaching."

### 0:30 — Demo Mode

**What to click:** Click **"🚀 Load Demo Data"** on the Home page.

**What to say:**
> "I included a Demo Mode so you can try the full feature set instantly — no video upload needed. One click loads realistic sample data for video, camera, speech, and AI analysis. This is great for testing, interviews, or presentations like this one."

**What happens:**
- Success toast appears: "Demo data loaded!"

### 0:45 — Feedback Page

**What to click:** Navigate to **Feedback** in the sidebar.

**What to say:**
> "Now let's look at the feedback. Here we see four analysis dimensions: video movement, camera presence, speech clarity, and AI Coach content analysis. Each section uses expandable containers so the page stays clean."

**Scroll to:** Video Analysis section.
> "Video analysis gives us duration, FPS, resolution, and a movement score. Lower, natural movement is better for interviews."

**Scroll to:** Camera Presence section.
> "Camera presence checks face visibility, framing, and distance. Here we see 95% face visibility with centered framing — that's strong."

**Scroll to:** Speech Analysis section.
> "Speech analysis uses faster-whisper to transcribe audio. We get word count, words per minute, filler words, and repeated words. The transcript is stored and editable."

**Scroll to:** AI Coach section.
> "The AI Coach analyzes the transcript for structure, relevance, and clarity. It works in two modes: if you have an API key, it calls a real LLM. If not, it falls back to intelligent rule-based scoring. Right now we're in fallback mode — zero config needed."

### 1:45 — Final Score

**What to click:** Scroll to **Final Feedback** and click **"✨ Generate Final Feedback"**.

**What to say:**
> "Once all three analyses are complete, we can generate a final overall score. It's a weighted average: 20% video, 30% camera, 30% speech, and 20% answer content. The engine also derives strengths, weak points, and a personalized next practice task."

**What happens:**
- Overall score appears (e.g., 79/100 — Good)
- Component breakdown shows 4 metrics
- Strengths and weak points render as styled cards

### 2:15 — Save & Dashboard

**What to click:** Click **"💾 Save Session"**.

**What to say:**
> "We can save this session to a local SQLite database. Now let's go to the Dashboard to see how progress tracking works."

**What to click:** Navigate to **Dashboard** in the sidebar.

**What to say:**
> "The Dashboard pulls real data from the database. We see KPIs like total sessions, average score, best score, and trend charts over time. Every chart has a caption explaining what it means. If there's no data, it shows a friendly placeholder instead of breaking."

### 2:40 — History & Export

**What to click:** Navigate to **History** in the sidebar.

**What to say:**
> "Finally, the History page lets you browse past sessions, view full transcripts, and export reports in HTML or CSV format. You can also delete sessions if needed."

### 2:55 — Closing

**What to say:**
> "That's PitchPilot AI in 3 minutes. It works offline for most features, supports real LLM integration when you want it, and has a clean modular architecture that makes it easy to extend. Thanks for watching!"

---

## How to Explain Demo Mode

If asked:
> "Demo Mode is a one-click feature that injects realistic sample data into the app's session state. It lets interviewers, testers, or stakeholders experience the full UI without uploading a real video or waiting for analysis. It's perfect for live demos."

## How to Explain Fallback AI Mode

If asked:
> "The AI Coach has a dual-mode design. When an API key is available, it calls an LLM for deep content analysis. When it's not, it falls back to a rule-based engine that checks word count, structure, keyword relevance, and sentence variety. The UI sees the exact same data structure in both cases, so there's no branching logic in the frontend."

## How to Explain Real-World Use

If asked:
> "In production, a user uploads a practice interview video. The app runs video, camera, and speech analyses locally. The user enters their interview question and target role, and the AI Coach evaluates their transcript. They get a final score, actionable feedback, and a next practice task. Over time, the Dashboard shows their improvement trend."
