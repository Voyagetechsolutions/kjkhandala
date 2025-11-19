import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { tripService } from '../../services/tripService';
import Card from '../../components/Card';
import Button from '../../components/Button';
import TripCard from '../../components/TripCard';
import StatsCard from '../../components/StatsCard';
import { Trip } from '../../types';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../lib/constants';

export default function DashboardScreen() {
  const { driver } = useAuth();
  const navigation = useNavigation();
  const [todaysTrips, setTodaysTrips] = useState<Trip[]>([]);
  const [stats, setStats] = useState({
    tripsToday: 0,
    tripsCompleted: 0,
    passengersToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [driver?.id]);

  const loadDashboardData = async () => {
    if (!driver?.id) return;

    try {
      setLoading(true);
      const [trips, statistics] = await Promise.all([
        tripService.getTodaysTrips(driver.id),
        tripService.getTripStats(driver.id),
      ]);

      setTodaysTrips(trips);
      setStats(statistics);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleTripPress = (tripId: string) => {
    navigation.navigate('TripDetails' as never, { tripId } as never);
  };

  const currentTrip = todaysTrips.find(
    (t) => t.status === 'EN_ROUTE' || t.status === 'NOT_STARTED'
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.driverName}>
            Driver #{driver?.license_number || 'N/A'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Messages' as never)}
        >
          <Ionicons name="notifications-outline" size={24} color={COLORS.white} />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <StatsCard
          icon="calendar-outline"
          label="Trips Today"
          value={stats.tripsToday}
          color={COLORS.primary}
        />
        <StatsCard
          icon="checkmark-circle-outline"
          label="Completed"
          value={stats.tripsCompleted}
          color={COLORS.success}
        />
        <StatsCard
          icon="people-outline"
          label="Passengers"
          value={stats.passengersToday}
          color={COLORS.info}
        />
      </View>

      {/* Current Trip */}
      {currentTrip && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Trip</Text>
          <TripCard trip={currentTrip} onPress={() => handleTripPress(currentTrip.id)} />
          <Button
            title="Start Trip"
            onPress={() => handleTripPress(currentTrip.id)}
            style={styles.startButton}
          />
        </View>
      )}

      {/* Today's Trips */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Trips</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Trips' as never)}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <Card>
            <Text style={styles.emptyText}>Loading trips...</Text>
          </Card>
        ) : todaysTrips.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>No trips scheduled for today</Text>
          </Card>
        ) : (
          todaysTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onPress={() => handleTripPress(trip.id)}
            />
          ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('FuelLog' as never, { tripId: currentTrip?.id } as never)}
          >
            <Ionicons name="water-outline" size={32} color={COLORS.primary} />
            <Text style={styles.actionText}>Fuel Log</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('IncidentReport' as never, { tripId: currentTrip?.id } as never)}
          >
            <Ionicons name="warning-outline" size={32} color={COLORS.danger} />
            <Text style={styles.actionText}>Report Incident</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Wallet' as never)}
          >
            <Ionicons name="wallet-outline" size={32} color={COLORS.success} />
            <Text style={styles.actionText}>Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Profile' as never)}
          >
            <Ionicons name="person-outline" size={32} color={COLORS.info} />
            <Text style={styles.actionText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.primary,
  },
  greeting: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    opacity: 0.9,
  },
  driverName: {
    ...TYPOGRAPHY.h2,
    color: COLORS.white,
    marginTop: SPACING.xs,
  },
  card: {
    margin: SPACING.md,
  },
  cardTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  cardSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.md,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  section: {
    padding: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
  },
  seeAll: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    fontWeight: '600',
  },
  startButton: {
    marginTop: SPACING.md,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    padding: SPACING.lg,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  actionText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.primary,
    marginTop: SPACING.sm,
    fontWeight: '600',
  },
});
