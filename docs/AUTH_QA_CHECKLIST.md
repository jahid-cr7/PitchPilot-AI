# PitchPilot AI — Auth QA Checklist

End-to-end verification of the v1.2.0 authentication release across the FastAPI backend, the React web app, and the Expo mobile app.

Run through this list before every release that touches auth, sessions, dashboard, or reports.

---

## 0. Preconditions

- [ ] Backend `.env` has a real `PITCHPILOT_JWT_SECRET` (not the placeholder).
- [ ] `PITCHPILOT_JWT_EXPIRES_MINUTES` is set (default `1440`).
- [ ] Database is empty or seeded with known-good users.
- [ ] Backend is running: `python -m uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload`.
- [ ] Frontend is built or running: `cd frontend && npm run dev`.
- [ ] Mobile is running: `cd mobile && npx expo start -c --web` (or on device).

---

## 1. Backend — Direct API

Use `curl` or the Swagger UI at `http://localhost:8000/docs`.

- [ ] **Register a user** — `POST /auth/register` with `{ "name": "Alice", "email": "alice@example.com", "password": "secret1234" }` returns `200` with `access_token` and `user`.
- [ ] **Duplicate email rejected** — repeating the same register call returns `409` (or `400`) with `detail: "Email already registered"`.
- [ ] **Password too short rejected** — password `< 6` chars returns `422` / `400`.
- [ ] **Login** — `POST /auth/login` with the same credentials returns `200` and a new `access_token`.
- [ ] **Wrong password** — same email + garbage password returns `401` with `detail: "Invalid email or password"`.
- [ ] **/auth/me works** — `GET /auth/me` with `Authorization: Bearer <token>` returns the caller's profile (`id`, `name`, `email`, `created_at`).
- [ ] **/auth/me without token** — `GET /auth/me` with no header returns `401`.
- [ ] **/auth/me with garbage token** — `Authorization: Bearer not.a.jwt` returns `401 Invalid token`.

## 2. Backend — Protected endpoints

- [ ] `POST /api/v1/analyze/full` **without** token returns `401`.
- [ ] `POST /api/v1/analyze/full` **with** token returns `200` and stores a session for that user.
- [ ] `GET /api/v1/sessions` returns only Alice's sessions.
- [ ] `GET /api/v1/dashboard/stats` reflects only Alice's activity.
- [ ] `GET /api/v1/reports/{session_id}/html` for one of Alice's sessions returns HTML.
- [ ] `GET /api/v1/reports/{session_id}/csv` returns CSV.

## 3. Backend — Public endpoints (must NOT require auth)

- [ ] `GET /health` returns `200`.
- [ ] `GET /api/v1/questions/modes` returns the mode list.
- [ ] `GET /api/v1/questions/{mode}` (e.g. `Behavioral Interview`) returns questions.
- [ ] `GET /api/v1/questions/{mode}/random` returns a question.
- [ ] `GET /api/v1/questions/{mode}/default-role` returns a role.

## 4. Backend — Cross-user isolation

- [ ] Register a second user (Bob) and log in.
- [ ] `GET /api/v1/sessions` as Bob returns **only** Bob's sessions (empty at first, then only sessions Bob created).
- [ ] `GET /api/v1/sessions/{alice_session_id}` as Bob returns `404` / `403` — never `200`.
- [ ] `DELETE /api/v1/sessions/{alice_session_id}` as Bob returns `404` / `403`.
- [ ] `GET /api/v1/reports/{alice_session_id}/html` as Bob returns `404` / `403`.
- [ ] After Bob attempts these, Alice logs back in and confirms her session count is unchanged.

## 5. Backend — Automated tests

- [ ] `pytest tests/test_auth.py -v` — all tests green (registration, login, /auth/me, wrong password, duplicate email, invalid/expired token, cross-user isolation).
- [ ] `python -m compileall app.py core pages reports api` — clean.

---

## 6. React Web (`frontend/`)

Run `npm run dev`, then in the browser:

- [ ] Open `/practice` while logged out — modes and questions load; **no** redirect to `/login`.
- [ ] Click **Run Full Analysis** while logged out → toast + redirect to `/login` with banner "Please log in to save your practice history."
- [ ] Register a new user on `/register` → redirected to `/dashboard` on success, JWT visible in DevTools → Application → localStorage → `pitchpilot_auth_token`.
- [ ] Log out → both `pitchpilot_auth_token` and `pitchpilot_auth_user` removed from localStorage.
- [ ] `/dashboard`, `/history`, `/feedback`, `/settings` redirect to `/login` when logged out.
- [ ] Log in → previous protected page opens (via `state.from`).
- [ ] Delete the token in DevTools, refresh, click Dashboard → redirected to `/login` (no infinite loop).
- [ ] Corrupt the token in DevTools (`pitchpilot_auth_token = "abc"`), navigate to `/dashboard` → app shows session-expired banner, redirects to `/login`.
- [ ] Upload an MP4 on `/practice` while logged in → `POST /api/v1/analyze/full` returns 200, session saved.
- [ ] `npm run build` — succeeds.

## 7. Expo Mobile (`mobile/`)

Run `npx expo start -c --web` (and/or `--android` / `--ios`):

- [ ] Guest can open `/practice` and see mode list; `AI/ML Interview` is filtered out (until backend supports slash-safe ids).
- [ ] Tapping **Run Full Analysis** while logged out shows the login prompt Alert → "Go to Login" navigates to `/login`.
- [ ] Register new user → landed on `/` (home), user profile appears in Settings.
- [ ] Log in existing user → same result.
- [ ] Logout in Settings → user profile clears, Login/Register buttons return.
- [ ] Pick an MP4 while logged in → `POST /api/v1/analyze/full` returns 200; feedback screen renders.
- [ ] On Expo web, DevTools → Network shows `Authorization: Bearer …` on `/analyze/full` and NO manual `Content-Type` header from the client.
- [ ] On native, backend logs show a valid filename (`practice-video.mp4` or the picker's name) — not empty.
- [ ] Restart the app → auth persists (`AsyncStorage` `pitchpilot_auth_token` reused, `/auth/me` verified once on mount).
- [ ] Manually revoke the token by clearing storage → next protected call surfaces "Your session expired. Please log in again." and clears state.
- [ ] `cd mobile && npx tsc --noEmit` — clean.

---

## 8. Cross-platform smoke

- [ ] Register Alice in the React web app, log into the mobile app with the same credentials, and vice versa — history is consistent across clients (same `user_id`).
- [ ] Delete a session on web → it disappears in the mobile history after refresh.

---

## 9. Regression watchlist

- [ ] Streamlit desktop app still runs (`streamlit run app.py`) — it does **not** use the HTTP API and must remain unaffected.
- [ ] `PITCHPILOT_ENV=production` with the default `dev-insecure-secret-change-me` **fails to boot** with a clear error.
- [ ] CORS still enforced in production (no wildcard even if `*` is listed in `PITCHPILOT_CORS_ORIGINS`).
