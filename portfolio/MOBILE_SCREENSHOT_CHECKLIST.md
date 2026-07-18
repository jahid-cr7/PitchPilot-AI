# PitchPilot AI — Mobile Screenshot Checklist

Use this checklist to capture clean, demo-ready screenshots of the premium Expo mobile app.

## Prerequisites

1. Start the backend:
   ```bash
   cd ..
   python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. Start the mobile app:
   ```bash
   cd mobile
   npx expo start -c --web
   ```

3. Use browser DevTools mobile viewport for consistent framing:
   - Recommended: **iPhone 14 Pro** (390×844) or **Pixel 7** (412×915)
   - Set zoom to 100%
   - Ensure dark theme is active (app uses dark navy background)

4. Make sure the backend is **connected** before capturing (Home shows "Backend Online" badge).

5. For the Feedback screenshot, run at least one practice analysis first so real data appears.

---

## Final Screenshot Order & Filenames

### 01_mobile_home.png — Home Screen
- [ ] Open `/` (Home tab)
- [ ] Ensure backend is **online**
- [ ] Verify visible elements:
  - PitchPilot AI logo + rocket icon
  - "Backend Online" badge
  - "READY FOR YOUR INTERVIEW?" hero badge
  - "Practice smarter with AI-powered coaching." title
  - "Start Practice" gradient button
  - Core Modules: Video Analysis, AI Voice Coach, Impact Analytics
  - Latest Session card (or empty state if no sessions)
  - Quick Stats grid (if sessions exist)
- [ ] No text overlapping status bar
- [ ] Bottom nav clearly visible with Home active

### 02_mobile_practice_upload.png — Practice Upload Screen
- [ ] Open `/practice` (Practice tab)
- [ ] Verify visible elements:
  - "Practice Lab" header
  - Segmented control: Solo Practice (active) + AI Interview with "Soon" badge
  - Target Role input filled (e.g., "Software Developer")
  - Practice Mode chips (e.g., Behavioral, Technical)
  - Interview Question card
  - "Random Question" link
  - Upload Session dashed card with video icon
  - "MP4 / MOV · Max 200 MB" note
- [ ] Tap Upload Session and select a valid MP4
- [ ] Verify selected file card shows:
  - File name
  - File size (e.g., "12.5 MB")
  - File type (e.g., "video/mp4")
- [ ] "Run Analysis" button visible and enabled

### 03_mobile_analysis_progress.png — Analysis Progress Screen
- [ ] Tap "Run Analysis"
- [ ] Capture the loading overlay with:
  - Spinner
  - "Running Full Analysis..." message
  - Progress steps with active dot:
    - Uploading
    - Video Analysis
    - Camera Analysis
    - Speech Analysis
    - AI Feedback
    - Final Score
- [ ] Ensure dark overlay covers entire screen
- [ ] No janky UI or text cut off

### 04_mobile_feedback_score.png — Feedback Result Screen
- [ ] After analysis completes, app navigates to `/feedback`
- [ ] Verify visible elements:
  - Large circular Score Ring with overall score
  - "PERFORMANCE" label inside ring
  - Performance level badge (e.g., "Good")
  - "Saved to History" badge (if session_id exists)
  - Coach Aria card with avatar and summary
  - Dimension Scores: Video, Camera, Speech, Answer
  - Key Strengths card with checkmark icons
  - Growth Areas card with alert icons
  - Improved Answer card (or fallback tip)
  - Next Milestone card
  - "Run Another Practice" button
  - "View History" and "View Dashboard" buttons
  - Export HTML / Export CSV buttons (only if session_id exists)
- [ ] Scroll to show all cards

### 05_mobile_settings_backend.png — Settings Screen
- [ ] Open `/settings` (Settings tab)
- [ ] Verify visible elements:
  - PitchPilot AI header with rocket icon
  - Profile block: "PitchPilot User" / "Local Demo Mode"
  - Backend Engine section
  - "Connected" or "Offline" status badge
  - Backend Endpoint input with current URL
  - Help box with 3 platform URLs
  - "Test Connection" and "Save Settings" buttons
  - "Reset to Default" link
  - AI Engine Provider cards (OpenAI-compatible active)
  - Preferences toggles: Save Practice History, Speech Analysis
  - More links: History, Dashboard
- [ ] Tap "Test Connection" and show success alert (optional extra shot)

### 06_mobile_history_or_export.png — History / Export
- [ ] Open `/history` (from Home "View All" or Settings "History" link)
- [ ] Verify visible elements:
  - Session list with glass-card rows
  - Session name, date, role, score, performance level
  - Or: detail view with scores, transcript, strengths, growth areas
  - Export HTML / Export CSV buttons
  - Delete Session button
- [ ] Optional: capture the native share sheet after tapping Export

---

## Bonus Shots (Optional)

- [ ] **Backend offline state** — Home showing "Backend Offline" badge in red + Settings showing "Offline"
- [ ] **AI Interview coming soon** — Practice tab showing the purple "Soon" badge on AI Interview
- [ ] **Dashboard screen** with KPIs and skill breakdown bars
- [ ] **Practice screen** with invalid file rejected (Alert popup)
- [ ] **Feedback screen** with "Not Saved" badge (when Save Practice History is toggled off)

---

## Capture Best Practices

1. Use **Chrome DevTools** → Toggle Device Toolbar → iPhone 14 Pro (390×844)
2. Set zoom to **100%** for sharpest text
3. Hide browser UI if possible (fullscreen mode / F11)
4. Ensure status bar area is clean (SafeAreaView handles this automatically)
5. Scroll to show relevant content; avoid cutting off cards mid-way
6. For dark screenshots, consider adding a subtle light border in post if sharing on white backgrounds
7. Do **not** commit screenshots that show private backend IPs or API keys
