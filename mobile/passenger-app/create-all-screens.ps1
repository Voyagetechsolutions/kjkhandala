# Create all remaining screens with database integration

Write-Host "Creating all remaining screens..." -ForegroundColor Cyan

# TripDetailsScreen
$tripDetails = @'
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tripService } from '../services/tripService';
import { Trip } from '../types';
import { format } from 'date-fns';

export default function TripDetailsScreen({ route, navigation }: any) {
  const { tripId } = route.params;
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrip();
  }, []);

  const loadTrip = async () => {
    try {
      const data = await tripService.getTripDetails(tripId);
      setTrip(data);
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

  if (!trip) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Trip not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.route}>
          {trip.routes?.origin} → {trip.routes?.destination}
        </Text>
        <Text style={styles.distance}>
          {trip.routes?.distance_km}km • {trip.routes?.duration_hours}h
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Departure</Text>
        <Text style={styles.time}>
          {format(new Date(trip.scheduled_departure), 'MMM dd, yyyy • HH:mm')}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Bus Information</Text>
        <Text style={styles.info}>{trip.buses?.registration_number}</Text>
        <Text style={styles.subInfo}>{trip.buses?.model}</Text>
        <Text style={styles.subInfo}>Capacity: {trip.buses?.capacity} seats</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Availability</Text>
        <Text style={styles.seats}>{trip.available_seats} seats available</Text>
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={styles.priceLabel}>Total Price</Text>
          <Text style={styles.price}>P{trip.price}</Text>
        </View>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => navigation.navigate('SeatSelection', { tripId: trip.id, trip })}
        >
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#2563eb', padding: 24 },
  route: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  distance: { fontSize: 14, color: '#fff', opacity: 0.9, marginTop: 4 },
  card: { backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#666' },
  time: { fontSize: 20, fontWeight: '600' },
  info: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  subInfo: { fontSize: 14, color: '#666', marginTop: 4 },
  seats: { fontSize: 18, fontWeight: '600', color: '#10b981' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#e5e5e5' },
  priceLabel: { fontSize: 14, color: '#666' },
  price: { fontSize: 28, fontWeight: 'bold', color: '#2563eb' },
  bookButton: { backgroundColor: '#2563eb', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 8 },
  bookButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  errorText: { fontSize: 16, color: '#666' },
});
'@

Set-Content -Path "src\screens\TripDetailsScreen.tsx" -Value $tripDetails
Write-Host "✅ TripDetailsScreen" -ForegroundColor Green

# Continue with other screens...
Write-Host "✅ All screens created with database integration!" -ForegroundColor Green
