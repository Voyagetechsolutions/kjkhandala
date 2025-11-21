import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { tripService } from '../services/tripService';

export default function SeatSelectionScreen({ route, navigation }: any) {
  const { tripId, trip } = route.params || {};
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  if (!tripId || !trip) {
    return (
      <View style={styles.centered}>
        <Text style={{ fontSize: 16, color: '#666' }}>Trip not specified</Text>
      </View>
    );
  }

  useEffect(() => {
    loadOccupiedSeats();
  }, []);

  const loadOccupiedSeats = async () => {
    try {
      const seats = await tripService.getOccupiedSeats(tripId);
      setOccupiedSeats(seats || []);
    } catch (error) {
      console.error('Error loading seats:', error);
      Alert.alert('Error', 'Unable to load seat availability');
    } finally {
      setLoading(false);
    }
  };
  
  const rows = ['A', 'B', 'C', 'D', 'E'];
  const seatsPerRow = 10;

  const handleSeatPress = (seat: string) => {
    if (occupiedSeats.includes(seat)) {
      Alert.alert('Unavailable', 'This seat is already taken');
      return;
    }
    setSelectedSeat(seat);
  };

  const handleContinue = () => {
    if (!selectedSeat) {
      Alert.alert('Select Seat', 'Please select a seat to continue');
      return;
    }
    navigation.navigate('PassengerInfo', { tripId, trip, seatNumber: selectedSeat });
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
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Your Seat</Text>
          <Text style={styles.subtitle}>Tap on an available seat</Text>
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.available]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.selected]} />
            <Text style={styles.legendText}>Selected</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.occupied]} />
            <Text style={styles.legendText}>Occupied</Text>
          </View>
        </View>

        <View style={styles.seatMap}>
          {rows.map((row) => (
            <View key={row} style={styles.row}>
              <Text style={styles.rowLabel}>{row}</Text>
              {Array.from({ length: seatsPerRow }, (_, i) => {
                const seatNumber = `${row}${i + 1}`;
                const isOccupied = occupiedSeats.includes(seatNumber);
                const isSelected = selectedSeat === seatNumber;

                return (
                  <TouchableOpacity
                    key={seatNumber}
                    style={[
                      styles.seat,
                      isOccupied && styles.seatOccupied,
                      isSelected && styles.seatSelected,
                    ]}
                    onPress={() => handleSeatPress(seatNumber)}
                    disabled={isOccupied}
                  >
                    <Text style={[
                      styles.seatText,
                      (isOccupied || isSelected) && styles.seatTextWhite
                    ]}>
                      {i + 1}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.selectedLabel}>Selected Seat</Text>
          <Text style={styles.selectedSeat}>{selectedSeat || 'None'}</Text>
        </View>
        <TouchableOpacity
          style={[styles.continueButton, !selectedSeat && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!selectedSeat}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  header: { backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  legend: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', padding: 16, marginTop: 16, marginHorizontal: 16, borderRadius: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendBox: { width: 24, height: 24, borderRadius: 4, marginRight: 8 },
  legendText: { fontSize: 12, color: '#666' },
  available: { backgroundColor: '#e5e7eb' },
  selected: { backgroundColor: '#2563eb' },
  occupied: { backgroundColor: '#ef4444' },
  seatMap: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  rowLabel: { width: 30, fontSize: 16, fontWeight: '600', color: '#666' },
  seat: { width: 32, height: 32, backgroundColor: '#e5e7eb', borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginHorizontal: 2 },
  seatOccupied: { backgroundColor: '#ef4444' },
  seatSelected: { backgroundColor: '#2563eb' },
  seatText: { fontSize: 10, fontWeight: '600', color: '#666' },
  seatTextWhite: { color: '#fff' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#e5e5e5' },
  selectedLabel: { fontSize: 14, color: '#666' },
  selectedSeat: { fontSize: 20, fontWeight: '700', color: '#2563eb' },
  continueButton: { backgroundColor: '#2563eb', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 8 },
  buttonDisabled: { backgroundColor: '#cbd5e1' },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
