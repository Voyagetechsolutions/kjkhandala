import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface Shift {
  id: string;
  shift_date: string;
  shift_start_time: string;
  shift_end_time: string;
  status: string;
  routes: {
    origin: string;
    destination: string;
  };
  buses: {
    registration_number: string;
    model: string;
  };
  drivers: {
    full_name: string;
  };
}

export default function MyShiftsScreen() {
  const { driver } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    loadShifts();
  }, [driver?.id, filter]);

  const loadShifts = async () => {
    if (!driver?.id) return;

    try {
      setLoading(true);
      
      const { startDate, endDate } = getDateRange(filter);
      
      // Query driver_shifts table with joins
      const { data, error } = await supabase
        .from('driver_shifts')
        .select(`
          id,
          shift_date,
          shift_start_time,
          shift_end_time,
          status,
          routes!route_id (
            origin,
            destination
          ),
          buses!bus_id (
            registration_number,
            model
          ),
          drivers!driver_id (
            full_name
          )
        `)
        .eq('driver_id', driver.id)
        .gte('shift_date', startDate)
        .lte('shift_date', endDate)
        .order('shift_date', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Loaded shifts data:', data);
      console.log('Driver ID:', driver.id);
      
      // Transform Supabase join arrays to objects
      const transformedData = (data || []).map(trip => ({
        ...trip,
        routes: Array.isArray(trip.routes) ? trip.routes[0] : trip.routes,
        buses: Array.isArray(trip.buses) ? trip.buses[0] : trip.buses,
        drivers: Array.isArray(trip.drivers) ? trip.drivers[0] : trip.drivers,
      }));
      
      setShifts(transformedData);
    } catch (error) {
      console.error('Error loading shifts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getDateRange = (filterType: 'today' | 'week' | 'month') => {
    const today = new Date();
    let startDate = today.toISOString().split('T')[0];
    let endDate = startDate;

    if (filterType === 'week') {
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() + 7);
      endDate = weekEnd.toISOString().split('T')[0];
    } else if (filterType === 'month') {
      const monthEnd = new Date(today);
      monthEnd.setMonth(today.getMonth() + 1);
      endDate = monthEnd.toISOString().split('T')[0];
    }

    return { startDate, endDate };
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadShifts();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    try {
      // Handle both timestamp strings and time strings
      const date = new Date(timeString);
      if (isNaN(date.getTime())) {
        // If invalid date, try parsing as time string
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
      }
      // Format as time from timestamp
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      return timeString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return '#10b981';
      case 'SCHEDULED': return '#3b82f6';
      case 'COMPLETED': return '#6b7280';
      case 'CANCELLED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderShift = ({ item }: { item: Shift }) => (
    <TouchableOpacity style={styles.shiftCard}>
      <View style={styles.shiftHeader}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar" size={20} color="#3b82f6" />
          <Text style={styles.dateText}>{formatDate(item.shift_date)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      {item.drivers?.full_name && (
        <View style={styles.driverContainer}>
          <Ionicons name="person" size={16} color="#10b981" />
          <Text style={styles.driverText}>Driver: {item.drivers.full_name}</Text>
        </View>
      )}

      <View style={styles.routeContainer}>
        <Ionicons name="location" size={24} color="#ef4444" />
        <View style={styles.routeDetails}>
          <Text style={styles.routeText}>
            {item.routes?.origin || 'Unknown'} → {item.routes?.destination || 'Unknown'}
          </Text>
        </View>
      </View>

      {item.buses?.registration_number && (
        <View style={styles.busContainer}>
          <Ionicons name="bus" size={20} color="#8b5cf6" />
          <Text style={styles.busText}>
            Bus: {item.buses.registration_number} {item.buses.model && `(${item.buses.model})`}
          </Text>
        </View>
      )}

      <View style={styles.timesContainer}>
        <Text style={styles.timesTitle}>Shift Times:</Text>
        {item.shift_start_time && (
          <View style={styles.timeRow}>
            <Ionicons name="time" size={16} color="#6b7280" />
            <Text style={styles.timeText}>
              Start: {formatTime(item.shift_start_time)}
            </Text>
          </View>
        )}
        {item.shift_end_time && (
          <View style={styles.timeRow}>
            <Ionicons name="time" size={16} color="#6b7280" />
            <Text style={styles.timeText}>
              End: {formatTime(item.shift_end_time)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading your shifts...</Text>
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
          style={[styles.filterTab, filter === 'week' && styles.filterTabActive]}
          onPress={() => setFilter('week')}
        >
          <Text style={[styles.filterText, filter === 'week' && styles.filterTextActive]}>
            This Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'month' && styles.filterTabActive]}
          onPress={() => setFilter('month')}
        >
          <Text style={[styles.filterText, filter === 'month' && styles.filterTextActive]}>
            This Month
          </Text>
        </TouchableOpacity>
      </View>

      {/* Shifts List */}
      {shifts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>No shifts scheduled</Text>
          <Text style={styles.emptySubtext}>
            Check back later or contact dispatch
          </Text>
        </View>
      ) : (
        <FlatList
          data={shifts}
          renderItem={renderShift}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  filterTabActive: {
    backgroundColor: '#3b82f6',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  shiftCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeDetails: {
    flex: 1,
    marginLeft: 12,
  },
  routeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  routeCode: {
    fontSize: 14,
    color: '#6b7280',
  },
  busContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  busText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  timesContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  timesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  timeText: {
    fontSize: 14,
    color: '#1f2937',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  autoGeneratedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  autoGeneratedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d97706',
    marginLeft: 4,
  },
  driverContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#f0fdf4',
    borderRadius: 6,
  },
  driverText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
    marginLeft: 6,
  },
});
