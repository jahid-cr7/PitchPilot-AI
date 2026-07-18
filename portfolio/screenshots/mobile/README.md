# Mobile Screenshots

This folder contains the premium Expo mobile app screenshots for the portfolio, GitHub README, and demo presentations.

## Expected Screenshot Filenames

| # | Filename | What It Shows |
|---|----------|---------------|
| 1 | `01_mobile_home.png` | Home screen with hero, backend status, module cards, latest session |
| 2 | `02_mobile_practice_upload.png` | Practice Lab with file selected, mode chips, question card |
| 3 | `03_mobile_analysis_progress.png` | Loading overlay with progress steps (Uploading → Final Score) |
| 4 | `04_mobile_feedback_score.png` | Feedback with score ring, Coach Aria, strengths, growth areas, exports |
| 5 | `05_mobile_settings_backend.png` | Settings with backend URL, provider cards, preference toggles |
| 6 | `06_mobile_history_or_export.png` | History list or detail view with export/delete actions |

## Recommended Size

- **Width:** 390px (iPhone 14 Pro) or 412px (Pixel 7)
- **Height:** 844px or 915px (full device frame)
- **Format:** PNG for crisp UI text
- **Max file size:** ~500 KB each (compress with TinyPNG or oxipng if needed)

## What Each Screenshot Should Show

1. **Home** — Dark navy background, cyan accents, "Backend Online" badge, hero title, module cards, latest session card.
2. **Practice** — Segmented control with "Solo Practice" active and "AI Interview" showing purple "Soon" badge. File card showing name/size/type. "Run Analysis" button enabled.
3. **Progress** — Full-screen dark overlay with cyan spinner and 6 animated progress steps.
4. **Feedback** — Score ring centered, performance badge, Coach Aria card, 4 dimension score cards, strengths/growth areas lists, improved answer, next milestone, export buttons.
5. **Settings** — Backend status badge, endpoint input with help URLs, Test/Save buttons, provider cards, Save Practice History + Speech Analysis toggles.
6. **History/Export** — Glass-card session rows or detail view with progress bars, transcript, export buttons.

## Security Reminders

- **Do not commit screenshots that show your real laptop IP address** in the backend URL field.
- **Do not commit screenshots that show API keys** (there should be none in the mobile UI, but double-check).
- Use `http://127.0.0.1:8000` or blur the IP before committing if using a LAN IP.

## How to Capture

```bash
cd mobile
npx expo start -c --web
```

1. Open browser at `http://localhost:8081`
2. Open DevTools → Toggle Device Toolbar
3. Select iPhone 14 Pro (390×844)
4. Navigate through each screen following `portfolio/MOBILE_SCREENSHOT_CHECKLIST.md`
5. Save screenshots to this folder with the exact filenames above

## Status

| # | Filename | Exists | Notes |
|---|----------|--------|-------|
| 1 | `01_mobile_home.png` | No | Capture Home tab with backend online |
| 2 | `02_mobile_practice_upload.png` | No | Capture Practice with file selected |
| 3 | `03_mobile_analysis_progress.png` | No | Capture loading overlay mid-analysis |
| 4 | `04_mobile_feedback_score.png` | No | Capture after successful analysis |
| 5 | `05_mobile_settings_backend.png` | No | Capture Settings with "Connected" badge |
| 6 | `06_mobile_history_or_export.png` | No | Capture History list or detail view |

> Mark **Exists** as `Yes` and update **Notes** after each screenshot is saved to this folder.
