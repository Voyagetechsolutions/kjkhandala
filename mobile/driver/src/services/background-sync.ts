import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { syncService } from './sync';

const BACKGROUND_SYNC_TASK = 'background-sync-task';

// Define the background task
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    console.log('Background sync task started');
    const result = await syncService.syncAll();
    
    if (result.success) {
      console.log('Background sync completed successfully');
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } else {
      console.error('Background sync failed:', result.error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  } catch (error) {
    console.error('Background sync error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export const backgroundSyncService = {
  // Register background sync task
  async register() {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
      
      if (!isRegistered) {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
          minimumInterval: 15 * 60, // 15 minutes
          stopOnTerminate: false,
          startOnBoot: true,
        });
        console.log('Background sync task registered');
      }
    } catch (error) {
      console.error('Failed to register background sync:', error);
    }
  },

  // Unregister background sync task
  async unregister() {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
      console.log('Background sync task unregistered');
    } catch (error) {
      console.error('Failed to unregister background sync:', error);
    }
  },

  // Check if task is registered
  async isRegistered() {
    return await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
  },

  // Get task status
  async getStatus() {
    const status = await BackgroundFetch.getStatusAsync();
    return {
      available: status === BackgroundFetch.BackgroundFetchStatus.Available,
      restricted: status === BackgroundFetch.BackgroundFetchStatus.Restricted,
      denied: status === BackgroundFetch.BackgroundFetchStatus.Denied,
    };
  },
};
