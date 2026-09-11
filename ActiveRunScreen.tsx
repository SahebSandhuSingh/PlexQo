import React, { useSyncExternalStore } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RunTrackingEngine } from './RunTrackingEngine';
import { RunSummary } from './types';

interface Props {
  engine: RunTrackingEngine;
  onFinish: (summary: RunSummary) => void;
}

function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

function formatDistanceKm(meters: number): string {
  return (meters / 1000).toFixed(2);
}

function formatPace(secPerKm: number | null): string {
  if (secPerKm == null || !isFinite(secPerKm)) return '--:--';
  const totalSec = Math.round(secPerKm);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')} /km`;
}

export function ActiveRunScreen({ engine, onFinish }: Props) {
  // Re-render whenever the engine notifies of any state change (ticks, pause/resume, GPS fixes).
  useSyncExternalStore(
    (onChange) => engine.subscribe(onChange),
    () => engine.version
  );

  const isPaused = engine.state === 'paused';

  const handlePauseResume = () => {
    if (isPaused) {
      engine.resume();
    } else {
      engine.pause();
    }
  };

  const handleFinish = () => {
    const summary = engine.finish();
    onFinish(summary);
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, isPaused ? styles.statusDotPaused : styles.statusDotActive]} />
        <Text style={styles.statusText}>{isPaused ? 'Paused' : 'Active'}</Text>
        {engine.isGPSSignalWeak && (
          <Text style={styles.gpsWarning}>GPS signal weak</Text>
        )}
      </View>

      <View style={styles.metricsBlock}>
        <Text style={styles.distanceValue}>{formatDistanceKm(engine.totalDistanceMeters)}</Text>
        <Text style={styles.distanceLabel}>km</Text>
      </View>

      <View style={styles.secondaryMetrics}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{formatDuration(engine.elapsedTimeSeconds)}</Text>
          <Text style={styles.metricLabel}>Duration</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{formatPace(engine.averagePaceSecPerKm)}</Text>
          <Text style={styles.metricLabel}>Avg Pace</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.pauseResumeButton}
          onPress={handlePauseResume}
          accessibilityRole="button"
          accessibilityLabel={isPaused ? 'Resume Run' : 'Pause Run'}
        >
          <Text style={styles.pauseResumeText}>{isPaused ? 'Resume' : 'Pause'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.finishButton}
          onPress={handleFinish}
          accessibilityRole="button"
          accessibilityLabel="Finish Run"
        >
          <Text style={styles.finishText}>Finish</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0F',
    padding: 24,
    justifyContent: 'space-between',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusDotActive: { backgroundColor: '#3DDC84' },
  statusDotPaused: { backgroundColor: '#F5A623' },
  statusText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  gpsWarning: {
    color: '#FF6B6B',
    fontSize: 13,
    marginLeft: 12,
  },
  metricsBlock: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  distanceValue: {
    color: '#FFFFFF',
    fontSize: 88,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  distanceLabel: {
    color: '#9A9AA5',
    fontSize: 18,
    marginTop: -8,
  },
  secondaryMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  metricLabel: {
    color: '#9A9AA5',
    fontSize: 13,
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  pauseResumeButton: {
    flex: 1,
    marginRight: 12,
    backgroundColor: '#1C1C22',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  pauseResumeText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  finishButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  finishText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
