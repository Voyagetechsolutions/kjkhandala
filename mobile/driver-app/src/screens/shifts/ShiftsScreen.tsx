import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { tripService } from '../../services/tripService';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { COLORS, SPACING, TYPOGRAPHY } from '../../lib/constants';
import { safeFormatDate } from '../../lib/dateUtils';

interface Shift {
  id: string;
  trip_id: string;
  bus_registration: string;
  route_origin: string;
  route_destination: string;
  scheduled_departure: string;
  scheduled_arrival: string;
  status: string;
  trip_number: string;
}

export default function ShiftsScreen({ navigation }: any) {
  const { driver } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'today' | 'upcoming' | 'all'>('today');

  useEffect(() => {
    loadShifts();
  }, [driver?.id, filter]);

  const loadShifts = async () => {
    if (!driver?.id) return;

    try {
      setLoading(true);
      const trips = await tripService.getDriverTrips(driver.id);
      
      // Transform trips into shifts
      const shiftsData = trips.map(trip => ({
        id: trip.id,
        trip_id: trip.id,
        bus_registration: trip.bus?.registration_number || 'N/A',
        route_origin: trip.route?.origin || 'N/A',
        route_destination: trip.route?.destination || 'N/A',
        scheduled_departure: trip.scheduled_departure,
        scheduled_arrival: trip.scheduled_arrival,
        status: trip.status,
        trip_number: trip.trip_number,
      }));

      // Filter based on selected filter
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let filtered = shiftsData;
      if (filter === 'today') {
        filtered = shiftsData.filter(shift => {
          const shiftDate = new Date(shift.scheduled_departure);
          return shiftDate >= today && shiftDate < tomorrow;
        });
      } else if (filter === 'upcoming') {
        filtered = shiftsData.filter(shift => {
          const shiftDate = new Date(shift.scheduled_departure);
          return shiftDate >= now;
        });
      }

      setShifts(filtered);
    } catch (error) {
      console.error('Error loading shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadShifts();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
      case 'SCHEDULED':
        return COLORS.info;
      case 'EN_ROUTE':
      case 'IN_PROGRESS':
        return COLORS.warning;
      case 'COMPLETED':
        return COLORS.success;
      case 'CANCELLED':
        return COLORS.danger;
      default:
        return COLORS.gray[500];
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
        return 'Not Started';
      case 'SCHEDULED':
        return 'Scheduled';
      case 'EN_ROUTE':
        return 'En Route';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const renderShiftCard = (shift: Shift) => {
    const departureDate = new Date(shift.scheduled_departure);
    const isToday = new Date().toDateString() === departureDate.toDateString();

    return (
      <TouchableOpacity
        key={shift.id}
        onPress={() => navigation.navigate('TripDetails', { tripId: shift.trip_id })}
      >
        <Card style={styles.shiftCard}>
          <View style={styles.shiftHeader}>
            <View style={styles.shiftInfo}>
              <Text style={styles.tripNumber}>{shift.trip_number}</Text>
              {isToday && (
                <Badge label="TODAY" variant="warning" style={styles.todayBadge} />
              )}
            </View>
            <Badge
              label={getStatusLabel(shift.status)}
              variant={
                shift.status === 'COMPLETED' ? 'success' :
                shift.status === 'EN_ROUTE' || shift.status === 'IN_PROGRESS' ? 'warning' :
                shift.status === 'CANCELLED' ? 'danger' : 'info'
              }
            />
          </View>

          <View style={styles.routeContainer}>
            <View style={styles.routePoint}>
              <View style={styles.routeDot} />
              <View>
                <Text style={styles.routeLabel}>From</Text>
                <Text style={styles.routeLocation}>{shift.route_origin}</Text>
                <Text style={styles.routeTime}>
                  {safeFormatDate(shift.scheduled_departure, 'HH:mm')}
                </Text>
              </View>
            </View>

            <View style={styles.routeLine} />

            <View style={styles.routePoint}>
              <View style={[styles.routeDot, styles.routeDotEnd]} />
              <View>
                <Text style={styles.routeLabel}>To</Text>
                <Text style={styles.routeLocation}>{shift.route_destination}</Text>
                <Text style={styles.routeTime}>
                  {safeFormatDate(shift.scheduled_arrival, 'HH:mm')}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.shiftFooter}>
            <View style={styles.busInfo}>
              <Ionicons name="bus" size={16} color={COLORS.gray[600]} />
              <Text style={styles.busText}>{shift.bus_registration}</Text>
            </View>
            <Text style={styles.dateText}>
              {safeFormatDate(shift.scheduled_departure, 'EEE, MMM d, yyyy')}
            </Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading shifts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'today' && styles.filterTabActive]}
          onPress={() => setFilter('today')}
        >
          <Text style={[styles.filterText, filter === 'today' && styles.filterTextActive]}>
            Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'upcoming' && styles.filterTabActive]}
          onPress={() => setFilter('upcoming')}
        >
          <Text style={[styles.filterText, filter === 'upcoming' && styles.filterTextActive]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Shifts</Text>
          <Text style={styles.subtitle}>
            {shifts.length} {filter === 'today' ? "shift(s) today" : filter === 'upcoming' ? "upcoming shift(s)" : "total shift(s)"}
          </Text>
        </View>

        {shifts.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={64} color={COLORS.gray[400]} />
            <Text style={styles.emptyText}>No shifts found</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'today' 
                ? "You don't have any shifts scheduled for today"
                : "No shifts available"}
            </Text>
          </Card>
        ) : (
          <View style={styles.shiftsContainer}>
            {shifts.map(renderShiftCard)}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    ...TYPOGRAPHY.body,
    color: COLORS.gray[600],
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  filterTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: SPACING.xs,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray[600],
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray[600],
  },
  shiftsContainer: {
    padding: SPACING.md,
  },
  shiftCard: {
    marginBottom: SPACING.md,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  shiftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  tripNumber: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  todayBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  routeContainer: {
    marginBottom: SPACING.md,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.md,
    marginTop: 4,
  },
  routeDotEnd: {
    backgroundColor: COLORS.success,
  },
  routeLine: {
    width: 2,
    height: 30,
    backgroundColor: COLORS.gray[300],
    marginLeft: 5,
    marginVertical: -SPACING.sm,
  },
  routeLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray[600],
    marginBottom: 2,
  },
  routeLocation: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  routeTime: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray[600],
  },
  shiftFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  busInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  busText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray[700],
    fontWeight: '500',
  },
  dateText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray[600],
  },
  emptyCard: {
    margin: SPACING.lg,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.gray[600],
    marginTop: SPACING.md,
  },
  emptySubtext: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray[500],
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});
