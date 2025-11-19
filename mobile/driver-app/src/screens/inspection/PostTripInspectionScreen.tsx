import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { inspectionService } from '../../services/inspectionService';
import { tripService } from '../../services/tripService';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { COLORS, SPACING, TYPOGRAPHY } from '../../lib/constants';

export default function PostTripInspectionScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { driver } = useAuth();
  const { tripId } = route.params as { tripId: string };
  
  const [busCondition, setBusCondition] = useState(5);
  const [issues, setIssues] = useState('');
  const [passengerBehavior, setPassengerBehavior] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');
  const [maintenanceRequest, setMaintenanceRequest] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!driver?.id) return;

    try {
      setSubmitting(true);

      await inspectionService.createPostTripInspection({
        trip_id: tripId,
        driver_id: driver.id,
        inspection_type: 'post_trip',
        tyres_condition: 'good',
        lights_working: true,
        mirrors_condition: 'good',
        windows_condition: 'good',
        engine_temperature: 'normal',
        oil_level: 'full',
        coolant_level: 'full',
        battery_condition: 'good',
        seats_condition: 'good',
        seat_belts_working: true,
        ac_working: true,
        floor_condition: 'clean',
        cleanliness_rating: busCondition,
        fire_extinguisher_present: true,
        first_aid_present: true,
        emergency_exit_working: true,
        warning_triangle_present: true,
        defects: issues || undefined,
        has_critical_issues: false,
        fuel_level: fuelConsumed ? parseInt(fuelConsumed) : undefined,
        notes: `${passengerBehavior ? `Passenger Behavior: ${passengerBehavior}\n` : ''}${maintenanceRequest ? `Maintenance: ${maintenanceRequest}\n` : ''}${notes}`,
      });

      await tripService.updateTripStatus(tripId, 'COMPLETED');

      Alert.alert(
        'Success',
        'Trip completed successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Dashboard' as never),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', 'Failed to submit inspection');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Post-Trip Inspection</Text>
        <Text style={styles.subtitle}>Complete trip and report condition</Text>
      </View>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Bus Condition Rating</Text>
        <Text style={styles.ratingValue}>{busCondition} / 5</Text>
        <View style={styles.ratingButtons}>
          {[1, 2, 3, 4, 5].map((rating) => (
            <Button
              key={rating}
              title={rating.toString()}
              onPress={() => setBusCondition(rating)}
              variant={busCondition === rating ? 'primary' : 'outline'}
              size="small"
              style={styles.ratingButton}
            />
          ))}
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Trip Report</Text>
        <Input
          label="Issues Noted"
          value={issues}
          onChangeText={setIssues}
          placeholder="Any issues during the trip..."
          multiline
        />
        <Input
          label="Passenger Behavior"
          value={passengerBehavior}
          onChangeText={setPassengerBehavior}
          placeholder="Note any passenger incidents..."
          multiline
        />
        <Input
          label="Fuel Consumed (Litres)"
          value={fuelConsumed}
          onChangeText={setFuelConsumed}
          keyboardType="numeric"
          placeholder="Approximate fuel used"
        />
        <Input
          label="Maintenance Request"
          value={maintenanceRequest}
          onChangeText={setMaintenanceRequest}
          placeholder="Request any maintenance needed..."
          multiline
        />
        <Input
          label="Additional Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Any other notes..."
          multiline
        />
      </Card>

      <View style={styles.actions}>
        <Button
          title="Complete Trip"
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
          variant="success"
        />
        <Button
          title="Cancel"
          onPress={() => navigation.goBack()}
          variant="outline"
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
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  ratingValue: {
    ...TYPOGRAPHY.h1,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'center',
  },
  ratingButton: {
    flex: 1,
  },
  actions: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
});
