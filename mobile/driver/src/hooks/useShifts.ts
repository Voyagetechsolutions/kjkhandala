import { useState, useEffect, useCallback } from 'react';
import { driverQueries } from '@/services/supabase';
import { offlineStorage } from '@/services/storage';
import { useNetwork } from './useNetwork';
import type { Shift } from '@/types';

export function useShifts(driverId: string | null) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isConnected } = useNetwork();

  const loadShifts = useCallback(async () => {
    if (!driverId) return;

    setLoading(true);
    setError(null);

    try {
      if (isConnected) {
        // Fetch from server
        const data = await driverQueries.getDriverShifts(driverId);
        setShifts(data);
        // Cache for offline use
        await offlineStorage.saveShifts(data);
      } else {
        // Load from cache
        const cached = await offlineStorage.getShifts(driverId);
        setShifts(cached);
      }
    } catch (err: any) {
      setError(err.message);
      // Try cache on error
      try {
        const cached = await offlineStorage.getShifts(driverId);
        setShifts(cached);
      } catch (cacheErr) {
        console.error('Cache load error:', cacheErr);
      }
    } finally {
      setLoading(false);
    }
  }, [driverId, isConnected]);

  const updateShiftStatus = useCallback(async (shiftId: string, status: string) => {
    try {
      if (isConnected) {
        await driverQueries.updateShiftStatus(shiftId, status);
      } else {
        // Queue for sync
        await offlineStorage.addToSyncQueue({
          action: 'update',
          table: 'shifts',
          data: { id: shiftId, status },
        });
      }
      
      // Update local state
      setShifts(prev => 
        prev.map(shift => 
          shift.id === shiftId ? { ...shift, status: status as any } : shift
        )
      );
    } catch (err: any) {
      throw new Error(err.message);
    }
  }, [isConnected]);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  return {
    shifts,
    loading,
    error,
    refresh: loadShifts,
    updateShiftStatus,
  };
}
