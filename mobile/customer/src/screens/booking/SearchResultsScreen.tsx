import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useBooking } from '../../context/BookingContext';
import { searchTrips } from '../../services/tripService';
import { formatTime, formatDate, formatCurrency } from '../../utils/formatters';
import Button from '../../components/Button';

interface Trip {
  id: string;
  trip_number: string;
  scheduled_departure: string;
  scheduled_arrival: string;
  fare: number;
  status: string;
  total_seats: number;
  available_seats: number;
  route: {
    origin: string;
    destination: string;
  };
  bus: {
    name: string;
    bus_type: string;
  };
  is_projected?: boolean;
}

const SearchResultsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { searchParams, setSelectedTrip, setSelectedReturnTrip } = useBooking();

  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [returnTrips, setReturnTrips] = useState<Trip[]>([]);
  const [selectedOutbound, setSelectedOutbound] = useState<Trip | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<Trip | null>(null);
  const [showingReturnTrips, setShowingReturnTrips] = useState(false);

  useEffect(() => {
    if (searchParams) {
      performSearch();
    }
  }, [searchParams]);

  const performSearch = async () => {
    if (!searchParams) return;

    try {
      setLoading(true);
      const results = await searchTrips(searchParams);

      setTrips(results.outbound);
      setReturnTrips(results.return);
    } catch (error) {
      Alert.alert('Error', 'Failed to search trips');
    } finally {
      setLoading(false);
    }
  };

  const handleTripSelect = (trip: Trip) => {
    if (showingReturnTrips) {
      setSelectedReturn(trip);
      setSelectedReturnTrip(trip);
      // Both trips selected, proceed to seat selection
      navigation.navigate('SeatSelection' as never);
    } else {
      setSelectedOutbound(trip);
      setSelectedTrip(trip);

      if (searchParams?.tripType === 'return') {
        // Show return trips
        setShowingReturnTrips(true);
      } else {
        // One-way trip, proceed to seat selection
        navigation.navigate('SeatSelection' as never);
      }
    }
  };

  const calculateDuration = (departure: string, arrival: string) => {
    const dep = new Date(departure);
    const arr = new Date(arrival);
    const diff = arr.getTime() - dep.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const renderTripCard = (trip: Trip) => (
    <TouchableOpacity
      key={trip.id}
      style={[
        styles.tripCard,
        (showingReturnTrips ? selectedReturn?.id : selectedOutbound?.id) === trip.id &&
          styles.tripCardSelected,
      ]}
      onPress={() => handleTripSelect(trip)}
    >
      <View style={styles.tripHeader}>
        <View style={styles.tripRoute}>
          <Text style={styles.tripCity}>{trip.route.origin}</Text>
          <Ionicons name="arrow-forward" size={20} color="#6b7280" />
          <Text style={styles.tripCity}>{trip.route.destination}</Text>
        </View>
        {trip.is_projected && (
          <View style={styles.projectedBadge}>
            <Text style={styles.projectedText}>Projected</Text>
          </View>
        )}
      </View>

      <View style={styles.tripDetails}>
        <View style={styles.tripTime}>
          <Ionicons name="time-outline" size={18} color="#6b7280" />
          <Text style={styles.timeText}>
            {formatTime(trip.scheduled_departure)} - {formatTime(trip.scheduled_arrival)}
          </Text>
          <Text style={styles.durationText}>
            ({calculateDuration(trip.scheduled_departure, trip.scheduled_arrival)})
          </Text>
        </View>

        <View style={styles.tripInfo}>
          <View style={styles.infoItem}>
            <Ionicons name="bus-outline" size={18} color="#6b7280" />
            <Text style={styles.infoText}>{trip.bus.bus_type}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="people-outline" size={18} color="#6b7280" />
            <Text style={styles.infoText}>
              {trip.available_seats} / {trip.total_seats} seats
            </Text>
          </View>
        </View>

        <View style={styles.tripFooter}>
          <Text style={styles.fareText}>{formatCurrency(trip.fare)}</Text>
          <View
            style={[
              styles.statusBadge,
              trip.status === 'SCHEDULED' ? styles.statusScheduled : styles.statusBoarding,
            ]}
          >
            <Text style={styles.statusText}>{trip.status}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Searching for trips...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentTrips = showingReturnTrips ? returnTrips : trips;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#2563eb" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {showingReturnTrips ? 'Select Return Trip' : 'Select Outbound Trip'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {showingReturnTrips
              ? `${searchParams?.to} → ${searchParams?.from}`
              : `${searchParams?.from} → ${searchParams?.to}`}
          </Text>
        </View>
      </View>

      {selectedOutbound && showingReturnTrips && (
        <View style={styles.selectedTripBanner}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <Text style={styles.selectedTripText}>
            Outbound: {formatTime(selectedOutbound.scheduled_departure)} - {formatCurrency(selectedOutbound.fare)}
          </Text>
        </View>
      )}

      <ScrollView style={styles.scrollView}>
        {currentTrips.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No trips found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your search criteria or date
            </Text>
            <Button
              title="Search Again"
              onPress={() => navigation.goBack()}
              style={styles.searchAgainButton}
            />
          </View>
        ) : (
          <View style={styles.tripsList}>
            <Text style={styles.resultsCount}>
              {currentTrips.length} trip{currentTrips.length !== 1 ? 's' : ''} found
            </Text>
            {currentTrips.map(renderTripCard)}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  selectedTripBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#d1fae5',
    borderBottomWidth: 1,
    borderBottomColor: '#10b981',
  },
  selectedTripText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#065f46',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  tripsList: {
    padding: 16,
  },
  resultsCount: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  tripCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tripCardSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripRoute: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripCity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginHorizontal: 8,
  },
  projectedBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  projectedText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
  },
  tripDetails: {
    gap: 12,
  },
  tripTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  durationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  tripInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#6b7280',
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  fareText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusScheduled: {
    backgroundColor: '#dbeafe',
  },
  statusBoarding: {
    backgroundColor: '#d1fae5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  searchAgainButton: {
    marginTop: 24,
    minWidth: 200,
  },
});

export default SearchResultsScreen;
