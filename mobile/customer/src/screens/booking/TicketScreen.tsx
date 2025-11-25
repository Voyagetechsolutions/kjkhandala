import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '../../lib/supabase';
import { formatCurrency, formatTime, formatDate } from '../../utils/formatters';
import Button from '../../components/Button';

const TicketScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookingReference } = (route.params as any) || {};

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    if (bookingReference) {
      loadBooking();
    }
  }, [bookingReference]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      
      // First, get the booking without trip join (since trip_id might be null for projected trips)
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_reference', bookingReference)
        .single();

      if (bookingError) throw bookingError;

      // If booking has a trip_id, fetch the trip details
      let tripData = null;
      if (bookingData.trip_id) {
        const { data: trip, error: tripError } = await supabase
          .from('trips')
          .select(`
            *,
            routes (origin, destination),
            buses (name, bus_type)
          `)
          .eq('id', bookingData.trip_id)
          .single();

        if (!tripError) {
          tripData = trip;
        }
      } else if (bookingData.flow_step) {
        // If no trip_id, parse the projected trip data from flow_step
        try {
          tripData = JSON.parse(bookingData.flow_step);
        } catch (e) {
          console.error('Error parsing trip metadata:', e);
        }
      }

      // Combine booking with trip data
      const fullBooking = {
        ...bookingData,
        trips: tripData,
      };

      setBooking(fullBooking);
    } catch (error) {
      console.error('Error loading booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `KJ Khandala Travel E-Ticket\nBooking Reference: ${bookingReference}\nRoute: ${booking?.trips?.routes?.origin} → ${booking?.trips?.routes?.destination}\nDate: ${formatDate(booking?.trips?.scheduled_departure)}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading ticket...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="ticket-outline" size={64} color="#9ca3af" />
          <Text style={styles.emptyTitle}>Ticket Not Found</Text>
          <Button
            title="Go to My Trips"
            onPress={() => navigation.navigate('Main' as never)}
            style={styles.button}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Main' as never)}
          style={styles.backButton}
        >
          <Ionicons name="close" size={24} color="#2563eb" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>E-Ticket</Text>
        </View>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.ticketCard}>
          <View style={styles.successBadge}>
            <Ionicons name="checkmark-circle" size={48} color="#10b981" />
            <Text style={styles.successTitle}>Booking Confirmed!</Text>
            <Text style={styles.successSubtitle}>Your ticket has been generated</Text>
          </View>

          <View style={styles.qrContainer}>
            <QRCode value={bookingReference} size={200} />
            <Text style={styles.bookingReference}>{bookingReference}</Text>
          </View>

          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Trip Details</Text>
            
            <View style={styles.detailRow}>
              <Ionicons name="location" size={20} color="#6b7280" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Route</Text>
                <Text style={styles.detailValue}>
                  {booking.trips?.routes?.origin} → {booking.trips?.routes?.destination}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="calendar" size={20} color="#6b7280" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>
                  {formatDate(booking.trips?.scheduled_departure)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="time" size={20} color="#6b7280" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Departure Time</Text>
                <Text style={styles.detailValue}>
                  {formatTime(booking.trips?.scheduled_departure)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="bus" size={20} color="#6b7280" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Bus</Text>
                <Text style={styles.detailValue}>
                  {booking.trips?.buses?.name} ({booking.trips?.buses?.bus_type})
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            
            <View style={styles.detailRow}>
              <Ionicons name="cash" size={20} color="#6b7280" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Total Fare</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(booking.total_fare)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="card" size={20} color="#6b7280" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Payment Method</Text>
                <Text style={styles.detailValue}>{booking.payment_method}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="information-circle" size={20} color="#6b7280" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Payment Status</Text>
                <View
                  style={[
                    styles.statusBadge,
                    booking.payment_status === 'PAID'
                      ? styles.statusPaid
                      : styles.statusPending,
                  ]}
                >
                  <Text style={styles.statusText}>{booking.payment_status}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.instructionsBox}>
            <Ionicons name="information-circle" size={20} color="#2563eb" />
            <View style={styles.instructionsContent}>
              <Text style={styles.instructionsTitle}>Important Instructions</Text>
              <Text style={styles.instructionsText}>
                • Present this QR code at the terminal{'\n'}
                • Arrive 30 minutes before departure{'\n'}
                • Carry valid identification{'\n'}
                {booking.payment_status === 'PENDING' &&
                  '• Complete payment before boarding'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="View My Trips"
          onPress={() => navigation.navigate('Main' as never)}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  button: {
    marginTop: 24,
    minWidth: 200,
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
  shareButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  ticketCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  successBadge: {
    alignItems: 'center',
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
    marginTop: 12,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  bookingReference: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: 2,
  },
  detailsSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPaid: {
    backgroundColor: '#d1fae5',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  instructionsBox: {
    flexDirection: 'row',
    marginTop: 20,
    padding: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  instructionsContent: {
    flex: 1,
    marginLeft: 12,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
});

export default TicketScreen;
