import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tripService } from '../services/tripService';

export default function PaymentScreen({ route, navigation }: any) {
  const { tripId, trip, seatNumber, passenger } = route.params || {};

  if (!tripId || !trip || !seatNumber || !passenger) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, color: '#666' }}>Missing payment information</Text>
      </View>
    );
  }
  const [selectedMethod, setSelectedMethod] = useState('mobile_money');
  const [processing, setProcessing] = useState(false);

  const paymentMethods = [
    { id: 'mobile_money', name: 'Mobile Money', icon: 'phone-portrait' },
    { id: 'card', name: 'Credit/Debit Card', icon: 'card' },
    { id: 'cash', name: 'Cash on Pickup', icon: 'cash' },
  ];

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const booking = await tripService.createBooking(
        tripId,
        passenger.name,
        passenger.phone,
        passenger.email || '',
        seatNumber,
        trip.price
      );

      if (booking) {
        navigation.navigate('BookingConfirmation', { bookingId: booking.id });
      } else {
        Alert.alert('Error', 'Failed to create booking. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Payment</Text>
          <Text style={styles.subtitle}>Select payment method</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodCard,
                selectedMethod === method.id && styles.methodCardSelected,
              ]}
              onPress={() => setSelectedMethod(method.id)}
            >
              <View style={styles.methodLeft}>
                <Ionicons
                  name={method.icon as any}
                  size={24}
                  color={selectedMethod === method.id ? '#2563eb' : '#666'}
                />
                <Text style={[
                  styles.methodName,
                  selectedMethod === method.id && styles.methodNameSelected
                ]}>
                  {method.name}
                </Text>
              </View>
              {selectedMethod === method.id && (
                <Ionicons name="checkmark-circle" size={24} color="#2563eb" />
              )}
            </TouchableOpacity>
          ))}

          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Payment Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Route:</Text>
              <Text style={styles.summaryValue}>
                {trip.routes?.origin} → {trip.routes?.destination}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Seat:</Text>
              <Text style={styles.summaryValue}>{seatNumber}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Passenger:</Text>
              <Text style={styles.summaryValue}>{passenger.name}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalValue}>P{trip.price}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, processing && styles.buttonDisabled]}
          onPress={handlePayment}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>Pay P{trip.price}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollView: { flex: 1 },
  header: { backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  content: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  methodCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 2, borderColor: '#e5e7eb' },
  methodCardSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  methodLeft: { flexDirection: 'row', alignItems: 'center' },
  methodName: { fontSize: 16, marginLeft: 12, color: '#374151' },
  methodNameSelected: { color: '#2563eb', fontWeight: '600' },
  summary: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginTop: 24 },
  summaryTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 14, color: '#666' },
  summaryValue: { fontSize: 14, fontWeight: '500' },
  totalRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  totalLabel: { fontSize: 16, fontWeight: '600' },
  totalValue: { fontSize: 20, fontWeight: '700', color: '#2563eb' },
  footer: { backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#e5e5e5' },
  payButton: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#cbd5e1' },
  payButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
