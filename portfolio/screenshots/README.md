# PitchPilot AI — Screenshot Assets

This folder contains the official screenshot assets for GitHub, LinkedIn, CV, and portfolio website use.

## Checklist

Capture these screenshots from the running app (`streamlit run app.py` at `http://localhost:8501`).

| # | Filename | Page | What to Capture |
|---|----------|------|-----------------|
| 1 | `01_home_page.png` | Home (`app.py`) | Hero section, status badges (MVP, Offline Fallback, API-Ready, Local SQLite, Ethical Practice Tool), CTA buttons, feature cards |
| 2 | `02_practice_question_bank.png` | Practice (`pages/1_Practice.py`) | Practice mode selector, question dropdown, "🎲 Random" button, target role, workflow steps |
| 3 | `03_feedback_ai_coach.png` | Feedback (`pages/2_Feedback.py`) | Session intelligence bar (all green), Video/Camera/Speech cards, AI Coach section with score, strengths, weak points |
| 4 | `04_dashboard_progress.png` | Dashboard (`pages/3_Dashboard.py`) | KPI cards, trend chart, component breakdown bar chart, history table |
| 5 | `05_history_report_export.png` | History (`pages/4_History.py`) | Session selector, score summary, metadata table, transcript, strengths/weak points, export buttons |
| 6 | `06_settings_ai_provider.png` | Settings (`pages/5_Settings.py`) | AI Provider Status card, security note, temporary settings form, health check |
| 7 | `07_html_report_example.png` | Exported HTML Report | Opened HTML report showing score grid, session details, speech/camera tables, strengths, weak points, summary, transcript |

## Capture Instructions

1. **Load Demo Data first** — Click "🧪 Load Demo Data" on the Home page to populate sample data.
2. **Save a session** — On the Feedback page, click "💾 Save Session to History" so Dashboard and History have data to display.
3. **Use full desktop width** — Browser at ~1440px or wider for best results.
4. **Capture full page** — Use Chrome DevTools → Command Menu → "Capture full size screenshot" for tall pages.
5. **No API keys visible** — Ensure Settings page shows "Not Set" or masked values.

## Naming Convention

```
screenshot_XX_descriptive_name.png
```

Use zero-padded two-digit numbers (`01`, `02`, etc.).

## Optimization

Before committing:
- Resize to max width 1440px
- Compress with `oxipng`, TinyPNG, or Squoosh
- Keep PNG format for crisp UI text

## Usage

| Asset | Best For |
|-------|----------|
| `01_home_page.png` | GitHub README, portfolio hero |
| `02_practice_question_bank.png` | Demo slides, feature highlights |
| `03_feedback_ai_coach.png` | GitHub README primary showcase, LinkedIn |
| `04_dashboard_progress.png` | Portfolio website, demo slides |
| `05_history_report_export.png` | GitHub README, feature list |
| `06_settings_ai_provider.png` | Documentation, portfolio |
| `07_html_report_example.png` | GitHub README, LinkedIn, CV attachment |
