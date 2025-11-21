import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';

export default function PassengerInfoScreen({ route, navigation }: any) {
  const { tripId, trip, seatNumber } = route.params || {};

  if (!tripId || !trip || !seatNumber) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, color: '#666' }}>Missing booking information</Text>
      </View>
    );
  }
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    idNumber: '',
  });

  const handleContinue = () => {
    if (!form.name || !form.phone) {
      Alert.alert('Required Fields', 'Please fill in name and phone number');
      return;
    }

    if (form.phone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return;
    }

    navigation.navigate('Payment', { tripId, trip, seatNumber, passenger: form });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Passenger Information</Text>
          <Text style={styles.subtitle}>Enter your details</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="+267 72 123 456"
              value={form.phone}
              onChangeText={(text) => setForm({ ...form, phone: text })}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="john@example.com"
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>ID Number (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="123456789"
              value={form.idNumber}
              onChangeText={(text) => setForm({ ...form, idNumber: text })}
            />
          </View>

          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Booking Summary</Text>
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
              <Text style={styles.summaryLabel}>Price:</Text>
              <Text style={styles.summaryValue}>P{trip.price}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue to Payment</Text>
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
  form: { padding: 16 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#374151' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, fontSize: 16 },
  summary: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginTop: 20 },
  summaryTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 14, color: '#666' },
  summaryValue: { fontSize: 14, fontWeight: '600' },
  footer: { backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#e5e5e5' },
  continueButton: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center' },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
