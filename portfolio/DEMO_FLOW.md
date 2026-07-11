# PitchPilot AI — Demo Flow

This guide provides a step-by-step walkthrough for demonstrating PitchPilot AI during a portfolio review, company interview, or screen recording. The flow is designed to be completed in 3–5 minutes.

---

## Prerequisites

- App is running locally (`streamlit run app.py` at `http://localhost:8501`)
- You have the browser open and ready to navigate
- Optional: have an API key ready if you want to show real AI mode

---

## Step 1: Open Home Page

**Action:** Navigate to the Home page (`app.py`).

**What to show:**
- Gradient hero section with "🎯 PitchPilot AI" title
- Status badges: MVP, Offline Fallback, API-Ready, Local SQLite, Ethical Practice Tool
- Three CTA buttons: "🚀 Start Practice", "📊 View Dashboard", "🧪 Load Demo Data"
- Value proposition cards: AI Coaching, Multimodal Feedback, Progress Tracking, Export Reports
- Feature overview grid: Video Intelligence, Camera Presence, Speech Analytics, AI Coach Mode, Progress Dashboard, Report Export, Question Bank, Random Question, AI Settings
- Use cases: Students, Job Seekers, Sales Teams, Teachers, Career Centers

**What to say:**
> "This is PitchPilot AI — a coaching platform for interview and presentation practice. The home page gives you an overview of all features, and these badges tell you the current status: it's an MVP, works offline, and is ready to connect to a real AI provider if you want."

---

## Step 2: Load Demo Data

**Action:** Click **"🧪 Load Demo Data"** on the Home page.

**What to show:**
- Success message: "Demo data loaded! Navigate to Feedback, Dashboard, or History to explore."
- Demo data includes a complete practice session with video, camera, speech, AI Coach, and final scoring results pre-populated in session state

**What to say:**
> "For demos and quick testing, you don't even need a video. Clicking Load Demo Data instantly populates a full practice session — video metadata, camera presence analysis, speech transcript, and AI Coach results — so you can explore every feature immediately."

---

## Step 3: Practice Mode Selection

**Action:** Click **"🚀 Start Practice"** to go to the Practice page.

**What to show:**
- Workflow step indicator: Upload → Video Analysis → Camera Analysis → Speech Analysis → Feedback
- Practice Setup card with mode selector dropdown showing all 7 modes:
  - Software Developer Interview
  - AI/ML Interview
  - Data Analyst Interview
  - University Admission Interview
  - Presentation Practice
  - Sales Pitch Practice
  - Behavioral Interview
- Question dropdown with curated questions for the selected mode
- "🎲 Random" button to pick a random question
- Target Role text input (auto-populated from the selected mode)
- Current setup info line showing mode, question, and role

**What to say:**
> "The Practice page is where you set up your session. You choose a practice mode — we have seven, covering software, AI/ML, data, university admissions, presentations, sales, and behavioral interviews. Each mode has curated questions, and you can pick a random one to keep practice fresh. The target role auto-fills based on the mode, but you can customize it."

---

## Step 4: Question Bank

**Action:** Click through a few different practice modes to show the question variety.

**What to show:**
- Switch to "AI/ML Interview" — questions about bias-variance tradeoff, recommendation systems, imbalanced datasets
- Switch to "Sales Pitch Practice" — questions about pitching to skeptical prospects, handling price objections
- Switch to "Behavioral Interview" — STAR-style questions about pressure, conflict, failure, adaptation
- Click "🎲 Random" to show random question selection

**What to say:**
> "The question bank is curated for each mode. For AI/ML, you get technical questions. For sales, you get pitch scenarios. For behavioral, you get STAR-method questions. The random picker keeps sessions unpredictable, just like real interviews."

---

## Step 5: Feedback Page

**Action:** Navigate to the **Feedback** page.

**What to show:**
- Session Intelligence bar: Video Ready, Camera Ready, Speech Ready, AI Coach Ready (all green badges)
- 🎬 Video Intelligence card: Duration 62s, FPS 30, Resolution 1920x1080, Movement Score 35
- 📷 Camera Presence card: Face Visible 95%, Framing Centered, Distance Good, Movement Low, Camera Score 82
- 🎤 Speech Analytics card: Words 95, WPM 142, Fillers 2, Repeated 1, Speech Score 78
- Expandable Transcript showing the demo answer text

**What to say:**
> "The Feedback page shows the results of all three analyses. Video intelligence tells you about motion and metadata. Camera presence checks if your face is visible, well-framed, and at a good distance. Speech analytics transcribes what you said, counts filler words, and calculates your speaking pace."

---

## Step 6: AI Coach

**Action:** Scroll to the **AI Coach Mode** section on the Feedback page.

**What to show:**
- Form pre-filled with transcript, interview question, and target role
- Info badge: "AI Coach is running in offline fallback mode (no API key detected)"
- Answer Score: 80/100
- Mode: fallback_rules
- Structure Feedback: "Structure: Introduction ✓ | Background ✓ | Closing ✓ | Role relevance: 4/10 keywords matched."
- Content Strengths (4 green success boxes)
- Content Weak Points (1 warning box)
- Expandable "💡 Improved Answer" suggestion
- Next Content Task recommendation

**What to say:**
> "The AI Coach analyzes your answer content. Right now it's in fallback mode because there's no API key — but notice it still gives structured feedback: a score, strengths, weak points, an improved answer suggestion, and a next task. This is the rule-based engine I built. If you add an API key, it switches to real LLM analysis with the exact same output format."

---

## Step 7: Final Feedback Score

**Action:** Scroll to the **Final Performance Score** section.

**What to show:**
- "✨ Generate Final Performance Score" button (already generated in demo mode)
- Large highlighted score: **79.5** / 100
- Performance Level: **Good**
- Component Breakdown: Video 79, Camera 82, Speech 78, Answer 80
- Strengths list (4 items)
- Weak Points list (1 item)
- Next Practice Task: specific, actionable recommendation
- Full Coaching Summary expandable section
- "💾 Save Session to History" button

**What to say:**
> "The final score combines all four dimensions with weighted aggregation: Video 20%, Camera 30%, Speech 30%, Answer 20%. You get a performance level, strengths, weak points, and a specific next task based on your weakest area. Then you can save the session to your history for tracking."

---

## Step 8: Dashboard

**Action:** Click **"📊 View Dashboard"** or navigate to the Dashboard page.

**What to show:**
- Key Performance Indicators: Total Sessions, Average Score, Best Score, Latest Score
- Current Session Score breakdown bar chart (Video, Camera, Speech, Answer)
- Overall Score Trend line chart
- Latest Session Breakdown bar chart
- Practice History data table with session IDs, dates, scores, and performance levels
- Coaching Insights info boxes

**What to say:**
> "The Dashboard is where you track progress. You see KPIs, a component breakdown for your latest session, and a trend chart that shows your overall scores over time. The more sessions you save, the richer this dashboard becomes."

---

## Step 9: History

**Action:** Navigate to the **History** page.

**What to show:**
- Session selector dropdown: "#1 — 2026-07-12 ... — 79/100 (Good)"
- Session Detail Card with Overall, Camera, Speech, Answer scores and Performance badge
- Session Metadata table: video file, question, target role, duration, resolution, WPM, fillers, AI model used
- Transcript & Feedback section with strengths, weak points, and next task
- Export Report section with two download buttons: HTML and CSV

**What to say:**
> "The History page lets you browse every saved session, inspect the full coaching report, and export professional reports. The HTML report is self-contained and styled — you can email it to a mentor or coach. The CSV export lets you do spreadsheet analysis or import into other tools."

**Optional:** Click one of the download buttons to show the export in action.

---

## Step 10: Export Report

**Action:** Click **"📄 Download HTML Report"** and **"📊 Download CSV Report"** on the History page.

**What to show:**
- Browser download starts
- If you open the HTML file, show the clean, styled report with:
  - Score grid (Overall, Video, Camera, Speech, Answer)
  - Session details table
  - Speech analysis table
  - Camera presence table
  - Strengths and weak points lists
  - Next practice task box
  - Summary box
  - Transcript block

**What to say:**
> "The HTML report is a professional, self-contained document you can share with a career coach, mentor, or hiring manager. The CSV gives you raw data for tracking across multiple sessions. Both are generated with zero external dependencies — just Python standard library."

---

## Step 11: Settings Page

**Action:** Navigate to the **Settings** page.

**What to show:**
- AI Provider Status card: Current Mode (fallback_rules), Model (gpt-4o-mini), Base URL, API Key (Not Set)
- Security Note: "API keys are never saved to files, SQLite, or logs"
- Library Status: OpenAI client library installed or not
- Temporary Session Settings form: API Key (password field), Base URL, Model Name
- Save and Clear buttons
- AI Health Check section with "🧪 Test AI Connection" button

**What to say:**
> "The Settings page shows you the current AI configuration. Right now we're in fallback mode because no API key is set. You can add a temporary key for this session only — it's stored in memory, never written to disk. Then you can test the connection with a single button. If it works, the AI Coach switches to real LLM analysis instantly."

---

## Step 12: Explain Fallback vs Real AI

**Action:** Click **"🧪 Test AI Connection"** to show the fallback message, then optionally enter a real API key and test again.

**What to show:**
- Without key: Info message "No API key configured. Fallback mode is active."
- With key: Success message showing provider response
- Status, Model Used, and Mode metrics in three columns

**What to say:**
> "This is one of the features I'm most proud of. The app is designed to work completely offline. The rule-based fallback engine analyzes structure, length, keywords, and role relevance — and it returns the exact same data structure as the LLM. So whether you're offline, don't have an API key, or the provider is down, the user experience is identical. When you do add a key, it seamlessly upgrades to GPT-4o-mini or any OpenAI-compatible model. This graceful degradation is something you rarely see in AI demos, but it's essential for real-world reliability."

---

## Demo Checklist

Use this checklist to ensure you hit every point:

- [ ] Home page hero and badges
- [ ] Load Demo Data
- [ ] Practice mode selector (show 2–3 modes)
- [ ] Question bank and random picker
- [ ] Feedback page with Video, Camera, Speech cards
- [ ] AI Coach with fallback explanation
- [ ] Final Performance Score with breakdown
- [ ] Dashboard with KPIs and trend chart
- [ ] History page with session inspection
- [ ] Export HTML and CSV reports
- [ ] Settings page with AI configuration
- [ ] Explain fallback vs real AI mode

---

## Tips for a Smooth Demo

1. **Load Demo Data first** — It removes the need for a real video and guarantees consistent results.
2. **Know your numbers** — The demo data produces Overall 79.5, Video 79, Camera 82, Speech 78, Answer 80. Mention these confidently.
3. **Emphasize offline capability** — This is a differentiator. Most AI demos fail without internet; PitchPilot doesn't.
4. **Show the modular architecture** — Mention that Video, Camera, Speech, and AI are independent modules.
5. **End on the ethical note** — "This is a practice tool, not a cheating tool. The goal is genuine confidence."
