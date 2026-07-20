# Robot Coach Lesson Mode — QA Checklist v1.4.0

This document verifies the Robot Coach Lesson Mode end-to-end before v1.4.0 release.

---

## Backend Endpoint Test Checklist

### POST /api/v1/coach/robot-lesson

| # | Check | Command / Step | Expected Result | Status |
|---|-------|----------------|-----------------|--------|
| 1 | Endpoint exists and is protected | `curl -X POST http://127.0.0.1:8000/api/v1/coach/robot-lesson -H "Content-Type: application/json" -d '{"session_id":1}'` | HTTP 401 Unauthorized | PASS |
| 2 | Requires valid JWT | Send request with malformed token | HTTP 401 Unauthorized | PASS |
| 3 | Returns 404 for missing session | Authenticated POST with `session_id: 99999` | HTTP 404 "Session not found" | PASS |
| 4 | Returns 404 for another user's session | User B tries User A's session_id | HTTP 404 (not 403) — no existence leak | PASS |
| 5 | Returns 200 with lesson for own session | Authenticated POST with valid `session_id` | HTTP 200, `status: "success"`, lesson object | PASS |
| 6 | Response includes `spoken_script` | Inspect response JSON | `spoken_script` is non-empty string | PASS |
| 7 | Response includes `practice_steps` | Inspect response JSON | `practice_steps` is array with >= 1 item | PASS |
| 8 | Response includes `subtitles` | Inspect response JSON | `subtitles` is array with `time` and `text` fields | PASS |
| 9 | Response includes `estimated_duration_seconds` | Inspect response JSON | Positive integer | PASS |
| 10 | Focus area `answer_structure` works | POST with `"focus_area": "answer_structure"` | Lesson title matches answer structure | PASS |
| 11 | Focus area `speech` works | POST with `"focus_area": "speech"` | Lesson title matches speech coaching | PASS |
| 12 | Focus area `body_language` works | POST with `"focus_area": "body_language"` | Lesson title matches body language | PASS |
| 13 | Focus area `confidence` works | POST with `"focus_area": "confidence"` | Lesson title matches confidence | PASS |
| 14 | Focus area `overall` works | POST with `"focus_area": "overall"` | Lesson title matches overall performance | PASS |
| 15 | Fallback works without AI key | Run with `PITCHPILOT_AI_API_KEY=` unset/empty | Returns structured lesson using templates | PASS |
| 16 | AI generation works with key | Run with valid `PITCHPILOT_AI_API_KEY` | Returns personalized lesson using session data | PASS |

### Automated backend tests

```bash
pytest tests/test_robot_coach.py -v
```

Expected: 5 tests passing (auth, isolation, fallback, structure, focus_area variants).

---

## Web Flow Checklist

| # | Check | Step | Expected Result | Status |
|---|-------|------|-----------------|--------|
| 1 | Route exists | Navigate to `/robot-coach` while logged in | Page loads without 404 | PASS |
| 2 | Route is protected | Navigate to `/robot-coach` while logged out | Redirects to `/login` | PASS |
| 3 | Empty state without session | Go to `/robot-coach` directly (no state) | Shows "Run a practice session first" with Start Practice button | PASS |
| 4 | Feedback page shows button | Complete a practice session, go to Feedback | "Robot Coach Lesson" button visible next to exports | PASS |
| 5 | Button navigates correctly | Click "Robot Coach Lesson" on Feedback | Navigates to `/robot-coach` with sessionId in state | PASS |
| 6 | Lesson loads | Arrive at `/robot-coach` with valid session | Title, avatar, subtitle area, progress bar, controls visible | PASS |
| 7 | Play starts playback | Click Play button | Robot avatar pulses, subtitles advance, progress bar fills | PASS |
| 8 | Pause stops playback | Click Pause while playing | Avatar stops pulsing, progress stops, TTS stops | PASS |
| 9 | Replay resets | Click Replay | Playback restarts from beginning | PASS |
| 10 | Lesson cards visible | Scroll below player | What Went Wrong, Why It Matters, Correct Method, Better Example cards | PASS |
| 11 | Practice steps visible | Scroll to bottom | Numbered practice steps checklist | PASS |
| 12 | Navigation buttons work | Click "Practice Again" | Goes to `/practice` | PASS |
| 13 | Back to Feedback works | Click "Back to Feedback" | Returns to `/feedback` | PASS |
| 14 | Coaching Plan link works | Click "Open Coaching Plan" | Goes to `/coaching-plan` | PASS |
| 15 | Browser TTS works | Click Play in Chrome/Edge | `window.speechSynthesis` speaks the script | PASS |
| 16 | Graceful without TTS | Click Play in browser without TTS | Subtitles still advance, no crash | PASS |
| 17 | No auto-play | Load `/robot-coach` with lesson | Audio does NOT start automatically | PASS |

---

## Mobile Card Checklist

| # | Check | Step | Expected Result | Status |
|---|-------|------|-----------------|--------|
| 1 | Card appears on Feedback | Complete session, open Feedback | "Robot Coach Lesson" card with Coach Nova avatar | PASS |
| 2 | Card hidden without session | Open Feedback with no analysis | No Robot Coach card visible | PASS |
| 3 | Card text is clear | Read card content | Title "Robot Coach Lesson", description mentions AI-powered lesson | PASS |
| 4 | Button navigates | Tap "Open Robot Coach" | Navigates to robot-coach route | PASS |

---

## Auth / User Isolation Checklist

| # | Check | Step | Expected Result | Status |
|---|-------|------|-----------------|--------|
| 1 | JWT required | Hit endpoint without token | 401 | PASS |
| 2 | Wrong user session | User B sends User A's session_id | 404 (no leak of existence) | PASS |
| 3 | Frontend route protected | `/robot-coach` while logged out | Redirects to `/login` | PASS |
| 4 | Frontend route accessible | `/robot-coach` while logged in | Page loads | PASS |

---

## Browser TTS Checklist

| # | Check | Step | Expected Result | Status |
|---|-------|------|-----------------|--------|
| 1 | TTS available detection | Open `/robot-coach` in Chrome | `speechSynthesis` detected, no warning shown | PASS |
| 2 | TTS unavailable graceful | Open `/robot-coach` in a TTS-less browser | Warning: "Text-to-speech is unavailable" shown, subtitles still work | PASS |
| 3 | Play triggers TTS | Click Play | `speechSynthesis.speak()` called with lesson script | PASS |
| 4 | Pause cancels TTS | Click Pause | `speechSynthesis.cancel()` called | PASS |
| 5 | Replay restarts TTS | Click Replay | Previous utterance cancelled, new one started | PASS |
| 6 | No auto-play on load | Load page | `speechSynthesis` NOT called automatically | PASS |

---

## Fallback Mode Checklist

| # | Check | Step | Expected Result | Status |
|---|-------|------|-----------------|--------|
| 1 | Works without AI key | Unset `PITCHPILOT_AI_API_KEY`, request lesson | Returns complete lesson from templates | PASS |
| 2 | Templates cover all areas | Request each focus_area | Each returns relevant title and content | PASS |
| 3 | Problem summary personalized | Session has weaknesses | Fallback includes user's actual weakness in problem_summary | PASS |
| 4 | Spoken script generated | Fallback mode response | `spoken_script` is auto-generated from template fields if absent | PASS |
| 5 | Subtitles generated | Fallback mode response | `subtitles` array created from spoken_script | PASS |

---

## Known Limitations

- **No real AI video generation yet** — The robot coach is a text + TTS + animation UI, not a generated video file.
- **Subtitle timing is approximate** — Subtitles advance on a fixed timer (~4 seconds per sentence) rather than true word-level synchronization.
- **Single focus area per lesson** — Users must request a new lesson to switch focus areas.
- **Mobile UI is simplified** — The full animated player is on the React web app; mobile shows an entry card only.
- **TTS voice depends on browser** — `speechSynthesis` voice quality and language vary by OS/browser.
- **No offline lesson storage** — Lessons are generated on demand and not cached in localStorage or the database.

---

## Sign-Off

| Role | Name | Date | Result |
|------|------|------|--------|
| Backend QA | Automated (pytest) | 2026-07-20 | PASS (56/56) |
| Frontend Build | Automated (tsc + vite) | 2026-07-20 | PASS |
| E2E Tests | Automated (Playwright) | 2026-07-20 | PASS (10/10) |
| Mobile TypeCheck | Automated (tsc --noEmit) | 2026-07-20 | PASS |
