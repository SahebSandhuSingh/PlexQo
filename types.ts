export type RunState = 'idle' | 'active' | 'paused' | 'finished';

/** A raw GPS fix as delivered by the location layer, before any filtering. */
export interface RawLocation {
  latitude: number;
  longitude: number;
  timestamp: number; // ms since epoch
  accuracy: number | null; // meters; null/negative means "unknown, reject"
}

/** A single accepted, filtered GPS sample kept as part of the route. */
export interface RunPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  horizontalAccuracy: number;
}

/** Shown on the Run Summary screen after finishing. */
export interface RunSummary {
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  averagePaceSecPerKm: number | null; // null if distance is ~0 (avoid divide-by-zero)
  route: RunPoint[];
  finishedAt: number;
}
