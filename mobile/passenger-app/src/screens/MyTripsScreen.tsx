import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tripService } from '../services/tripService';
import { Booking } from '../services/tripService';
import { format } from 'date-fns';

export default function MyTripsScreen({ navigation }: any) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const data = await tripService.getMyBookings();
      setBookings(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filter === 'upcoming') return booking.booking_status === 'confirmed';
    if (filter === 'completed') return booking.booking_status === 'completed';
    if (filter === 'cancelled') return booking.booking_status === 'cancelled';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#10b981';
      case 'completed': return '#6b7280';
      case 'cancelled': return '#ef4444';
      default: return '#2563eb';
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Trips</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        {['all', 'upcoming', 'completed', 'cancelled'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f as any)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="ticket-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>No bookings found</Text>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.searchButtonText}>Search Trips</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredBookings.map((booking) => (
            <TouchableOpacity
              key={booking.id}
              style={styles.bookingCard}
              onPress={() => navigation.navigate('BookingDetails', { bookingId: booking.id })}
            >
              <View style={styles.bookingHeader}>
                <Text style={styles.reference}>{booking.booking_reference}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.booking_status) }]}>
                  <Text style={styles.statusText}>{booking.booking_status}</Text>
                </View>
              </View>

              <View style={styles.routeInfo}>
                <Text style={styles.route}>
                  {booking.trips?.routes?.origin} → {booking.trips?.routes?.destination}
                </Text>
                <Text style={styles.date}>
                  {booking.trips?.scheduled_departure &&
                    format(new Date(booking.trips.scheduled_departure), 'MMM dd, yyyy • HH:mm')}
                </Text>
              </View>

              <View style={styles.bookingFooter}>
                <View style={styles.seatInfo}>
                  <Ionicons name="person" size={16} color="#666" />
                  <Text style={styles.seatText}>Seat {booking.seat_number}</Text>
                </View>
                <Text style={styles.price}>P{booking.total_amount}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' },
  title: { fontSize: 24, fontWeight: '700' },
  filterContainer: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: '#f5f5f5' },
  filterButtonActive: { backgroundColor: '#2563eb' },
  filterText: { fontSize: 14, color: '#666' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  scrollView: { flex: 1 },
  bookingCard: { backgroundColor: '#fff', margin: 16, marginBottom: 0, padding: 16, borderRadius: 12 },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  reference: { fontSize: 16, fontWeight: '600', color: '#2563eb' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600', color: '#fff', textTransform: 'capitalize' },
  routeInfo: { marginBottom: 12 },
  route: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  date: { fontSize: 14, color: '#666' },
  bookingFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f5f5f5' },
  seatInfo: { flexDirection: 'row', alignItems: 'center' },
  seatText: { fontSize: 14, color: '#666', marginLeft: 4 },
  price: { fontSize: 18, fontWeight: '700', color: '#2563eb' },
  emptyState: { alignItems: 'center', padding: 40, marginTop: 60 },
  emptyText: { fontSize: 16, color: '#666', marginTop: 16, marginBottom: 24 },
  searchButton: { backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  searchButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
