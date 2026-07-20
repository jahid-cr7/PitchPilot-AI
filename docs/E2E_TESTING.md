# End-to-End Browser Testing

PitchPilot AI uses [Playwright](https://playwright.dev) for real-browser end-to-end tests of the React web frontend.

## What is covered

- Homepage, login, and register page loads
- Protected-route redirect when logged out
- Full auth flow: register → login → dashboard → logout
- Coaching plan page: view, create goal, complete goal, delete goal

## What is NOT covered yet

- Video upload and analysis (requires real MP4 files and heavy ML dependencies)
- AI Coach feedback generation
- Report export (HTML/CSV)
- Mobile app automation

## Prerequisites

1. Backend dependencies installed:
   ```bash
   pip install -r requirements.txt
   ```

2. Frontend dependencies installed:
   ```bash
   cd frontend
   npm install
   ```

3. Playwright Chromium browser installed:
   ```bash
   cd frontend
   npx playwright install chromium
   ```

## Running E2E tests locally

### Terminal 1 — Start the backend

```bash
python -m uvicorn api.main:app --host 127.0.0.1 --port 8000
```

Wait until `http://127.0.0.1:8000/health` returns `{"status":"ok"}`.

### Terminal 2 — Run the E2E suite

```bash
cd frontend
npm run test:e2e
```

To debug with the Playwright UI:

```bash
cd frontend
npm run test:e2e:ui
```

## Environment variables

Use these safe test values (no real API keys):

```bash
export PITCHPILOT_ENV=testing
export PITCHPILOT_JWT_SECRET=test-secret-for-ci-only
export PITCHPILOT_CORS_ORIGINS="http://127.0.0.1:5173,http://localhost:5173"
export PITCHPILOT_AI_API_KEY=test
export PITCHPILOT_AI_BASE_URL=https://example.com
export PITCHPILOT_AI_MODEL=test-model
```

## Test design principles

- **Independent tests** — every test registers a fresh user with `e2e-user-${Date.now()}@pitchpilot.test` so there is no cross-test state.
- **No real AI key required** — the backend falls back to rule-based responses when `PITCHPILOT_AI_API_KEY=test`.
- **Chromium only** — Playwright is configured for Desktop Chrome to keep CI fast and stable.
- **Minimal test IDs** — only critical interactive elements carry `data-testid` attributes (login/register inputs, logout button, coaching goal form).

## CI integration

The GitHub Actions workflow (`.github/workflows/ci.yml`) includes an `e2e-tests` job that:

1. Installs Python and Node.js dependencies
2. Starts the FastAPI backend on `127.0.0.1:8000`
3. Runs Playwright tests against the dev server
4. Uploads the Playwright report as an artifact on failure

The E2E job runs on every push and pull request to `main`/`master`.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Error: browserType.launch: Executable doesn't exist` | Run `npx playwright install chromium` |
| `Backend unavailable` on dashboard | Ensure FastAPI is running on port 8000 and `/health` responds |
| Tests timeout in CI | The workflow retries twice and uses one worker to reduce flakiness |
| `EACCES` on port 5173 | Another dev server may be running; kill it or change the port in `vite.config.ts` |
