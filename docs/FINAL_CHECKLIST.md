# Final Release Checklist — PitchPilot AI v1.0.0

Use this checklist to verify the project is ready for public GitHub release and company interview presentation.

---

## 1. App Runs Locally

- [ ] Clone or navigate to the project directory
- [ ] Activate virtual environment (`.venv`)
- [ ] Run `pip install -r requirements.txt` without errors
- [ ] Run `streamlit run app.py`
- [ ] App opens at `http://localhost:8501` without traceback errors
- [ ] Database initializes automatically on first run (`data/practice_sessions.db`)

---

## 2. All Pages Open

- [ ] **Home** (`app.py`) — hero section, badges, CTAs, feature cards render correctly
- [ ] **Practice** (`pages/1_Practice.py`) — workflow steps, mode selector, question bank, upload area visible
- [ ] **Feedback** (`pages/2_Feedback.py`) — empty state renders when no data; no crash
- [ ] **Dashboard** (`pages/3_Dashboard.py`) — KPIs and empty states render; no crash
- [ ] **History** (`pages/4_History.py`) — empty state renders when no sessions; no crash
- [ ] **Settings** (`pages/5_Settings.py`) — status card, temp settings form, health check visible

---

## 3. Demo Mode Works

- [ ] Click **"🧪 Load Demo Data"** on Home page
- [ ] Success toast/message appears
- [ ] Navigate to **Feedback** — all four Session Intelligence badges show green (Ready)
- [ ] Video Intelligence card shows: Duration 62s, FPS 30, Resolution 1920x1080, Movement 35
- [ ] Camera Presence card shows: Face Visible 95%, Framing Centered, Distance Good, Camera Score 82
- [ ] Speech Analytics card shows: Words 95, WPM 142, Fillers 2, Repeated 1, Speech Score 78
- [ ] AI Coach section shows Answer Score 80/100, fallback mode banner, strengths, weak points
- [ ] Final Performance Score shows Overall 79.5, Performance Level "Good", component breakdown
- [ ] **Save Session to History** button works and shows success

---

## 4. AI Fallback Works (No API Key)

- [ ] Ensure no `PITCHPILOT_AI_API_KEY` environment variable is set
- [ ] Ensure no temporary API key is stored in session state
- [ ] Load Demo Data and navigate to Feedback
- [ ] AI Coach shows info banner: "offline fallback mode (no API key detected)"
- [ ] Answer Score is computed (e.g., 80/100)
- [ ] Mode badge shows `fallback_rules`
- [ ] Structure Feedback, Strengths, Weak Points, Improved Answer, and Next Task all render
- [ ] **Test AI Connection** on Settings page returns `fallback` status with message "No API key configured"
- [ ] App does not crash or hang

---

## 5. Real AI Works (With API Key Configured)

- [ ] Set `PITCHPILOT_AI_API_KEY` environment variable with a valid key
- [ ] Restart the app
- [ ] Navigate to Settings page
- [ ] Current Mode shows `real_ai`
- [ ] Click **"🧪 Test AI Connection"**
- [ ] Test returns `success` status with provider response
- [ ] Load Demo Data or upload a video and run Speech Analysis
- [ ] Run AI Coach — result shows `status: "success"` and `model_used: "gpt-4o-mini"` (or configured model)
- [ ] Answer Score is computed by LLM
- [ ] Content Strengths and Weak Points are LLM-generated

---

## 6. Smoke Test Passes

- [ ] Run `python scripts/smoke_test.py`
- [ ] Output shows: `✅ PitchPilot AI smoke test passed.`
- [ ] All checks pass:
  - [ ] Required files and folders exist
  - [ ] All core modules import successfully
  - [ ] SQLite database initializes correctly
  - [ ] AI Coach fallback mode works without an API key
  - [ ] AI connection test returns gracefully
  - [ ] Scoring engine computes a valid overall score
  - [ ] Report generator produces non-empty HTML and CSV output

---

## 7. Docker Files Exist

- [ ] `Dockerfile` exists in project root
- [ ] `docker-compose.yml` exists in project root
- [ ] `docs/DOCKER.md` exists with build/run/troubleshooting instructions
- [ ] `.dockerignore` exists (or is documented as not needed)

---

## 8. CI File Exists

- [ ] `.github/workflows/ci.yml` exists
- [ ] CI triggers on push and pull request to `main` and `master`
- [ ] CI steps include: checkout, Python setup, dependency install, compile check, smoke test

---

## 9. No API Keys Committed

- [ ] Run `git grep -i "sk-[a-zA-Z0-9]" -- '*.py' '*.md' '*.yml' '*.yaml' '*.toml'` — returns no real keys
- [ ] Run `git grep -i "api_key.*=" -- '*.py' | grep -v "example\|placeholder\|os.environ.get\|st.session_state.get\|temp_ai_api_key\|_error_dict\|print("` — returns no hardcoded keys
- [ ] `.gitignore` includes: `.env`, `.streamlit/secrets.toml`, `data/*.db`, `uploads/`, `.venv/`
- [ ] `.env.example` exists with empty placeholder values
- [ ] No `.db` files are tracked by git
- [ ] No `.mp4` files are tracked by git
- [ ] No `__pycache__` or `.pyc` files are tracked by git

---

## 10. README Complete

- [ ] Project title and one-line description at the top
- [ ] Short description paragraph
- [ ] Key features table with all 10+ features
- [ ] Tech stack table
- [ ] Architecture overview diagram or description
- [ ] How It Works section (step-by-step)
- [ ] Installation instructions for Ubuntu and Windows
- [ ] Demo Mode instructions
- [ ] AI Settings / API key configuration instructions
- [ ] Quality Check section with smoke test command
- [ ] Docker / CI section
- [ ] Deployment section (local, cloud, Docker)
- [ ] Portfolio & Demo section linking to `portfolio/` docs
- [ ] Ethical Use Note
- [ ] Current Limitations section
- [ ] Future Improvements / Roadmap link
- [ ] Project Structure tree
- [ ] License

---

## 11. Portfolio Docs Complete

- [ ] `portfolio/PROJECT_SUMMARY.md` exists with all required sections
- [ ] `portfolio/INTERVIEW_PITCH.md` exists with 30s, 1m, 2m, technical, business pitches
- [ ] `portfolio/DEMO_FLOW.md` exists with step-by-step walkthrough
- [ ] `portfolio/RESUME_BULLETS.md` exists with CV bullets, LinkedIn posts, GitHub description
- [ ] `portfolio/SCREENSHOT_LIST.md` exists with required screenshot checklist

---

## 12. Screenshots Ready

- [ ] `portfolio/screenshots/` folder exists (or is ready to be created)
- [ ] Screenshot 1: Home page captured
- [ ] Screenshot 2: Practice page with question bank captured
- [ ] Screenshot 3: Feedback page with AI Coach result captured
- [ ] Screenshot 4: Dashboard page captured
- [ ] Screenshot 5: History page captured
- [ ] Screenshot 6: Settings page captured
- [ ] Screenshot 7: Export report example (HTML) captured
- [ ] All screenshots are optimized (resized to max 1440px width, compressed PNG)
- [ ] All screenshots use consistent naming: `screenshot_XX_descriptive_name.png`

> **Note:** Screenshots can be captured after the code is finalized. Mark this section complete once images are added to `portfolio/screenshots/`.

---

## 13. Demo Video Ready

- [ ] Demo video script reviewed (`docs/VIDEO_DEMO_SCRIPT.md` or `portfolio/DEMO_FLOW.md`)
- [ ] Screen recording software ready (OBS, Loom, QuickTime, etc.)
- [ ] Practice run completed (follow `portfolio/DEMO_FLOW.md` steps 1–12)
- [ ] Video exported and uploaded (YouTube, Loom, or cloud storage)
- [ ] Demo video link added to README.md Demo section
- [ ] Video length is 3–5 minutes (or 60s for short version)

> **Note:** The demo video can be recorded after release. Mark this complete once the video is produced and linked.

---

## 14. Documentation Complete

- [ ] `README.md` — up to date
- [ ] `CHANGELOG.md` — has v1.0.0 entry with date
- [ ] `RELEASE_NOTES.md` — up to date with all features, limitations, roadmap
- [ ] `DEPLOYMENT.md` — covers local, cloud, Docker deployment
- [ ] `docs/ARCHITECTURE.md` — reflects current system design
- [ ] `docs/DEMO_SCRIPT.md` — matches current UI flow
- [ ] `docs/INTERVIEW_GUIDE.md` — has current talking points
- [ ] `docs/ROADMAP.md` — is current
- [ ] `docs/QA_CHECKLIST.md` — covers all pages and AI modes
- [ ] `docs/FINAL_CHECKLIST.md` — this document exists
- [ ] `CONTRIBUTING.md` exists (even if minimal)
- [ ] `LICENSE` exists (MIT)

---

## 15. Git Hygiene

- [ ] `git status` shows only intended files staged
- [ ] `git diff` looks correct (no accidental changes to app logic)
- [ ] No `.db` files staged
- [ ] No `.mp4` files staged
- [ ] No `.env` or secrets files staged
- [ ] Commit message is descriptive (e.g., `Release v1.0.0 — portfolio package and final docs`)
- [ ] Tag created: `git tag -a v1.0.0 -m "PitchPilot AI v1.0.0"`

---

## Sign-Off

| Date | Tester | Result | Notes |
|------|--------|--------|-------|
| 2026-07-12 | | ⬜ Pass / ⬜ Fail | |

---

## Post-Release Actions

After v1.0.0 is tagged and pushed:

1. [ ] Push tag to GitHub: `git push origin v1.0.0`
2. [ ] Create GitHub Release from the tag
3. [ ] Attach screenshots to the release (or link to `portfolio/screenshots/`)
4. [ ] Update repository description and tags on GitHub
5. [ ] Share on LinkedIn (use `docs/LINKEDIN_POST.md` or `portfolio/RESUME_BULLETS.md`)
6. [ ] Add project to personal portfolio website
7. [ ] Submit to relevant GitHub awesome-lists or showcase collections
