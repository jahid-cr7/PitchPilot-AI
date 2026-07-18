# PitchPilot AI — Mobile App

Premium dark-themed Expo React Native app for AI-powered interview and presentation coaching.

## Features

- **Auth** — Register, Login, and Logout screens (email + password); JWT persisted in `AsyncStorage` under `pitchpilot_auth_token`
- **Home** — Premium hero landing, backend status, core module cards, latest session, quick stats
- **Practice** — Practice Lab with mode selection, question picker, video upload, full AI analysis (login required to Run Analysis)
- **Feedback** — Score ring, Coach Aria feedback, strengths, growth areas, improved answer, exports
- **Settings** — Backend URL configuration, AI provider cards, preferences toggles, real user profile + Logout
- **History** (accessible from Home/Feedback/Settings) — Browse sessions, view details, export/delete
- **Dashboard** (accessible from Settings) — KPI grid, skill breakdown, recent sessions

## Authentication

Since **v1.2.0** the mobile app talks to a protected backend:

- Practice modes and questions load anonymously (public endpoints).
- Everything else — Run Full Analysis, Sessions, Dashboard, Reports — needs a valid JWT.
- On login/register the token is stored in `AsyncStorage` (`pitchpilot_auth_token`) and mirrored to `pitchpilot_auth_user`.
- The shared API client (`src/api/pitchpilotApi.ts`) auto-attaches `Authorization: Bearer <token>` via `setAuthTokenProvider`; a 401 clears storage and routes the user back to `/login`.
- Passwords are never stored on device; only the JWT and the sanitized user profile.
- Logout tears down the token, calls `POST /auth/logout` fire-and-forget, and returns the user to the guest state.

## Premium UI Overview

The mobile app uses a **dark navy SaaS aesthetic** designed for professional coaching products:

- **Background:** `#081225` deep navy
- **Cards:** `#111c31` glass-morphism with `#263654` borders
- **Accents:** Cyan `#35d7ff`, Blue `#4f8cff`, Purple `#9b7cff`
- **Typography:** Large bold titles, clear hierarchy, readable on small screens
- **Navigation:** Custom bottom tab bar with active indicator and icon backgrounds
- **Safe Areas:** Properly handles iOS notch, status bar, and home indicator

## Install

```bash
cd mobile
npm install
npx expo install @expo/vector-icons
```

## Run

### Web preview (fastest for UI testing and screenshots)

```bash
cd mobile
npx expo start -c --web
```

Opens in your browser at `http://localhost:8081`. The app is centered with a phone-sized viewport (`maxWidth: 480`). Use DevTools mobile viewport (iPhone 14 Pro 390×844) for realistic framing.

### Native device via LAN

```bash
cd mobile
npx expo start -c --lan
```

Scan the QR code with **Expo Go** (iOS/Android) or run in a simulator.

### iOS Simulator

```bash
cd mobile
npx expo start -c --ios
```

### Android Emulator

```bash
cd mobile
npx expo start -c --android
```

## Backend URL Setup

The mobile app talks to the FastAPI backend. The default URL is `http://127.0.0.1:8000`.

### Quick Reference

| Platform | Backend URL |
|----------|-------------|
| Local browser / iOS simulator | `http://127.0.0.1:8000` |
| Android emulator | `http://10.0.2.2:8000` |
| Physical phone (same Wi-Fi) | `http://YOUR_LAPTOP_IP:8000` |

### For a physical phone

1. Start the backend with `--host 0.0.0.0`:

   ```bash
   cd ..
   python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. Find your laptop's LAN IP:
   - **Linux/macOS:** `ipconfig getifaddr en0` or `hostname -I`
   - **Windows:** `ipconfig` → look for IPv4 Address under Wi-Fi adapter

3. In the mobile app, go to **Settings → Backend Endpoint**
4. Enter: `http://YOUR_LAPTOP_IP:8000`
5. Tap **Test Connection** to verify
6. Both devices must be on the same Wi-Fi network
7. If the test fails, check your firewall allows port `8000`

### For Android Emulator

The emulator has a special alias for the host machine:

```
http://10.0.2.2:8000
```

Enter this in **Settings → Backend Endpoint** and tap **Test Connection**.

## Video Upload & Analysis Flow

1. Go to the **Practice** tab
2. Enter a **Target Role**
3. Select a **Practice Mode**
4. Pick or randomize an **Interview Question**
5. Tap **Upload Session** and choose an MP4/MOV file
6. Tap **Run Analysis**
7. Watch the progress steps: Uploading → Video Analysis → Camera Analysis → Speech Analysis → AI Feedback → Final Score
8. On success, you are taken to the **Feedback** tab automatically
9. View your overall score, dimension scores, coach feedback, strengths, and growth areas

## Settings Explanation

### Save Practice History
- **On (default):** Full analysis results are saved to the backend SQLite database. You get a `session_id` and can view the session in History.
- **Off:** Analysis runs normally but is not saved to the database. Feedback shows "Not Saved" badge.
- This toggle is persisted to AsyncStorage and sent to the backend on every analysis request.

### Speech Analysis
- **On (default):** Speech is analyzed from the uploaded video's audio track (transcription, WPM, filler words).
- **Off:** UI toggle only — the backend currently always runs speech analysis. Future versions may support skipping speech analysis.
- This toggle is persisted to AsyncStorage.

## Export / Share

Export buttons appear on Feedback and History screens **only when a `session_id` exists**.

### Native (iOS/Android)
- Tap **Export HTML** or **Export CSV**
- The report content is written to the app's cache directory
- The native system **share sheet** opens automatically
- Choose an app (Mail, Messages, Files, etc.) to save or send the report

### Web Preview
- Tap **Export HTML** or **Export CSV**
- The browser triggers a **file download** automatically

If sharing is unavailable, a friendly alert explains that the file was saved to cache.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| "Another navigator is already registered" | Make sure `app-tabs.web.tsx` does NOT import `Tabs` from `expo-router/ui`. It should only render `View` + `Pressable`. |
| "Network error" / "Connection refused" | Make sure backend is running with `--host 0.0.0.0`. Check firewall and Wi-Fi. |
| "Timeout" | Verify the IP address is correct and backend is responsive. |
| Blank white screen on web | Check browser console for Metro bundler errors. Try `npx expo start -c --web`. |
| Bottom nav overlaps content | Fixed in current build — all screens include `paddingBottom: 100`. |
| Keyboard covers inputs on Practice | Fixed — Practice screen wraps ScrollView in `KeyboardAvoidingView`. |
| CORS error in logs | Backend CORS is already enabled for `*` in development. |
| Icons not showing on web | Ensure `@expo/vector-icons` is installed: `npx expo install @expo/vector-icons` |

## Known Limitations

1. **AI Interview mode** is not yet implemented. The tab shows a "Soon" badge and displays a friendly Alert when tapped.
2. **Speech Analysis toggle** is persisted and shown in Settings, but the backend always runs speech analysis from video audio. A future backend update would be needed to fully honor this toggle.
3. **Export on native** uses the system share sheet — the user must select an app to save the file. Direct "Save to Downloads" without interaction is not implemented.

## Tech Stack

- Expo SDK 57
- React Native 0.86
- TypeScript
- Expo Router (file-based routing)
- `@expo/vector-icons` (Ionicons)
- `expo-document-picker` (video selection)
- `expo-linear-gradient` (gradient buttons)
- `expo-sharing` + `expo-file-system` (report export)
- `react-native-svg` (score ring)
- `react-native-safe-area-context` (safe areas)

## Folder Structure

```
mobile/src/
  app/
    _layout.tsx       # Expo Router root layout with Tabs + custom tabBar
    index.tsx         # Home screen
    practice.tsx      # Practice Lab (upload + analyze)
    feedback.tsx      # AI coaching feedback
    settings.tsx      # Backend & preferences
    history.tsx       # Session history
    dashboard.tsx     # Stats dashboard
  components/
    app-tabs.tsx      # Native bottom tab bar
    app-tabs.web.tsx  # Web bottom tab bar
    GlassCard.tsx     # Reusable glass-morphism card
    GradientButton.tsx
    ScoreRing.tsx
    StatusBadge.tsx
    SectionTitle.tsx
    LoadingOverlay.tsx
    ErrorBanner.tsx
  api/
    pitchpilotApi.ts  # All backend API calls + AsyncStorage settings
  theme.ts            # Colors, spacing, typography, shadows, gradients
  types/
    pitchpilot.ts     # TypeScript interfaces
```
