import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';

export const locationService = {
  // Request location permissions
  requestPermissions: async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  },

  // Get current location
  getCurrentLocation: async () => {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  },

  // Start tracking trip
  startTracking: async (tripId: string, driverId: string) => {
    const hasPermission = await locationService.requestPermissions();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    // Update trip status to tracking
    const { error } = await supabase
      .from('trips')
      .update({
        tracking_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tripId);

    if (error) throw error;
  },

  // Stop tracking trip
  stopTracking: async (tripId: string) => {
    const { error } = await supabase
      .from('trips')
      .update({
        tracking_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tripId);

    if (error) throw error;
  },

  // Update trip location
  updateTripLocation: async (
    tripId: string,
    latitude: number,
    longitude: number
  ) => {
    const { error } = await supabase
      .from('trips')
      .update({
        current_latitude: latitude,
        current_longitude: longitude,
        last_location_update: new Date().toISOString(),
      })
      .eq('id', tripId);

    if (error) throw error;
  },

  // Watch position (for real-time tracking)
  watchPosition: async (
    callback: (location: { latitude: number; longitude: number }) => void
  ) => {
    return await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 30000, // 30 seconds
        distanceInterval: 100, // 100 meters
      },
      (location) => {
        callback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    );
  },
};
