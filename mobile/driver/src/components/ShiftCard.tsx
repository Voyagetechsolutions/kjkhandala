import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import type { Shift } from '@/types';

interface ShiftCardProps {
  shift: Shift;
  onPress?: () => void;
  onStartShift?: () => void;
  onEndShift?: () => void;
}

export function ShiftCard({ shift, onPress, onStartShift, onEndShift }: ShiftCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'completed':
        return '#9E9E9E';
      case 'cancelled':
        return '#f44336';
      default:
        return '#2196F3';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return 'play-circle';
      case 'completed':
        return 'check-circle';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'clock-outline';
    }
  };

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons 
              name="bus" 
              size={24} 
              color="#1976D2" 
            />
            <Text variant="titleMedium" style={styles.busNumber}>
              {shift.bus?.bus_number || 'N/A'}
            </Text>
          </View>
          <Chip 
            icon={getStatusIcon(shift.status)}
            style={[styles.statusChip, { backgroundColor: getStatusColor(shift.status) }]}
            textStyle={styles.statusText}
          >
            {shift.status.toUpperCase()}
          </Chip>
        </View>

        <View style={styles.routeInfo}>
          <MaterialCommunityIcons name="map-marker-path" size={20} color="#666" />
          <Text variant="bodyMedium" style={styles.routeText}>
            {shift.route?.route_name || 'Unknown Route'}
          </Text>
        </View>

        <View style={styles.timeInfo}>
          <View style={styles.timeRow}>
            <MaterialCommunityIcons name="clock-start" size={18} color="#666" />
            <Text variant="bodySmall" style={styles.timeText}>
              Start: {format(new Date(shift.start_time), 'HH:mm')}
            </Text>
          </View>
          <View style={styles.timeRow}>
            <MaterialCommunityIcons name="clock-end" size={18} color="#666" />
            <Text variant="bodySmall" style={styles.timeText}>
              End: {format(new Date(shift.end_time), 'HH:mm')}
            </Text>
          </View>
        </View>

        {shift.status === 'scheduled' && onStartShift && (
          <Button 
            mode="contained" 
            onPress={onStartShift}
            style={styles.actionButton}
            icon="play"
          >
            Start Shift
          </Button>
        )}

        {shift.status === 'active' && onEndShift && (
          <Button 
            mode="contained" 
            onPress={onEndShift}
            style={[styles.actionButton, styles.endButton]}
            icon="stop"
          >
            End Shift
          </Button>
        )}
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
  busNumber: {
    fontWeight: 'bold',
    color: '#1976D2',
  },
  statusChip: {
    height: 28,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  routeText: {
    flex: 1,
    color: '#333',
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    color: '#666',
  },
  actionButton: {
    marginTop: 8,
  },
  endButton: {
    backgroundColor: '#f44336',
  },
});
