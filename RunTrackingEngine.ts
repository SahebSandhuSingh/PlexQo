import { haversineDistanceMeters } from './geo';
import { RawLocation, RunPoint, RunSummary, RunState } from './types';

type Listener = () => void;

// --- Tunable filtering thresholds ---
const MAX_ACCEPTABLE_ACCURACY_M = 20;
const MAX_FIX_AGE_MS = 5000;
/** ~6.5 m/s ≈ 2:34/km — faster than realistic amateur running pace; treat as GPS noise. */
const MAX_PLAUSIBLE_SPEED_MPS = 6.5;
const MIN_MOVEMENT_M = 2;

/**
 * Pure tracking/calculation logic for a run. No React, no expo-location —
 * just "feed me locations, ask me for numbers". This is what should be
 * unit tested; LocationService is the only piece that talks to the device.
 */
export class RunTrackingEngine {
  state: RunState = 'idle';
  totalDistanceMeters = 0;
  elapsedTimeSeconds = 0;
  /** Running average pace (total distance / total active time so far), recalculated live. */
  averagePaceSecPerKm: number | null = null;
  isGPSSignalWeak = false;
  route: RunPoint[] = [];

  private startTime: number | null = null;
  private accumulatedPausedMs = 0;
  private lastPauseStart: number | null = null;
  private lastAccepted: RawLocation | null = null;
  private lastFixReceivedAt: number | null = null;
  private uiIntervalId: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<Listener>();

  /** Subscribe to any state change. Returns an unsubscribe function. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // --- Lifecycle controls ---

  start() {
    if (this.state !== 'idle') return;
    this.state = 'active';
    this.startTime = Date.now();
    this.accumulatedPausedMs = 0;
    this.totalDistanceMeters = 0;
    this.averagePaceSecPerKm = null;
    this.route = [];
    this.lastAccepted = null;
    this.startUiTimer();
    this.notify();
  }

  pause() {
    if (this.state !== 'active') return;
    this.state = 'paused';
    this.lastPauseStart = Date.now();
    this.stopUiTimer();
    this.notify();
  }

  resume() {
    if (this.state !== 'paused') return;
    if (this.lastPauseStart != null) {
      this.accumulatedPausedMs += Date.now() - this.lastPauseStart;
    }
    this.lastPauseStart = null;
    // Don't bridge distance across the pause gap: next fix just becomes the new anchor.
    this.lastAccepted = null;
    this.state = 'active';
    this.startUiTimer();
    this.notify();
  }

  finish(): RunSummary {
    this.stopUiTimer();
    const durationSeconds = this.currentElapsedSeconds();
    const avgPace =
      this.totalDistanceMeters > 1
        ? durationSeconds / (this.totalDistanceMeters / 1000)
        : null;
    const summary: RunSummary = {
      totalDistanceMeters: this.totalDistanceMeters,
      totalDurationSeconds: durationSeconds,
      averagePaceSecPerKm: avgPace,
      route: this.route,
      finishedAt: Date.now(),
    };
    this.state = 'finished';
    this.elapsedTimeSeconds = durationSeconds;
    this.notify();
    return summary;
  }

  // --- Feeding GPS updates ---

  /** Call this with every raw fix the LocationService hands you. */
  ingest(loc: RawLocation) {
    this.lastFixReceivedAt = Date.now();
    this.isGPSSignalWeak = false;

    if (this.state !== 'active') return;

    const ageMs = Date.now() - loc.timestamp;
    if (ageMs > MAX_FIX_AGE_MS) return;

    if (loc.accuracy == null || loc.accuracy < 0 || loc.accuracy > MAX_ACCEPTABLE_ACCURACY_M) {
      return;
    }

    const point: RunPoint = {
      latitude: loc.latitude,
      longitude: loc.longitude,
      timestamp: loc.timestamp,
      horizontalAccuracy: loc.accuracy,
    };

    if (!this.lastAccepted) {
      this.lastAccepted = loc;
      this.route.push(point);
      this.notify();
      return;
    }

    const distance = haversineDistanceMeters(
      this.lastAccepted.latitude,
      this.lastAccepted.longitude,
      loc.latitude,
      loc.longitude
    );
    const timeDeltaSeconds = (loc.timestamp - this.lastAccepted.timestamp) / 1000;

    if (timeDeltaSeconds <= 0) {
      this.route.push(point);
      this.notify();
      return;
    }

    const impliedSpeed = distance / timeDeltaSeconds;
    if (impliedSpeed > MAX_PLAUSIBLE_SPEED_MPS) {
      // Likely a GPS glitch: reset the anchor so one bad fix doesn't poison
      // every subsequent calculation, but don't accumulate the distance.
      this.lastAccepted = loc;
      this.route.push(point);
      this.notify();
      return;
    }

    if (distance >= MIN_MOVEMENT_M) {
      this.totalDistanceMeters += distance;
      this.updateAveragePace();
    }

    this.lastAccepted = loc;
    this.route.push(point);
    this.notify();
  }

  /** Call periodically to flag a weak/lost signal without guessing internally on a timer. */
  checkSignalHealth(now = Date.now()) {
    if (this.state !== 'active' || this.lastFixReceivedAt == null) return;
    this.isGPSSignalWeak = now - this.lastFixReceivedAt > 8000;
  }

  // --- Pace / time helpers ---

  /**
   * Simple running average: total distance so far / total active time so far.
   * Recalculated on every accepted GPS point and every UI tick, so it still
   * updates live during the run — just without the extra complexity of a
   * rolling window, which the brief doesn't require ("current or average
   * pace" — average satisfies this and is easier to reason about/defend).
   */
  private updateAveragePace() {
    const elapsed = this.currentElapsedSeconds();
    if (this.totalDistanceMeters <= 1 || elapsed <= 0) {
      this.averagePaceSecPerKm = null;
      return;
    }
    this.averagePaceSecPerKm = elapsed / (this.totalDistanceMeters / 1000);
  }

  private currentElapsedSeconds(): number {
    if (this.startTime == null) return 0;
    let pausedMs = this.accumulatedPausedMs;
    if (this.lastPauseStart != null) {
      pausedMs += Date.now() - this.lastPauseStart;
    }
    return (Date.now() - this.startTime - pausedMs) / 1000;
  }

  private startUiTimer() {
    this.stopUiTimer();
    this.uiIntervalId = setInterval(() => {
      this.elapsedTimeSeconds = this.currentElapsedSeconds();
      this.updateAveragePace();
      this.checkSignalHealth();
      this.notify();
    }, 1000);
  }

  private stopUiTimer() {
    if (this.uiIntervalId != null) {
      clearInterval(this.uiIntervalId);
      this.uiIntervalId = null;
    }
  }
}
