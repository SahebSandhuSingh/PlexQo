import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import MapView, { Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { RunSummary } from './types';

interface Props {
  summary: RunSummary;
  onDone: () => void;
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

export function SummaryScreen({ summary, onDone }: Props) {
  const hasRoute = summary.route.length > 1;
  const coordinates = summary.route.map((p) => ({
    latitude: p.latitude,
    longitude: p.longitude,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Run Complete</Text>

      {hasRoute && (
        <MapView
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          initialRegion={{
            latitude: coordinates[0].latitude,
            longitude: coordinates[0].longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Polyline coordinates={coordinates} strokeWidth={4} strokeColor="#3DDC84" />
        </MapView>
      )}
      {!hasRoute && (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>Not enough GPS data to draw a route</Text>
        </View>
      )}

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatDistanceKm(summary.totalDistanceMeters)}</Text>
          <Text style={styles.statLabel}>km</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatDuration(summary.totalDurationSeconds)}</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatPace(summary.averagePaceSecPerKm)}</Text>
          <Text style={styles.statLabel}>Avg Pace</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.doneButton}
        onPress={onDone}
        accessibilityRole="button"
        accessibilityLabel="Done"
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0F',
    padding: 24,
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 20,
  },
  map: {
    width: width - 48,
    height: 220,
    borderRadius: 16,
    marginBottom: 24,
  },
  mapPlaceholder: {
    width: width - 48,
    height: 220,
    borderRadius: 16,
    backgroundColor: '#1C1C22',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  mapPlaceholderText: {
    color: '#9A9AA5',
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    color: '#9A9AA5',
    fontSize: 13,
    marginTop: 4,
  },
  doneButton: {
    backgroundColor: '#3DDC84',
    paddingVertical: 16,
    paddingHorizontal: 64,
    borderRadius: 16,
  },
  doneButtonText: {
    color: '#0B0B0F',
    fontSize: 17,
    fontWeight: '700',
  },
});
