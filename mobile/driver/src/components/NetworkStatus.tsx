import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Banner, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNetwork, useSync } from '@/hooks';

export function NetworkStatus() {
  const { isConnected } = useNetwork();
  const { syncStatus } = useSync();

  if (isConnected && !syncStatus.isSyncing) {
    return null;
  }

  return (
    <View style={styles.container}>
      {!isConnected && (
        <Banner
          visible
          icon={({ size }: { size: number }) => (
            <MaterialCommunityIcons name="wifi-off" size={size} color="#f44336" />
          )}
          style={styles.offlineBanner}
        >
          <Text style={styles.offlineText}>
            Offline Mode - Changes will sync when connected
          </Text>
        </Banner>
      )}
      
      {syncStatus.isSyncing && (
        <Banner
          visible
          icon={({ size }: { size: number }) => (
            <MaterialCommunityIcons name="sync" size={size} color="#2196F3" />
          )}
          style={styles.syncBanner}
        >
          <Text style={styles.syncText}>Syncing data...</Text>
        </Banner>
      )}

      {syncStatus.pendingCount > 0 && !syncStatus.isSyncing && (
        <Banner
          visible
          icon={({ size }: { size: number }) => (
            <MaterialCommunityIcons name="cloud-upload" size={size} color="#FF9800" />
          )}
          style={styles.pendingBanner}
        >
          <Text style={styles.pendingText}>
            {syncStatus.pendingCount} items pending sync
          </Text>
        </Banner>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  offlineBanner: {
    backgroundColor: '#ffebee',
  },
  offlineText: {
    color: '#c62828',
    fontWeight: '600',
  },
  syncBanner: {
    backgroundColor: '#e3f2fd',
  },
  syncText: {
    color: '#1565c0',
    fontWeight: '600',
  },
  pendingBanner: {
    backgroundColor: '#fff3e0',
  },
  pendingText: {
    color: '#e65100',
    fontWeight: '600',
  },
});
