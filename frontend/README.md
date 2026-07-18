# PitchPilot AI — React Frontend

Modern React frontend for PitchPilot AI. Built with Vite, TypeScript, and Tailwind CSS.

---

## Prerequisites

- Node.js 18+ and npm
- PitchPilot AI FastAPI backend running at `http://127.0.0.1:8000`

---

## Install

```bash
cd frontend
npm install
```

---

## Run

```bash
npm run dev
```

The dev server starts at `http://localhost:5173`.

---

## Build

```bash
npm run build
```

Static output goes to `dist/`.

---

## Backend Requirement

Make sure the FastAPI backend is running before using the frontend:

```bash
cd ..
python -m uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
```

---

## API URL Config

The frontend defaults to `http://127.0.0.1:8000`. You can change it on the **Settings** page or by editing localStorage key `pp_api_url`.

---

## Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── pitchpilotApi.ts       # Fetch wrapper around FastAPI
│   ├── components/
│   │   ├── Layout.tsx             # Navbar + page wrapper
│   │   ├── Hero.tsx               # Landing hero section
│   │   ├── PracticeModeSelector.tsx
│   │   ├── QuestionPanel.tsx
│   │   ├── AiCoachPanel.tsx       # AI analysis form + results
│   │   ├── ScoreCard.tsx
│   │   └── Footer.tsx
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── PracticePage.tsx
│   │   ├── FeedbackPage.tsx
│   │   └── SettingsPage.tsx
│   ├── types/
│   │   └── pitchpilot.ts          # TypeScript interfaces
│   └── styles/
│       └── index.css              # Tailwind entry
```

---

## Features

- **Home:** Hero, feature cards, quick stats, backend status
- **Practice:** Mode selector, question bank, random picker, role input, MP4 dropzone with validation, simulated progress animation, full analysis pipeline
- **Feedback:** Animated score ring, dimension breakdown, strengths/weak points, transcript preview, next practice task, AI model display, export HTML/CSV (when session_id exists)
- **Dashboard:** KPI cards, score progression chart, skill breakdown, recent activity table, refresh button
- **History:** Filter tabs (Today/This Week/All Time), session list sorted newest-first, detail panel with scores/transcript/metadata, report export, delete confirmation, refresh button
- **Settings:** Backend URL config, API docs link, provider hints
