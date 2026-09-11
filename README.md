# RUN — Outdoor GPS Running Tracker

A modular, production-ready outdoor running tracker built with **React Native** and **Expo**. Tracks real-time GPS coordinates, filters telemetry noise, calculates active duration and average pace, and presents a full route map summary upon run completion.

---

## 📱 Features

- **Live Telemetry:** Tracks elapsed duration, distance (in kilometers), and running average pace (`min/km`).
- **State Machine Control:** Seamless transitions between `idle`, `running`, `paused`, and `completed` states.
- **GPS Noise & Glitch Filtering:** Multi-stage filtering pipeline to ensure reliable metrics without GPS drift.
- **Route Visualization:** Renders the GPS path using `react-native-maps` polyline on the post-run summary screen.
- **Decoupled Core Architecture:** Pure TypeScript tracking engine with zero React or native dependencies for maximum testability.

---

## 🏗️ Architecture

The codebase follows a strict separation of concerns across three distinct layers:

```
┌─────────────────────────────────────────────────────────────┐
│                      UI / Presentation                      │
│        (StartScreen, ActiveRunScreen, SummaryScreen)        │
└──────────────────────────────┬──────────────────────────────┘
                               │ useRunTrackingEngine (Hook)
┌──────────────────────────────▼──────────────────────────────┐
│                    RunTrackingEngine                        │
│          (Pure State Machine, Math & GPS Filtering)         │
│                 └── geo.ts (Haversine Formula)              │
│                 └── types.ts (Shared Domain Models)         │
└──────────────────────────────▲──────────────────────────────┘
                               │ Raw Coordinates
┌──────────────────────────────┴──────────────────────────────┐
│                      LocationService                        │
│             (Thin wrapper around expo-location)             │
└─────────────────────────────────────────────────────────────┘
```

### File Structure & Responsibilities

| File | Purpose |
|---|---|
| [`types.ts`](./types.ts) | Shared domain models (`RunPoint`, `RunSummary`, `RunState`, `RawLocation`). |
| [`geo.ts`](./geo.ts) | Pure Haversine distance calculation formula for geographic coordinates. |
| [`RunTrackingEngine.ts`](./RunTrackingEngine.ts) | Core business logic: lifecycle state machine, GPS point filtering heuristics, pace, and distance calculation. |
| [`RunTrackingEngine.test.ts`](./RunTrackingEngine.test.ts) | Comprehensive unit tests verifying GPS filtering, edge cases, and arithmetic without native mocks. |
| [`locationService.ts`](./locationService.ts) | Thin adapter for `expo-location` requesting foreground permissions and streaming raw fixes. |
| [`useRunTrackingEngine.ts`](./useRunTrackingEngine.ts) | Custom React hook connecting the engine's observer pattern to React state re-renders. |
| [`StartScreen.tsx`](./StartScreen.tsx) | Initial state UI handling location permission requests and triggering run start. |
| [`ActiveRunScreen.tsx`](./ActiveRunScreen.tsx) | Live dashboard rendering elapsed time, distance, pace, and pause/resume/finish actions. |
| [`SummaryScreen.tsx`](./SummaryScreen.tsx) | Post-run review displaying summary stats and the route polyline on an interactive map. |
| [`runStorage.ts`](./runStorage.ts) | Local session persistence using AsyncStorage (`saveRunRecording`, `getStoredRunRecordings`). |
| [`App.tsx`](./App.tsx) | Root application component coordinating screen transitions based on engine state. |

---

## 🔬 How Distance & Pace are Calculated

Consumer GPS is inherently noisy. Raw location fixes are passed through a defensive filtering pipeline in `RunTrackingEngine` before being incorporated into total distance:

1. **Horizontal Accuracy Cutoff:** Fixes with horizontal accuracy worse than `20 meters` are discarded.
2. **Staleness Rejection:** Points timestamped older than `5 seconds` when received are dropped.
3. **Speed Spike Filter:** Fixes that require an instantaneous speed exceeding `6.5 m/s` (faster than `2:34 min/km` pace) are rejected as GPS teleportation/glitches.
4. **Stationary Jitter Suppression:** Distance between consecutive points smaller than `2 meters` while moving at near-zero velocity is ignored to prevent distance accumulation while standing still.

### Metrics Logic

* **Pace:** Calculated as a **running average** (`total distance / total active elapsed time`), updated every second. This avoids erratic rolling-window spikes caused by momentary signal variance.
* **Duration:** Derived from exact timestamps (`current timestamp - start timestamp - cumulative paused duration`), ensuring zero timer drift if JavaScript execution is momentarily throttled.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- **Expo Go** app installed on your physical iOS or Android device

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/SahebSandhuSingh/PlexQo.git
   cd PlexQo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Expo development server:
   ```bash
   npx expo start
   ```
   *(Or use `npx expo start --tunnel` if testing over different Wi-Fi / cellular networks).*

4. Scan the QR code using:
   - **iOS:** Camera app (opens in Expo Go)
   - **Android:** Expo Go app

> **Note:** Testing GPS tracking requires testing on a physical device outdoors. Simulators/emulators will not yield realistic GPS fixes unless locations are actively mocked.

---

## 🧪 Running Tests

Unit tests execute directly against the pure `RunTrackingEngine` without needing a physical device or native device mocks:

```bash
npx jest
```

---

## ⚖️ Engineering Decisions & Trade-offs

* **Zero Navigation Library Overhead:** Switched between the 3 screens via simple state in `App.tsx`. Introducing `@react-navigation/native` was intentionally avoided to keep bundle size lightweight and dependencies minimal for a focused 3-screen workflow.
* **Foreground GPS vs Background Tracking:** Built and configured for standard Expo Go usage with foreground location updates (`NSLocationWhenInUseUsageDescription`). Full background tracking requires an EAS standalone build with background location entitlements.
* **GPS Telemetry vs Step Counting:** GPS was chosen over pedometer/accelerometer estimation as research demonstrates GPS provides superior distance fidelity for outdoor running without requiring user-specific stride length calibration.
* **Local Run Persistence:** Completed runs and route coordinates are persistently stored on-device using `@react-native-async-storage/async-storage` via `runStorage.ts`, allowing the Start screen to surface previous session stats.
