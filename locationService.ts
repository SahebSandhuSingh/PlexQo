import * as Location from 'expo-location';
import { RawLocation } from './types';

export type PermissionState = 'notDetermined' | 'deniedOrRestricted' | 'authorized';

/**
 * Thin wrapper around expo-location. Deliberately does no filtering or
 * business logic itself — that all lives in RunTrackingEngine, which is
 * what makes the engine testable without a device or emulator GPS.
 */
export class LocationService {
  private subscription: Location.LocationSubscription | null = null;

  async requestPermission(): Promise<PermissionState> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === Location.PermissionStatus.GRANTED) return 'authorized';
    if (status === Location.PermissionStatus.DENIED) return 'deniedOrRestricted';
    return 'notDetermined';
  }

  async startUpdating(onLocation: (loc: RawLocation) => void): Promise<void> {
    this.subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 0, // we filter in software (RunTrackingEngine), not here
      },
      (update) => {
        onLocation({
          latitude: update.coords.latitude,
          longitude: update.coords.longitude,
          timestamp: update.timestamp,
          accuracy: update.coords.accuracy,
        });
      }
    );
  }

  stopUpdating(): void {
    this.subscription?.remove();
    this.subscription = null;
  }
}
