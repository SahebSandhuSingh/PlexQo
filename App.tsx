import React, { useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import { RunTrackingEngine } from './RunTrackingEngine';
import { LocationService } from './locationService';
import { StartScreen } from './StartScreen';
import { ActiveRunScreen } from './ActiveRunScreen';
import { SummaryScreen } from './SummaryScreen';
import { RunSummary } from './types';
import { saveRunRecording } from './runStorage';

type Screen = 'start' | 'active' | 'summary';

export default function App() {
  const [screen, setScreen] = useState<Screen>('start');
  const [lastSummary, setLastSummary] = useState<RunSummary | null>(null);

  // Stable instances across re-renders — created once, reused for the app's lifetime.
  const engineRef = useRef<RunTrackingEngine | null>(null);
  const locationServiceRef = useRef<LocationService | null>(null);
  if (!engineRef.current) engineRef.current = new RunTrackingEngine();
  if (!locationServiceRef.current) locationServiceRef.current = new LocationService();

  const engine = engineRef.current;
  const locationService = locationServiceRef.current;

  const handleStart = async () => {
    engine.reset();
    engine.start();
    await locationService.startUpdating((loc) => engine.ingest(loc));
    setScreen('active');
  };

  const handleFinish = async (summary: RunSummary) => {
    locationService.stopUpdating();
    await saveRunRecording(summary);
    setLastSummary(summary);
    setScreen('summary');
  };

  const handleDone = () => {
    engine.reset();
    setLastSummary(null);
    setScreen('start');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {screen === 'start' && (
        <StartScreen locationService={locationService} onStart={handleStart} />
      )}
      {screen === 'active' && <ActiveRunScreen engine={engine} onFinish={handleFinish} />}
      {screen === 'summary' && lastSummary && (
        <SummaryScreen summary={lastSummary} onDone={handleDone} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0F',
  },
});
