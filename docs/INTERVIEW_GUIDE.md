# Interview Guide

Use this guide to pitch PitchPilot AI in job interviews, networking events, or portfolio reviews.

---

## Short Project Pitch (30 seconds)

> "PitchPilot AI is a Python/Streamlit application that analyzes practice interview and presentation videos. It evaluates four dimensions — body movement, camera presence, speech clarity, and answer content — then combines them into a single overall score with actionable feedback. It works offline for most features, includes a demo mode for quick testing, and gracefully falls back to rule-based AI scoring when no API key is available."

---

## Long Project Pitch (2 minutes)

> "I built PitchPilot AI to solve a real problem: people preparing for interviews have no objective way to evaluate their performance. You can practice in front of a mirror, but you can't measure your pacing, filler words, or body language rigorously.
>
> The app takes an MP4 video and runs three local analyses: OpenCV for motion and face detection, faster-whisper for speech transcription, and a custom scoring engine that weights everything into a 0–100 score. Then there's an AI Coach that evaluates your answer content — structure, relevance, and clarity. If you have an API key, it calls a real LLM. If not, it uses an intelligent rule-based fallback that checks introductions, background mentions, role keywords, and sentence variety.
>
> The architecture is modular — each analyzer is independent, the scoring engine is pure Python with no external dependencies, and the UI is built with Streamlit. That means I can swap in a better face detector or a different speech model later without touching the rest of the codebase.
>
> I also built session persistence with SQLite, progress tracking with Pandas charts, and report export in HTML and CSV. There's a Demo Mode so anyone can try the app instantly without uploading a video."

---

## Technical Explanation

### What technologies did you use and why?

- **Streamlit** — Rapid UI prototyping for data apps. Chosen because it handles widgets, state, and charts with minimal boilerplate.
- **OpenCV** — Battle-tested computer vision library. Used for video metadata extraction, optical flow motion scoring, and Haar Cascade face detection.
- **faster-whisper** — Efficient speech-to-text on CPU. Uses ONNX runtime and quantized models for fast local inference.
- **OpenAI API (optional)** — GPT-4o-mini for content analysis. The prompt enforces JSON output so the response is machine-parseable.
- **SQLite** — Zero-config local database. Perfect for single-user MVP storage without running a database server.
- **Pandas** — Data manipulation and preparation for trend charts.

### How does the scoring engine work?

The engine takes four component scores and computes a weighted average:

| Component | Weight | Source |
|-----------|--------|--------|
| Video | 20% | Inverted movement score (natural motion = higher score) |
| Camera | 30% | Face visibility + framing + distance + movement level |
| Speech | 30% | WPM, filler words, repeated words, transcript quality |
| Answer | 20% | AI Coach score (LLM or rule-based) |

It then classifies the overall score into performance levels, derives strengths and weak points by thresholding each component, and suggests a next practice task based on the weakest area.

### Why rule-based fallback instead of only API?

Three reasons:
1. **Offline usability** — The app is useful immediately without API keys or internet.
2. **Cost control** — Users can practice unlimited times without API charges.
3. **Interview safety** — In a live demo or interview setting, I don't need to expose API keys or worry about rate limits.

The fallback returns the exact same dictionary structure as the LLM path, so the UI is completely decoupled from the implementation.

---

## Problems Solved

| Problem | Solution |
|---------|----------|
| No objective interview feedback | Automated scoring across 4 dimensions |
| Hard to track progress over time | SQLite persistence + Dashboard trend charts |
| Need to practice without setup | Demo Mode loads sample data instantly |
| API costs and key management | Rule-based fallback works out of the box |
| Cross-platform compatibility | Pure Python + pathlib, tested on Ubuntu and Windows |
| Messy UI with many metrics | Expandable containers, clean metric cards, sidebar navigation |

---

## Challenges Faced

### Challenge 1: Handling large video files
**Problem:** Video uploads can be hundreds of megabytes.
**Solution:** Added a 200 MB file size guard and saved files using pathlib for cross-platform paths.

### Challenge 2: Face detection accuracy
**Problem:** Haar Cascade is fast but produces false negatives on poor lighting.
**Solution:** Designed the scoring engine to tolerate partial face detection. The camera score is a composite, not binary. Future roadmap includes MediaPipe for better accuracy.

### Challenge 3: LLM response format reliability
**Problem:** LLMs don't always return valid JSON.
**Solution:** Enforced JSON output in the system prompt, added markdown code-fence stripping, schema validation, and automatic fallback to rule-based scoring if parsing fails.

### Challenge 4: Cross-page state management
**Problem:** Streamlit reruns scripts on every interaction, losing local variables.
**Solution:** Used `st.session_state` as a persistent dictionary to pass analysis results from Practice to Feedback to Dashboard.

---

## Why This Project Is Useful

1. **Real-world impact** — Job interviews are high-stakes. Objective feedback reduces anxiety and accelerates improvement.
2. **Full-stack demonstration** — Shows frontend (Streamlit), backend logic (Python modules), data persistence (SQLite), AI integration (LLM API), and DevOps awareness (modular architecture, future FastAPI/Docker plans).
3. **Product thinking** — Includes Demo Mode, fallback design, ethical-use notes, and user-facing documentation — not just code.
4. **Extensibility** — The modular pipeline design makes it easy to add new analyzers, swap models, or add a REST API layer.

---

## Possible Interview Questions and Answers

### Q: Why did you choose Streamlit over React or another framework?
**A:** Streamlet let me build a polished, interactive UI in pure Python without context switching to JavaScript. For an MVP focused on data visualization and rapid iteration, it's the right tool. The architecture is modular enough that I can later add a FastAPI backend and a React frontend if needed.

### Q: How would you scale this to handle multiple users?
**A:** I'd add a FastAPI backend with JWT authentication, move SQLite to PostgreSQL, and store videos in object storage (S3 or MinIO). The analyzer modules are already stateless — they'd become background Celery tasks. Streamlit would then become a client that calls the API.

### Q: What would you improve next?
**A:** Three things: (1) Replace Haar Cascade with MediaPipe for more accurate body language analysis, (2) Add sentiment and emotion detection to speech analysis, and (3) Deploy with Docker so users can run it with one command. All of these are in the roadmap.

### Q: How do you handle errors in the AI Coach?
**A:** The AI Coach wraps the API call in a try-except block. If the API fails, times out, or returns invalid JSON, it silently falls back to rule-based analysis. The user sees an info banner saying it's in fallback mode — the app never crashes.

### Q: What's your favorite technical decision in this project?
**A:** The dual-mode AI Coach design. It makes the app instantly usable for demos and offline practice, while being production-ready when an API key is added. The UI doesn't care which mode is active because both return the same data contract.

### Q: How did you ensure cross-platform compatibility?
**A:** I used `pathlib.Path` for all file operations instead of string paths, avoided OS-specific shell commands, and tested on both Ubuntu and Windows. The virtual environment setup is documented for both platforms.

### Q: What does the scoring engine teach us about the user's performance?
**A:** It doesn't just give a number. It breaks down performance by dimension, identifies specific strengths and weak points, and suggests a concrete next task. For example, if speech is the weakest area, it might recommend a filler-word drill. If camera is weak, it suggests checking framing and lighting.
