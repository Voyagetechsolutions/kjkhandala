import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, isToday } from 'date-fns';
import { useAuthStore } from '@/store/auth-store';
import { useShifts, useSync } from '@/hooks';
import { NetworkStatus, ShiftCard } from '@/components';
import type { Shift } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  const { driver } = useAuthStore();
  const { shifts, loading, refresh } = useShifts(driver?.id || null);
  const { sync, syncStatus } = useSync();
  const [refreshing, setRefreshing] = useState(false);

  const todayShift = shifts.find(shift => 
    isToday(new Date(shift.start_time)) && shift.status !== 'completed'
  );

  const upcomingShifts = shifts.filter(shift => 
    !isToday(new Date(shift.start_time)) && shift.status === 'scheduled'
  ).slice(0, 3);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleSync = async () => {
    await sync();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <NetworkStatus />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Welcome Card */}
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <View style={styles.welcomeHeader}>
              <MaterialCommunityIcons name="account-circle" size={48} color="#1976D2" />
              <View style={styles.welcomeText}>
                <Text variant="headlineSmall">Welcome back,</Text>
                <Text variant="titleLarge" style={styles.driverName}>
                  {driver?.name || 'Driver'}
                </Text>
              </View>
            </View>
            <Text variant="bodyMedium" style={styles.date}>
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </Text>
          </Card.Content>
        </Card>

        {/* Today's Shift */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Today's Shift
          </Text>
          {todayShift ? (
            <ShiftCard
              shift={todayShift}
              onPress={() => console.log('View shift:', todayShift.id)}
            />
          ) : (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <MaterialCommunityIcons name="calendar-blank" size={48} color="#999" />
                <Text variant="bodyLarge" style={styles.emptyText}>
                  No shift scheduled for today
                </Text>
              </Card.Content>
            </Card>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Quick Actions
          </Text>
          <View style={styles.actionsGrid}>
            <Card style={styles.actionCard} onPress={() => router.push('/shifts')}>
              <Card.Content style={styles.actionContent}>
                <MaterialCommunityIcons name="calendar-clock" size={32} color="#1976D2" />
                <Text variant="labelLarge" style={styles.actionText}>
                  View Shifts
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.actionCard} onPress={() => router.push('/trips')}>
              <Card.Content style={styles.actionContent}>
                <MaterialCommunityIcons name="map-marker-path" size={32} color="#1976D2" />
                <Text variant="labelLarge" style={styles.actionText}>
                  View Trips
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.actionCard} onPress={handleSync}>
              <Card.Content style={styles.actionContent}>
                <MaterialCommunityIcons 
                  name={syncStatus.isSyncing ? "sync" : "cloud-sync"} 
                  size={32} 
                  color="#1976D2" 
                />
                <Text variant="labelLarge" style={styles.actionText}>
                  Sync Data
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.actionCard} onPress={() => console.log('Report issue')}>
              <Card.Content style={styles.actionContent}>
                <MaterialCommunityIcons name="alert-circle" size={32} color="#f44336" />
                <Text variant="labelLarge" style={styles.actionText}>
                  Report Issue
                </Text>
              </Card.Content>
            </Card>
          </View>
        </View>

        {/* Upcoming Shifts */}
        {upcomingShifts.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Upcoming Shifts
            </Text>
            {upcomingShifts.map(shift => (
              <ShiftCard
                key={shift.id}
                shift={shift}
                onPress={() => console.log('View shift:', shift.id)}
              />
            ))}
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
  welcomeCard: {
    margin: 16,
    elevation: 2,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  welcomeText: {
    marginLeft: 16,
    flex: 1,
  },
  driverName: {
    fontWeight: 'bold',
    color: '#1976D2',
  },
  date: {
    color: '#666',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  emptyCard: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: '#999',
    marginTop: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  actionCard: {
    width: '48%',
    margin: 8,
    elevation: 2,
  },
  actionContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  actionText: {
    marginTop: 8,
    textAlign: 'center',
  },
});
