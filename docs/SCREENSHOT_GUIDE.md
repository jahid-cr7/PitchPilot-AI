# Screenshot Guide

This checklist ensures you capture all key screens for your GitHub README, portfolio, and LinkedIn posts.

## Recommended Tools

- **Windows:** Snipping Tool, ShareX, or Greenshot
- **macOS:** Cmd + Shift + 4 (area selection) or Cmd + Shift + 5 (window)
- **Ubuntu:** Flameshot, GNOME Screenshot, or Shutter
- **Browser extension:** GoFullPage (for full-page captures)

---

## Screenshot Checklist

### 1. Home Page
- [ ] Full page showing the hero section with project title and description
- [ ] Feature cards section (Practice, Feedback, Dashboard)
- [ ] Demo Mode button visible
- [ ] Tech stack section
- [ ] Ethical use note

**File name:** `screenshot_01_home.png`

---

### 2. Practice Page — Upload
- [ ] File uploader with an MP4 video selected
- [ ] Video preview playing
- [ ] Analysis buttons visible (Analyze Video, Analyze Camera, Analyze Speech)

**File name:** `screenshot_02_practice_upload.png`

---

### 3. Video Analysis Result
- [ ] Success message: "Video analysis complete"
- [ ] Metric cards: Duration, FPS, Resolution, Movement Score
- [ ] Video details table visible

**File name:** `screenshot_03_video_result.png`

---

### 4. Camera Analysis Result
- [ ] Success message: "Camera analysis complete"
- [ ] Metric cards: Face Visible %, Framing, Distance, Movement, Camera Score
- [ ] Warnings section (if any)
- [ ] Camera details table visible

**File name:** `screenshot_04_camera_result.png`

---

### 5. Speech Analysis Result
- [ ] Success message: "Speech analysis complete"
- [ ] Metric cards: Word Count, WPM, Filler Words, Repeated Words, Speech Score
- [ ] Transcript expander open showing text
- [ ] Speech details table visible

**File name:** `screenshot_05_speech_result.png`

---

### 6. Feedback Page — Overview
- [ ] All three analysis sections visible (Video, Camera, Speech)
- [ ] Clean layout with border containers
- [ ] AI Coach form visible with transcript text area

**File name:** `screenshot_06_feedback_overview.png`

---

### 7. AI Coach Result
- [ ] Answer Score, Model Used, Mode metric cards
- [ ] Structure Feedback text
- [ ] Content Strengths (green cards)
- [ ] Content Weak Points (yellow cards)
- [ ] Improved Answer expander
- [ ] Next Content Task

**File name:** `screenshot_07_ai_coach.png`

---

### 8. Final Score
- [ ] Overall Score and Performance Level prominently displayed
- [ ] Component breakdown: Video, Camera, Speech, Answer
- [ ] Strengths and Weak Points lists
- [ ] Next Practice Task
- [ ] Save Session button

**File name:** `screenshot_08_final_score.png`

---

### 9. Dashboard
- [ ] KPI metrics: Total Sessions, Avg Score, Best Score, Latest Score
- [ ] Overall Score Trend line chart
- [ ] Latest Session Breakdown bar chart
- [ ] Saved Sessions table

**File name:** `screenshot_09_dashboard.png`

---

### 10. History Page
- [ ] Session selector dropdown
- [ ] Session scores (Overall, Camera, Speech, Answer, Performance)
- [ ] Session info table
- [ ] Transcript expander
- [ ] Strengths and Weak Points
- [ ] Export buttons (HTML and CSV)

**File name:** `screenshot_10_history.png`

---

### 11. Export Report
- [ ] HTML report opened in browser showing full session data
- [ ] CSV report opened in spreadsheet showing structured data

**File name:** `screenshot_11_export_report.png`

---

## Bonus Screenshots

- [ ] Demo Mode button clicked with success toast
- [ ] Mobile view (use browser dev tools to simulate mobile)
- [ ] Dark mode view (if supported by browser/system)
- [ ] Terminal showing `streamlit run app.py` output

---

## Where to Store Screenshots

Save all screenshots to:

```
assets/screenshots/
```

This folder is tracked by git so your README can reference them.

## How to Add to README

After capturing, update the Screenshots section in `README.md`:

```markdown
## Screenshots

### Home Page
<img src="assets/screenshots/screenshot_01_home.png" width="800">

### Practice Page
<img src="assets/screenshots/screenshot_02_practice_upload.png" width="800">

### Video Analysis
<img src="assets/screenshots/screenshot_03_video_result.png" width="800">

### Camera Analysis
<img src="assets/screenshots/screenshot_04_camera_result.png" width="800">

### Speech Analysis
<img src="assets/screenshots/screenshot_05_speech_result.png" width="800">

### Feedback & AI Coach
<img src="assets/screenshots/screenshot_07_ai_coach.png" width="800">

### Final Score
<img src="assets/screenshots/screenshot_08_final_score.png" width="800">

### Dashboard
<img src="assets/screenshots/screenshot_09_dashboard.png" width="800">

### History & Export
<img src="assets/screenshots/screenshot_10_history.png" width="800">
```

---

## Demo Video

For a polished portfolio, also record a 60-second screen capture video showing:
1. Clicking "Load Demo Data" on the Home page
2. Navigating to Feedback
3. Scrolling through analysis results
4. Showing the Final Score
5. Navigating to Dashboard

Upload to:
- YouTube (unlisted)
- Loom
- GitHub repository as a release asset

Add the link to README.md and LinkedIn posts.
