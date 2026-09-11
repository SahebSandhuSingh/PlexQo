import { RunTrackingEngine } from './RunTrackingEngine';
import { RawLocation } from './types';

function makeLocation(
  lat: number,
  lon: number,
  secondsFromNow: number,
  accuracy = 5
): RawLocation {
  return {
    latitude: lat,
    longitude: lon,
    timestamp: Date.now() + secondsFromNow * 1000,
    accuracy,
  };
}

describe('RunTrackingEngine', () => {
  test('distance accumulates across valid points', () => {
    const engine = new RunTrackingEngine();
    engine.start();

    // ~111m apart (0.001 deg latitude ≈ 111m), 20s apart ≈ 5.5 m/s — plausible.
    engine.ingest(makeLocation(37.0, -122.0, -40));
    engine.ingest(makeLocation(37.001, -122.0, -20));

    expect(engine.totalDistanceMeters).toBeGreaterThan(100);
    expect(engine.totalDistanceMeters).toBeLessThan(120);
  });

  test('rejects implausible speed jump', () => {
    const engine = new RunTrackingEngine();
    engine.start();

    engine.ingest(makeLocation(37.0, -122.0, -10));
    // ~1.1km jump in 1 second — a GPS glitch, not a human runner.
    engine.ingest(makeLocation(37.01, -122.0, -9));

    expect(engine.totalDistanceMeters).toBeCloseTo(0, 1);
  });

  test('rejects low accuracy fixes', () => {
    const engine = new RunTrackingEngine();
    engine.start();

    engine.ingest(makeLocation(37.0, -122.0, -20, 5));
    engine.ingest(makeLocation(37.001, -122.0, -10, 200));

    expect(engine.totalDistanceMeters).toBeCloseTo(0, 1);
  });

  test('ignores jitter while stationary', () => {
    const engine = new RunTrackingEngine();
    engine.start();

    engine.ingest(makeLocation(37.0, -122.0, -10));
    // ~0.5m of jitter — below the minimum movement threshold.
    engine.ingest(makeLocation(37.000005, -122.0, -5));

    expect(engine.totalDistanceMeters).toBeLessThan(1);
  });

  test('finish is safe with near-zero distance (no divide-by-zero pace)', () => {
    const engine = new RunTrackingEngine();
    engine.start();
    const summary = engine.finish();

    expect(summary.averagePaceSecPerKm).toBeNull();
    expect(summary.totalDistanceMeters).toBeCloseTo(0, 1);
  });

  test('pause/resume transitions state correctly', () => {
    const engine = new RunTrackingEngine();
    engine.start();
    engine.pause();
    expect(engine.state).toBe('paused');
    engine.resume();
    expect(engine.state).toBe('active');
  });
});
