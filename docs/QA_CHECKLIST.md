# QA Checklist

Use this checklist before GitHub push, demo video recording, or company interview presentation.

---

## Automated Smoke Test

Run the automated smoke test first:

```bash
cd ~/PitchPilot\ AI
source .venv/bin/activate
python scripts/smoke_test.py
```

Expected output: `✅ PitchPilot AI smoke test passed.`

---

## Manual UI Checklist

### Home Page
- [ ] App opens at `http://localhost:8501` without errors
- [ ] Gradient hero section renders correctly
- [ ] Badge row (MVP, Offline Fallback, API-Ready, etc.) is visible
- [ ] CTA buttons (Start Practice, View Dashboard, Load Demo Data) are clickable
- [ ] Feature cards render in 2 rows
- [ ] Use case cards (Students, Job Seekers, Sales Teams, Teachers, Career Centers) render
- [ ] Ethical use note is visible

### Demo Mode
- [ ] Click **"🧪 Load Demo Data"** on Home page
- [ ] Success toast appears
- [ ] Demo data indicator shows on Practice page

### Practice Page
- [ ] Page opens without errors
- [ ] Workflow step indicator shows 5 steps (Upload → Video → Camera → Speech → Feedback)
- [ ] File uploader accepts MP4 files
- [ ] Video preview plays after upload
- [ ] **Analyze Video** button runs and returns results
- [ ] **Analyze Camera Presence** button runs and returns results
- [ ] **Analyze Speech** button runs and returns results
- [ ] Transcript expander shows text
- [ ] All three analyses show success metrics

### Feedback Page
- [ ] Page opens without errors
- [ ] Session Intelligence badge bar shows Video/Camera/Speech/AI Coach status
- [ ] Video Intelligence card shows metrics
- [ ] Camera Presence card shows metrics
- [ ] Speech Analytics card shows metrics
- [ ] AI Coach Mode form accepts transcript, question, and role
- [ ] **Generate Coaching Insights** button runs
- [ ] AI Coach result shows Answer Score, Model, Mode
- [ ] Content Strengths and Weak Points render
- [ ] Fallback mode info banner appears when no API key is set
- [ ] **Generate Final Performance Score** button runs when all 3 analyses complete
- [ ] Final score highlight box shows Overall Score and Performance Level
- [ ] Component Breakdown shows Video, Camera, Speech, Answer
- [ ] **Save Session to History** button works

### Dashboard Page
- [ ] Page opens without errors
- [ ] KPI cards show Total Sessions, Average Score, Best Score, Latest Score
- [ ] Current Session Score section appears if final feedback exists
- [ ] Overall Score Trend chart renders (or empty state if no sessions)
- [ ] Latest Session Breakdown chart renders (or empty state)
- [ ] Practice History table shows saved sessions

### History Page
- [ ] Page opens without errors
- [ ] Session selector dropdown lists saved sessions
- [ ] Session detail card shows scores
- [ ] Transcript expander works
- [ ] Strengths and Weak Points render
- [ ] **Download HTML Report** button works
- [ ] **Download CSV Report** button works
- [ ] Delete session workflow works (with confirmation)

### Settings Page
- [ ] Page opens without errors
- [ ] AI Provider Status card shows Current Mode, Model, Base URL, API Key status
- [ ] Security note is visible
- [ ] Library Status shows OpenAI installed or not
- [ ] Temporary API Key password input works
- [ ] Base URL and Model Name inputs work
- [ ] **Save Temporary Settings** button stores values in session
- [ ] **Clear Temporary Settings** button removes values
- [ ] **Test AI Connection** button runs without crash
- [ ] Test result shows status, model, mode

---

## AI Modes

### Fallback Mode (no API key)
- [ ] AI Coach returns `status: "fallback"`
- [ ] Answer Score is computed by rule-based engine
- [ ] No API calls are attempted
- [ ] App does not crash

### Real AI Mode (with API key)
- [ ] Set `PITCHPILOT_AI_API_KEY` environment variable
- [ ] AI Coach returns `status: "success"`
- [ ] Answer Score is computed by LLM
- [ ] Or use Settings page to set a temporary session key
- [ ] Health check shows "Connection successful"

---

## Security Checklist

- [ ] No API keys are hardcoded in any `.py` file
- [ ] No API keys are saved to SQLite
- [ ] No API keys are written to files
- [ ] No API keys are printed to console (except smoke test, which masks them)
- [ ] `.gitignore` ignores `.env`, `data/*.db`, `uploads/`, `.streamlit/secrets.toml`
- [ ] `.env.example` exists with empty placeholder values
- [ ] No real credentials committed to git

---

## Cross-Platform Checklist

- [ ] Works on Ubuntu (primary dev environment)
- [ ] Works on Windows (tested or documented)
- [ ] Uses `pathlib.Path` for all file operations
- [ ] No OS-specific shell commands in app code
- [ ] Virtual environment setup documented for both platforms

---

## Documentation Checklist

- [ ] `README.md` is up to date
- [ ] `docs/ARCHITECTURE.md` reflects current design
- [ ] `docs/DEMO_SCRIPT.md` matches current UI flow
- [ ] `docs/INTERVIEW_GUIDE.md` has current talking points
- [ ] `docs/ROADMAP.md` is current
- [ ] `CHANGELOG.md` has v1.0.0 entry
- [ ] `RELEASE_NOTES.md` is current
- [ ] `LICENSE` exists
- [ ] `CONTRIBUTING.md` exists

---

## Pre-Push Final Checks

- [ ] `python scripts/smoke_test.py` passes
- [ ] `git status` shows only intended files
- [ ] `git diff` looks correct
- [ ] No `.db` files staged
- [ ] No `.mp4` files staged
- [ ] No `.env` files staged
- [ ] Commit message is descriptive

---

## Sign-Off

| Date | Tester | Result |
|------|--------|--------|
|      |        |        |
