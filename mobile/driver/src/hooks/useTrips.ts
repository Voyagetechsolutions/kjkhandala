import { useState, useEffect, useCallback } from 'react';
import { driverQueries } from '@/services/supabase';
import { offlineStorage } from '@/services/storage';
import { useNetwork } from './useNetwork';
import type { Trip } from '@/types';

export function useTrips(shiftId: string | null) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isConnected } = useNetwork();

  const loadTrips = useCallback(async () => {
    if (!shiftId) return;

    setLoading(true);
    setError(null);

    try {
      if (isConnected) {
        const data = await driverQueries.getShiftTrips(shiftId);
        setTrips(data);
        await offlineStorage.saveTrips(data);
      } else {
        const cached = await offlineStorage.getTrips(shiftId);
        setTrips(cached);
      }
    } catch (err: any) {
      setError(err.message);
      try {
        const cached = await offlineStorage.getTrips(shiftId);
        setTrips(cached);
      } catch (cacheErr) {
        console.error('Cache load error:', cacheErr);
      }
    } finally {
      setLoading(false);
    }
  }, [shiftId, isConnected]);

  const updateTripStatus = useCallback(async (
    tripId: string, 
    status: string, 
    updates: any = {}
  ) => {
    try {
      if (isConnected) {
        await driverQueries.updateTripStatus(tripId, status, updates);
      } else {
        await offlineStorage.addToSyncQueue({
          action: 'update',
          table: 'trips',
          data: { id: tripId, status, updates },
        });
      }
      
      setTrips(prev => 
        prev.map(trip => 
          trip.id === tripId 
            ? { ...trip, status: status as any, ...updates } 
            : trip
        )
      );
    } catch (err: any) {
      throw new Error(err.message);
    }
  }, [isConnected]);

  const startTrip = useCallback(async (tripId: string) => {
    return updateTripStatus(tripId, 'in_progress', {
      actual_departure: new Date().toISOString(),
    });
  }, [updateTripStatus]);

  const completeTrip = useCallback(async (tripId: string) => {
    return updateTripStatus(tripId, 'completed', {
      actual_arrival: new Date().toISOString(),
    });
  }, [updateTripStatus]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  return {
    trips,
    loading,
    error,
    refresh: loadTrips,
    updateTripStatus,
    startTrip,
    completeTrip,
  };
}
