# Multi-Platform QA Checklist — PitchPilot AI

Use this checklist before every major release, portfolio demo, or company interview presentation.

---

## 1. Backend Health

### FastAPI Startup
- [ ] `python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload` starts without errors
- [ ] `GET /health` returns `{"status":"ok"}`
- [ ] `GET /` returns API metadata
- [ ] CORS headers are present (test from browser dev tools)

### Compile Check
```bash
python -m compileall app.py core pages reports api
```
- [ ] No syntax errors in any module

---

## 2. Streamlit App

### Startup
- [ ] `streamlit run app.py` opens at `http://localhost:8501`
- [ ] Home page renders gradient hero, badges, and CTAs
- [ ] Demo Mode loads sample data without errors
- [ ] Sidebar navigation works across all pages

### Practice Flow
- [ ] MP4 file uploader accepts valid video files
- [ ] Video analysis runs and returns duration, FPS, resolution, movement score
- [ ] Camera analysis runs and returns face visibility, framing, distance
- [ ] Speech analysis runs and returns transcript, WPM, filler words
- [ ] AI Coach works in fallback mode without API key
- [ ] AI Coach works in real mode with API key
- [ ] Final score generates overall rating (0–100)
- [ ] Session saves to SQLite successfully

### Dashboard & History
- [ ] Dashboard shows KPIs and trend charts
- [ ] History lists saved sessions
- [ ] HTML report export produces styled output
- [ ] CSV report export produces valid CSV
- [ ] Delete session works with confirmation

---

## 3. React Web Frontend

### Startup
- [ ] `cd frontend && npm install && npm run dev` starts at `http://localhost:5173`
- [ ] `npm run build` completes with zero TypeScript errors
- [ ] Backend connection indicator shows "Online"

### Practice Flow
- [ ] Mode selector loads all 7 practice modes
- [ ] Question selector shows questions for selected mode
- [ ] Random question button works
- [ ] Target role input is editable
- [ ] MP4 dropzone accepts valid files and rejects non-MP4
- [ ] File size display is accurate
- [ ] Run Full Analysis button triggers simulated progress steps
- [ ] Progress animation shows: Uploading → Video → Camera → Speech → AI → Final Score
- [ ] Analysis completes and stores result in `localStorage`
- [ ] Success toast appears ("Analysis saved to history." if session_id exists)

### Feedback Flow
- [ ] Feedback page reads `pp_last_analysis` from localStorage
- [ ] Overall score ring animates
- [ ] Performance badge shows correct level
- [ ] Dimension breakdown bars animate
- [ ] Strengths and weak points render
- [ ] Score cards show Video/Camera/Speech/Answer
- [ ] Transcript preview renders
- [ ] AI model used is displayed
- [ ] **If session_id exists:**
  - [ ] "Saved to History" badge is visible
  - [ ] Export HTML button is enabled and works
  - [ ] Export CSV button is enabled and works
  - [ ] "Open in History" button navigates to History
- [ ] **If session_id is missing:**
  - [ ] `save_warning` message is shown
  - [ ] Export buttons are hidden or disabled

### Dashboard
- [ ] Refresh button fetches latest stats
- [ ] KPI cards show correct values after new session
- [ ] Score progression chart renders
- [ ] Skill breakdown bars render
- [ ] Recent activity table shows newest sessions

### History
- [ ] Refresh button fetches latest sessions
- [ ] Sessions are sorted newest-first
- [ ] Filter tabs (Today / This Week / All Time) work
- [ ] Session list shows scores and dates
- [ ] Detail panel shows full session data
- [ ] Export HTML/CSV works for saved sessions
- [ ] Delete session works with confirmation

---

## 4. Expo Mobile App

### Startup
- [ ] `cd mobile && npm install` completes
- [ ] `npx expo start -c --lan` starts Metro bundler
- [ ] App opens on phone/simulator without crashes

### Backend Connection
- [ ] Home page shows backend status badge
- [ ] Settings page allows backend URL configuration
- [ ] Test Connection button verifies reachability

#### Backend URL Matrix
| Platform | Expected URL | Result |
|----------|--------------|--------|
| Local browser / iOS simulator | `http://127.0.0.1:8000` | |
| Android emulator | `http://10.0.2.2:8000` | |
| Physical phone (same Wi-Fi) | `http://<LAPTOP_IP>:8000` | |

### Practice Flow
- [ ] Practice mode selector loads modes
- [ ] Question selector shows questions
- [ ] Random question button works
- [ ] Target role displays correctly
- [ ] MP4 video picker accepts valid files and rejects non-MP4
- [ ] File name and size display correctly
- [ ] Run Full Analysis starts progress simulation
- [ ] Progress steps cycle: Uploading → Video → Camera → Speech → AI → Final Score
- [ ] Analysis completes and shows result screen
- [ ] **If session_id exists:**
  - [ ] "Saved to History (Session #N)" badge is visible
  - [ ] View History button navigates to History tab
  - [ ] View Dashboard button navigates to Dashboard tab
  - [ ] Export HTML/CSV buttons are enabled
- [ ] **If session_id is missing:**
  - [ ] `save_warning` card is shown

### Dashboard
- [ ] Pull-to-refresh updates stats
- [ ] KPI grid shows Sessions, Avg Score, Best, Latest
- [ ] Skill breakdown bars render
- [ ] Recent sessions list shows data

### History
- [ ] Pull-to-refresh updates session list
- [ ] Session list shows scores and dates
- [ ] Tap opens detail view
- [ ] Detail view shows scores, transcript, strengths, weak points
- [ ] Export HTML/CSV works
- [ ] Delete session works with confirmation

---

## 5. Full Analysis Upload Flow (All Platforms)

### Happy Path
- [ ] Upload a valid MP4 (under 200 MB)
- [ ] Select a practice mode, question, and role
- [ ] Run full analysis
- [ ] Backend returns `status: "success"`
- [ ] Backend returns `session_id` (integer)
- [ ] `GET /api/v1/sessions` includes the new session
- [ ] `GET /api/v1/dashboard/stats` reflects updated totals
- [ ] `GET /api/v1/reports/{session_id}/html` returns valid HTML
- [ ] `GET /api/v1/reports/{session_id}/csv` returns valid CSV

### Save Warning Path
- [ ] If database write fails, backend still returns full analysis
- [ ] Backend returns `session_id: null`
- [ ] Backend returns `save_warning` string
- [ ] Frontend/mobile shows warning instead of crashing

---

## 6. Dashboard / History Refresh

### React
- [ ] Click Refresh on Dashboard → stats update
- [ ] Click Refresh on History → newest session appears first

### Mobile
- [ ] Pull-to-refresh on Dashboard → stats update
- [ ] Pull-to-refresh on History → newest session appears first

### Streamlit
- [ ] Re-run page script → latest data loads

---

## 7. Report Export

### HTML Report
- [ ] Contains session metadata (date, question, role)
- [ ] Contains score grid (Overall, Video, Camera, Speech, Answer)
- [ ] Contains transcript
- [ ] Contains strengths and weak points
- [ ] Contains next practice task
- [ ] Is self-contained (no external dependencies)

### CSV Report
- [ ] Contains all numeric metrics
- [ ] Valid single-row CSV format
- [ ] Opens correctly in spreadsheet applications

---

## 8. Backend URL Setup for Phone

- [ ] Backend started with `--host 0.0.0.0`
- [ ] Phone and laptop are on the same Wi-Fi network
- [ ] Firewall allows port 8000
- [ ] Mobile Settings → Backend URL matches laptop LAN IP
- [ ] Test Connection succeeds

---

## 9. Error Cases

### Backend Offline
- [ ] Stop backend
- [ ] React frontend shows "Backend unavailable" error state
- [ ] Mobile app shows offline badge / network error alert
- [ ] Streamlit app shows connection error (if applicable)
- [ ] No crash or infinite loading spinner

### Wrong Backend URL
- [ ] Enter invalid URL in Settings
- [ ] Test Connection fails gracefully
- [ ] App does not crash
- [ ] Clear error message is shown

### Non-MP4 File
- [ ] Upload `.mov`, `.avi`, or `.txt`
- [ ] React dropzone rejects with error toast
- [ ] Mobile picker rejects with alert
- [ ] FastAPI returns `400: Only MP4 files are supported`

### Large File (>200 MB)
- [ ] Upload file > 200 MB
- [ ] React dropzone rejects with size error
- [ ] FastAPI returns `413: File too large`
- [ ] App does not attempt to process it

### Missing API Key
- [ ] Ensure no `PITCHPILOT_AI_API_KEY` env var
- [ ] Ensure no temporary key in Settings
- [ ] Run AI Coach analysis
- [ ] Returns `status: "fallback"` with rule-based score
- [ ] App does not crash
- [ ] No API calls are attempted

### AI Fallback Mode
- [ ] With no API key, AI Coach produces:
  - [ ] `answer_score` (0–100)
  - [ ] `content_strengths` (array)
  - [ ] `content_weak_points` (array)
  - [ ] `summary` (string)
  - [ ] `improved_answer` (string)
- [ ] Final scoring engine accepts fallback result

### Timeout
- [ ] Simulate slow backend (e.g., large video)
- [ ] Frontend shows timeout message after ~30s
- [ ] Mobile shows error alert
- [ ] User can retry without refreshing the page

---

## 10. Security Checks

- [ ] No API keys hardcoded in any source file
- [ ] No API keys saved to SQLite
- [ ] No API keys written to localStorage (React)
- [ ] No API keys returned in API responses
- [ ] `.gitignore` ignores `.env`, `data/`, `uploads/`, `.streamlit/secrets.toml`
- [ ] No real credentials committed to git
- [ ] Stack traces are suppressed from API responses

---

## 11. Cross-Platform Consistency

| Feature | Streamlit | React Web | Mobile | Backend |
|---------|-----------|-----------|--------|---------|
| Practice mode selector | ✅ | ✅ | ✅ | ✅ |
| Question bank + random | ✅ | ✅ | ✅ | ✅ |
| Target role input | ✅ | ✅ | ✅ | ✅ |
| MP4 upload | ✅ | ✅ | ✅ | ✅ |
| Full analysis pipeline | ✅ | ✅ | ✅ | ✅ |
| Session save to SQLite | ✅ | ✅ | ✅ | ✅ |
| Dashboard stats | ✅ | ✅ | ✅ | ✅ |
| History list + detail | ✅ | ✅ | ✅ | ✅ |
| HTML report export | ✅ | ✅ | ✅ | ✅ |
| CSV report export | ✅ | ✅ | ✅ | ✅ |
| Demo mode | ✅ | — | — | — |
| AI fallback mode | ✅ | ✅ | ✅ | ✅ |

---

## 12. Final Build Verification

```bash
# Python compile check
python -m compileall app.py core pages reports api

# React build
cd frontend && npm run build

# Mobile install
cd mobile && npm install
```

- [ ] All three commands complete without errors

---

## Sign-Off

| Date | Tester | Platform | Result |
|------|--------|----------|--------|
|      |        | Streamlit | |
|      |        | React Web | |
|      |        | Expo Mobile | |
|      |        | FastAPI Backend | |
