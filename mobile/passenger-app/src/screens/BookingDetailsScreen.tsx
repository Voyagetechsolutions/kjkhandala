import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tripService } from '../services/tripService';
import { Booking } from '../services/tripService';
import { format } from 'date-fns';

export default function BookingDetailsScreen({ route, navigation }: any) {
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
  const [cancelling, setCancelling] = useState(false);

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

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              const success = await tripService.cancelBooking(bookingId);
              if (success) {
                Alert.alert('Cancelled', 'Your booking has been cancelled', [
                  { text: 'OK', onPress: () => navigation.goBack() }
                ]);
              } else {
                Alert.alert('Error', 'Failed to cancel booking');
              }
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
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

  const canCancel = booking.booking_status === 'confirmed';

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.reference}>{booking.booking_reference}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: booking.booking_status === 'confirmed' ? '#10b981' : '#6b7280' }
          ]}>
            <Text style={styles.statusText}>{booking.booking_status}</Text>
          </View>
        </View>

        <View style={styles.qrSection}>
          <View style={styles.qrPlaceholder}>
            <Ionicons name="qr-code" size={120} color="#cbd5e1" />
          </View>
          <Text style={styles.qrText}>Show this at the station</Text>
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
          <Text style={styles.cardTitle}>Passenger Information</Text>
          <Text style={styles.passengerName}>{booking.passenger_name}</Text>
          <Text style={styles.passengerInfo}>{booking.passenger_phone}</Text>
          {booking.passenger_email && (
            <Text style={styles.passengerInfo}>{booking.passenger_email}</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={styles.priceValue}>P{booking.total_amount}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={[
              styles.detailValue,
              { color: booking.payment_status === 'paid' ? '#10b981' : '#f59e0b' }
            ]}>
              {booking.payment_status}
            </Text>
          </View>
        </View>

        {canCancel && (
          <TouchableOpacity
            style={[styles.cancelButton, cancelling && styles.buttonDisabled]}
            onPress={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="close-circle" size={20} color="#fff" />
                <Text style={styles.cancelButtonText}>Cancel Booking</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  header: { backgroundColor: '#2563eb', padding: 24, alignItems: 'center' },
  reference: { fontSize: 24, fontWeight: '700', color: '#fff', letterSpacing: 2 },
  statusBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, marginTop: 12 },
  statusText: { fontSize: 14, fontWeight: '600', color: '#fff', textTransform: 'capitalize' },
  qrSection: { backgroundColor: '#fff', padding: 32, alignItems: 'center', marginTop: 16, marginHorizontal: 16, borderRadius: 12 },
  qrPlaceholder: { padding: 20 },
  qrText: { fontSize: 14, color: '#666', marginTop: 8 },
  card: { backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16, color: '#666' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  detailLabel: { fontSize: 14, color: '#666' },
  detailValue: { fontSize: 14, fontWeight: '500', textAlign: 'right', flex: 1, marginLeft: 12 },
  priceValue: { fontSize: 18, fontWeight: '700', color: '#2563eb' },
  passengerName: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  passengerInfo: { fontSize: 14, color: '#666', marginBottom: 4 },
  cancelButton: { backgroundColor: '#ef4444', margin: 16, padding: 16, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#fca5a5' },
  cancelButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  errorText: { fontSize: 16, color: '#666' },
});
