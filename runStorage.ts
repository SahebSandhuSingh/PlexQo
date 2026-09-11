import AsyncStorage from '@react-native-async-storage/async-storage';
import { RunSummary } from './types';

const RUN_STORAGE_KEY = '@plexqo_run_recordings';

/**
 * Persists a completed run recording to local device storage.
 */
export async function saveRunRecording(summary: RunSummary): Promise<void> {
  try {
    const existing = await getStoredRunRecordings();
    const updated = [summary, ...existing];
    await AsyncStorage.setItem(RUN_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save run recording:', error);
  }
}

/**
 * Retrieves all stored run recordings from local device storage, newest first.
 */
export async function getStoredRunRecordings(): Promise<RunSummary[]> {
  try {
    const json = await AsyncStorage.getItem(RUN_STORAGE_KEY);
    if (!json) return [];
    return JSON.parse(json) as RunSummary[];
  } catch (error) {
    console.error('Failed to load run recordings:', error);
    return [];
  }
}

/**
 * Clears all stored run recordings from local device storage.
 */
export async function clearStoredRunRecordings(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RUN_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear run recordings:', error);
  }
}
