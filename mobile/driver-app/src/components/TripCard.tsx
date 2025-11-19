import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import Card from './Card';
import Badge from './Badge';
import { Trip } from '../types';
import { COLORS, SPACING, TYPOGRAPHY } from '../lib/constants';

interface TripCardProps {
  trip: Trip;
  onPress?: () => void;
}

export default function TripCard({ trip, onPress }: TripCardProps) {
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

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  };

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.tripNumber}>{trip.trip_number}</Text>
            <Badge
              label={trip.status.replace('_', ' ')}
              variant={getStatusVariant(trip.status)}
            />
          </View>
          {onPress && (
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
          )}
        </View>

        <View style={styles.route}>
          <View style={styles.routePoint}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <View style={styles.routeText}>
              <Text style={styles.routeLabel}>From</Text>
              <Text style={styles.routeValue}>{trip.route?.origin || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.routeLine} />

          <View style={styles.routePoint}>
            <Ionicons name="location" size={20} color={COLORS.success} />
            <View style={styles.routeText}>
              <Text style={styles.routeLabel}>To</Text>
              <Text style={styles.routeValue}>{trip.route?.destination || 'N/A'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color={COLORS.gray[600]} />
            <Text style={styles.detailText}>
              {formatTime(trip.departure_time)} - {formatTime(trip.arrival_time)}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="bus-outline" size={16} color={COLORS.gray[600]} />
            <Text style={styles.detailText}>
              {trip.bus?.registration_number || 'N/A'}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="people-outline" size={16} color={COLORS.gray[600]} />
            <Text style={styles.detailText}>
              {trip.total_seats - trip.available_seats}/{trip.total_seats} passengers
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  tripNumber: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
  },
  route: {
    marginBottom: SPACING.md,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  routeText: {
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
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: COLORS.gray[300],
    marginLeft: 9,
    marginVertical: 4,
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
  },
});
