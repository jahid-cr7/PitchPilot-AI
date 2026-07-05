# Architecture Overview

This document describes the system architecture, data flow, and design decisions behind PitchPilot AI v1.0 MVP.

---

## System Architecture

PitchPilot AI follows a modular, single-process architecture built on Streamlit. Each responsibility is isolated into its own module so analyzers, the scoring engine, and the UI can evolve independently.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Streamlit App                            │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  app.py     │  │  Sidebar    │  │  Demo Mode  │             │
│  │  (landing)  │  │  (shared)   │  │  (loader)   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     Pages (multipage)                      │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │  │
│  │  │ Practice │ │ Feedback │ │Dashboard │ │ History  │     │  │
│  │  │ 1_Pr...  │ │ 2_Fee... │ │ 3_Das... │ │ 4_His... │     │  │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘     │  │
│  │       └─────────────┴────────────┴────────────┘            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────┼───────────────────────────────┐  │
│  │                        Core Layer                            │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │  │
│  │  │video_analyzer│ │camera_anal..│ │  speech_analyzer    │  │  │
│  │  │  (OpenCV)   │ │  (OpenCV)   │ │ (faster-whisper)    │  │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │              ai_coach_agent.py                        │  │  │
│  │  │   - LLM API integration (OpenAI-compatible)           │  │  │
│  │  │   - Rule-based fallback when no key / offline         │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │              scoring_engine.py                        │  │  │
│  │  │   - Weighted score aggregation                        │  │  │
│  │  │   - Strength / weak-point derivation                  │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │              database.py                              │  │  │
│  │  │   - SQLite read/write                                 │  │  │
│  │  │   - Session CRUD + stats aggregation                  │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────▼───────────────────────────────┐  │
│  │                      Storage Layer                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────────────┐  │  │
│  │  │  uploads/   │  │  data/      │  │  reports/         │  │  │
│  │  │  MP4 files  │  │  SQLite DB  │  │  HTML / CSV       │  │  │
│  │  └─────────────┘  └─────────────┘  └───────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Page Flow

```
Home (app.py)
    │
    ├── Load Demo Data ──► injects sample state
    │
    ├── Practice (pages/1_Practice.py)
    │       ├── Upload MP4
    │       ├── Analyze Video      ──► core/video_analyzer.py
    │       ├── Analyze Camera     ──► core/camera_analyzer.py
    │       └── Analyze Speech     ──► core/speech_analyzer.py
    │
    ├── Feedback (pages/2_Feedback.py)
    │       ├── Display Video / Camera / Speech results
    │       ├── AI Coach Form
    │       │       └── Run AI Coach ──► core/ai_coach_agent.py
    │       ├── Generate Final Score ──► core/scoring_engine.py
    │       └── Save Session         ──► core/database.py
    │
    ├── Dashboard (pages/3_Dashboard.py)
    │       ├── Current Session Score (from state)
    │       ├── KPIs (from DB)
    │       ├── Trend Charts (from DB)
    │       └── Saved Sessions Table (from DB)
    │
    └── History (pages/4_History.py)
            ├── Browse Sessions      ──► core/database.py
            ├── Export HTML / CSV    ──► reports/report_generator.py
            └── Delete Session       ──► core/database.py
```

---

## Data Flow

### 1. Video Upload Flow

```
User uploads MP4
    │
    ▼
Streamlit file_uploader saves bytes to uploads/<filename>
    │
    ▼
File path stored in session_state["last_uploaded_name"]
    │
    ▼
Analyzers read the file path and return dict results
    │
    ▼
Results stored in session_state keys for cross-page access
```

### 2. Analysis Result Flow

```
Video Analysis Result
├── status: "success" | "error"
├── duration_seconds
├── fps
├── resolution
├── movement_score        ← used by scoring_engine
├── total_frames
└── message

Camera Analysis Result
├── status: "success" | "error"
├── face_visible_percent
├── framing
├── distance_feedback
├── movement_level
├── camera_score          ← used by scoring_engine
├── warnings
└── message

Speech Analysis Result
├── status: "success" | "error"
├── transcript            ← used by ai_coach_agent
├── word_count
├── words_per_minute
├── filler_word_count
├── repeated_word_count
├── speech_score          ← used by scoring_engine
├── warnings
└── message
```

### 3. AI Coach Flow

```
User provides:
    - transcript (auto-filled from speech or manually entered)
    - interview_question
    - target_role

ai_coach_agent.analyze_answer_with_ai()
    │
    ├── Check for API key (PITCHPILOT_AI_API_KEY)
    │       ├── YES ──► Call OpenAI-compatible API
    │       │              ├── Build system + user prompt
    │       │              ├── Enforce JSON output format
    │       │              ├── Parse and validate JSON
    │       │              └── Return structured result
    │       │
    │       └── NO  ──► Run _fallback_analysis()
    │                      ├── Word count scoring
    │                      ├── Structure detection (intro/body/closing)
    │                      ├── Role keyword matching
    │                      └── Return structured result
    │
    └── Result stored in session_state["ai_result"]
```

### 4. Final Scoring Flow

```
scoring_engine.calculate_overall_score(video, camera, speech, ai)
    │
    ├── Validate all three base analyses succeeded
    │
    ├── Compute video_score from movement_score
    │       └── Lower/natural movement = higher score
    │
    ├── Extract camera_score, speech_score
    │
    ├── Extract answer_score from AI result (default 75)
    │
    ├── Weighted average:
    │       Video   20%
    │       Camera  30%
    │       Speech  30%
    │       Answer  20%
    │
    ├── Derive performance level (Excellent/Good/Needs Practice/Weak)
    ├── Derive strengths from component thresholds
    ├── Derive weak points from component thresholds
    ├── Suggest next practice task based on weakest area
    └── Build human-readable summary
```

### 5. SQLite Storage Flow

```
User clicks "Save Session" on Feedback page
    │
    ▼
database.save_practice_session(video, camera, speech, ai, final, filename)
    │
    ├── Extract scalar fields from each result dict
    ├── Serialize lists (strengths, weak_points) to JSON strings
    ├── Build row dict with all fields
    │
    └── INSERT INTO practice_sessions
        │
        ├── id (AUTOINCREMENT)
        ├── created_at (ISO 8601 UTC)
        ├── video_filename
        ├── interview_question
        ├── target_role
        ├── transcript
        ├── duration_seconds, fps, resolution, movement_score
        ├── face_visible_percent, framing, distance_feedback
        ├── camera_score
        ├── word_count, words_per_minute, filler_word_count
        ├── repeated_word_count, speech_score
        ├── answer_score, overall_score, performance_level
        ├── strengths (JSON), weak_points (JSON)
        ├── next_practice_task, summary, ai_model_used
        │
        └── Returns session_id
```

### 6. Report Export Flow

```
User selects session on History page
    │
    ├── generate_html_report(session)
    │       └── Jinja2-style HTML string with all metrics
    │
    ├── generate_csv_report(session)
    │       └── Comma-separated values for spreadsheet import
    │
    └── build_report_filename(session, ext)
            └── pitchpilot_session_<id>_<timestamp>.<ext>
```

---

## AI Coach Fallback / API Design

The AI Coach is designed to work in **two modes** with zero configuration required:

### Mode A: LLM API (Real AI)
- Requires `PITCHPILOT_AI_API_KEY` environment variable
- Uses OpenAI client library with configurable base URL and model
- Prompt enforces strict JSON output format
- Response parsed, validated, and normalized before returning
- Gracefully falls back to rule-based mode on any API failure

### Mode B: Rule-Based Fallback
- Zero external dependencies
- Analyzes transcript using keyword detection, word counts, and sentence structure
- Detects: introduction, background (education/experience), closing, role relevance
- Scoring rubric: 0–100 with clear deductions and bonuses
- Returns identical dictionary structure as Mode A so the UI never needs to branch

This dual-mode design makes the app **instantly usable** for demos and offline use, while being **API-ready** for production.

---

## SQLite Storage Design

**Database file:** `data/pitchpilot.db`

**Table:** `practice_sessions`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | INTEGER PK AI | Unique session identifier |
| `created_at` | TEXT | ISO 8601 timestamp |
| `video_filename` | TEXT | Original upload name |
| `interview_question` | TEXT | Question being practiced |
| `target_role` | TEXT | Job role context |
| `transcript` | TEXT | Full speech transcript |
| `duration_seconds` | REAL | Video length |
| `fps` | REAL | Frame rate |
| `resolution` | TEXT | Video dimensions |
| `movement_score` | REAL | Raw motion metric |
| `face_visible_percent` | REAL | % of frames with face |
| `framing` | TEXT | centered / left / right |
| `distance_feedback` | TEXT | too_close / good / too_far |
| `camera_movement_level` | TEXT | low / medium / high |
| `camera_score` | INTEGER | 0–100 camera grade |
| `word_count` | INTEGER | Words spoken |
| `words_per_minute` | REAL | Speaking pace |
| `filler_word_count` | INTEGER | Um, uh, like, etc. |
| `repeated_word_count` | INTEGER | Repeated words |
| `speech_score` | INTEGER | 0–100 speech grade |
| `answer_score` | INTEGER | 0–100 content grade |
| `overall_score` | REAL | Weighted final score |
| `performance_level` | TEXT | Excellent / Good / Needs Practice / Weak |
| `strengths` | TEXT (JSON) | List of positive observations |
| `weak_points` | TEXT (JSON) | List of improvement areas |
| `next_practice_task` | TEXT | Actionable next step |
| `summary` | TEXT | Human-readable summary |
| `ai_model_used` | TEXT | Model name or "fallback_rules" |

**Queries supported:**
- `get_all_sessions(limit)` — newest first
- `get_dashboard_stats()` — aggregates (COUNT, AVG, MAX)
- `delete_session(id)` — soft-delete by ID

---

## Design Principles

1. **Modularity** — Each analyzer is a standalone module with a single public function.
2. **Graceful Degradation** — If an analyzer fails, the others still work. If AI is unavailable, fallback kicks in.
3. **State-Driven UI** — Streamlit `session_state` is the single source of truth for cross-page data.
4. **Zero-Config Defaults** — The app runs meaningfully without any API keys or external setup.
5. **Extensibility** — New analyzers can be added without changing the scoring engine or UI structure.
