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
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface Shift {
  id: string;
  shift_date: string;
  shift_start_time: string;
  shift_end_time: string;
  status: string;
  notes?: string;
  auto_generated?: boolean;
  driver: {
    id: string;
    full_name: string;
  };
  route: {
    id: string;
    origin: string;
    destination: string;
  };
  bus: {
    id: string;
    registration_number: string;
    model?: string;
  };
}

type FilterType = 'today' | 'upcoming' | 'all';

export default function MyShiftsScreen() {
  const { driver } = useAuth();
  const navigation = useNavigation();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('today');

  useEffect(() => {
    if (driver?.id) {
      loadShifts();
    }
  }, [driver?.id, filter]);

  const loadShifts = async () => {
    if (!driver?.id) {
      console.warn('No driver ID available');
      return;
    }

    try {
      setLoading(true);

      console.log('Fetching shifts for driver:', driver.id);

      // Query driver_shifts with all necessary joins
      const { data, error } = await supabase
        .from('driver_shifts')
        .select(`
          id,
          shift_date,
          shift_start_time,
          shift_end_time,
          status,
          notes,
          auto_generated,
          drivers!driver_id (
            id,
            full_name
          ),
          routes!route_id (
            id,
            origin,
            destination
          ),
          buses!bus_id (
            id,
            registration_number,
            model
          )
        `)
        .eq('driver_id', driver.id)
        .order('shift_date', { ascending: true })
        .order('shift_start_time', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Raw data from Supabase:', data);

      // Transform data to match our interface
      const transformedShifts: Shift[] = (data || []).map((shift: any) => ({
        id: shift.id,
        shift_date: shift.shift_date,
        shift_start_time: shift.shift_start_time,
        shift_end_time: shift.shift_end_time,
        status: shift.status,
        notes: shift.notes,
        auto_generated: shift.auto_generated,
        driver: Array.isArray(shift.drivers) ? shift.drivers[0] : shift.drivers,
        route: Array.isArray(shift.routes) ? shift.routes[0] : shift.routes,
        bus: Array.isArray(shift.buses) ? shift.buses[0] : shift.buses,
      }));

      console.log('Transformed shifts:', transformedShifts);

      // Apply filter
      const filteredShifts = applyFilter(transformedShifts, filter);
      console.log(`Filtered shifts (${filter}):`, filteredShifts);

      setShifts(filteredShifts);
    } catch (error) {
      console.error('Error loading shifts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilter = (allShifts: Shift[], filterType: FilterType): Shift[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (filterType) {
      case 'today':
        return allShifts.filter(shift => {
          const shiftDate = new Date(shift.shift_date);
          return shiftDate >= today && shiftDate < tomorrow;
        });
      case 'upcoming':
        return allShifts.filter(shift => {
          const shiftDate = new Date(shift.shift_date);
          return shiftDate >= today;
        });
      case 'all':
      default:
        return allShifts;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadShifts();
  };

  const formatDate = (dateString: string): string => {
    try {
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
    } catch (error) {
      return dateString;
    }
  };

  const formatTime = (timeString: string): string => {
    if (!timeString) return 'N/A';
    try {
      // Handle both timestamp and time-only strings
      const date = new Date(timeString);
      if (isNaN(date.getTime())) {
        // Parse as time string (HH:MM:SS)
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
      }
      // Format timestamp
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      return timeString;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return '#10b981';
      case 'SCHEDULED':
        return '#3b82f6';
      case 'COMPLETED':
        return '#6b7280';
      case 'CANCELLED':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const renderShiftCard = ({ item }: { item: Shift }) => (
    <TouchableOpacity
      style={styles.shiftCard}
      onPress={() => {
        // Navigate to shift details if needed
        // navigation.navigate('ShiftDetails', { shiftId: item.id });
      }}
    >
      {/* Header: Date and Status */}
      <View style={styles.shiftHeader}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar" size={20} color="#3b82f6" />
          <Text style={styles.dateText}>{formatDate(item.shift_date)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status?.toUpperCase() || 'N/A'}</Text>
        </View>
      </View>

      {/* Driver Name */}
      {item.driver?.full_name && (
        <View style={styles.infoRow}>
          <Ionicons name="person" size={16} color="#10b981" />
          <Text style={styles.infoText}>Driver: {item.driver.full_name}</Text>
        </View>
      )}

      {/* Route */}
      {item.route && (
        <View style={styles.routeContainer}>
          <Ionicons name="location" size={24} color="#ef4444" />
          <View style={styles.routeDetails}>
            <Text style={styles.routeText}>
              {item.route.origin || 'Unknown'} → {item.route.destination || 'Unknown'}
            </Text>
          </View>
        </View>
      )}

      {/* Bus */}
      {item.bus?.registration_number && (
        <View style={styles.infoRow}>
          <Ionicons name="bus" size={16} color="#8b5cf6" />
          <Text style={styles.infoText}>
            Bus: {item.bus.registration_number} {item.bus.model && `(${item.bus.model})`}
          </Text>
        </View>
      )}

      {/* Shift Times */}
      <View style={styles.timesContainer}>
        <Text style={styles.timesTitle}>Shift Times:</Text>
        {item.shift_start_time && (
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={16} color="#6b7280" />
            <Text style={styles.timeText}>Start: {formatTime(item.shift_start_time)}</Text>
          </View>
        )}
        {item.shift_end_time && (
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={16} color="#6b7280" />
            <Text style={styles.timeText}>End: {formatTime(item.shift_end_time)}</Text>
          </View>
        )}
      </View>

      {/* Auto-generated badge */}
      {item.auto_generated && (
        <View style={styles.autoGeneratedBadge}>
          <Ionicons name="flash" size={14} color="#f59e0b" />
          <Text style={styles.autoGeneratedText}>Auto-generated</Text>
        </View>
      )}

      {/* Notes */}
      {item.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesText}>Note: {item.notes}</Text>
        </View>
      )}
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
        {(['today', 'upcoming', 'all'] as FilterType[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Shifts List */}
      {shifts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>No shifts found</Text>
          <Text style={styles.emptySubtext}>
            {filter === 'today'
              ? 'No shifts scheduled for today'
              : filter === 'upcoming'
              ? 'No upcoming shifts'
              : 'No shifts available'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={shifts}
          renderItem={renderShiftCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
    backgroundColor: '#f9fafb',
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginLeft: 8,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
  },
  routeDetails: {
    flex: 1,
    marginLeft: 12,
  },
  routeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
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
  notesContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  notesText: {
    fontSize: 13,
    color: '#4b5563',
    fontStyle: 'italic',
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
});
