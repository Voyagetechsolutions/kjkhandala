import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function HomeScreen({ navigation }: any) {
  const [origin] = useState('Gaborone');
  const [destination] = useState('Francistown');
  const [date] = useState(new Date().toISOString().split('T')[0]);

  const handleSearch = () => {
    navigation.navigate('Search', { origin, destination, date });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>KJ Khandala</Text>
        <Text style={styles.headerSubtitle}>Book Your Journey</Text>
      </View>

      <View style={styles.searchCard}>
        <Text style={styles.sectionTitle}>Search Trips</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>From:</Text>
          <Text style={styles.input}>{origin}</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>To:</Text>
          <Text style={styles.input}>{destination}</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.input}>{date}</Text>
        </View>

        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search Trips</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('MyTrips')}>
            <Text style={styles.actionText}>My Trips</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 32, paddingTop: 60, backgroundColor: '#2563eb' },
  headerTitle: { fontSize: 32, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 16, color: '#fff', marginTop: 4 },
  searchCard: { backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', width: 60 },
  input: { marginLeft: 12, fontSize: 16, flex: 1 },
  searchButton: { flexDirection: 'row', backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  searchButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginRight: 8 },
  quickActions: { backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 12 },
  actionsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  actionCard: { flex: 1, alignItems: 'center', padding: 20, backgroundColor: '#f5f5f5', borderRadius: 8, marginHorizontal: 6 },
  actionText: { marginTop: 8, fontSize: 14, fontWeight: '500' },
});
