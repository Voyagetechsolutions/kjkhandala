import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/Card';
import { COLORS, SPACING, TYPOGRAPHY } from '../../lib/constants';
import { differenceInDays } from 'date-fns';
import { safeFormatDate } from '../../lib/dateUtils';

export default function LicenseDetailsScreen() {
  const { driver } = useAuth();

  const getDaysUntilExpiry = () => {
    if (!driver?.license_expiry) return null;
    const expiryDate = new Date(driver.license_expiry);
    const today = new Date();
    return differenceInDays(expiryDate, today);
  };

  const getExpiryStatus = () => {
    const days = getDaysUntilExpiry();
    if (days === null) return { color: COLORS.gray[500], text: 'Unknown', icon: 'help-circle' };
    if (days < 0) return { color: COLORS.danger, text: 'Expired', icon: 'close-circle' };
    if (days < 30) return { color: COLORS.warning, text: 'Expiring Soon', icon: 'warning' };
    return { color: COLORS.success, text: 'Valid', icon: 'checkmark-circle' };
  };

  const status = getExpiryStatus();
  const daysUntilExpiry = getDaysUntilExpiry();

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="card" size={48} color={COLORS.primary} />
          <Text style={styles.title}>Driver's License</Text>
        </View>

        <View style={styles.statusContainer}>
          <Ionicons name={status.icon as any} size={32} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>
            {status.text}
          </Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>License Information</Text>

        <View style={styles.infoRow}>
          <Text style={styles.label}>License Number</Text>
          <Text style={styles.value}>{driver?.license_number || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Issue Date</Text>
          <Text style={styles.value}>
            {safeFormatDate(driver?.created_at, 'dd MMM yyyy')}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Expiry Date</Text>
          <Text style={[styles.value, daysUntilExpiry !== null && daysUntilExpiry < 30 && { color: COLORS.danger }]}>
            {safeFormatDate(driver?.license_expiry, 'dd MMM yyyy')}
          </Text>
        </View>

        {daysUntilExpiry !== null && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Days Until Expiry</Text>
            <Text style={[styles.value, { color: daysUntilExpiry < 30 ? COLORS.danger : COLORS.success }]}>
              {daysUntilExpiry > 0 ? `${daysUntilExpiry} days` : 'Expired'}
            </Text>
          </View>
        )}
      </Card>

      {daysUntilExpiry !== null && daysUntilExpiry < 60 && (
        <Card style={[styles.card, styles.warningCard] as any}>
          <View style={styles.warningHeader}>
            <Ionicons name="warning" size={24} color={COLORS.warning} />
            <Text style={styles.warningTitle}>Renewal Required</Text>
          </View>
          <Text style={styles.warningText}>
            {daysUntilExpiry < 0
              ? 'Your license has expired. Please renew it immediately to continue driving.'
              : `Your license will expire in ${daysUntilExpiry} days. Please renew it before the expiry date.`}
          </Text>
        </Card>
      )}

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>License Classes</Text>
        <View style={styles.classContainer}>
          <View style={styles.classBadge}>
            <Text style={styles.classText}>Class C1</Text>
          </View>
          <Text style={styles.classDescription}>Light Motor Vehicles</Text>
        </View>
        <View style={styles.classContainer}>
          <View style={styles.classBadge}>
            <Text style={styles.classText}>Class C</Text>
          </View>
          <Text style={styles.classDescription}>Heavy Motor Vehicles</Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Endorsements</Text>
        <View style={styles.endorsementRow}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
          <Text style={styles.endorsementText}>Public Transport Permit</Text>
        </View>
        <View style={styles.endorsementRow}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
          <Text style={styles.endorsementText}>Professional Driving Permit (PrDP)</Text>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  card: {
    margin: SPACING.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
    marginTop: SPACING.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  statusText: {
    ...TYPOGRAPHY.h4,
    fontWeight: '600',
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
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  label: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
  },
  value: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  warningCard: {
    backgroundColor: COLORS.warning + '10',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  warningTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.warning,
  },
  warningText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  classContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  classBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  classText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    fontWeight: '600',
  },
  classDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
  },
  endorsementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  endorsementText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
  },
});
