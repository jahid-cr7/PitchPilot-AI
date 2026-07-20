# Robot Coach Lesson Mode

PitchPilot AI can now generate instant robot coach lessons that teach users how to improve after every practice session.

## Purpose

When a user's interview or presentation performance is weak in a specific area, the app generates a personalized video-style lesson that explains:

1. **What the user did wrong** — based on session feedback
2. **Why it matters** — the impact on interviewers or audiences
3. **How to do it properly** — a clear method or framework
4. **A better example** — a model answer or demonstration
5. **Practice steps** — actionable exercises to improve

## How it works

### Backend

**Endpoint:** `POST /api/v1/coach/robot-lesson`

Protected by JWT. The caller must own the session.

**Request:**
```json
{
  "session_id": 123,
  "lesson_type": "interview",
  "focus_area": "answer_structure"
}
```

`focus_area` options: `answer_structure`, `speech`, `body_language`, `confidence`, `overall`

**Response:**
```json
{
  "status": "success",
  "lesson": {
    "title": "How to Structure Your Answer Better",
    "coach_name": "Coach Nova",
    "lesson_type": "interview",
    "focus_area": "answer_structure",
    "problem_summary": "Your answer lacked a clear structure...",
    "why_it_matters": "Interviewers form opinions in the first 30 seconds...",
    "correct_method": "Use the STAR method...",
    "better_example": "In my last project...",
    "practice_steps": [
      "Pick one past experience and write it in STAR format.",
      "..."
    ],
    "spoken_script": "Hi, I'm Coach Nova. Let's improve your interview answer...",
    "subtitles": [
      {"time": 0, "text": "Hi, I'm Coach Nova."},
      {"time": 4, "text": "Let's improve your interview answer."}
    ],
    "estimated_duration_seconds": 60
  }
}
```

### AI vs. Fallback

- **If `PITCHPILOT_AI_API_KEY` is configured:** The backend calls the LLM with a structured prompt and returns an AI-generated lesson personalized to the user's session data (transcript, weaknesses, strengths, scores).
- **If no AI key is configured:** A rule-based fallback selects a pre-built lesson template for the requested focus area and personalizes the problem summary with the user's actual weaknesses. The fallback always works offline.

### Frontend

- **Feedback Page** — When a session is saved, a "Robot Coach Lesson" button appears next to the export buttons.
- **Robot Coach Page** (`/robot-coach`) — A video-style lesson screen with:
  - Animated robot avatar with pulse/speak animation
  - Subtitle player that advances during playback
  - Progress bar
  - Play / Pause / Replay controls
  - Browser text-to-speech (`window.speechSynthesis`) — speaks the lesson script
  - Lesson cards: What Went Wrong, Why It Matters, Correct Method, Better Example
  - Practice Steps checklist
  - Navigation: Practice Again, Back to Feedback, Open Coaching Plan

**Note:** The page does not auto-play audio. The user must click Play.

If `speechSynthesis` is unavailable, subtitles still play on a timer.

### Mobile

The mobile Feedback screen shows a "Robot Coach Lesson" card with Coach Nova's avatar and an "Open Robot Coach" button. The full robot coach UI is web-first; mobile shows the card as an entry point.

## Limitations

- **No real AI video generation yet.** The robot coach is a text + TTS + animation UI, not a generated video file.
- **Subtitle timing is approximate.** Subtitles advance on a fixed timer (~4 seconds per sentence) rather than true word-level synchronization.
- **Single focus area per lesson.** Users must request a new lesson to switch focus areas.
- **Mobile UI is simplified.** The full animated player is on the React web app.

## Future roadmap

- Real AI video avatar generation (lip-sync, animated character)
- Word-level subtitle synchronization
- Multiple focus areas in one lesson
- Downloadable lesson video/audio
- Mobile-native TTS with Expo Speech

## Saved Lesson History

Generated lessons are automatically saved to the database so users can replay them later.

### Backend endpoints

- `POST /api/v1/coach/robot-lesson` — Generates and saves a lesson. Returns `lesson_id`.
- `GET /api/v1/coach/robot-lessons` — Lists all saved lessons for the authenticated user.
- `GET /api/v1/coach/robot-lessons/{lesson_id}` — Returns a single saved lesson (owner-only).
- `DELETE /api/v1/coach/robot-lessons/{lesson_id}` — Deletes a saved lesson (owner-only).

### Frontend

- **Robot Coach Page** (`/robot-coach`) — Shows a "Saved Lesson" badge when the lesson has a `lesson_id`, and a "View Saved Lessons" button.
- **Saved Lessons Page** (`/robot-lessons`) — Grid of all saved lessons with title, focus area, duration, created date, open, and delete actions. Opening a saved lesson replays it in the same Robot Coach player.

### Mobile

- The mobile Feedback screen shows both "Open Robot Coach" and "Saved Lessons" buttons on the Robot Coach card.

## Testing

Run the robot coach tests:

```bash
pytest tests/test_robot_coach.py -v
```

Tests cover:
- Auth requirement (401 without token)
- Cross-user session isolation (404 when accessing another user's session)
- Fallback generation without AI key
- Response structure (lesson_id, spoken_script, practice_steps, subtitles, duration)
- All focus_area variants
- Saved lesson history CRUD (list, get, delete)
- Cross-user lesson isolation (list, get, delete)
