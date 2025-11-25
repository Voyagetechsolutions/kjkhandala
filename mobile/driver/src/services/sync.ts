import { supabase, driverQueries } from './supabase';
import { offlineStorage } from './storage';
import type { SyncQueueItem } from '@/types';

export class SyncService {
  private isSyncing = false;
  private syncCallbacks: Array<(status: any) => void> = [];

  // Subscribe to sync status updates
  onSyncStatusChange(callback: (status: any) => void) {
    this.syncCallbacks.push(callback);
    return () => {
      this.syncCallbacks = this.syncCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyStatusChange(status: any) {
    this.syncCallbacks.forEach(cb => cb(status));
  }

  // Main sync function
  async syncAll(): Promise<{ success: boolean; error?: string }> {
    if (this.isSyncing) {
      return { success: false, error: 'Sync already in progress' };
    }

    this.isSyncing = true;
    this.notifyStatusChange({ isSyncing: true, error: null });

    try {
      // Get all pending items from sync queue
      const queue = await offlineStorage.getSyncQueue();
      
      if (queue.length === 0) {
        this.isSyncing = false;
        this.notifyStatusChange({ 
          isSyncing: false, 
          lastSyncTime: new Date(),
          pendingCount: 0 
        });
        return { success: true };
      }

      // Process each item in the queue
      let successCount = 0;
      let errorCount = 0;

      for (const item of queue) {
        try {
          await this.processSyncItem(item);
          await offlineStorage.markSynced(item.id);
          successCount++;
        } catch (error: any) {
          console.error('Sync item error:', error);
          await offlineStorage.markSyncError(item.id, error.message);
          errorCount++;
        }
      }

      // Clean up synced items
      await offlineStorage.clearSyncQueue();

      this.isSyncing = false;
      this.notifyStatusChange({
        isSyncing: false,
        lastSyncTime: new Date(),
        pendingCount: errorCount,
        error: errorCount > 0 ? `${errorCount} items failed to sync` : null,
      });

      return { 
        success: errorCount === 0,
        error: errorCount > 0 ? `${errorCount} items failed to sync` : undefined,
      };
    } catch (error: any) {
      this.isSyncing = false;
      this.notifyStatusChange({
        isSyncing: false,
        error: error.message,
      });
      return { success: false, error: error.message };
    }
  }

  // Process individual sync item
  private async processSyncItem(item: SyncQueueItem) {
    const { action, table, data } = item;

    switch (table) {
      case 'shifts':
        if (action === 'update') {
          await driverQueries.updateShiftStatus(data.id, data.status);
        }
        break;

      case 'trips':
        if (action === 'update') {
          await driverQueries.updateTripStatus(data.id, data.status, data.updates);
        }
        break;

      case 'manifest':
        if (action === 'update') {
          await driverQueries.checkInPassenger(data.id);
        }
        break;

      case 'trip_logs':
        if (action === 'create') {
          await driverQueries.createTripLog(data);
        }
        break;

      case 'issues':
        if (action === 'create') {
          await driverQueries.createIssue(data);
        }
        break;

      default:
        throw new Error(`Unknown table: ${table}`);
    }
  }

  // Sync specific data types
  async syncShifts(driverId: string) {
    try {
      const shifts = await driverQueries.getDriverShifts(driverId);
      await offlineStorage.saveShifts(shifts);
      return { success: true, data: shifts };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async syncTrips(shiftId: string) {
    try {
      const trips = await driverQueries.getShiftTrips(shiftId);
      await offlineStorage.saveTrips(trips);
      return { success: true, data: trips };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async syncManifest(tripId: string) {
    try {
      const manifest = await driverQueries.getTripManifest(tripId);
      await offlineStorage.saveManifest(manifest);
      return { success: true, data: manifest };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const syncService = new SyncService();
