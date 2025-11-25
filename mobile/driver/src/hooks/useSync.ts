import { useState, useEffect, useCallback } from 'react';
import { syncService } from '@/services/sync';
import type { SyncStatus } from '@/types';

export function useSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    pendingCount: 0,
  });

  useEffect(() => {
    const unsubscribe = syncService.onSyncStatusChange((status) => {
      setSyncStatus(status);
    });

    return unsubscribe;
  }, []);

  const sync = useCallback(async () => {
    return await syncService.syncAll();
  }, []);

  const syncShifts = useCallback(async (driverId: string) => {
    return await syncService.syncShifts(driverId);
  }, []);

  const syncTrips = useCallback(async (shiftId: string) => {
    return await syncService.syncTrips(shiftId);
  }, []);

  const syncManifest = useCallback(async (tripId: string) => {
    return await syncService.syncManifest(tripId);
  }, []);

  return {
    syncStatus,
    sync,
    syncShifts,
    syncTrips,
    syncManifest,
  };
}
