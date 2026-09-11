import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LocationService, PermissionState } from './locationService';
import { getStoredRunRecordings } from './runStorage';
import { RunSummary } from './types';

interface Props {
  locationService: LocationService;
  onStart: () => void;
}

function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(m)}:${pad(sec)}`;
}

function formatPace(secPerKm: number | null): string {
  if (secPerKm == null || !isFinite(secPerKm)) return '--:--';
  const totalSec = Math.round(secPerKm);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')} /km`;
}

export function StartScreen({ locationService, onStart }: Props) {
  const [permission, setPermission] = useState<PermissionState>('notDetermined');
  const [requesting, setRequesting] = useState(false);
  const [recentRun, setRecentRun] = useState<RunSummary | null>(null);

  useEffect(() => {
    getStoredRunRecordings().then((runs) => {
      if (runs && runs.length > 0) {
        setRecentRun(runs[0]);
      }
    });
  }, []);

  const handleStart = async () => {
    setRequesting(true);
    const result = await locationService.requestPermission();
    setPermission(result);
    setRequesting(false);
    if (result === 'authorized') {
      onStart();
    }
  };

  return (
    <View style={styles.container}>
      {/* Subtle geometric background track contours */}
      <View pointerEvents="none" style={styles.backgroundContourContainer}>
        <View style={[styles.contourRing, styles.ringLarge]} />
        <View style={[styles.contourRing, styles.ringMedium]} />
        <View style={[styles.contourRing, styles.ringSmall]} />
      </View>

      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.title}>RUN</Text>
        <Text style={styles.subtitle}>Precision telemetry, duration, and pace</Text>

        {permission === 'deniedOrRestricted' && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              Location access is required. Please enable it in Settings to track your run.
            </Text>
          </View>
        )}
      </View>

      {/* Center Hero — Paracetamol Pill Button with Ambient Halo */}
      <View style={styles.heroCenter}>
        <View style={styles.buttonHalo} />
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStart}
          disabled={requesting}
          accessibilityRole="button"
          accessibilityLabel="Start Run"
          activeOpacity={0.88}
        >
          <Text style={styles.startButtonText}>
            {requesting ? 'Locating...' : 'Start Run'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Information Card */}
      <View style={styles.bottomCard}>
        {recentRun ? (
          <>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>LATEST SESSION</Text>
              <Text style={styles.cardTimestamp}>
                {new Date(recentRun.finishedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statColumn}>
                <Text style={styles.statValue}>
                  {(recentRun.totalDistanceMeters / 1000).toFixed(2)}
                </Text>
                <Text style={styles.statUnit}>km</Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statColumn}>
                <Text style={styles.statValue}>
                  {formatDuration(recentRun.totalDurationSeconds)}
                </Text>
                <Text style={styles.statUnit}>time</Text>
                <Text style={styles.statLabel}>Duration</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statColumn}>
                <Text style={styles.statValue}>
                  {formatPace(recentRun.averagePaceSecPerKm).replace(' /km', '')}
                </Text>
                <Text style={styles.statUnit}>/km</Text>
                <Text style={styles.statLabel}>Avg Pace</Text>
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>RUN ENGINE</Text>
              <Text style={styles.cardTimestamp}>STANDBY</Text>
            </View>
            <View style={styles.specsRow}>
              <View style={styles.specItem}>
                <Text style={styles.specValue}>High Precision</Text>
                <Text style={styles.specLabel}>GPS Tracking</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specValue}>Jitter Filter</Text>
                <Text style={styles.specLabel}>Noise Rejection</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specValue}>Polyline</Text>
                <Text style={styles.specLabel}>Route Map</Text>
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 28,
  },
  backgroundContourContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  contourRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
  },
  ringLarge: {
    width: width * 1.5,
    height: width * 1.5,
    borderColor: 'rgba(203, 213, 225, 0.45)',
  },
  ringMedium: {
    width: width * 1.08,
    height: width * 1.08,
    borderColor: 'rgba(203, 213, 225, 0.65)',
  },
  ringSmall: {
    width: width * 0.72,
    height: width * 0.72,
    borderColor: 'rgba(203, 213, 225, 0.85)',
  },
  header: {
    alignItems: 'center',
    width: '100%',
    marginTop: 12,
  },
  title: {
    fontSize: 44,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },
  errorBox: {
    marginTop: 16,
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    width: '100%',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  heroCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  buttonHalo: {
    position: 'absolute',
    width: 270,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
  },
  startButton: {
    backgroundColor: '#10B981',
    minWidth: 230,
    height: 64,
    borderRadius: 32,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 5,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  bottomCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 18,
    paddingHorizontal: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardTitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cardTimestamp: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  statUnit: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: -2,
  },
  statLabel: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E2E8F0',
  },
  specsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  specItem: {
    flex: 1,
    alignItems: 'center',
  },
  specValue: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  specLabel: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
});
