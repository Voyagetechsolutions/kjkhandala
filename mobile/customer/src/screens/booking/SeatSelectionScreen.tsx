import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useBooking } from '../../context/BookingContext';
import { supabase } from '../../lib/supabase';
import Button from '../../components/Button';

interface Seat {
  number: string;
  status: 'available' | 'booked' | 'selected';
}

const SeatSelectionScreen = () => {
  const navigation = useNavigation();
  const { selectedTrip, selectedReturnTrip, setSelectedSeats, searchParams } = useBooking();

  const [outboundSeats, setOutboundSeats] = useState<Seat[]>([]);
  const [returnSeats, setReturnSeats] = useState<Seat[]>([]);
  const [selectedOutboundSeats, setSelectedOutboundSeats] = useState<number[]>([]);
  const [selectedReturnSeats, setSelectedReturnSeats] = useState<number[]>([]);
  const [showingReturnSeats, setShowingReturnSeats] = useState(false);
  const [loading, setLoading] = useState(true);

  const totalSeats = selectedTrip?.total_seats || 60;
  const seatsPerRow = 4;
  const rows = Math.ceil(totalSeats / seatsPerRow);

  useEffect(() => {
    loadSeats();
  }, []);

  const loadSeats = async () => {
    try {
      setLoading(true);
      
      // Generate seat layout
      const outbound: Seat[] = [];
      for (let i = 1; i <= totalSeats; i++) {
        outbound.push({
          number: i.toString(),
          status: 'available', // In production, fetch booked seats from database
        });
      }
      setOutboundSeats(outbound);

      if (selectedReturnTrip) {
        const returnTotal = selectedReturnTrip.total_seats || 60;
        const returnSeatsList: Seat[] = [];
        for (let i = 1; i <= returnTotal; i++) {
          returnSeatsList.push({
            number: i.toString(),
            status: 'available',
          });
        }
        setReturnSeats(returnSeatsList);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load seats');
    } finally {
      setLoading(false);
    }
  };

  const handleSeatPress = (seatNumber: string) => {
    const seatNum = parseInt(seatNumber);
    if (showingReturnSeats) {
      if (selectedReturnSeats.includes(seatNum)) {
        setSelectedReturnSeats(selectedReturnSeats.filter(s => s !== seatNum));
      } else {
        if (selectedReturnSeats.length < (searchParams?.passengers || 1)) {
          setSelectedReturnSeats([...selectedReturnSeats, seatNum]);
        } else {
          Alert.alert('Limit Reached', `You can only select ${searchParams?.passengers} seat(s)`);
        }
      }
    } else {
      if (selectedOutboundSeats.includes(seatNum)) {
        setSelectedOutboundSeats(selectedOutboundSeats.filter(s => s !== seatNum));
      } else {
        if (selectedOutboundSeats.length < (searchParams?.passengers || 1)) {
          setSelectedOutboundSeats([...selectedOutboundSeats, seatNum]);
        } else {
          Alert.alert('Limit Reached', `You can only select ${searchParams?.passengers} seat(s)`);
        }
      }
    }
  };

  const handleContinue = () => {
    const requiredSeats = searchParams?.passengers || 1;
    
    if (showingReturnSeats) {
      if (selectedReturnSeats.length !== requiredSeats) {
        Alert.alert('Error', `Please select ${requiredSeats} seat(s) for return trip`);
        return;
      }
      setSelectedReturnSeats(selectedReturnSeats);
      navigation.navigate('PassengerDetails' as never);
    } else {
      if (selectedOutboundSeats.length !== requiredSeats) {
        Alert.alert('Error', `Please select ${requiredSeats} seat(s)`);
        return;
      }
      setSelectedSeats(selectedOutboundSeats);
      
      if (selectedReturnTrip) {
        setShowingReturnSeats(true);
      } else {
        navigation.navigate('PassengerDetails' as never);
      }
    }
  };

  const renderSeat = (seat: Seat) => {
    const seatNum = parseInt(seat.number);
    const isSelected = showingReturnSeats 
      ? selectedReturnSeats.includes(seatNum)
      : selectedOutboundSeats.includes(seatNum);
    
    const isBooked = seat.status === 'booked';

    return (
      <TouchableOpacity
        key={seat.number}
        style={[
          styles.seat,
          isBooked && styles.seatBooked,
          isSelected && styles.seatSelected,
        ]}
        onPress={() => !isBooked && handleSeatPress(seat.number)}
        disabled={isBooked}
      >
        <Ionicons
          name={isBooked ? 'close' : isSelected ? 'checkmark' : 'square-outline'}
          size={20}
          color={isBooked ? '#9ca3af' : isSelected ? '#ffffff' : '#6b7280'}
        />
        <Text
          style={[
            styles.seatNumber,
            isBooked && styles.seatNumberBooked,
            isSelected && styles.seatNumberSelected,
          ]}
        >
          {seat.number}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading seats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentSeats = showingReturnSeats ? returnSeats : outboundSeats;
  const currentSelected = showingReturnSeats ? selectedReturnSeats : selectedOutboundSeats;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => showingReturnSeats ? setShowingReturnSeats(false) : navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#2563eb" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {showingReturnSeats ? 'Select Return Seats' : 'Select Outbound Seats'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {currentSelected.length} / {searchParams?.passengers} selected
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.legendAvailable]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.legendSelected]} />
            <Text style={styles.legendText}>Selected</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.legendBooked]} />
            <Text style={styles.legendText}>Booked</Text>
          </View>
        </View>

        {/* Bus Front */}
        <View style={styles.busHeader}>
          <Ionicons name="car-sport" size={32} color="#6b7280" />
          <Text style={styles.busHeaderText}>Front of Bus</Text>
        </View>

        {/* Seat Layout */}
        <View style={styles.seatLayout}>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <View key={rowIndex} style={styles.seatRow}>
              {/* Left side seats */}
              <View style={styles.seatSide}>
                {currentSeats
                  .slice(rowIndex * seatsPerRow, rowIndex * seatsPerRow + 2)
                  .map(renderSeat)}
              </View>

              {/* Aisle */}
              <View style={styles.aisle} />

              {/* Right side seats */}
              <View style={styles.seatSide}>
                {currentSeats
                  .slice(rowIndex * seatsPerRow + 2, rowIndex * seatsPerRow + 4)
                  .map(renderSeat)}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={showingReturnSeats ? 'Continue to Passenger Details' : selectedReturnTrip ? 'Select Return Seats' : 'Continue'}
          onPress={handleContinue}
          disabled={currentSelected.length !== (searchParams?.passengers || 1)}
        />
      </View>
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
  scrollView: {
    flex: 1,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginRight: 6,
  },
  legendAvailable: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  legendSelected: {
    backgroundColor: '#2563eb',
  },
  legendBooked: {
    backgroundColor: '#e5e7eb',
  },
  legendText: {
    fontSize: 14,
    color: '#6b7280',
  },
  busHeader: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  busHeaderText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  seatLayout: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  seatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  seatSide: {
    flexDirection: 'row',
    gap: 8,
  },
  aisle: {
    width: 40,
  },
  seat: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seatBooked: {
    backgroundColor: '#e5e7eb',
    borderColor: '#9ca3af',
  },
  seatSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#1e40af',
  },
  seatNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 2,
  },
  seatNumberBooked: {
    color: '#9ca3af',
  },
  seatNumberSelected: {
    color: '#ffffff',
  },
  footer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
});

export default SeatSelectionScreen;
