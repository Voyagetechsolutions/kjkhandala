import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { inspectionService } from '../../services/inspectionService';
import { tripService } from '../../services/tripService';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { COLORS, SPACING, TYPOGRAPHY } from '../../lib/constants';

export default function PreTripInspectionScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { driver } = useAuth();
  const { tripId } = route.params as { tripId: string };
  
  const [tyres, setTyres] = useState<'good' | 'fair' | 'poor'>('good');
  const [lightsWorking, setLightsWorking] = useState(true);
  const [mirrors, setMirrors] = useState<'good' | 'damaged'>('good');
  const [bodyDamage, setBodyDamage] = useState('');
  const [windows, setWindows] = useState<'good' | 'cracked' | 'broken'>('good');
  
  const [engineTemp, setEngineTemp] = useState<'normal' | 'high' | 'low'>('normal');
  const [oilLevel, setOilLevel] = useState<'full' | 'low' | 'critical'>('full');
  const [coolantLevel, setCoolantLevel] = useState<'full' | 'low' | 'critical'>('full');
  const [battery, setBattery] = useState<'good' | 'weak' | 'dead'>('good');
  
  const [seats, setSeats] = useState<'good' | 'damaged'>('good');
  const [seatBelts, setSeatBelts] = useState(true);
  const [acWorking, setAcWorking] = useState(true);
  const [floor, setFloor] = useState<'clean' | 'dirty' | 'damaged'>('clean');
  const [cleanliness, setCleanliness] = useState(5);
  
  const [fireExtinguisher, setFireExtinguisher] = useState(true);
  const [firstAid, setFirstAid] = useState(true);
  const [emergencyExit, setEmergencyExit] = useState(true);
  const [triangle, setTriangle] = useState(true);
  
  const [defects, setDefects] = useState('');
  const [odometerReading, setOdometerReading] = useState('');
  const [fuelLevel, setFuelLevel] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const hasCriticalIssues = () => {
    return (
      tyres === 'poor' ||
      !lightsWorking ||
      windows === 'broken' ||
      oilLevel === 'critical' ||
      coolantLevel === 'critical' ||
      battery === 'dead' ||
      !seatBelts ||
      !fireExtinguisher ||
      !emergencyExit
    );
  };

  const handleSubmit = async () => {
    if (!driver?.id) return;

    if (!odometerReading || !fuelLevel) {
      Alert.alert('Error', 'Please fill in odometer reading and fuel level');
      return;
    }

    const critical = hasCriticalIssues();

    if (critical) {
      Alert.alert(
        'Critical Issues Found',
        'This inspection has critical issues. The trip cannot start until these are resolved.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Submit Anyway',
            style: 'destructive',
            onPress: () => submitInspection(critical),
          },
        ]
      );
    } else {
      submitInspection(critical);
    }
  };

  const submitInspection = async (hasCritical: boolean) => {
    if (!driver?.id) return;

    try {
      setSubmitting(true);

      await inspectionService.createPreTripInspection({
        trip_id: tripId,
        driver_id: driver.id,
        inspection_type: 'pre_trip',
        tyres_condition: tyres,
        lights_working: lightsWorking,
        mirrors_condition: mirrors,
        body_damage: bodyDamage || undefined,
        windows_condition: windows,
        engine_temperature: engineTemp,
        oil_level: oilLevel,
        coolant_level: coolantLevel,
        battery_condition: battery,
        seats_condition: seats,
        seat_belts_working: seatBelts,
        ac_working: acWorking,
        floor_condition: floor,
        cleanliness_rating: cleanliness,
        fire_extinguisher_present: fireExtinguisher,
        first_aid_present: firstAid,
        emergency_exit_working: emergencyExit,
        warning_triangle_present: triangle,
        defects: defects || undefined,
        has_critical_issues: hasCritical,
        odometer_reading: parseInt(odometerReading),
        fuel_level: parseInt(fuelLevel),
        notes: notes || undefined,
      });

      if (!hasCritical) {
        await tripService.updateTripStatus(tripId, 'EN_ROUTE');
      }

      Alert.alert(
        'Success',
        hasCritical
          ? 'Inspection submitted. Trip cannot start due to critical issues.'
          : 'Inspection completed successfully. Trip can now start.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
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

  const renderOption = (
    label: string,
    value: any,
    options: { label: string; value: any }[],
    onChange: (value: any) => void
  ) => (
    <View style={styles.optionGroup}>
      <Text style={styles.optionLabel}>{label}</Text>
      <View style={styles.optionButtons}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value.toString()}
            style={[
              styles.optionButton,
              value === option.value && styles.optionButtonActive,
            ]}
            onPress={() => onChange(option.value)}
          >
            <Text
              style={[
                styles.optionButtonText,
                value === option.value && styles.optionButtonTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pre-Trip Inspection</Text>
        <Text style={styles.subtitle}>Complete before starting trip</Text>
      </View>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Exterior</Text>
        {renderOption('Tyres', tyres, [
          { label: 'Good', value: 'good' },
          { label: 'Fair', value: 'fair' },
          { label: 'Poor', value: 'poor' },
        ], setTyres)}
        {renderOption('Lights', lightsWorking, [
          { label: 'Working', value: true },
          { label: 'Not Working', value: false },
        ], setLightsWorking)}
        {renderOption('Mirrors', mirrors, [
          { label: 'Good', value: 'good' },
          { label: 'Damaged', value: 'damaged' },
        ], setMirrors)}
        {renderOption('Windows', windows, [
          { label: 'Good', value: 'good' },
          { label: 'Cracked', value: 'cracked' },
          { label: 'Broken', value: 'broken' },
        ], setWindows)}
        <Input
          label="Body Damage (if any)"
          value={bodyDamage}
          onChangeText={setBodyDamage}
          placeholder="Describe any damage..."
          multiline
        />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Engine & Fluids</Text>
        {renderOption('Engine Temperature', engineTemp, [
          { label: 'Normal', value: 'normal' },
          { label: 'High', value: 'high' },
          { label: 'Low', value: 'low' },
        ], setEngineTemp)}
        {renderOption('Oil Level', oilLevel, [
          { label: 'Full', value: 'full' },
          { label: 'Low', value: 'low' },
          { label: 'Critical', value: 'critical' },
        ], setOilLevel)}
        {renderOption('Coolant Level', coolantLevel, [
          { label: 'Full', value: 'full' },
          { label: 'Low', value: 'low' },
          { label: 'Critical', value: 'critical' },
        ], setCoolantLevel)}
        {renderOption('Battery', battery, [
          { label: 'Good', value: 'good' },
          { label: 'Weak', value: 'weak' },
          { label: 'Dead', value: 'dead' },
        ], setBattery)}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Interior</Text>
        {renderOption('Seats', seats, [
          { label: 'Good', value: 'good' },
          { label: 'Damaged', value: 'damaged' },
        ], setSeats)}
        {renderOption('Seat Belts', seatBelts, [
          { label: 'Working', value: true },
          { label: 'Not Working', value: false },
        ], setSeatBelts)}
        {renderOption('AC/Ventilation', acWorking, [
          { label: 'Working', value: true },
          { label: 'Not Working', value: false },
        ], setAcWorking)}
        {renderOption('Floor', floor, [
          { label: 'Clean', value: 'clean' },
          { label: 'Dirty', value: 'dirty' },
          { label: 'Damaged', value: 'damaged' },
        ], setFloor)}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Safety Equipment</Text>
        {renderOption('Fire Extinguisher', fireExtinguisher, [
          { label: 'Present', value: true },
          { label: 'Missing', value: false },
        ], setFireExtinguisher)}
        {renderOption('First Aid Kit', firstAid, [
          { label: 'Present', value: true },
          { label: 'Missing', value: false },
        ], setFirstAid)}
        {renderOption('Emergency Exit', emergencyExit, [
          { label: 'Working', value: true },
          { label: 'Not Working', value: false },
        ], setEmergencyExit)}
        {renderOption('Warning Triangle', triangle, [
          { label: 'Present', value: true },
          { label: 'Missing', value: false },
        ], setTriangle)}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Additional Information</Text>
        <Input
          label="Odometer Reading *"
          value={odometerReading}
          onChangeText={setOdometerReading}
          keyboardType="numeric"
          placeholder="Enter current odometer reading"
        />
        <Input
          label="Fuel Level (%) *"
          value={fuelLevel}
          onChangeText={setFuelLevel}
          keyboardType="numeric"
          placeholder="Enter fuel level percentage"
        />
        <Input
          label="Defects"
          value={defects}
          onChangeText={setDefects}
          placeholder="List any defects..."
          multiline
        />
        <Input
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Additional notes..."
          multiline
        />
      </Card>

      {hasCriticalIssues() && (
        <Card style={styles.warningCard}>
          <View style={styles.warningHeader}>
            <Ionicons name="warning" size={24} color={COLORS.danger} />
            <Text style={styles.warningTitle}>Critical Issues Detected</Text>
          </View>
          <Text style={styles.warningText}>
            This inspection has critical issues. The trip cannot start until these are resolved.
          </Text>
        </Card>
      )}

      <View style={styles.actions}>
        <Button
          title="Submit Inspection"
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
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
  optionGroup: {
    marginBottom: SPACING.md,
  },
  optionLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.primary,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  optionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  optionButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.gray[100],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  optionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionButtonText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  optionButtonTextActive: {
    color: COLORS.white,
  },
  warningCard: {
    backgroundColor: `${COLORS.danger}10`,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  warningTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.danger,
  },
  warningText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
  },
  actions: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
});
