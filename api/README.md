# PitchPilot AI — FastAPI Backend

This folder contains the FastAPI backend API for PitchPilot AI.
It exposes the same core analyzers (`core/`) used by the Streamlit frontend so that React, Vue, mobile, and third-party clients can consume them via HTTP.

---

## Run the API

### Development (with auto-reload)

```bash
python -m uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
```

### Production

```bash
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000
```

---

## API Documentation

Once the server is running, open:

- **Swagger UI:** http://127.0.0.1:8000/docs
- **ReDoc:** http://127.0.0.1:8000/redoc

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | API metadata (name, version, status) |
| GET | `/health` | Health check |
| POST | `/api/v1/ai/analyze-answer` | AI Coach — analyze a transcript |
| POST | `/api/v1/score/final` | Final scoring from analysis results |
| GET | `/api/v1/questions/modes` | List all practice modes |
| GET | `/api/v1/questions/{mode}` | List questions for a mode |
| GET | `/api/v1/questions/{mode}/random` | Random question for a mode |
| GET | `/api/v1/questions/{mode}/default-role` | Default role for a mode |

---

## CORS

The API allows cross-origin requests from these development origins:

- http://localhost:3000
- http://localhost:5173
- http://localhost:8081
- http://127.0.0.1:3000
- http://127.0.0.1:5173
- http://127.0.0.1:8081

For production, update `api/main.py` to restrict origins to your deployed frontend URL.

---

## Example Requests

### Analyze Answer

```bash
curl -X POST "http://127.0.0.1:8000/api/v1/ai/analyze-answer" \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Hello, I am a software developer with five years of experience...",
    "question": "Tell me about yourself.",
    "role": "Software Developer"
  }'
```

### Final Score

```bash
curl -X POST "http://127.0.0.1:8000/api/v1/score/final" \
  -H "Content-Type: application/json" \
  -d '{
    "video_result": {"status": "success", "movement_score": 35},
    "camera_result": {"status": "success", "camera_score": 82},
    "speech_result": {"status": "success", "speech_score": 78},
    "ai_result": {"status": "fallback", "answer_score": 80}
  }'
```

---

## Architecture

```
┌─────────────┐     HTTP      ┌─────────────┐     ┌─────────────┐
│  React/Vue  │ ◄────────────►│  FastAPI    │────►│   core/     │
│  Mobile App │               │  (api/)     │     │ analyzers   │
└─────────────┘               └─────────────┘     └─────────────┘
```

The API layer (`api/main.py`, `api/schemas.py`, `api/services.py`) is intentionally thin. All business logic lives in `core/` and is shared with the Streamlit app.

---

## Security Notes

- API keys sent in request bodies are passed directly to the core agent and are **never logged or stored** by the API layer.
- Stack traces are suppressed from API responses; only generic error messages are returned to clients.
- For production, add API-key or JWT authentication middleware before exposing the API publicly.
