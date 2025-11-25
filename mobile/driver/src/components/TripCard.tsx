import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip, Button, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import type { Trip } from '@/types';

interface TripCardProps {
  trip: Trip;
  onPress?: () => void;
  onStartTrip?: () => void;
  onCompleteTrip?: () => void;
}

export function TripCard({ trip, onPress, onStartTrip, onCompleteTrip }: TripCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return '#4CAF50';
      case 'completed':
        return '#9E9E9E';
      case 'delayed':
        return '#FF9800';
      case 'cancelled':
        return '#f44336';
      default:
        return '#2196F3';
    }
  };

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="map-marker-path" size={24} color="#1976D2" />
            <Text variant="titleMedium" style={styles.tripNumber}>
              Trip #{trip.trip_number}
            </Text>
          </View>
          <Chip 
            style={[styles.statusChip, { backgroundColor: getStatusColor(trip.status) }]}
            textStyle={styles.statusText}
          >
            {trip.status.replace('_', ' ').toUpperCase()}
          </Chip>
        </View>

        <View style={styles.routeInfo}>
          <Text variant="bodyMedium" style={styles.routeName}>
            {trip.route?.route_name || 'Unknown Route'}
          </Text>
          <Text variant="bodySmall" style={styles.routeDetails}>
            {trip.route?.origin} → {trip.route?.destination}
          </Text>
        </View>

        <View style={styles.timeInfo}>
          <View style={styles.timeRow}>
            <MaterialCommunityIcons name="clock-outline" size={18} color="#666" />
            <Text variant="bodySmall" style={styles.timeText}>
              Scheduled: {format(new Date(trip.scheduled_departure), 'HH:mm')}
            </Text>
          </View>
          {trip.actual_departure && (
            <View style={styles.timeRow}>
              <MaterialCommunityIcons name="clock-check" size={18} color="#4CAF50" />
              <Text variant="bodySmall" style={styles.timeText}>
                Departed: {format(new Date(trip.actual_departure), 'HH:mm')}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.passengerInfo}>
          <MaterialCommunityIcons name="account-group" size={20} color="#666" />
          <Text variant="bodyMedium" style={styles.passengerText}>
            {trip.passengers_count} passengers
          </Text>
        </View>

        {trip.status === 'in_progress' && (
          <ProgressBar 
            indeterminate 
            color="#4CAF50" 
            style={styles.progressBar}
          />
        )}

        <View style={styles.actions}>
          {trip.status === 'scheduled' && onStartTrip && (
            <Button 
              mode="contained" 
              onPress={onStartTrip}
              style={styles.actionButton}
              icon="play"
            >
              Start Trip
            </Button>
          )}

          {trip.status === 'in_progress' && onCompleteTrip && (
            <Button 
              mode="contained" 
              onPress={onCompleteTrip}
              style={[styles.actionButton, styles.completeButton]}
              icon="check"
            >
              Complete Trip
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tripNumber: {
    fontWeight: 'bold',
    color: '#1976D2',
  },
  statusChip: {
    height: 28,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  routeInfo: {
    marginBottom: 12,
  },
  routeName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  routeDetails: {
    color: '#666',
  },
  timeInfo: {
    marginBottom: 12,
    gap: 6,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    color: '#666',
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  passengerText: {
    color: '#333',
  },
  progressBar: {
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
});
