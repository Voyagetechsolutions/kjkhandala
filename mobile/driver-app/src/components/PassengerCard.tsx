import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import Badge from './Badge';
import { Booking } from '../types';
import { COLORS, SPACING, TYPOGRAPHY } from '../lib/constants';

interface PassengerCardProps {
  booking: Booking;
  onCheckIn?: () => void;
  onNoShow?: () => void;
  onAddNotes?: () => void;
}

export default function PassengerCard({
  booking,
  onCheckIn,
  onNoShow,
  onAddNotes,
}: PassengerCardProps) {
  const getStatusBadge = () => {
    switch (booking.check_in_status) {
      case 'boarded':
        return <Badge label="Boarded" variant="success" />;
      case 'no_show':
        return <Badge label="No Show" variant="danger" />;
      default:
        return <Badge label="Not Boarded" variant="default" />;
    }
  };

  const getPaymentBadge = () => {
    switch (booking.payment_status) {
      case 'paid':
        return <Badge label="Paid" variant="success" />;
      case 'refunded':
        return <Badge label="Refunded" variant="warning" />;
      default:
        return <Badge label="Pending" variant="warning" />;
    }
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.seatContainer}>
          <Ionicons name="person" size={20} color={COLORS.primary} />
          <Text style={styles.seatNumber}>Seat {booking.seat_number}</Text>
        </View>
        {getStatusBadge()}
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{booking.passenger_name}</Text>
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={16} color={COLORS.gray[600]} />
          <Text style={styles.infoText}>{booking.passenger_phone}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="card-outline" size={16} color={COLORS.gray[600]} />
          <Text style={styles.infoText}>{booking.passenger_id_number}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons
            name={booking.luggage ? 'bag-check' : 'bag-outline'}
            size={16}
            color={COLORS.gray[600]}
          />
          <Text style={styles.infoText}>
            {booking.luggage ? 'Has luggage' : 'No luggage'}
          </Text>
        </View>
        {getPaymentBadge()}
      </View>

      {booking.check_in_status === 'not_boarded' && (
        <View style={styles.actions}>
          {onCheckIn && (
            <TouchableOpacity style={styles.actionButton} onPress={onCheckIn}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <Text style={[styles.actionText, { color: COLORS.success }]}>
                Check In
              </Text>
            </TouchableOpacity>
          )}
          {onNoShow && (
            <TouchableOpacity style={styles.actionButton} onPress={onNoShow}>
              <Ionicons name="close-circle" size={20} color={COLORS.danger} />
              <Text style={[styles.actionText, { color: COLORS.danger }]}>
                No Show
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {onAddNotes && (
        <TouchableOpacity style={styles.notesButton} onPress={onAddNotes}>
          <Ionicons name="create-outline" size={16} color={COLORS.primary} />
          <Text style={styles.notesText}>Add Notes</Text>
        </TouchableOpacity>
      )}
    </Card>
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
  seatContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  seatNumber: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
  },
  info: {
    gap: SPACING.sm,
  },
  name: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  infoText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.gray[100],
  },
  actionText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
  },
  notesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  notesText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
