import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatCurrency, formatTime, formatDate } from '../../utils/formatters';
import Button from '../../components/Button';

const MyTripsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  
  // Always call hooks in the same order - before any conditional returns
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  // Now we can do conditional rendering
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="ticket-outline" size={64} color="#2563eb" />
          </View>
          <Text style={styles.title}>Sign In Required</Text>
          <Text style={styles.subtitle}>
            Please sign in to view your trips and bookings
          </Text>
          <Button
            title="Sign In"
            onPress={() => navigation.navigate('SignIn' as never)}
            style={styles.signInButton}
          />
          <TouchableOpacity
            onPress={() => navigation.navigate('SignUp' as never)}
            style={styles.signUpLink}
          >
            <Text style={styles.signUpText}>
              Don't have an account? <Text style={styles.signUpTextBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  useEffect(() => {
    loadBookings();
  }, [user]);

  const loadBookings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get all bookings for the user
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // For each booking, fetch trip details if trip_id exists, or parse from flow_step
      const bookingsWithTrips = await Promise.all(
        (bookingsData || []).map(async (booking) => {
          let tripData = null;

          if (booking.trip_id) {
            // Fetch trip from database
            const { data: trip } = await supabase
              .from('trips')
              .select(`
                *,
                routes (origin, destination),
                buses (name, bus_type)
              `)
              .eq('id', booking.trip_id)
              .single();

            tripData = trip;
          } else if (booking.flow_step) {
            // Parse projected trip data
            try {
              const parsedTrip = JSON.parse(booking.flow_step);
              tripData = {
                scheduled_departure: parsedTrip.scheduled_departure,
                scheduled_arrival: parsedTrip.scheduled_arrival,
                trip_number: parsedTrip.trip_number,
                routes: {
                  origin: parsedTrip.origin,
                  destination: parsedTrip.destination,
                },
                buses: {
                  name: parsedTrip.bus_name,
                },
              };
            } catch (e) {
              console.error('Error parsing trip metadata:', e);
            }
          }

          return {
            ...booking,
            trips: tripData,
          };
        })
      );

      setBookings(bookingsWithTrips);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingBookings = bookings.filter(
    (b) => new Date(b.trips?.scheduled_departure) >= new Date()
  );
  const pastBookings = bookings.filter(
    (b) => new Date(b.trips?.scheduled_departure) < new Date()
  );

  const currentBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading trips...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Trips</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text
            style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}
          >
            Upcoming ({upcomingBookings.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
            Past ({pastBookings.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {currentBookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="ticket-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No {activeTab} trips</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'upcoming'
                ? 'Book a trip to see it here'
                : 'Your past trips will appear here'}
            </Text>
          </View>
        ) : (
          currentBookings.map((booking) => (
            <TouchableOpacity
              key={booking.id}
              style={styles.bookingCard}
              onPress={() =>
                (navigation as any).navigate('Ticket', {
                  bookingReference: booking.booking_reference,
                })
              }
            >
              <View style={styles.bookingHeader}>
                <View style={styles.routeInfo}>
                  <Text style={styles.routeText}>
                    {booking.trips?.routes?.origin} → {booking.trips?.routes?.destination}
                  </Text>
                  <Text style={styles.dateText}>
                    {formatDate(booking.trips?.scheduled_departure)} at{' '}
                    {formatTime(booking.trips?.scheduled_departure)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    booking.booking_status === 'confirmed'
                      ? styles.statusConfirmed
                      : styles.statusCancelled,
                  ]}
                >
                  <Text style={styles.statusText}>
                    {booking.booking_status?.toUpperCase() || 'PENDING'}
                  </Text>
                </View>
              </View>

              <View style={styles.bookingDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="ticket" size={16} color="#6b7280" />
                  <Text style={styles.detailText}>{booking.booking_reference}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="bus" size={16} color="#6b7280" />
                  <Text style={styles.detailText}>{booking.trips?.buses?.name}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="cash" size={16} color="#6b7280" />
                  <Text style={styles.detailText}>
                    {formatCurrency(booking.total_amount)}
                  </Text>
                </View>
              </View>

              <View style={styles.bookingFooter}>
                <Text style={styles.viewTicketText}>View E-Ticket</Text>
                <Ionicons name="chevron-forward" size={20} color="#2563eb" />
              </View>
            </TouchableOpacity>
          ))
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#eff6ff',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  signInButton: {
    width: '100%',
    maxWidth: 300,
  },
  signUpLink: {
    marginTop: 16,
  },
  signUpText: {
    fontSize: 14,
    color: '#6b7280',
  },
  signUpTextBold: {
    color: '#2563eb',
    fontWeight: '600',
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
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2563eb',
  },
  tabText: {
    fontSize: 16,
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
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
    marginTop: 8,
    textAlign: 'center',
  },
  bookingCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routeInfo: {
    flex: 1,
  },
  routeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusConfirmed: {
    backgroundColor: '#d1fae5',
  },
  statusCancelled: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  bookingDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  viewTicketText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
});

export default MyTripsScreen;
