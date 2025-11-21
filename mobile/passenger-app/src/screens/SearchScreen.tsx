import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tripService } from '../services/tripService';
import { Trip } from '../types';
import { format } from 'date-fns';

export default function SearchScreen({ route, navigation }: any) {
  const { origin, destination, date } = route.params || {};

  if (!origin || !destination || !date) {
    return (
      <View style={styles.centered}>
        <Text style={{ fontSize: 16, color: '#666' }}>Search parameters missing</Text>
      </View>
    );
  }
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const data = await tripService.searchTrips(origin, destination, date);
      setTrips(data);
    } finally {
      setLoading(false);
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.route}>{origin} → {destination}</Text>
        <Text style={styles.date}>{date}</Text>
      </View>

      {trips.map((trip) => (
        <TouchableOpacity
          key={trip.id}
          style={styles.tripCard}
          onPress={() => navigation.navigate('TripDetails', { tripId: trip.id })}
        >
          <View style={styles.tripHeader}>
            <View style={styles.timeContainer}>
              <Text style={styles.time}>{trip.scheduled_departure ? format(new Date(trip.scheduled_departure), 'HH:mm') : 'N/A'}</Text>
              <Ionicons name="arrow-forward" size={20} color="#666" />
              <Text style={styles.time}>{trip.scheduled_arrival ? format(new Date(trip.scheduled_arrival), 'HH:mm') : 'N/A'}</Text>
            </View>
            <Text style={styles.duration}>
              {trip.routes?.duration_hours ? `${trip.routes.duration_hours}h` : 'N/A'}
            </Text>
          </View>

          <View style={styles.tripDetails}>
            <View style={styles.busInfo}>
              <Ionicons name="bus" size={16} color="#666" />
              <Text style={styles.busNumber}>{trip.buses?.registration_number || 'N/A'}</Text>
              <View style={[styles.badge, styles.luxuryBadge]}>
                <Text style={styles.badgeText}>{trip.buses?.model || 'Standard'}</Text>
              </View>
            </View>
            <Text style={styles.seats}>{trip.available_seats} seats left</Text>
          </View>

          <View style={styles.tripFooter}>
            <Text style={styles.price}>P{trip.price.toString()}</Text>
            <TouchableOpacity style={styles.bookButton}>
              <Text style={styles.bookButtonText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' },
  route: { fontSize: 18, fontWeight: '600' },
  date: { fontSize: 14, color: '#666', marginTop: 4 },
  tripCard: { backgroundColor: '#fff', margin: 16, marginBottom: 0, padding: 16, borderRadius: 12 },
  tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  timeContainer: { flexDirection: 'row', alignItems: 'center' },
  time: { fontSize: 18, fontWeight: '600', marginHorizontal: 4 },
  duration: { fontSize: 14, color: '#666' },
  tripDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  busInfo: { flexDirection: 'row', alignItems: 'center' },
  busNumber: { fontSize: 14, color: '#666', marginHorizontal: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  luxuryBadge: { backgroundColor: '#fef3c7' },
  badgeText: { fontSize: 12, fontWeight: '500', color: '#92400e' },
  seats: { fontSize: 14, color: '#10b981' },
  tripFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f5f5f5' },
  price: { fontSize: 24, fontWeight: '700', color: '#2563eb' },
  bookButton: { backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  bookButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
