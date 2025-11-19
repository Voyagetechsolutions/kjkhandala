import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { fuelService } from '../../services/fuelService';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { COLORS, SPACING, TYPOGRAPHY } from '../../lib/constants';

export default function FuelLogScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { driver } = useAuth();
  const { tripId } = route.params as { tripId: string };
  
  const [fuelStation, setFuelStation] = useState('');
  const [litres, setLitres] = useState('');
  const [pricePerLitre, setPricePerLitre] = useState('');
  const [odometerReading, setOdometerReading] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'company_card' | 'cash' | 'account'>('company_card');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const totalCost = litres && pricePerLitre 
    ? (parseFloat(litres) * parseFloat(pricePerLitre)).toFixed(2)
    : '0.00';

  const handleSubmit = async () => {
    if (!driver?.id) return;

    if (!fuelStation || !litres || !pricePerLitre || !odometerReading) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      await fuelService.createFuelLog({
        trip_id: tripId,
        driver_id: driver.id,
        fuel_station: fuelStation,
        litres: parseFloat(litres),
        price_per_litre: parseFloat(pricePerLitre),
        total_cost: parseFloat(totalCost),
        odometer_reading: parseInt(odometerReading),
        payment_method: paymentMethod,
        comments: comments || undefined,
      });

      Alert.alert(
        'Success',
        'Fuel log submitted for approval',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', 'Failed to submit fuel log');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderPaymentOption = (
    method: 'company_card' | 'cash' | 'account',
    label: string,
    icon: any
  ) => (
    <TouchableOpacity
      style={[
        styles.paymentOption,
        paymentMethod === method && styles.paymentOptionActive,
      ]}
      onPress={() => setPaymentMethod(method)}
    >
      <Ionicons
        name={icon}
        size={24}
        color={paymentMethod === method ? COLORS.primary : COLORS.gray[600]}
      />
      <Text
        style={[
          styles.paymentLabel,
          paymentMethod === method && styles.paymentLabelActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fuel Log</Text>
        <Text style={styles.subtitle}>Submit for finance approval</Text>
      </View>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Fuel Details</Text>
        <Input
          label="Fuel Station *"
          value={fuelStation}
          onChangeText={setFuelStation}
          placeholder="e.g., Engen, Shell, BP"
        />
        <Input
          label="Litres *"
          value={litres}
          onChangeText={setLitres}
          keyboardType="decimal-pad"
          placeholder="Enter litres filled"
        />
        <Input
          label="Price per Litre (P) *"
          value={pricePerLitre}
          onChangeText={setPricePerLitre}
          keyboardType="decimal-pad"
          placeholder="Enter price per litre"
        />
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Cost:</Text>
          <Text style={styles.totalValue}>P{totalCost}</Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Vehicle Information</Text>
        <Input
          label="Odometer Reading *"
          value={odometerReading}
          onChangeText={setOdometerReading}
          keyboardType="numeric"
          placeholder="Current odometer reading"
        />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.paymentOptions}>
          {renderPaymentOption('company_card', 'Company Card', 'card')}
          {renderPaymentOption('cash', 'Cash', 'cash')}
          {renderPaymentOption('account', 'Account', 'business')}
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Additional Information</Text>
        <Input
          label="Comments"
          value={comments}
          onChangeText={setComments}
          placeholder="Any additional notes..."
          multiline
        />
        <TouchableOpacity style={styles.uploadButton}>
          <Ionicons name="camera" size={24} color={COLORS.primary} />
          <Text style={styles.uploadText}>Upload Receipt Photo</Text>
        </TouchableOpacity>
      </Card>

      <View style={styles.actions}>
        <Button
          title="Submit for Approval"
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
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    marginTop: SPACING.sm,
  },
  totalLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  totalValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  paymentOption: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.gray[50],
    borderWidth: 2,
    borderColor: COLORS.gray[200],
  },
  paymentOptionActive: {
    backgroundColor: `${COLORS.primary}10`,
    borderColor: COLORS.primary,
  },
  paymentLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
    fontWeight: '600',
  },
  paymentLabelActive: {
    color: COLORS.primary,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    marginTop: SPACING.md,
  },
  uploadText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
  actions: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
});
