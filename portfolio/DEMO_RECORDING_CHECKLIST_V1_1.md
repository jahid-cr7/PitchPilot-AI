# PitchPilot AI — Multi-Platform Demo Recording Checklist (v1.1)

Use this checklist before every demo recording, portfolio video, or live interview presentation.

---

## 1. Start All Services

### FastAPI Backend (Required for React + Mobile)
```bash
cd ~/PitchPilot\ AI
source .venv/bin/activate
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```
- [ ] Backend starts without errors
- [ ] `GET /health` returns `{"status":"ok"}`
- [ ] Swagger docs reachable at `http://127.0.0.1:8000/docs`

### React Web Frontend
```bash
cd frontend
npm run dev
```
- [ ] Frontend starts at `http://localhost:5173`
- [ ] `npm run build` completes with zero errors (do this first)

### Expo Mobile App
```bash
cd mobile
npx expo start -c --lan
```
- [ ] Metro bundler starts
- [ ] App opens on simulator or phone
- [ ] Backend URL in Settings matches your platform:
  - Local browser / iOS simulator: `http://127.0.0.1:8000`
  - Android emulator: `http://10.0.2.2:8000`
  - Physical phone: `http://<YOUR_LAPTOP_IP>:8000`
- [ ] Test Connection succeeds

### Streamlit Desktop App
```bash
cd ~/PitchPilot\ AI
source .venv/bin/activate
streamlit run app.py
```
- [ ] Streamlit opens at `http://localhost:8501`
- [ ] Demo Mode loads without errors

---

## 2. Browser Tabs to Prepare

Open these tabs before recording:

| Tab | URL | Purpose |
|-----|-----|---------|
| React Home | `http://localhost:5173` | Primary demo surface |
| React Practice | `http://localhost:5173/practice` | Upload + analysis flow |
| React Feedback | `http://localhost:5173/feedback` | Results page |
| React Dashboard | `http://localhost:5173/dashboard` | Stats + charts |
| React History | `http://localhost:5173/history` | Session list + export |
| Streamlit | `http://localhost:8501` | Desktop demo fallback |
| FastAPI Docs | `http://127.0.0.1:8000/docs` | API architecture showcase |

---

## 3. Sample Content Reminders

### Sample Interview Question
> "Tell me about yourself."

### Sample Target Role
> "Software Developer"

### Sample Practice Mode
> "Software Developer Interview"

### Sample MP4 File
- Use a real practice video under **200 MB**
- MP4 format only
- Have it in an easy-to-access folder (e.g., `~/uploads/`)
- **Backup:** If upload is too slow, use a previously saved session and say: "For time, I'm showing a completed analysis."

---

## 4. Demo Sequence — What to Show First

| Order | Surface | What to Show | Duration |
|-------|---------|--------------|----------|
| 1 | React Web | Home page → problem statement | 15s |
| 2 | React Web | Practice page → mode, question, role, upload | 45s |
| 3 | React Web | Feedback page → scores, badge, exports | 45s |
| 4 | React Web | Dashboard + History → refresh, reports | 30s |
| 5 | Mobile | Practice → result → saved badge | 45s |
| 6 | FastAPI Docs | Swagger endpoints → architecture | 20s |
| 7 | Streamlit | Brief Demo Mode mention | 15s |
| 8 | React Web | Closing pitch + GitHub URL | 15s |

**Total target:** 3–4 minutes

---

## 5. Common Mistakes to Avoid

### Before Recording
- [ ] **Don't start backend with `127.0.0.1` only** — use `--host 0.0.0.0` or mobile won't connect
- [ ] **Don't forget to activate the virtual environment** — `source .venv/bin/activate`
- [ ] **Don't use a large MP4** — keep it under 200 MB or the upload will drag
- [ ] **Don't have cluttered browser tabs** — close unrelated tabs and bookmarks bars
- [ ] **Don't use a small cursor** — enlarge it in OS settings for screen recording

### During Recording
- [ ] **Don't rush clicks** — pause slightly after each click so viewers can follow
- [ ] **Don't skip the progress animation** — it's a visual highlight; let it play for 2–3 seconds
- [ ] **Don't forget the "Saved to History" badge** — call it out explicitly; it's a key differentiator
- [ ] **Don't leave errors on screen** — if something fails, use Demo Mode or a saved session
- [ ] **Don't mumble through the architecture** — practice the FastAPI / multi-client explanation beforehand
- [ ] **Don't end abruptly** — leave the GitHub URL on screen for at least 3 seconds

### After Recording
- [ ] **Check audio levels** — ensure narration is clear and background noise is minimal
- [ ] **Trim dead air** — remove long pauses or loading screens
- [ ] **Add captions if possible** — many viewers watch without sound
- [ ] **Verify the GitHub URL is legible** — in the final frame overlay

---

## 6. Quick Health Checks

```bash
# Python compile check
python -m compileall app.py core pages reports api

# Frontend build check
cd frontend && npm run build

# Mobile install check
cd mobile && npm install

# Backend health check
curl http://127.0.0.1:8000/health
```

- [ ] All commands above pass before pressing record

---

## 7. Post-Recording Checklist

- [ ] Video length is 3–5 minutes
- [ ] Audio is clear and synced
- [ ] No sensitive info visible (API keys, personal files, `.env`)
- [ ] GitHub URL shown at end for 3+ seconds
- [ ] File exported in MP4 or MOV format
- [ ] File size under 500 MB for easy upload
- [ ] Filename is descriptive: `PitchPilot_AI_Demo_v2.mp4`
