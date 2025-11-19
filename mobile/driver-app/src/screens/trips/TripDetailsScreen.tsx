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
import { format } from 'date-fns';
import { tripService } from '../../services/tripService';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import { Trip } from '../../types';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../lib/constants';

export default function TripDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { tripId } = route.params as { tripId: string };
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

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
          onPress: async (reason) => {
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
    // Check if pre-trip inspection is completed
    navigation.navigate('PreTripInspection' as never, { tripId } as never);
  };

  const handleCompleteTrip = async () => {
    navigation.navigate('PostTripInspection' as never, { tripId } as never);
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
          {format(new Date(trip.departure_time), 'EEEE, MMMM d, yyyy')}
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
                {format(new Date(trip.departure_time), 'HH:mm')}
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
                {format(new Date(trip.arrival_time), 'HH:mm')}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Bus Info */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Bus Details</Text>
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
          <Text style={styles.infoText}>P{trip.price.toFixed(2)} per seat</Text>
        </View>
      </Card>

      {/* Passengers */}
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Passengers</Text>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('PassengerManifest' as never, { tripId } as never)
            }
          >
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.passengerCount}>
          {trip.total_seats - trip.available_seats} / {trip.total_seats} booked
        </Text>
      </Card>

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
                navigation.navigate('PassengerManifest' as never, { tripId } as never)
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
            navigation.navigate('IncidentReport' as never, { tripId } as never)
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
