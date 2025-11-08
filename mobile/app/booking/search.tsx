import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { COLORS } from '@/lib/constants';
import { Ionicons } from '@expo/vector-icons';
import { Schedule } from '@/types';
import { format } from 'date-fns';

export default function SearchResults() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedules();
  }, [params]);

  const fetchSchedules = async () => {
    try {
      // Format date properly for database query (YYYY-MM-DD)
      const searchDate = params.date ? format(new Date(params.date as string), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          route:routes(*),
          bus:buses(*)
        `)
        .gte('departure_date', searchDate)
        .gt('available_seats', 0);

      if (error) throw error;

      // Filter by origin and destination
      const filtered = data?.filter(
        (schedule) =>
          schedule.route?.origin.toLowerCase().includes((params.origin as string).toLowerCase()) &&
          schedule.route?.destination.toLowerCase().includes((params.destination as string).toLowerCase())
      );

      setSchedules(filtered || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderSchedule = ({ item }: { item: Schedule }) => (
    <TouchableOpacity
      style={styles.scheduleCard}
      onPress={() => {
        // Navigate to seat selection or booking details
        alert(`Selected trip: ${item.route?.origin} to ${item.route?.destination}`);
      }}
    >
      <View style={styles.routeHeader}>
        <View style={styles.routeInfo}>
          <Ionicons name="location" size={20} color={COLORS.primary} />
          <Text style={styles.routeText}>
            {item.route?.origin} → {item.route?.destination}
          </Text>
        </View>
        <Text style={styles.price}>R{item.price.toFixed(2)}</Text>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color={COLORS.textLight} />
          <Text style={styles.detailText}>
            {format(new Date(item.departure_time), 'MMM dd, yyyy')}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="time" size={16} color={COLORS.textLight} />
          <Text style={styles.detailText}>
            Departs: {format(new Date(item.departure_time), 'HH:mm')}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={COLORS.textLight} />
          <Text style={styles.detailText}>
            Arrives: {format(new Date(item.arrival_time), 'HH:mm')}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="bus" size={16} color={COLORS.textLight} />
          <Text style={styles.detailText}>
            {item.bus?.bus_type} - {item.bus?.bus_number}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="people" size={16} color={COLORS.textLight} />
          <Text style={styles.detailText}>
            {item.available_seats} seats available
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.bookButton}>
        <Text style={styles.bookButtonText}>Book Now</Text>
        <Ionicons name="arrow-forward" size={20} color="#ffffff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Searching for trips...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchInfo}>
        <Text style={styles.searchText}>
          {params.origin} → {params.destination}
        </Text>
        <Text style={styles.searchDate}>{params.date as string}</Text>
      </View>

      {schedules.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bus-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.emptyText}>No trips found</Text>
          <Text style={styles.emptySubtext}>
            Try different dates or locations
          </Text>
        </View>
      ) : (
        <FlatList
          data={schedules}
          renderItem={renderSchedule}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.textLight,
  },
  searchInfo: {
    backgroundColor: COLORS.primary,
    padding: 15,
  },
  searchText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  searchDate: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 4,
  },
  listContent: {
    padding: 15,
  },
  scheduleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  routeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  detailsContainer: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginLeft: 8,
  },
  bookButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
});
