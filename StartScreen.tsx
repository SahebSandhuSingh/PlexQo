import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LocationService, PermissionState } from './locationService';

interface Props {
  locationService: LocationService;
  onStart: () => void;
}

export function StartScreen({ locationService, onStart }: Props) {
  const [permission, setPermission] = useState<PermissionState>('notDetermined');
  const [requesting, setRequesting] = useState(false);

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
      <Text style={styles.title}>RUN</Text>
      <Text style={styles.subtitle}>Track your run — distance, time, and pace.</Text>

      {permission === 'deniedOrRestricted' && (
        <Text style={styles.errorText}>
          Location access is off. Enable it in Settings to track a run.
        </Text>
      )}

      <TouchableOpacity
        style={styles.startButton}
        onPress={handleStart}
        disabled={requesting}
        accessibilityRole="button"
        accessibilityLabel="Start Run"
      >
        <Text style={styles.startButtonText}>
          {requesting ? 'Getting location…' : 'Start Run'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0F',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 15,
    color: '#9A9AA5',
    marginTop: 8,
    marginBottom: 48,
    textAlign: 'center',
  },
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  startButton: {
    backgroundColor: '#3DDC84',
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: '#0B0B0F',
    fontSize: 18,
    fontWeight: '700',
  },
});
