# Video Demo Script

Scripts for recording a polished demo video for your portfolio, GitHub, and interviews.

---

## 60-Second Demo Script

### Setup
- Start the app: `streamlit run app.py`
- Ensure browser is at `http://localhost:8501`
- Have screen recording software ready (OBS, Loom, or ShareX)
- Resolution: 1920x1080 recommended

---

### 0:00 — Hook

**On screen:** Home page of PitchPilot AI

**Narration:**
> "This is PitchPilot AI — an AI-powered interview coach that analyzes your practice videos and gives you structured feedback."

---

### 0:05 — Demo Mode

**Action:** Click "🚀 Load Demo Data" on the Home page.

**Narration:**
> "I'll start with Demo Mode — one click loads realistic sample data so you can see the full feature set instantly."

**On screen:** Success toast appears.

---

### 0:10 — Feedback Page

**Action:** Click **Feedback** in the sidebar.

**Narration:**
> "On the Feedback page, we see four analysis dimensions: video movement, camera presence, speech clarity, and AI Coach content analysis."

**Action:** Scroll through Video, Camera, and Speech sections quickly.

---

### 0:25 — AI Coach

**Action:** Scroll to the AI Coach section.

**Narration:**
> "The AI Coach evaluates your answer for structure, relevance, and clarity. It works with a real LLM when you have an API key, or falls back to intelligent rule-based scoring offline."

---

### 0:35 — Final Score

**Action:** Scroll to the Final Feedback section.

**Narration:**
> "All scores combine into a weighted overall rating — 79 out of 100, rated Good. You get strengths, weak points, and a personalized next practice task."

---

### 0:45 — Dashboard

**Action:** Click **Dashboard** in the sidebar.

**Narration:**
> "The Dashboard tracks your progress over time with trend charts and key metrics."

---

### 0:52 — History

**Action:** Click **History** in the sidebar.

**Narration:**
> "And the History page lets you browse past sessions and export reports in HTML or CSV."

---

### 0:58 — Closing

**Narration:**
> "That's PitchPilot AI in 60 seconds. Built with Python, Streamlit, and OpenCV. Check it out on GitHub."

**On screen:** GitHub URL appears as overlay text.

---

## 3-Minute Demo Script

### Setup
- Same as 60-second script
- Have a clean browser window, no unnecessary tabs

---

### 0:00 — Introduction

**On screen:** Home page

**Narration:**
> "Hi, I'm demonstrating PitchPilot AI — an AI-powered interview and presentation coaching platform I built with Python and Streamlit. The problem it solves is simple: people preparing for interviews have no objective way to measure their performance. You can practice in a mirror, but you can't count your filler words or analyze your body movement rigorously."

---

### 0:20 — Demo Mode

**Action:** Click "🚀 Load Demo Data"

**Narration:**
> "To show you the full feature set without uploading a real video, I'll use Demo Mode. One click injects realistic sample data into the app. This is perfect for presentations, testing, and interviews."

---

### 0:30 — Practice Page (Brief)

**Action:** Click **Practice** in the sidebar.

**Narration:**
> "On the Practice page, you upload an MP4 video and run three analyses: video motion, camera presence, and speech transcription. Since Demo Mode already loaded the data, we can skip ahead to the results."

---

### 0:40 — Feedback Page — Video Analysis

**Action:** Click **Feedback** in the sidebar.

**Narration:**
> "The Feedback page aggregates all results. First, video analysis gives us duration, FPS, resolution, and a movement score. Natural, calm movement is ideal for interviews."

**Action:** Point cursor to Video Analysis metrics.

---

### 0:55 — Camera Presence

**Action:** Scroll to Camera Presence.

**Narration:**
> "Camera presence checks face visibility, framing, and distance. Here we see 95% face visibility with centered framing — strong camera presence."

---

### 1:05 — Speech Analysis

**Action:** Scroll to Speech Analysis.

**Narration:**
> "Speech analysis uses faster-whisper for local transcription. We get word count, words per minute, filler words like 'um' and 'uh', and repeated words. The full transcript is stored and editable."

---

### 1:20 — AI Coach

**Action:** Scroll to AI Coach.

**Narration:**
> "Now the AI Coach. You enter your interview question and target role, and it analyzes your transcript for structure, relevance, and clarity. I'm proud of the dual-mode design: with an API key, it calls a real LLM. Without one, it falls back to rule-based scoring that checks introductions, background mentions, role keywords, and sentence variety. The UI sees the exact same data structure in both cases."

**Action:** Point to the fallback mode info banner.

---

### 1:45 — Final Score

**Action:** Scroll to Final Feedback.

**Narration:**
> "Once all three analyses are done, the scoring engine calculates a weighted overall score: 20% video, 30% camera, 30% speech, and 20% answer content. It also classifies your performance level, identifies strengths and weak points, and suggests a concrete next practice task based on your weakest area."

---

### 2:05 — Save Session

**Action:** Click "💾 Save Session" (if available) or mention it.

**Narration:**
> "You can save the session to a local SQLite database, which powers the progress tracking."

---

### 2:10 — Dashboard

**Action:** Click **Dashboard** in the sidebar.

**Narration:**
> "The Dashboard pulls real data from the database. We see total sessions, average score, best score, and trend charts. Every chart has a caption explaining what it means. If there's no data, it shows a friendly placeholder."

---

### 2:30 — History & Export

**Action:** Click **History** in the sidebar.

**Narration:**
> "Finally, the History page lets you browse past sessions, view full transcripts, and export reports in HTML or CSV format. You can also delete sessions if needed."

---

### 2:50 — Closing

**Narration:**
> "That's PitchPilot AI. It works offline for most features, supports real LLM integration when you want it, and has a clean modular architecture that makes it easy to extend. Thanks for watching — check out the code on GitHub."

**On screen:** GitHub URL overlay.

---

## What to Click — Cheat Sheet

| Timestamp | Action | Page |
|-----------|--------|------|
| 0:00 | Show Home page | Home |
| 0:05 | Click "Load Demo Data" | Home |
| 0:10 | Click "Feedback" in sidebar | Feedback |
| 0:25 | Scroll to AI Coach | Feedback |
| 0:35 | Scroll to Final Feedback | Feedback |
| 0:45 | Click "Dashboard" in sidebar | Dashboard |
| 0:52 | Click "History" in sidebar | History |

---

## What to Say — Key Phrases

- **Problem statement:** "People preparing for interviews have no objective way to measure their performance."
- **Solution:** "PitchPilot AI analyzes practice videos across four dimensions and gives you a score and actionable feedback."
- **Dual-mode AI:** "Works with a real LLM when available, falls back to rule-based scoring offline."
- **Weighted scoring:** "20% video, 30% camera, 30% speech, 20% answer."
- **Modular architecture:** "Each analyzer is independent — swap in better models without rewriting the UI."
- **Demo Mode:** "One click loads sample data for instant testing and presentations."

---

## Backup Plan — Using Demo Mode

If your real video analysis is slow or fails during a live demo:

1. **Immediately click "Load Demo Data"** on the Home page.
2. **Navigate to Feedback** — all results are pre-loaded.
3. **Show the AI Coach, Final Score, Dashboard, and History** as planned.
4. **Explain:** "This is Demo Mode — it lets you experience the full feature set instantly. In real use, you upload a video and the analyses run automatically."

**Why this works:** The demo data is realistic and comprehensive. Interviewers care about the product and architecture, not whether you uploaded a real video.

---

## Recording Tips

- **Resolution:** 1920x1080 minimum
- **Cursor:** Make your cursor large and visible
- **Zoom:** Use browser zoom (110-125%) if text looks small
- **Audio:** Use a quiet room or a good microphone
- **Pacing:** Pause slightly after each click so viewers can follow
- **Length:** Aim for exactly 60 seconds or 3 minutes — edit ruthlessly
- **Outro:** End with the GitHub URL on screen for at least 3 seconds
