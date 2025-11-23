import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { COLORS, SPACING, TYPOGRAPHY } from '../../lib/constants';
import { supabase } from '../../lib/supabase';

interface InspectionItem {
  id: string;
  label: string;
  checked: boolean;
  category: string;
}

export default function ComprehensivePreTripInspectionScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { driver } = useAuth();
  const { tripId, busId, busRegistration } = route.params as any;

  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([
    // 1. Vehicle Exterior
    { id: 'body_damage', label: 'Body damage check', checked: false, category: 'exterior' },
    { id: 'mirrors', label: 'Mirrors clean & adjusted', checked: false, category: 'exterior' },
    { id: 'number_plates', label: 'Number plates visible & secure', checked: false, category: 'exterior' },
    { id: 'windows', label: 'Windows & windscreen clean', checked: false, category: 'exterior' },
    
    // Tyres & Wheels
    { id: 'tyre_pressure', label: 'Tyre pressure normal', checked: false, category: 'tyres' },
    { id: 'tread_depth', label: 'Tread depth above minimum', checked: false, category: 'tyres' },
    { id: 'sidewall', label: 'No sidewall cuts or bulges', checked: false, category: 'tyres' },
    { id: 'wheel_nuts', label: 'Wheel nuts secure', checked: false, category: 'tyres' },
    { id: 'spare_wheel', label: 'Spare wheel condition', checked: false, category: 'tyres' },
    
    // Lights & Reflectors
    { id: 'headlights', label: 'Headlights (low & high beam)', checked: false, category: 'lights' },
    { id: 'indicators', label: 'Indicators (all sides)', checked: false, category: 'lights' },
    { id: 'brake_lights', label: 'Brake lights', checked: false, category: 'lights' },
    { id: 'reverse_light', label: 'Reverse light', checked: false, category: 'lights' },
    { id: 'hazard_lights', label: 'Hazard lights', checked: false, category: 'lights' },
    { id: 'fog_lights', label: 'Fog lights', checked: false, category: 'lights' },
    { id: 'reflectors', label: 'Reflectors clean & intact', checked: false, category: 'lights' },
    
    // Safety Equipment
    { id: 'fire_extinguisher', label: 'Fire extinguisher present & charged', checked: false, category: 'safety' },
    { id: 'first_aid', label: 'First aid kit stocked', checked: false, category: 'safety' },
    { id: 'warning_triangles', label: 'Warning triangles', checked: false, category: 'safety' },
    { id: 'reflective_jacket', label: 'Reflective jacket', checked: false, category: 'safety' },
    { id: 'wheel_chocks', label: 'Wheel chocks', checked: false, category: 'safety' },
    
    // 2. Engine Bay
    { id: 'oil_level', label: 'Oil level', checked: false, category: 'engine' },
    { id: 'coolant_level', label: 'Coolant level', checked: false, category: 'engine' },
    { id: 'brake_fluid', label: 'Brake fluid', checked: false, category: 'engine' },
    { id: 'power_steering', label: 'Power steering fluid', checked: false, category: 'engine' },
    { id: 'belts', label: 'Belts (tension, wear)', checked: false, category: 'engine' },
    { id: 'battery', label: 'Battery secure (no corrosion)', checked: false, category: 'engine' },
    { id: 'no_leaks', label: 'No fluid leaks under bus', checked: false, category: 'engine' },
    
    // 3. Interior - Cabin & Driver Area
    { id: 'seat_position', label: 'Seat position & adjustment', checked: false, category: 'cabin' },
    { id: 'seatbelt', label: 'Seatbelt working', checked: false, category: 'cabin' },
    { id: 'warning_lights', label: 'Dashboard warning lights OFF', checked: false, category: 'cabin' },
    { id: 'horn', label: 'Horn working', checked: false, category: 'cabin' },
    { id: 'wipers', label: 'Wipers & washers working', checked: false, category: 'cabin' },
    { id: 'heater_ac', label: 'Heater/AC functioning', checked: false, category: 'cabin' },
    { id: 'dashboard_switches', label: 'Dashboard switches functioning', checked: false, category: 'cabin' },
    
    // Passenger Area
    { id: 'seats_secure', label: 'Seats secure & clean', checked: false, category: 'passenger' },
    { id: 'handrails', label: 'Handrails and poles secure', checked: false, category: 'passenger' },
    { id: 'emergency_exits', label: 'Emergency exits working', checked: false, category: 'passenger' },
    { id: 'emergency_hammers', label: 'Emergency hammers present', checked: false, category: 'passenger' },
    { id: 'interior_lights', label: 'Interior lights working', checked: false, category: 'passenger' },
    { id: 'windows_open', label: 'Windows can open if required', checked: false, category: 'passenger' },
    { id: 'no_loose_items', label: 'No loose items in aisle', checked: false, category: 'passenger' },
    
    // 4. Braking & Controls
    { id: 'service_brake', label: 'Service brake test', checked: false, category: 'brakes' },
    { id: 'handbrake', label: 'Handbrake holding firmly', checked: false, category: 'brakes' },
    { id: 'air_pressure', label: 'Air pressure normal', checked: false, category: 'brakes' },
    { id: 'no_air_leaks', label: 'No air leaks', checked: false, category: 'brakes' },
    { id: 'warning_buzzer', label: 'Warning buzzer functional', checked: false, category: 'brakes' },
    
    // Steering & Suspension
    { id: 'steering_play', label: 'Steering free play normal', checked: false, category: 'steering' },
    { id: 'no_stiffness', label: 'No stiffness', checked: false, category: 'steering' },
    { id: 'no_knocking', label: 'No knocking sounds', checked: false, category: 'steering' },
    { id: 'suspension', label: 'Suspension level correct', checked: false, category: 'steering' },
    
    // 5. Under the Bus
    { id: 'no_oil_leaks', label: 'No oil leaks', checked: false, category: 'underbus' },
    { id: 'exhaust_secure', label: 'Exhaust system secure', checked: false, category: 'underbus' },
    { id: 'no_loose_wires', label: 'No loose wires or components', checked: false, category: 'underbus' },
    { id: 'no_debris', label: 'No debris stuck underneath', checked: false, category: 'underbus' },
    
    // 6. Fuel & Fluids
    { id: 'fuel_level', label: 'Fuel level', checked: false, category: 'fuel' },
    { id: 'adblue', label: 'AdBlue level', checked: false, category: 'fuel' },
    { id: 'diesel_cap', label: 'Diesel cap secure', checked: false, category: 'fuel' },
    { id: 'no_fuel_smell', label: 'No smell of leaking fuel', checked: false, category: 'fuel' },
    
    // 7. Documentation
    { id: 'license_disc', label: 'License disc valid', checked: false, category: 'docs' },
    { id: 'operator_permits', label: 'Operator permits', checked: false, category: 'docs' },
    { id: 'waybill', label: 'Waybill / trip sheet', checked: false, category: 'docs' },
    { id: 'insurance', label: 'Insurance documents', checked: false, category: 'docs' },
    { id: 'logbook', label: 'Logbook', checked: false, category: 'docs' },
    
    // 8. Final Functional Tests
    { id: 'engine_start', label: 'Engine starts normally', checked: false, category: 'functional' },
    { id: 'no_unusual_noise', label: 'No unusual noises', checked: false, category: 'functional' },
    { id: 'gearbox', label: 'Gearbox shifts properly', checked: false, category: 'functional' },
    { id: 'reverse_beeper', label: 'Reverse beeper', checked: false, category: 'functional' },
    { id: 'gps_tracker', label: 'GPS / tracker working', checked: false, category: 'functional' },
    { id: 'dashcam', label: 'Dashcam working', checked: false, category: 'functional' },
    { id: 'radio', label: 'Radio/communication device', checked: false, category: 'functional' },
    { id: 'ticketing', label: 'Ticketing or onboard tablets', checked: false, category: 'functional' },
  ]);

  const [notes, setNotes] = useState('');
  const [odometerReading, setOdometerReading] = useState('');

  const categories = [
    { key: 'exterior', title: '1. Vehicle Exterior', icon: 'car-outline' },
    { key: 'tyres', title: 'Tyres & Wheels', icon: 'disc-outline' },
    { key: 'lights', title: 'Lights & Reflectors', icon: 'bulb-outline' },
    { key: 'safety', title: 'Safety Equipment', icon: 'shield-checkmark-outline' },
    { key: 'engine', title: '2. Engine Bay', icon: 'construct-outline' },
    { key: 'cabin', title: '3. Cabin & Driver Area', icon: 'person-outline' },
    { key: 'passenger', title: 'Passenger Area', icon: 'people-outline' },
    { key: 'brakes', title: '4. Braking & Controls', icon: 'hand-left-outline' },
    { key: 'steering', title: 'Steering & Suspension', icon: 'navigate-circle-outline' },
    { key: 'underbus', title: '5. Under the Bus', icon: 'arrow-down-circle-outline' },
    { key: 'fuel', title: '6. Fuel & Fluids', icon: 'water-outline' },
    { key: 'docs', title: '7. Documentation', icon: 'document-text-outline' },
    { key: 'functional', title: '8. Final Functional Tests', icon: 'checkmark-done-outline' },
  ];

  const toggleItem = (id: string) => {
    setInspectionItems(prev =>
      prev.map(item => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const calculatePassRate = () => {
    const total = inspectionItems.length;
    const checked = inspectionItems.filter(item => item.checked).length;
    return (checked / total) * 100;
  };

  const handleSubmit = async () => {
    const passRate = calculatePassRate();
    const passed = passRate >= 90;

    if (passRate < 50) {
      Alert.alert(
        'Incomplete Inspection',
        'Please complete more inspection items before submitting.',
        [{ text: 'OK' }]
      );
      return;
    }

    let status: 'pass' | 'pass_with_issues' | 'fail' = 'pass';
    let canDrive = true;

    if (passRate >= 90) {
      status = 'pass';
    } else if (passRate >= 70) {
      status = 'pass_with_issues';
      Alert.alert(
        'Pass With Issues',
        'Bus passed but has some issues. Maintenance will be notified.',
        [{ text: 'OK' }]
      );
    } else {
      status = 'fail';
      canDrive = false;
      
      // Check odometer reading for <1000km exception
      const currentOdometer = parseInt(odometerReading || '0');
      if (currentOdometer < 1000) {
        Alert.alert(
          'Bus Failed Inspection',
          'However, since the bus has driven less than 1000km, it can still be used for this trip.',
          [
            {
              text: 'Use This Bus',
              onPress: () => saveInspection(status, true),
            },
            {
              text: 'Suggest Alternative',
              onPress: () => suggestAlternativeBus(),
            },
          ]
        );
        return;
      } else {
        Alert.alert(
          'Bus Failed Inspection',
          'This bus cannot be used. An alternative bus will be suggested.',
          [
            {
              text: 'Find Alternative',
              onPress: () => suggestAlternativeBus(),
            },
          ]
        );
        return;
      }
    }

    await saveInspection(status, canDrive);
  };

  const saveInspection = async (status: string, canDrive: boolean) => {
    try {
      const inspectionData = {
        trip_id: tripId,
        bus_id: busId,
        driver_id: driver?.id,
        inspection_type: 'pre_trip',
        status,
        pass_rate: calculatePassRate(),
        can_drive: canDrive,
        checklist: inspectionItems,
        notes,
        odometer_reading: parseInt(odometerReading || '0'),
        created_at: new Date().toISOString(),
      };

      // Save to vehicle_inspections table (for maintenance dashboard)
      const { error: inspectionError } = await supabase
        .from('vehicle_inspections')
        .insert(inspectionData);

      if (inspectionError) throw inspectionError;

      // Update trip with inspection status
      const { error: tripError } = await supabase
        .from('trips')
        .update({ 
          pre_trip_inspection_completed: true,
          pre_trip_inspection_status: status,
        })
        .eq('id', tripId);

      if (tripError) throw tripError;

      Alert.alert(
        'Inspection Saved',
        'Pre-trip inspection has been completed and saved.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error saving inspection:', error);
      Alert.alert('Error', 'Failed to save inspection. Please try again.');
    }
  };

  const suggestAlternativeBus = async () => {
    try {
      // Find available buses
      const { data: availableBuses, error } = await supabase
        .from('buses')
        .select('*')
        .eq('status', 'active')
        .neq('id', busId)
        .limit(5);

      if (error) throw error;

      if (availableBuses && availableBuses.length > 0) {
        const busOptions = availableBuses
          .map((bus, index) => `${index + 1}. ${bus.registration_number} (${bus.seating_capacity} seats)`)
          .join('\n');

        Alert.alert(
          'Alternative Buses Available',
          `The following buses are available:\n\n${busOptions}\n\nPlease contact operations to reassign the bus.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert(
          'No Buses Available',
          'No alternative buses found. Please contact operations immediately.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Error finding alternative buses:', error);
      Alert.alert('Error', 'Failed to find alternative buses.');
    }
  };

  const passRate = calculatePassRate();
  const passRateColor =
    passRate >= 90 ? COLORS.success : passRate >= 70 ? COLORS.warning : COLORS.danger;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Pre-Trip Inspection</Text>
        <Text style={styles.subtitle}>Bus: {busRegistration}</Text>
        <View style={styles.passRateContainer}>
          <Text style={styles.passRateLabel}>Completion Rate:</Text>
          <Text style={[styles.passRate, { color: passRateColor }]}>
            {passRate.toFixed(0)}%
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {categories.map(category => {
          const categoryItems = inspectionItems.filter(
            item => item.category === category.key
          );
          const categoryChecked = categoryItems.filter(item => item.checked).length;
          const categoryTotal = categoryItems.length;
          const categoryProgress = (categoryChecked / categoryTotal) * 100;

          return (
            <Card key={category.key} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryTitleRow}>
                  <Ionicons name={category.icon as any} size={24} color={COLORS.primary} />
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                </View>
                <Text style={styles.categoryProgress}>
                  {categoryChecked}/{categoryTotal}
                </Text>
              </View>

              {categoryItems.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.checklistItem}
                  onPress={() => toggleItem(item.id)}
                >
                  <View style={styles.checkboxContainer}>
                    <View
                      style={[
                        styles.checkbox,
                        item.checked && styles.checkboxChecked,
                      ]}
                    >
                      {item.checked && (
                        <Ionicons name="checkmark" size={16} color={COLORS.white} />
                      )}
                    </View>
                    <Text style={styles.checklistLabel}>{item.label}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </Card>
          );
        })}
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <Button
          title={`Submit Inspection (${passRate.toFixed(0)}%)`}
          onPress={handleSubmit}
          disabled={passRate < 50}
        />
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
    ...TYPOGRAPHY.body,
    color: COLORS.gray[600],
    marginTop: SPACING.xs,
  },
  passRateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  passRateLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray[600],
  },
  passRate: {
    ...TYPOGRAPHY.h2,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  categoryCard: {
    margin: SPACING.md,
    marginBottom: SPACING.sm,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  categoryTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
  },
  categoryProgress: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
  checklistItem: {
    paddingVertical: SPACING.sm,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.gray[400],
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checklistLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    flex: 1,
  },
  footer: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
});
