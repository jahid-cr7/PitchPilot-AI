# PitchPilot AI — Deployment Guide

This document covers how to run and deploy PitchPilot AI.

---

## Local Run

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

> **Optional system dependencies:**
> - `ffmpeg` (required by faster-whisper for audio extraction)
> - `libgl1` or equivalent (required by OpenCV on some Linux distributions)

### 2. Configure secrets (optional — for real AI coaching)

Copy the example file and add your API key:

```bash
cp .streamlit/secrets.toml.example .streamlit/secrets.toml
```

Edit `.streamlit/secrets.toml`:

```toml
PITCHPILOT_AI_API_KEY = "sk-..."
PITCHPILOT_AI_BASE_URL = "https://api.openai.com/v1"
PITCHPILOT_AI_MODEL = "gpt-4o-mini"
```

### 3. Run the app

```bash
streamlit run app.py
```

The app will open at `http://localhost:8501`.

---

## Streamlit Cloud / Community Cloud Deployment

1. Push your code to a GitHub repository.
2. Go to [share.streamlit.io](https://share.streamlit.io) and connect your repo.
3. Configure secrets via the Streamlit Cloud dashboard (**Settings → Secrets**).
   - Paste the contents of `secrets.toml` there.
   - Do **not** commit `secrets.toml` to Git.

---

## Other Platforms (Railway, Render, Heroku, VPS)

1. Set environment variables or use the platform's secrets manager:
   - `PITCHPILOT_AI_API_KEY`
   - `PITCHPILOT_AI_BASE_URL`
   - `PITCHPILOT_AI_MODEL`
2. Ensure the runtime has:
   - Python 3.12+
   - `ffmpeg` installed
   - Sufficient disk space for the faster-whisper model (~150 MB on first run)
3. Start with:
   ```bash
   streamlit run app.py
   ```

---

## ⚠️ Security Warning

- **Never commit real API keys** to Git.
- `.streamlit/secrets.toml`, `.env`, and `*.db` are already ignored in `.gitignore`.
- Always use your deployment platform's secrets manager or environment variables.

---

## Demo Mode

If you do not have an API key or a video ready:

1. Open the app.
2. Click **"🧪 Load Demo Data"** on the Home page.
3. Navigate to **Feedback**, **Dashboard**, or **History** to explore the full UI instantly.

---

## Optional Dependencies Notes

| Dependency | Purpose | Notes |
|------------|---------|-------|
| **ffmpeg** | Audio extraction for speech analysis | Install via `apt`, `brew`, or download from ffmpeg.org |
| **OpenCV** | Video and camera analysis | Bundled with `opencv-python` wheel; may need `libgl1` on Linux |
| **faster-whisper** | Speech transcription | Downloads the model (~150 MB) on first run |

---

## Environment Variables Summary

| Variable | Required? | Default | Description |
|----------|-----------|---------|-------------|
| `PITCHPILOT_AI_API_KEY` | No (fallback works) | — | OpenAI-compatible API key |
| `PITCHPILOT_AI_BASE_URL` | No | `https://api.openai.com/v1` | API base URL |
| `PITCHPILOT_AI_MODEL` | No | `gpt-4o-mini` | Model name |
