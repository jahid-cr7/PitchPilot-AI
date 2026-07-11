# PitchPilot AI — Screenshot Checklist

This document lists all required screenshots for the portfolio, GitHub README, and demo presentations. Each entry includes what to capture, where to find it, and suggested file naming.

---

## Screenshot 1: Home Page

**What to capture:**
- Full Home page (`app.py`) from top to bottom, or at minimum the hero section and feature cards
- Hero section with "🎯 PitchPilot AI" title and gradient background
- Status badges: MVP, Offline Fallback, API-Ready, Local SQLite, Ethical Practice Tool
- CTA buttons: Start Practice, View Dashboard, Load Demo Data
- Feature overview grid (Video Intelligence, Camera Presence, Speech Analytics, AI Coach Mode, etc.)
- Use cases section (Students, Job Seekers, Sales Teams, Teachers, Career Centers)

**How to capture:**
1. Open `http://localhost:8501`
2. Ensure browser is at full width (desktop, ~1440px or wider)
3. Take a full-page screenshot or capture the hero + first two feature rows

**Suggested filename:** `screenshot_01_home_page.png`

**Usage:** GitHub README, portfolio website, LinkedIn post

---

## Screenshot 2: Practice Page with Question Bank

**What to capture:**
- Practice page (`pages/1_Practice.py`) with Practice Setup card visible
- Practice Mode dropdown showing one of the modes (e.g., "Software Developer Interview")
- Question dropdown showing a selected question (e.g., "Tell me about yourself.")
- Target Role field filled in (e.g., "Software Developer")
- Current setup info line
- Workflow step indicator at the top
- Optional: show the "🎲 Random" button being used

**How to capture:**
1. Navigate to Practice page
2. Select a practice mode and question
3. Ensure the form is fully visible
4. Take screenshot of the upper portion of the page

**Suggested filename:** `screenshot_02_practice_question_bank.png`

**Usage:** GitHub README, demo slides, portfolio website

---

## Screenshot 3: Feedback Page with AI Coach Result

**What to capture:**
- Feedback page (`pages/2_Feedback.py`) after Demo Data is loaded
- Session Intelligence bar with all four badges green (Video Ready, Camera Ready, Speech Ready, AI Coach Ready)
- Video Intelligence card with metrics (Duration, FPS, Resolution, Movement Score)
- Camera Presence card with metrics (Face Visible %, Framing, Distance, Movement, Camera Score)
- Speech Analytics card with metrics (Words, WPM, Fillers, Repeated, Speech Score)
- AI Coach Mode section showing:
  - Answer Score (e.g., 80/100)
  - Mode badge (fallback_rules)
  - Structure Feedback line
  - Content Strengths (green boxes)
  - Content Weak Points (warning boxes)
  - Improved Answer expandable section

**How to capture:**
1. Load Demo Data from Home page
2. Navigate to Feedback page
3. Scroll to show Video, Camera, Speech, and AI Coach sections
4. Capture the full page or a tall composite screenshot

**Suggested filename:** `screenshot_03_feedback_ai_coach.png`

**Usage:** GitHub README (primary showcase image), portfolio website hero, demo slides

---

## Screenshot 4: Dashboard Page

**What to capture:**
- Dashboard page (`pages/3_Dashboard.py`) after Demo Data is loaded
- Key Performance Indicators row (Total Sessions, Average Score, Best Score, Latest Score)
- Current Session Score component breakdown bar chart (Video, Camera, Speech, Answer)
- Overall Score Trend line chart
- Latest Session Breakdown bar chart
- Practice History data table with at least one row

**How to capture:**
1. Load Demo Data
2. Save the session from Feedback page (optional — generates more data)
3. Navigate to Dashboard
4. Capture the full page

**Suggested filename:** `screenshot_04_dashboard.png`

**Usage:** GitHub README, portfolio website, demo slides

---

## Screenshot 5: History Page

**What to capture:**
- History page (`pages/4_History.py`) with at least one saved session
- Session selector dropdown
- Session Detail Card with score summary (Overall, Camera, Speech, Answer + Performance badge)
- Session Metadata table (Video File, Question, Target Role, Duration, WPM, etc.)
- Transcript & Feedback section with strengths and weak points
- Export Report section with Download HTML and Download CSV buttons

**How to capture:**
1. Load Demo Data
2. Go to Feedback page and click "💾 Save Session to History"
3. Navigate to History page
4. Capture the full page or a tall composite

**Suggested filename:** `screenshot_05_history.png`

**Usage:** GitHub README, portfolio website, demo slides

---

## Screenshot 6: Settings Page

**What to capture:**
- Settings page (`pages/5_Settings.py`) with all sections visible
- AI Provider Status card (Current Mode, Model, Base URL, API Key status)
- Security Note about API key handling
- Library Status (OpenAI client installed or not)
- Temporary Session Settings form
- AI Health Check section with Test AI Connection button

**How to capture:**
1. Navigate to Settings page
2. Ensure no real API key is visible (show "Not Set" or mask it)
3. Capture the full page

**Suggested filename:** `screenshot_06_settings.png`

**Usage:** GitHub README, portfolio website

---

## Screenshot 7: Export Report Example

**What to capture:**
- The exported HTML report opened in a browser
- Title: "PitchPilot AI Feedback Report"
- Score grid with Overall, Video, Camera, Speech, Answer scores
- Session Details table
- Speech Analysis table
- Camera Presence table
- Strengths and Weak Points lists
- Next Practice Task box
- Summary box
- Transcript block

**How to capture:**
1. Load Demo Data and save a session
2. Go to History page
3. Click "📄 Download HTML Report"
4. Open the downloaded HTML file in a browser
5. Capture the full page or a tall composite

**Suggested filename:** `screenshot_07_export_report_html.png`

**Usage:** GitHub README, portfolio website, LinkedIn post, demo slides

---

## Optional Bonus Screenshots

### Screenshot 8: Final Performance Score
**What:** The Final Performance Score section on Feedback page showing the large highlighted score, component breakdown, strengths, weak points, and next task.
**Filename:** `screenshot_08_final_score.png`

### Screenshot 9: Demo Mode in Action
**What:** Home page with the "🧪 Load Demo Data" button clicked and the success message visible.
**Filename:** `screenshot_09_demo_mode.png`

### Screenshot 10: Mobile / Responsive View
**What:** Any page captured at a narrow viewport width (~375px) to show responsive layout.
**Filename:** `screenshot_10_mobile_responsive.png`

---

## Screenshot Naming Convention

Use this pattern for consistency:

```
screenshot_XX_descriptive_name.png
```

Where `XX` is a zero-padded two-digit number.

Store all screenshots in:
```
portfolio/screenshots/
```

---

## Tools for Capturing Screenshots

- **Browser full-page:** Chrome DevTools → Command Menu → "Capture full size screenshot"
- **Mac:** `Cmd + Shift + 4` (selection) or `Cmd + Shift + 3` (full screen)
- **Windows:** `Win + Shift + S` (Snipping Tool)
- **Linux:** `gnome-screenshot -a` or `flameshot`
- **Professional:** Shottr, CleanShot X, or ShareX

---

## Image Optimization

Before adding screenshots to the GitHub README or portfolio website:

1. **Resize** large screenshots to max width 1440px for faster loading
2. **Compress** using tools like:
   - `oxipng` (command line)
   - TinyPNG (web)
   - Squoosh (web)
3. **Use PNG** for UI screenshots (preserves crisp text)
4. **Add alt text** in markdown for accessibility
