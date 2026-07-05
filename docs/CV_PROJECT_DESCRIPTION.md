# PitchPilot AI — CV Project Description

Copy-paste ready descriptions for your resume, CV, LinkedIn, and job applications.

---

## 1-Line CV Version

> Built an AI-powered interview coaching app that analyzes practice videos and delivers structured feedback across body language, speech, and answer content.

---

## 2-Line CV Version

> Built PitchPilot AI, a Python/Streamlit app that analyzes practice interview videos using OpenCV, faster-whisper, and LLM APIs to deliver structured feedback and track improvement over time. Designed a modular architecture with dual-mode AI Coach (LLM API + rule-based fallback) and SQLite session persistence.

---

## Detailed CV Version (for "Projects" section)

**PitchPilot AI — AI Interview & Presentation Coach**

Developed an end-to-end coaching platform that analyzes practice interview videos across four dimensions — body movement, camera presence, speech clarity, and answer content — and produces a weighted overall performance score (0–100) with actionable feedback.

- **Video & Camera Analysis:** Implemented OpenCV-based motion scoring and Haar Cascade face detection to evaluate body movement, framing, distance, and face visibility.
- **Speech Analysis:** Integrated faster-whisper for local speech-to-text transcription, extracting word count, WPM, filler words, and repeated words.
- **AI Coach:** Built a dual-mode content analysis engine — calls an OpenAI-compatible LLM when an API key is available, and falls back to intelligent rule-based scoring (keyword detection, structure analysis, role relevance) when offline.
- **Scoring Engine:** Designed a weighted aggregation system (Video 20%, Camera 30%, Speech 30%, Answer 20%) that derives performance level, strengths, weak points, and a personalized next practice task.
- **Data & Reporting:** Implemented SQLite session history, a Dashboard with trend charts and KPIs, and HTML/CSV report export.
- **Demo Mode:** Added one-click sample data loading for instant presentations and testing without uploading a video.

**Technologies:** Python, Streamlit, OpenCV, faster-whisper, OpenAI API, SQLite, Pandas

---

## Bullet Points for Resume

- Built a Python/Streamlit web app that analyzes practice interview videos and delivers structured AI-powered feedback
- Integrated OpenCV for video motion analysis and face detection; faster-whisper for local speech-to-text transcription
- Designed a dual-mode AI Coach that uses LLM APIs when available and intelligently falls back to rule-based scoring offline
- Engineered a weighted scoring system (0–100) combining video, camera, speech, and answer metrics with actionable next steps
- Implemented SQLite session persistence, progress dashboard with trend charts, and HTML/CSV report export
- Created a Demo Mode for instant product demonstrations without requiring video uploads or external API keys

---

## Technologies Used

| Category | Tools |
|----------|-------|
| Language | Python 3.12+ |
| Web Framework | Streamlit |
| Computer Vision | OpenCV (Haar Cascade, optical flow) |
| Speech-to-Text | faster-whisper (ONNX runtime) |
| AI / LLM | OpenAI-compatible API, custom rule-based fallback |
| Database | SQLite |
| Data & Charts | Pandas, Streamlit native charts |
| Reports | HTML / CSV generators |
| Architecture | Modular pipeline, session-state driven UI |

---

## Measurable Project Impact

- **4 analysis dimensions** evaluated per session (video, camera, speech, answer)
- **0–100 scoring scale** with weighted aggregation and performance level classification
- **100% offline capable** for core features (video, camera, speech, rule-based AI)
- **Instant demo ready** — Demo Mode loads sample data in one click for presentations and interviews
- **Cross-platform** — tested and documented for Ubuntu and Windows
- **Interview-ready documentation** — architecture docs, demo scripts, interview Q&A, and roadmap included
