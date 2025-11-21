import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen({ navigation }: any) {
  const { signOut, user } = useAuth();
  
  const menuItems = [
    { id: 'trips', title: 'My Trips', icon: 'ticket-outline', screen: 'MyTrips' },
    { id: 'personal', title: 'Personal Information', icon: 'person-outline', screen: 'PersonalInfo' },
    { id: 'payment', title: 'Payment Methods', icon: 'card-outline', screen: 'PaymentMethods' },
    { id: 'notifications', title: 'Notifications', icon: 'notifications-outline', screen: 'Notifications' },
    { id: 'help', title: 'Help & Support', icon: 'help-circle-outline', screen: 'HelpSupport' },
    { id: 'about', title: 'About', icon: 'information-circle-outline', screen: 'About' },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: async () => {
            await signOut();
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={48} color="#fff" />
        </View>
        <Text style={styles.name}>{user?.user_metadata?.full_name || 'User'}</Text>
        <Text style={styles.email}>{user?.email || 'No email'}</Text>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Trips</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>P0</Text>
          <Text style={styles.statLabel}>Spent</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
      </View>

      <View style={styles.menuSection}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => item.screen && navigation.navigate(item.screen)}
          >
            <View style={styles.menuLeft}>
              <Ionicons name={item.icon as any} size={24} color="#2563eb" />
              <Text style={styles.menuTitle}>{item.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.version}>Version 1.0.0</Text>
        <Text style={styles.copyright}>© 2025 KJ Khandala</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#2563eb', padding: 32, alignItems: 'center' },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#1e40af', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  name: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 4 },
  email: { fontSize: 14, color: '#fff' },
  statsCard: { backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: '#2563eb', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#666' },
  statDivider: { width: 1, backgroundColor: '#e5e7eb' },
  menuSection: { backgroundColor: '#fff', margin: 16, marginTop: 0, borderRadius: 12, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuTitle: { fontSize: 16, marginLeft: 16, color: '#374151' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#fee2e2' },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#ef4444', marginLeft: 8 },
  footer: { alignItems: 'center', padding: 32 },
  version: { fontSize: 12, color: '#9ca3af', marginBottom: 4 },
  copyright: { fontSize: 12, color: '#9ca3af' },
});
