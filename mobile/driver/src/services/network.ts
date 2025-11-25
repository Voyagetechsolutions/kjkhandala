import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { syncService } from './sync';

export class NetworkService {
  private listeners: Array<(isConnected: boolean) => void> = [];
  private isConnected = false;
  private unsubscribe: (() => void) | null = null;

  // Initialize network monitoring
  init() {
    this.unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const wasConnected = this.isConnected;
      this.isConnected = state.isConnected ?? false;

      // Notify listeners
      this.listeners.forEach(listener => listener(this.isConnected));

      // Auto-sync when connection is restored
      if (!wasConnected && this.isConnected) {
        console.log('Connection restored, starting auto-sync...');
        this.autoSync();
      }
    });
  }

  // Clean up
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  // Subscribe to network changes
  onChange(callback: (isConnected: boolean) => void) {
    this.listeners.push(callback);
    // Immediately call with current status
    callback(this.isConnected);

    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  // Get current status
  async getStatus() {
    const state = await NetInfo.fetch();
    return {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable ?? false,
      type: state.type,
    };
  }

  // Auto-sync when connection is restored
  private async autoSync() {
    try {
      await syncService.syncAll();
      console.log('Auto-sync completed successfully');
    } catch (error) {
      console.error('Auto-sync failed:', error);
    }
  }
}

export const networkService = new NetworkService();
