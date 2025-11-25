import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, List, Button, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth-store';
import { useSync, useNetwork } from '@/hooks';
import { NetworkStatus } from '@/components';
import { format } from 'date-fns';

export default function ProfileScreen() {
  const { driver, signOut } = useAuthStore();
  const { syncStatus, sync } = useSync();
  const { isConnected } = useNetwork();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => signOut(),
        },
      ]
    );
  };

  const handleSync = async () => {
    const result = await sync();
    if (result.success) {
      Alert.alert('Success', 'Data synced successfully');
    } else {
      Alert.alert('Error', result.error || 'Sync failed');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <NetworkStatus />
      
      <ScrollView style={styles.scrollView}>
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <Card.Content>
            <View style={styles.profileHeader}>
              <MaterialCommunityIcons name="account-circle" size={80} color="#1976D2" />
              <View style={styles.profileInfo}>
                <Text variant="headlineSmall" style={styles.name}>
                  {driver?.name || 'Driver'}
                </Text>
                <Text variant="bodyMedium" style={styles.email}>
                  {driver?.email}
                </Text>
                <Text variant="bodySmall" style={styles.phone}>
                  {driver?.phone}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Account Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Account Information
            </Text>
            <Divider style={styles.divider} />
            
            <List.Item
              title="License Number"
              description={driver?.license_number || 'Not set'}
              left={props => <List.Icon {...props} icon="card-account-details" />}
            />
            <List.Item
              title="Member Since"
              description={driver?.created_at ? format(new Date(driver.created_at), 'MMMM yyyy') : 'Unknown'}
              left={props => <List.Icon {...props} icon="calendar" />}
            />
          </Card.Content>
        </Card>

        {/* Sync Status */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Sync Status
            </Text>
            <Divider style={styles.divider} />
            
            <List.Item
              title="Connection Status"
              description={isConnected ? 'Online' : 'Offline'}
              left={props => (
                <List.Icon 
                  {...props} 
                  icon={isConnected ? "wifi" : "wifi-off"} 
                  color={isConnected ? "#4CAF50" : "#f44336"}
                />
              )}
            />
            <List.Item
              title="Last Sync"
              description={
                syncStatus.lastSyncTime 
                  ? format(syncStatus.lastSyncTime, 'MMM d, yyyy HH:mm')
                  : 'Never'
              }
              left={props => <List.Icon {...props} icon="sync" />}
            />
            <List.Item
              title="Pending Items"
              description={`${syncStatus.pendingCount} items waiting to sync`}
              left={props => <List.Icon {...props} icon="cloud-upload" />}
            />

            <Button
              mode="contained"
              onPress={handleSync}
              loading={syncStatus.isSyncing}
              disabled={syncStatus.isSyncing || !isConnected}
              style={styles.syncButton}
              icon="sync"
            >
              Sync Now
            </Button>
          </Card.Content>
        </Card>

        {/* Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Actions
            </Text>
            <Divider style={styles.divider} />
            
            <List.Item
              title="App Version"
              description="1.0.0"
              left={props => <List.Icon {...props} icon="information" />}
            />
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleSignOut}
          style={styles.signOutButton}
          buttonColor="#f44336"
          icon="logout"
        >
          Sign Out
        </Button>

        <View style={styles.footer}>
          <Text variant="bodySmall" style={styles.footerText}>
            Voyage Bus Management System
          </Text>
          <Text variant="bodySmall" style={styles.footerText}>
            Driver Application v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    margin: 16,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
    color: '#1976D2',
  },
  email: {
    color: '#666',
    marginTop: 4,
  },
  phone: {
    color: '#666',
    marginTop: 2,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  divider: {
    marginBottom: 8,
  },
  syncButton: {
    marginTop: 16,
  },
  signOutButton: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    color: '#999',
    marginTop: 4,
  },
});
