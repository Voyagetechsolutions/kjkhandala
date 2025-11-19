import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { incidentService } from '../../services/incidentService';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { COLORS, SPACING, TYPOGRAPHY } from '../../lib/constants';

export default function IncidentReportScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { driver } = useAuth();
  const { tripId } = route.params as { tripId: string };
  
  const [incidentType, setIncidentType] = useState<string>('accident');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [injuries, setInjuries] = useState('');
  const [witnesses, setWitnesses] = useState('');
  const [policeInvolved, setPoliceInvolved] = useState(false);
  const [policeReport, setPoliceReport] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const incidentTypes = [
    { value: 'accident', label: 'Accident', icon: 'car-sport' },
    { value: 'breakdown', label: 'Breakdown', icon: 'construct' },
    { value: 'passenger_incident', label: 'Passenger', icon: 'people' },
    { value: 'medical', label: 'Medical', icon: 'medical' },
    { value: 'security', label: 'Security', icon: 'shield' },
    { value: 'other', label: 'Other', icon: 'alert-circle' },
  ];

  const handleSubmit = async () => {
    if (!driver?.id) return;

    if (!location || !description) {
      Alert.alert('Error', 'Please fill in location and description');
      return;
    }

    try {
      setSubmitting(true);

      await incidentService.createIncident({
        trip_id: tripId,
        driver_id: driver.id,
        incident_type: incidentType,
        severity,
        location,
        description,
        injuries_reported: injuries || undefined,
        witnesses: witnesses || undefined,
        police_involved: policeInvolved,
        police_report_number: policeReport || undefined,
        incident_time: new Date().toISOString(),
      });

      Alert.alert(
        'Success',
        'Incident report submitted successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', 'Failed to submit incident report');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderIncidentType = (type: any) => (
    <TouchableOpacity
      key={type.value}
      style={[
        styles.typeCard,
        incidentType === type.value && styles.typeCardActive,
      ]}
      onPress={() => setIncidentType(type.value)}
    >
      <Ionicons
        name={type.icon}
        size={32}
        color={incidentType === type.value ? COLORS.primary : COLORS.gray[600]}
      />
      <Text
        style={[
          styles.typeLabel,
          incidentType === type.value && styles.typeLabelActive,
        ]}
      >
        {type.label}
      </Text>
    </TouchableOpacity>
  );

  const renderSeverity = (level: 'low' | 'medium' | 'high' | 'critical', label: string, color: string) => (
    <TouchableOpacity
      key={level}
      style={[
        styles.severityButton,
        severity === level && { backgroundColor: `${color}20`, borderColor: color },
      ]}
      onPress={() => setSeverity(level)}
    >
      <Text
        style={[
          styles.severityText,
          severity === level && { color },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Incident Report</Text>
        <Text style={styles.subtitle}>Report any incidents immediately</Text>
      </View>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Incident Type</Text>
        <View style={styles.typesGrid}>
          {incidentTypes.map(renderIncidentType)}
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Severity Level</Text>
        <View style={styles.severityButtons}>
          {renderSeverity('low', 'Low', COLORS.success)}
          {renderSeverity('medium', 'Medium', COLORS.warning)}
          {renderSeverity('high', 'High', '#FF6B35')}
          {renderSeverity('critical', 'Critical', COLORS.danger)}
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Incident Details</Text>
        <Input
          label="Location *"
          value={location}
          onChangeText={setLocation}
          placeholder="Where did this happen?"
        />
        <Input
          label="Description *"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe what happened in detail..."
          multiline
          numberOfLines={4}
        />
        <Input
          label="Injuries Reported"
          value={injuries}
          onChangeText={setInjuries}
          placeholder="Any injuries? Describe..."
          multiline
        />
        <Input
          label="Witnesses"
          value={witnesses}
          onChangeText={setWitnesses}
          placeholder="Names and contact info of witnesses..."
          multiline
        />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Police Involvement</Text>
        <View style={styles.policeButtons}>
          <TouchableOpacity
            style={[
              styles.policeButton,
              !policeInvolved && styles.policeButtonActive,
            ]}
            onPress={() => setPoliceInvolved(false)}
          >
            <Text
              style={[
                styles.policeButtonText,
                !policeInvolved && styles.policeButtonTextActive,
              ]}
            >
              No Police
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.policeButton,
              policeInvolved && styles.policeButtonActive,
            ]}
            onPress={() => setPoliceInvolved(true)}
          >
            <Text
              style={[
                styles.policeButtonText,
                policeInvolved && styles.policeButtonTextActive,
              ]}
            >
              Police Involved
            </Text>
          </TouchableOpacity>
        </View>
        {policeInvolved && (
          <Input
            label="Police Report Number"
            value={policeReport}
            onChangeText={setPoliceReport}
            placeholder="Enter police report number"
          />
        )}
      </Card>

      <Card style={styles.card}>
        <TouchableOpacity style={styles.uploadButton}>
          <Ionicons name="camera" size={24} color={COLORS.primary} />
          <Text style={styles.uploadText}>Add Photos</Text>
        </TouchableOpacity>
      </Card>

      <View style={styles.actions}>
        <Button
          title="Submit Report"
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
          variant="danger"
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
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  typeCard: {
    width: '31%',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.gray[50],
    borderWidth: 2,
    borderColor: COLORS.gray[200],
  },
  typeCardActive: {
    backgroundColor: `${COLORS.primary}10`,
    borderColor: COLORS.primary,
  },
  typeLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  typeLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  severityButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  severityButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.gray[50],
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    alignItems: 'center',
  },
  severityText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  policeButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  policeButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
  },
  policeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  policeButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  policeButtonTextActive: {
    color: COLORS.white,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.lg,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
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
