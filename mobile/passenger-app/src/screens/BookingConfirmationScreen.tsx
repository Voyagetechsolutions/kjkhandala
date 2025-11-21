import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tripService } from '../services/tripService';
import { Booking } from '../types';
import { format } from 'date-fns';

export default function BookingConfirmationScreen({ route, navigation }: any) {
  const { bookingId } = route.params || {};

  if (!bookingId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Booking not specified</Text>
      </View>
    );
  }
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBooking();
  }, []);

  const loadBooking = async () => {
    try {
      const data = await tripService.getBookingDetails(bookingId);
      setBooking(data);
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

  if (!booking) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Booking not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.successHeader}>
          <Ionicons name="checkmark-circle" size={80} color="#10b981" />
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successSubtitle}>Your ticket has been booked successfully</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Booking Reference</Text>
          <Text style={styles.reference}>{booking.booking_reference}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trip Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Route:</Text>
            <Text style={styles.detailValue}>
              {booking.trips?.routes?.origin} → {booking.trips?.routes?.destination}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Departure:</Text>
            <Text style={styles.detailValue}>
              {booking.trips?.scheduled_departure && 
                format(new Date(booking.trips.scheduled_departure), 'MMM dd, yyyy • HH:mm')}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Bus:</Text>
            <Text style={styles.detailValue}>{booking.trips?.buses?.registration_number}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Seat:</Text>
            <Text style={styles.detailValue}>{booking.seat_number}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Passenger</Text>
          <Text style={styles.passengerName}>{booking.passenger_name}</Text>
          <Text style={styles.passengerInfo}>{booking.passenger_phone}</Text>
          {booking.passenger_email && (
            <Text style={styles.passengerInfo}>{booking.passenger_email}</Text>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.qrPlaceholder}>
            <Ionicons name="qr-code" size={100} color="#cbd5e1" />
            <Text style={styles.qrText}>QR Code</Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#2563eb" />
          <Text style={styles.infoText}>
            Show this booking reference at the station to board your bus
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => navigation.navigate('MainTabs', { screen: 'MyTrips' })}
        >
          <Text style={styles.doneButtonText}>View My Trips</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  successHeader: { backgroundColor: '#fff', padding: 40, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e5e5e5' },
  successTitle: { fontSize: 24, fontWeight: '700', marginTop: 16, color: '#10b981' },
  successSubtitle: { fontSize: 14, color: '#666', marginTop: 8, textAlign: 'center' },
  card: { backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#666' },
  reference: { fontSize: 24, fontWeight: '700', color: '#2563eb', textAlign: 'center', letterSpacing: 2 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  detailLabel: { fontSize: 14, color: '#666' },
  detailValue: { fontSize: 14, fontWeight: '500', textAlign: 'right', flex: 1, marginLeft: 12 },
  passengerName: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  passengerInfo: { fontSize: 14, color: '#666', marginBottom: 4 },
  qrPlaceholder: { alignItems: 'center', padding: 40 },
  qrText: { fontSize: 14, color: '#cbd5e1', marginTop: 8 },
  infoBox: { flexDirection: 'row', backgroundColor: '#eff6ff', padding: 16, margin: 16, borderRadius: 8, alignItems: 'center' },
  infoText: { fontSize: 14, color: '#2563eb', marginLeft: 12, flex: 1 },
  footer: { backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#e5e5e5' },
  doneButton: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center' },
  doneButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  errorText: { fontSize: 16, color: '#666' },
});
