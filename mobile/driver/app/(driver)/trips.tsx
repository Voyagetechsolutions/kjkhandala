import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth-store';
import { useShifts } from '@/hooks';
import { NetworkStatus } from '@/components';
import { isToday } from 'date-fns';

export default function TripsScreen() {
  const router = useRouter();
  const { driver } = useAuthStore();
  const { shifts, loading, refresh } = useShifts(driver?.id || null);
  const [refreshing, setRefreshing] = useState(false);

  const activeShift = shifts.find(shift => shift.status === 'active');
  const todayShift = shifts.find(shift => 
    isToday(new Date(shift.start_time)) && shift.status !== 'completed'
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const currentShift = activeShift || todayShift;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <NetworkStatus />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {!currentShift ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="map-marker-off" size={64} color="#999" />
            <Text variant="headlineSmall" style={styles.emptyTitle}>
              No Active Shift
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Start a shift to view and manage trips
            </Text>
          </View>
        ) : (
          <View style={styles.content}>
            <Card style={styles.shiftCard}>
              <Card.Content>
                <Text variant="titleMedium">Current Shift</Text>
                <Text variant="bodyLarge" style={styles.busNumber}>
                  Bus: {currentShift.bus?.bus_number}
                </Text>
                <Text variant="bodyMedium" style={styles.routeName}>
                  Route: {currentShift.route?.route_name}
                </Text>
              </Card.Content>
            </Card>

            <Text variant="titleLarge" style={styles.sectionTitle}>
              Trips for this shift will appear here
            </Text>
            <Text variant="bodyMedium" style={styles.infoText}>
              This feature requires integration with the trip management system.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  emptyText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#999',
  },
  content: {
    padding: 16,
  },
  shiftCard: {
    marginBottom: 24,
    elevation: 2,
  },
  busNumber: {
    fontWeight: 'bold',
    color: '#1976D2',
    marginTop: 8,
  },
  routeName: {
    color: '#666',
    marginTop: 4,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    color: '#666',
  },
});
