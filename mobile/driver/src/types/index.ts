export * from './database';

export interface AuthState {
  user: any | null;
  driver: any | null;
  session: any | null;
  loading: boolean;
}

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
}

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime?: Date;
  pendingCount: number;
  error?: string;
}
