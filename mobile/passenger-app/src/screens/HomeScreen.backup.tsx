import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { tripService } from '../services/tripService';

export default function HomeScreen({ navigation }: any) {
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      const data = await tripService.getCities();
      setCities(data);
      if (data.length >= 2) {
        setOrigin(data[0]);
        setDestination(data[1]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    navigation.navigate('Search', { origin, destination, date });
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#2563eb', '#1e40af']} style={styles.header}>
        <Text style={styles.headerTitle}>KJ Khandala</Text>
        <Text style={styles.headerSubtitle}>Book Your Journey</Text>
      </LinearGradient>

      <View style={styles.searchCard}>
        <Text style={styles.sectionTitle}>Search Trips</Text>
        
        <View style={styles.inputGroup}>
          <Ionicons name="location" size={20} color="#2563eb" />
          <Text style={styles.input}>{origin}</Text>
        </View>

        <View style={styles.inputGroup}>
          <Ionicons name="location" size={20} color="#2563eb" />
          <Text style={styles.input}>{destination}</Text>
        </View>

        <View style={styles.inputGroup}>
          <Ionicons name="calendar" size={20} color="#2563eb" />
          <Text style={styles.input}>{date}</Text>
        </View>

        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search Trips</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('MyTrips')}>
            <Ionicons name="ticket" size={32} color="#2563eb" />
            <Text style={styles.actionText}>My Trips</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="time" size={32} color="#2563eb" />
            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 32, paddingTop: 60 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 16, color: '#fff', opacity: 0.9, marginTop: 4 },
  searchCard: { backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 12, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8, marginBottom: 12 },
  input: { marginLeft: 12, fontSize: 16, flex: 1 },
  searchButton: { flexDirection: 'row', backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  searchButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginRight: 8 },
  quickActions: { backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 12 },
  actionsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  actionCard: { flex: 1, alignItems: 'center', padding: 20, backgroundColor: '#f5f5f5', borderRadius: 8, marginHorizontal: 6 },
  actionText: { marginTop: 8, fontSize: 14, fontWeight: '500' },
});
