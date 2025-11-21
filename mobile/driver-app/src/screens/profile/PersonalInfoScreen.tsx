import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { driverService } from '../../services/driverService';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { COLORS, SPACING, TYPOGRAPHY } from '../../lib/constants';
import { Driver } from '../../types';

export default function PersonalInfoScreen() {
  const { driver } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Driver>>({
    full_name: '',
    email: '',
    phone: '',
    emergency_contact: '',
    emergency_phone: '',
  });

  useEffect(() => {
    if (driver) {
      setFormData({
        full_name: driver.full_name || '',
        email: driver.email || '',
        phone: driver.phone || '',
        emergency_contact: driver.emergency_contact || '',
        emergency_phone: driver.emergency_phone || '',
      });
    }
  }, [driver]);

  const handleSave = async () => {
    if (!driver?.id) return;

    setSaving(true);
    try {
      await driverService.updateDriverProfile(driver.id, formData);
      Alert.alert('Success', 'Personal information updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update personal information');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <Input
          label="Full Name"
          value={formData.full_name}
          onChangeText={(text) => setFormData({ ...formData, full_name: text })}
          placeholder="Enter your full name"
        />

        <Input
          label="Email"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label="Phone Number"
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
        />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Emergency Contact</Text>
        
        <Input
          label="Contact Name"
          value={formData.emergency_contact}
          onChangeText={(text) => setFormData({ ...formData, emergency_contact: text })}
          placeholder="Enter emergency contact name"
        />

        <Input
          label="Contact Phone"
          value={formData.emergency_phone}
          onChangeText={(text) => setFormData({ ...formData, emergency_phone: text })}
          placeholder="Enter emergency contact phone"
          keyboardType="phone-pad"
        />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Account Status</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status:</Text>
          <View style={[styles.statusBadge, { backgroundColor: driver?.status === 'active' ? COLORS.success : COLORS.danger }]}>
            <Text style={styles.statusText}>{driver?.status?.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Driver ID:</Text>
          <Text style={styles.infoValue}>{driver?.id.substring(0, 8)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Member Since:</Text>
          <Text style={styles.infoValue}>
            {driver?.created_at ? new Date(driver.created_at).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
      </Card>

      <Button
        title="Save Changes"
        onPress={handleSave}
        loading={saving}
        disabled={saving}
        style={styles.saveButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  card: {
    margin: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  infoLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
  },
  infoValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: '600',
  },
  saveButton: {
    margin: SPACING.md,
  },
});
