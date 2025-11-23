import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { safeFormatDate } from '../../lib/dateUtils';
import { tripService } from '../../services/tripService';
import { automationService } from '../../services/automationService';
import { useTripAutomations } from '../../hooks/useTripAutomations';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import { Trip } from '../../types';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../lib/constants';

export default function TripDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { driver } = useAuth();
  const { tripId } = route.params as { tripId: string };
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize automations
  const { startAutomations, stopAutomations, isActive, lastLocation } = useTripAutomations(
    trip && driver
      ? {
          tripId: trip.id,
          driverId: driver.id,
          departureTime: trip.scheduled_departure,
          route: trip.route,
          stops: (trip.route as any)?.stops || [],
          destination: trip.route?.destination,
        }
      : null
  );

  useEffect(() => {
    loadTripDetails();
  }, [tripId]);

  const loadTripDetails = async () => {
    try {
      setLoading(true);
      const data = await tripService.getTripDetails(tripId);
      setTrip(data);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load trip details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTrip = async () => {
    Alert.alert(
      'Accept Trip',
      'Are you sure you want to accept this trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              await tripService.acceptTrip(tripId);
              Alert.alert('Success', 'Trip accepted successfully');
              loadTripDetails();
            } catch (error: any) {
              Alert.alert('Error', 'Failed to accept trip');
            }
          },
        },
      ]
    );
  };

  const handleRejectTrip = async () => {
    Alert.prompt(
      'Reject Trip',
      'Please provide a reason for rejecting this trip:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async (reason?: string) => {
            try {
              await tripService.rejectTrip(tripId, reason || 'No reason provided');
              Alert.alert('Success', 'Trip rejected');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', 'Failed to reject trip');
            }
          },
        },
      ]
    );
  };

  const handleStartTrip = async () => {
    if (!driver || !trip) return;

    try {
      // Check pre-trip inspection
      const inspectionValid = await automationService.validatePreTripInspection(tripId);
      
      if (!inspectionValid) {
        Alert.alert(
          'Pre-Trip Inspection Required',
          'Please complete the pre-trip inspection before starting the trip.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Start Inspection',
              onPress: () => (navigation as any).navigate('PreTripInspection', { tripId }),
            },
          ]
        );
        return;
      }

      // Check driver rest requirement
      const restCheck = await automationService.checkDriverRestRequirement(driver.id, tripId);
      
      if (restCheck.requiresRest) {
        Alert.alert(
          'Rest Required',
          `You have driven ${restCheck.totalHours?.toFixed(1)} hours. Rest required for ${restCheck.hoursRemaining?.toFixed(1)} more hours.`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Auto-assign conductor if needed
      if (!trip.conductor_id && trip.route_id) {
        await automationService.autoAssignConductor(
          tripId,
          trip.route_id,
          safeFormatDate(trip.scheduled_departure, 'yyyy-MM-dd')
        );
      }

      // Start trip
      await tripService.startTrip(tripId);
      
      // Start automations
      await startAutomations();
      
      Alert.alert('Success', 'Trip started! Automations are now active.');
      loadTripDetails();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start trip');
    }
  };

  const handleCompleteTrip = async () => {
    try {
      // Stop automations
      await stopAutomations();
      
      // Navigate to post-trip inspection
      (navigation as any).navigate('PostTripInspection', { tripId });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to complete trip');
    }
  };

  if (loading || !trip) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading trip details...</Text>
      </View>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'EN_ROUTE':
        return 'info';
      case 'CANCELLED':
        return 'danger';
      case 'DELAYED':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.tripNumber}>{trip.trip_number}</Text>
          <Badge
            label={trip.status.replace('_', ' ')}
            variant={getStatusVariant(trip.status)}
          />
        </View>
        <Text style={styles.date}>
          {safeFormatDate(trip.scheduled_departure, 'EEEE, MMMM d, yyyy')}
        </Text>
      </View>

      {/* Route Info */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Route</Text>
        <View style={styles.routeContainer}>
          <View style={styles.routePoint}>
            <View style={styles.routeDot} />
            <View style={styles.routeInfo}>
              <Text style={styles.routeLabel}>From</Text>
              <Text style={styles.routeValue}>{trip.route?.origin}</Text>
              <Text style={styles.routeTime}>
                {safeFormatDate(trip.scheduled_departure, 'HH:mm')}
              </Text>
            </View>
          </View>

          <View style={styles.routeLine} />

          <View style={styles.routePoint}>
            <View style={[styles.routeDot, styles.routeDotEnd]} />
            <View style={styles.routeInfo}>
              <Text style={styles.routeLabel}>To</Text>
              <Text style={styles.routeValue}>{trip.route?.destination}</Text>
              <Text style={styles.routeTime}>
                {safeFormatDate(trip.scheduled_arrival, 'HH:mm')}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Bus Info */}
      <TouchableOpacity
        onPress={() =>
          (navigation as any).navigate('PreTripInspection', { 
            tripId,
            busId: trip.bus_id,
            busRegistration: trip.bus?.registration_number 
          })
        }
      >
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Bus Details</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="bus" size={20} color={COLORS.gray[600]} />
            <Text style={styles.infoText}>
              {trip.bus?.registration_number || 'N/A'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="people" size={20} color={COLORS.gray[600]} />
            <Text style={styles.infoText}>
              {trip.total_seats} seats ({trip.available_seats} available)
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="pricetag" size={20} color={COLORS.gray[600]} />
            <Text style={styles.infoText}>
              P{trip.price ? trip.price.toFixed(2) : '0.00'} per seat
            </Text>
          </View>
          <View style={styles.inspectionHint}>
            <Ionicons name="clipboard-outline" size={16} color={COLORS.primary} />
            <Text style={styles.inspectionHintText}>Tap to start pre-trip inspection</Text>
          </View>
        </Card>
      </TouchableOpacity>

      {/* Passengers */}
      <TouchableOpacity
        onPress={() =>
          (navigation as any).navigate('QRScanner', { tripId })
        }
      >
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Passengers</Text>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                (navigation as any).navigate('PassengerManifest', { tripId });
              }}
            >
              <Text style={styles.viewAll}>View Manifest</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.passengerCount}>
            {trip.total_seats - trip.available_seats} / {trip.total_seats} booked
          </Text>
          <View style={styles.inspectionHint}>
            <Ionicons name="qr-code-outline" size={16} color={COLORS.primary} />
            <Text style={styles.inspectionHintText}>Tap to check-in passengers</Text>
          </View>
        </Card>
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.actions}>
        {trip.status === 'NOT_STARTED' && (
          <>
            <Button
              title="Start Trip"
              onPress={handleStartTrip}
              style={styles.actionButton}
            />
            <View style={styles.actionRow}>
              <Button
                title="Accept"
                onPress={handleAcceptTrip}
                variant="success"
                style={styles.halfButton}
              />
              <Button
                title="Reject"
                onPress={handleRejectTrip}
                variant="danger"
                style={styles.halfButton}
              />
            </View>
          </>
        )}

        {trip.status === 'EN_ROUTE' && (
          <>
            <Button
              title="View Manifest"
              onPress={() =>
                (navigation as any).navigate('PassengerManifest', { tripId })
              }
              style={styles.actionButton}
            />
            <Button
              title="Complete Trip"
              onPress={handleCompleteTrip}
              variant="success"
              style={styles.actionButton}
            />
          </>
        )}

        <Button
          title="Report Incident"
          onPress={() =>
            (navigation as any).navigate('IncidentReport', { tripId })
          }
          variant="outline"
          style={styles.actionButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  tripNumber: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text.primary,
  },
  date: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
  },
  card: {
    margin: SPACING.md,
  },
  cardTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  viewAll: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    fontWeight: '600',
  },
  routeContainer: {
    paddingVertical: SPACING.sm,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },
  routeDotEnd: {
    backgroundColor: COLORS.success,
  },
  routeLine: {
    width: 2,
    height: 40,
    backgroundColor: COLORS.gray[300],
    marginLeft: 5,
    marginVertical: 4,
  },
  routeInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  routeLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  routeValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  routeTime: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    marginTop: 4,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  infoText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
  },
  inspectionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  inspectionHintText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '500',
  },
  passengerCount: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
  },
  actions: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  actionButton: {
    marginBottom: 0,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfButton: {
    flex: 1,
  },
});
