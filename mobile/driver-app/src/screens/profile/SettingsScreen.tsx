import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/Card';
import { COLORS, SPACING, TYPOGRAPHY } from '../../lib/constants';

export default function SettingsScreen() {
  const { driver } = useAuth();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [tripAlerts, setTripAlerts] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [locationTracking, setLocationTracking] = useState(true);

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear the app cache?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', 'Cache cleared successfully');
          },
        },
      ]
    );
  };

  const renderSettingRow = (
    icon: string,
    label: string,
    value: boolean,
    onValueChange: (value: boolean) => void
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={24} color={COLORS.gray[600]} />
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: COLORS.gray[300], true: COLORS.primary }}
        thumbColor={COLORS.white}
      />
    </View>
  );

  const renderActionRow = (icon: string, label: string, onPress: () => void, color?: string) => (
    <TouchableOpacity style={styles.actionRow} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={24} color={color || COLORS.gray[600]} />
        <Text style={[styles.settingLabel, color && { color }]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        {renderSettingRow('notifications', 'Push Notifications', pushNotifications, setPushNotifications)}
        {renderSettingRow('car', 'Trip Alerts', tripAlerts, setTripAlerts)}
        {renderSettingRow('chatbubbles', 'Message Notifications', messageNotifications, setMessageNotifications)}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Privacy & Location</Text>
        {renderSettingRow('location', 'Location Tracking', locationTracking, setLocationTracking)}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Location tracking is required for trip management and passenger safety.
          </Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>App Preferences</Text>
        {renderActionRow('language', 'Language', () => Alert.alert('Language', 'English (Default)'))}
        {renderActionRow('moon', 'Dark Mode', () => Alert.alert('Dark Mode', 'Coming soon!'))}
        {renderActionRow('trash', 'Clear Cache', handleClearCache)}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>App Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Build Number</Text>
          <Text style={styles.infoValue}>100</Text>
        </View>
        {renderActionRow('document-text', 'Terms of Service', () => Alert.alert('Terms of Service', 'View terms and conditions'))}
        {renderActionRow('shield-checkmark', 'Privacy Policy', () => Alert.alert('Privacy Policy', 'View privacy policy'))}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Account</Text>
        {renderActionRow('key', 'Change Password', () => Alert.alert('Change Password', 'Password change coming soon'))}
        {renderActionRow('trash', 'Delete Account', () => {
          Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive' },
            ]
          );
        }, COLORS.danger)}
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
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  settingLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
  },
  infoBox: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 8,
    marginTop: SPACING.md,
  },
  infoText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
    flex: 1,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
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
});
