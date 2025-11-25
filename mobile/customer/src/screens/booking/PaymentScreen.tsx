import React, { useState } from 'react';
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
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatCurrency, formatTime, formatDate } from '../../utils/formatters';
import Button from '../../components/Button';
import COLORS from '../../constants/colors';

type PaymentMethod = 'CASH' | 'ORANGE_MONEY' | 'MYZAKA' | 'CARD';

const PaymentScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { selectedTrip, selectedReturnTrip, selectedSeats, selectedReturnSeats, searchParams, passengers } = useBooking();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('CASH');
  const [processing, setProcessing] = useState(false);

  const calculateTotal = () => {
    let total = 0;
    if (selectedTrip) {
      total += selectedTrip.fare * (selectedSeats?.length || 0);
    }
    if (selectedReturnTrip) {
      total += selectedReturnTrip.fare * (selectedReturnSeats?.length || 0);
    }
    return total;
  };

  const generateBookingReference = () => {
    return `BK${Date.now().toString().slice(-8)}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  };

  const handlePayment = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in to complete booking');
      return;
    }

    try {
      setProcessing(true);

      const bookingReference = generateBookingReference();
      const totalFare = calculateTotal();

      // Get first passenger details (primary passenger)
      const primaryPassenger = passengers && passengers.length > 0 ? passengers[0] : null;
      const outboundFare = selectedTrip ? selectedTrip.fare * (selectedSeats?.length || 0) : 0;
      const amountPaid = selectedMethod === 'CASH' ? 0 : outboundFare;
      const balance = outboundFare - amountPaid;

      // Check if trip is projected (ID starts with 'projected-')
      const isProjectedTrip = selectedTrip?.id?.toString().startsWith('projected-');
      const tripId = isProjectedTrip ? null : selectedTrip?.id;

      // Store trip details for projected trips
      const tripMetadata = isProjectedTrip ? JSON.stringify({
        projected_trip_id: selectedTrip?.id,
        origin: selectedTrip?.route?.origin,
        destination: selectedTrip?.route?.destination,
        scheduled_departure: selectedTrip?.scheduled_departure,
        scheduled_arrival: selectedTrip?.scheduled_arrival,
        bus_name: selectedTrip?.bus?.name,
        trip_number: selectedTrip?.trip_number,
      }) : null;

      // Create outbound booking
      const { data: outboundBooking, error: outboundError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          trip_id: tripId,
          booking_reference: bookingReference,
          booked_by: user.id,
          flow_step: tripMetadata, // Store projected trip details
          
          // Passenger Information
          passenger_name: primaryPassenger?.fullName || user.full_name || '',
          passenger_email: primaryPassenger?.email || user.email || '',
          passenger_phone: primaryPassenger?.phone || user.phone || '',
          
          // Financial Information
          total_amount: outboundFare,
          base_fare: selectedTrip?.fare || 0,
          amount_paid: amountPaid,
          balance: balance,
          
          // Booking Details
          number_of_passengers: selectedSeats?.length || 1,
          seat_number: selectedSeats?.join(',') || '',
          
          // Status
          booking_status: selectedMethod === 'CASH' ? 'reserved' : 'confirmed',
          payment_method: selectedMethod,
          payment_status: selectedMethod === 'CASH' ? 'pending' : 'paid',
          
          // Reservation
          is_reservation: selectedMethod === 'CASH' ? 'true' : 'false',
          reservation_expires_at: selectedMethod === 'CASH' 
            ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
            : null,
        })
        .select()
        .single();

      if (outboundError) throw outboundError;

      // Create return booking if exists
      let returnBooking = null;
      if (selectedReturnTrip && selectedReturnSeats && selectedReturnSeats.length > 0) {
        const returnFare = selectedReturnTrip.fare * selectedReturnSeats.length;
        const returnAmountPaid = selectedMethod === 'CASH' ? 0 : returnFare;
        const returnBalance = returnFare - returnAmountPaid;

        // Check if return trip is projected
        const isProjectedReturnTrip = selectedReturnTrip.id?.toString().startsWith('projected-');
        const returnTripId = isProjectedReturnTrip ? null : selectedReturnTrip.id;

        // Store return trip details for projected trips
        const returnTripMetadata = isProjectedReturnTrip ? JSON.stringify({
          projected_trip_id: selectedReturnTrip.id,
          origin: selectedReturnTrip.route?.origin,
          destination: selectedReturnTrip.route?.destination,
          scheduled_departure: selectedReturnTrip.scheduled_departure,
          scheduled_arrival: selectedReturnTrip.scheduled_arrival,
          bus_name: selectedReturnTrip.bus?.name,
          trip_number: selectedReturnTrip.trip_number,
        }) : null;

        const { data: returnData, error: returnError } = await supabase
          .from('bookings')
          .insert({
            user_id: user.id,
            trip_id: returnTripId,
            booking_reference: bookingReference,
            booked_by: user.id,
            flow_step: returnTripMetadata, // Store projected trip details
            
            // Passenger Information
            passenger_name: primaryPassenger?.fullName || user.full_name || '',
            passenger_email: primaryPassenger?.email || user.email || '',
            passenger_phone: primaryPassenger?.phone || user.phone || '',
            
            // Financial Information
            total_amount: returnFare,
            base_fare: selectedReturnTrip.fare,
            amount_paid: returnAmountPaid,
            balance: returnBalance,
            
            // Booking Details
            number_of_passengers: selectedReturnSeats.length,
            seat_number: selectedReturnSeats.join(','),
            
            // Status
            booking_status: selectedMethod === 'CASH' ? 'reserved' : 'confirmed',
            payment_method: selectedMethod,
            payment_status: selectedMethod === 'CASH' ? 'pending' : 'paid',
            
            // Reservation
            is_reservation: selectedMethod === 'CASH' ? 'true' : 'false',
            reservation_expires_at: selectedMethod === 'CASH' 
              ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
              : null,
          })
          .select()
          .single();

        if (returnError) throw returnError;
        returnBooking = returnData;
      }

      // Create payment record
      await supabase.from('payments').insert({
        booking_id: outboundBooking.id,
        amount: totalFare,
        payment_method: selectedMethod,
        payment_status: selectedMethod === 'CASH' ? 'PENDING' : 'COMPLETED',
      });

      Alert.alert(
        'Booking Confirmed!',
        `Your booking reference is ${bookingReference}`,
        [
          {
            text: 'View Ticket',
            onPress: () => (navigation as any).navigate('Ticket', { bookingReference }),
          },
        ]
      );
    } catch (error: any) {
      console.error('Payment error:', error);
      Alert.alert('Payment Failed', error.message || 'Please try again');
    } finally {
      setProcessing(false);
    }
  };

  const paymentMethods = [
    { id: 'CASH' as PaymentMethod, name: 'Cash on Arrival', icon: 'cash-outline', color: COLORS.cash },
    { id: 'ORANGE_MONEY' as PaymentMethod, name: 'Orange Money', icon: 'phone-portrait-outline', color: COLORS.orangeMoney },
    { id: 'MYZAKA' as PaymentMethod, name: 'MyZaka', icon: 'wallet-outline', color: COLORS.myZaka },
    { id: 'CARD' as PaymentMethod, name: 'Card Payment', icon: 'card-outline', color: COLORS.card },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Payment</Text>
          <Text style={styles.headerSubtitle}>Complete your booking</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Booking Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Summary</Text>

          {selectedTrip && (
            <View style={styles.tripCard}>
              <View style={styles.tripHeader}>
                <Ionicons name="arrow-forward" size={20} color="#2563eb" />
                <Text style={styles.tripTitle}>Outbound Trip</Text>
              </View>
              <Text style={styles.tripRoute}>
                {selectedTrip.route.origin} → {selectedTrip.route.destination}
              </Text>
              <Text style={styles.tripDate}>
                {formatDate(selectedTrip.scheduled_departure)} at {formatTime(selectedTrip.scheduled_departure)}
              </Text>
              <Text style={styles.tripSeats}>
                Seats: {selectedSeats?.join(', ')}
              </Text>
              <Text style={styles.tripFare}>
                {formatCurrency(selectedTrip.fare)} × {selectedSeats?.length} = {formatCurrency(selectedTrip.fare * (selectedSeats?.length || 0))}
              </Text>
            </View>
          )}

          {selectedReturnTrip && (
            <View style={styles.tripCard}>
              <View style={styles.tripHeader}>
                <Ionicons name="arrow-back" size={20} color="#10b981" />
                <Text style={styles.tripTitle}>Return Trip</Text>
              </View>
              <Text style={styles.tripRoute}>
                {selectedReturnTrip.route.origin} → {selectedReturnTrip.route.destination}
              </Text>
              <Text style={styles.tripDate}>
                {formatDate(selectedReturnTrip.scheduled_departure)} at {formatTime(selectedReturnTrip.scheduled_departure)}
              </Text>
              <Text style={styles.tripSeats}>
                Seats: {selectedReturnSeats?.join(', ')}
              </Text>
              <Text style={styles.tripFare}>
                {formatCurrency(selectedReturnTrip.fare)} × {selectedReturnSeats?.length} = {formatCurrency(selectedReturnTrip.fare * (selectedReturnSeats?.length || 0))}
              </Text>
            </View>
          )}

          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>{formatCurrency(calculateTotal())}</Text>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentMethod,
                selectedMethod === method.id && styles.paymentMethodSelected,
              ]}
              onPress={() => setSelectedMethod(method.id)}
            >
              <View style={[styles.methodIcon, { backgroundColor: `${method.color}20` }]}>
                <Ionicons name={method.icon as any} size={24} color={method.color} />
              </View>
              <Text style={styles.methodName}>{method.name}</Text>
              <View style={styles.radioButton}>
                {selectedMethod === method.id && <View style={styles.radioButtonInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {selectedMethod === 'CASH' && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#f59e0b" />
            <Text style={styles.infoText}>
              Pay cash at the bus terminal before departure
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={processing ? 'Processing...' : `Pay ${formatCurrency(calculateTotal())}`}
          onPress={handlePayment}
          loading={processing}
          disabled={processing}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  tripCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  tripRoute: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  tripDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  tripSeats: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  tripFare: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
    marginTop: 8,
  },
  totalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  paymentMethodSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.gray100,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  methodName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.gray300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginTop: 0,
    padding: 12,
    backgroundColor: COLORS.warning + '20',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  footer: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

export default PaymentScreen;
