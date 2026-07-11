# PitchPilot AI — Docker Guide

This document covers how to build, run, and troubleshoot PitchPilot AI using Docker.

---

## Quick Start

### Build the image

```bash
docker build -t pitchpilot-ai .
```

### Run the container

```bash
docker run -p 8501:8501 \
  -e PITCHPILOT_AI_API_KEY="" \
  -e PITCHPILOT_AI_BASE_URL="https://api.openai.com/v1" \
  -e PITCHPILOT_AI_MODEL="gpt-4o-mini" \
  pitchpilot-ai
```

Open [http://localhost:8501](http://localhost:8501).

---

## Docker Compose (recommended)

### 1. Create a `.env` file (optional)

```bash
cp .env.example .env
```

Edit `.env`:

```
PITCHPILOT_AI_API_KEY=sk-...
PITCHPILOT_AI_BASE_URL=https://api.openai.com/v1
PITCHPILOT_AI_MODEL=gpt-4o-mini
```

### 2. Start with Docker Compose

```bash
docker-compose up --build
```

The app will be available at `http://localhost:8501`.

### 3. Stop

```bash
docker-compose down
```

---

## Passing Environment Variables Safely

| Method | Command |
|--------|---------|
| **Command line** | `docker run -e VAR=value ...` |
| **.env file** | `docker-compose --env-file .env up` |
| **Compose env** | `docker-compose up` reads `.env` automatically |

---

## ⚠️ Security Warning

- **Never bake API keys into the Dockerfile** or image layers.
- Always pass secrets via environment variables at runtime.
- `secrets.toml`, `.env`, and `*.db` are already ignored in `.dockerignore`.

---

## Troubleshooting

### Docker Hub i/o timeout

If you see `failed to resolve reference "docker.io/library/python:3.12-slim"` with an i/o timeout, this is a **network connectivity issue** to Docker Hub, not an app error.

**Fixes:**
- Retry the build after a few minutes.
- Use a stable internet connection or VPN if Docker Hub is blocked in your region.
- Pre-pull the base image first: `docker pull python:3.12-slim`
- Verify Docker daemon is running: `docker info`

### Build context too large

If `docker build` sends hundreds of megabytes, your `.dockerignore` is not filtering local artifacts. The provided `.dockerignore` excludes `.venv/`, `data/*.db`, media files, and cache directories. After updating it, the context should be under ~15 MB.

### faster-whisper model download

On first run, faster-whisper downloads a model (~150 MB). If the container stops during download, restart it. The model is cached inside the container; for persistence, mount a volume to `/root/.cache`.

### ffmpeg not found

The Dockerfile installs `ffmpeg` via `apt-get`. If you see `ffmpeg not found` errors, rebuild the image:

```bash
docker-compose down
docker-compose up --build
```

### OpenCV / libGL errors

The Dockerfile installs `libgl1` and `libglib2.0-0`. If you see `libGL.so.1: cannot open shared object file`, rebuild the image or add the missing package manually:

```dockerfile
RUN apt-get update && apt-get install -y libgl1
```

### Port already in use

If port `8501` is occupied:

```bash
docker-compose down
docker run -p 8502:8501 pitchpilot-ai
```

Then open `http://localhost:8502`.

---

## Image Size

The image is based on `python:3.12-slim`. For an even smaller image, consider:
- `python:3.12-alpine` (requires more setup for ffmpeg and OpenCV)
- Multi-stage builds (separate build and runtime stages)
