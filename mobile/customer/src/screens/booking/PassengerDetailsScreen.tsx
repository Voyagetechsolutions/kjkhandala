import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useBooking } from '../../context/BookingContext';
import Input from '../../components/Input';
import Button from '../../components/Button';

interface PassengerInfo {
  seatNumber: string;
  fullName: string;
  idNumber: string;
  phone: string;
  email: string;
}

const PassengerDetailsScreen = () => {
  const navigation = useNavigation();
  const { selectedSeats, selectedReturnSeats, setPassengers } = useBooking();

  const allSeats = [...(selectedSeats || []), ...(selectedReturnSeats || [])];
  
  const [passengerData, setPassengerData] = useState<PassengerInfo[]>(
    allSeats.map((seat) => ({
      seatNumber: seat.toString(),
      fullName: '',
      idNumber: '',
      phone: '',
      email: '',
    }))
  );

  const updatePassenger = (index: number, field: keyof PassengerInfo, value: string) => {
    const updated = [...passengerData];
    updated[index] = { ...updated[index], [field]: value };
    setPassengerData(updated);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string) => {
    return /^[0-9]{8,15}$/.test(phone.replace(/[\s-]/g, ''));
  };

  const handleContinue = () => {
    // Validate all fields
    for (let i = 0; i < passengerData.length; i++) {
      const passenger = passengerData[i];
      
      if (!passenger.fullName.trim()) {
        Alert.alert('Error', `Please enter full name for Seat ${passenger.seatNumber}`);
        return;
      }
      
      if (!passenger.idNumber.trim()) {
        Alert.alert('Error', `Please enter ID/Passport for Seat ${passenger.seatNumber}`);
        return;
      }
      
      if (!passenger.phone.trim() || !validatePhone(passenger.phone)) {
        Alert.alert('Error', `Please enter valid phone number for Seat ${passenger.seatNumber}`);
        return;
      }
      
      if (!passenger.email.trim() || !validateEmail(passenger.email)) {
        Alert.alert('Error', `Please enter valid email for Seat ${passenger.seatNumber}`);
        return;
      }
    }

    setPassengers(passengerData);
    navigation.navigate('Payment' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#2563eb" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Passenger Details</Text>
          <Text style={styles.headerSubtitle}>
            {passengerData.length} passenger{passengerData.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {passengerData.map((passenger, index) => (
          <View key={index} style={styles.passengerCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="person" size={20} color="#2563eb" />
              <Text style={styles.cardTitle}>Passenger {index + 1}</Text>
              <View style={styles.seatBadge}>
                <Ionicons name="airplane" size={14} color="#6b7280" />
                <Text style={styles.seatText}>Seat {passenger.seatNumber}</Text>
              </View>
            </View>

            <Input
              label="Full Name"
              value={passenger.fullName}
              onChangeText={(value) => updatePassenger(index, 'fullName', value)}
              placeholder="Enter full name as per ID"
            />

            <Input
              label="ID / Passport Number"
              value={passenger.idNumber}
              onChangeText={(value) => updatePassenger(index, 'idNumber', value)}
              placeholder="Enter ID or passport number"
            />

            <Input
              label="Phone Number"
              value={passenger.phone}
              onChangeText={(value) => updatePassenger(index, 'phone', value)}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />

            <Input
              label="Email Address"
              value={passenger.email}
              onChangeText={(value) => updatePassenger(index, 'email', value)}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        ))}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#2563eb" />
          <Text style={styles.infoText}>
            Please ensure all details match your identification documents
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Continue to Payment" onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
  passengerCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  seatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  seatText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2563eb',
    marginLeft: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1e40af',
  },
  footer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
});

export default PassengerDetailsScreen;
