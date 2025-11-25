import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

interface RouteFrequency {
  id: string;
  route_id: string;
  departure_time: string;
  frequency_type: string;
  days_of_week: number[];
  fare_per_seat: number;
  active: boolean;
  routes?: {
    origin: string;
    destination: string;
    duration_hours: number;
  };
  buses?: {
    name: string;
    registration_number: string;
    bus_type: string;
  };
}

const DeparturesScreen = () => {
  const [departures, setDepartures] = useState<RouteFrequency[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDepartures();
  }, []);

  const loadDepartures = async () => {
    try {
      setLoading(true);

      // Fetch active route frequencies
      const { data: frequencies, error: freqError } = await supabase
        .from('route_frequencies')
        .select('*')
        .eq('active', true)
        .order('departure_time');

      if (freqError) throw freqError;

      if (!frequencies || frequencies.length === 0) {
        setDepartures([]);
        return;
      }

      // Get unique route and bus IDs
      const routeIds = [...new Set(frequencies.map((f) => f.route_id).filter(Boolean))];
      const busIds = [...new Set(frequencies.map((f) => f.bus_id).filter(Boolean))];

      // Fetch routes and buses
      const [routesRes, busesRes] = await Promise.all([
        routeIds.length > 0
          ? supabase
              .from('routes')
              .select('id, origin, destination, duration_hours')
              .in('id', routeIds)
          : { data: [] },
        busIds.length > 0
          ? supabase
              .from('buses')
              .select('id, registration_number, name, bus_type')
              .in('id', busIds)
          : { data: [] },
      ]);

      // Create maps for quick lookup
      const routesMap = new Map(
        routesRes.data?.map((r: any) => [r.id, r] as const) || []
      );
      const busesMap = new Map(
        busesRes.data?.map((b: any) => [b.id, b] as const) || []
      );

      // Combine data
      const enrichedDepartures = frequencies.map((freq) => ({
        ...freq,
        routes: routesMap.get(freq.route_id) || null,
        buses: busesMap.get(freq.bus_id) || null,
      }));

      setDepartures(enrichedDepartures);
    } catch (error) {
      console.error('Error loading departures:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDepartures();
  };

  const getFrequencyLabel = (type: string, days?: number[]) => {
    if (type === 'DAILY') return 'Daily';
    if (type === 'WEEKLY' && days) {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days.map((d) => dayNames[d]).join(', ');
    }
    if (type === 'SPECIFIC_DAYS' && days) {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days.map((d) => dayNames[d]).join(', ');
    }
    return type;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Active Departures</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading departures...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Departures</Text>
        <Text style={styles.headerSubtitle}>
          {departures.length} active route{departures.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {departures.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bus-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Active Departures</Text>
            <Text style={styles.emptyText}>
              There are currently no active routes scheduled.
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {departures.map((departure) => (
              <View key={departure.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.routeInfo}>
                    <View style={styles.routeRow}>
                      <Ionicons name="location" size={20} color="#2563eb" />
                      <Text style={styles.cityText}>
                        {departure.routes?.origin || 'Unknown'}
                      </Text>
                    </View>
                    <View style={styles.arrowContainer}>
                      <Ionicons name="arrow-forward" size={16} color="#9ca3af" />
                    </View>
                    <View style={styles.routeRow}>
                      <Ionicons name="location" size={20} color="#10b981" />
                      <Text style={styles.cityText}>
                        {departure.routes?.destination || 'Unknown'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardBody}>
                  <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                      <Ionicons name="time-outline" size={18} color="#6b7280" />
                      <Text style={styles.infoLabel}>Departure</Text>
                      <Text style={styles.infoValue}>
                        {formatTime(departure.departure_time)}
                      </Text>
                    </View>

                    <View style={styles.infoItem}>
                      <Ionicons name="calendar-outline" size={18} color="#6b7280" />
                      <Text style={styles.infoLabel}>Frequency</Text>
                      <Text style={styles.infoValue}>
                        {getFrequencyLabel(
                          departure.frequency_type,
                          departure.days_of_week
                        )}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                      <Ionicons name="cash-outline" size={18} color="#6b7280" />
                      <Text style={styles.infoLabel}>Fare</Text>
                      <Text style={styles.fareValue}>
                        R{departure.fare_per_seat?.toFixed(2) || '0.00'}
                      </Text>
                    </View>

                    {departure.buses && (
                      <View style={styles.infoItem}>
                        <Ionicons name="bus-outline" size={18} color="#6b7280" />
                        <Text style={styles.infoLabel}>Bus</Text>
                        <Text style={styles.infoValue}>
                          {departure.buses.registration_number || departure.buses.name}
                        </Text>
                      </View>
                    )}
                  </View>

                  {departure.routes?.duration_hours && (
                    <View style={styles.durationBadge}>
                      <Ionicons name="hourglass-outline" size={14} color="#7c3aed" />
                      <Text style={styles.durationText}>
                        {departure.routes.duration_hours}h journey
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Active</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
    paddingBottom: 12,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  arrowContainer: {
    paddingHorizontal: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  cardBody: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  fareValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  durationText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7c3aed',
    marginLeft: 4,
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
});

export default DeparturesScreen;
