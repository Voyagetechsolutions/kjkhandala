import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { locationService } from '../../services/locationService';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { COLORS, SPACING, TYPOGRAPHY } from '../../lib/constants';

export default function LiveTrackingScreen() {
  const route = useRoute();
  const { driver } = useAuth();
  const { tripId } = route.params as { tripId: string };
  
  const [tracking, setTracking] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [subscription]);

  const handleStartTracking = async () => {
    if (!driver?.id) return;

    try {
      await locationService.startTracking(tripId, driver.id);
      
      const sub = await locationService.watchPosition(async (loc) => {
        setLocation(loc);
        await locationService.updateTripLocation(tripId, loc.latitude, loc.longitude);
      });
      
      setSubscription(sub);
      setTracking(true);
      Alert.alert('Success', 'GPS tracking started');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start tracking');
    }
  };

  const handleStopTracking = async () => {
    try {
      if (subscription) {
        subscription.remove();
        setSubscription(null);
      }
      
      await locationService.stopTracking(tripId);
      setTracking(false);
      Alert.alert('Success', 'GPS tracking stopped');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to stop tracking');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Live GPS Tracking</Text>
        <Text style={styles.subtitle}>
          {tracking ? 'Tracking active' : 'Start tracking to share location'}
        </Text>
      </View>

      <Card style={styles.card}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, tracking && styles.statusDotActive]} />
          <Text style={styles.statusText}>
            {tracking ? 'Tracking Active' : 'Tracking Inactive'}
          </Text>
        </View>

        {location && (
          <View style={styles.locationInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>
                Lat: {location.latitude.toFixed(6)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>
                Lng: {location.longitude.toFixed(6)}
              </Text>
            </View>
          </View>
        )}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Features</Text>
        <View style={styles.feature}>
          <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
          <Text style={styles.featureText}>Real-time location sharing</Text>
        </View>
        <View style={styles.feature}>
          <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
          <Text style={styles.featureText}>Passenger tracking</Text>
        </View>
        <View style={styles.feature}>
          <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
          <Text style={styles.featureText}>Route monitoring</Text>
        </View>
        <View style={styles.feature}>
          <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
          <Text style={styles.featureText}>ETA updates</Text>
        </View>
      </Card>

      <View style={styles.actions}>
        {!tracking ? (
          <Button
            title="Start Tracking"
            onPress={handleStartTracking}
            variant="success"
          />
        ) : (
          <Button
            title="Stop Tracking"
            onPress={handleStopTracking}
            variant="danger"
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text.primary,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  card: {
    margin: SPACING.md,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.gray[400],
  },
  statusDotActive: {
    backgroundColor: COLORS.success,
  },
  statusText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  locationInfo: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  infoText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  featureText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
  },
  actions: {
    padding: SPACING.md,
  },
});
