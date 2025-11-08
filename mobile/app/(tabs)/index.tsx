import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, COMPANY_NAME } from '@/lib/constants';
import { Ionicons } from '@expo/vector-icons';

export default function Home() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const router = useRouter();

  const handleSearch = () => {
    if (!origin || !destination || !date) {
      alert('Please fill in all fields');
      return;
    }
    router.push({
      pathname: '/booking/search',
      params: { origin, destination, date },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>{COMPANY_NAME}</Text>
          <Text style={styles.subtitle}>Your Journey Starts Here</Text>
        </View>

        <View style={styles.searchCard}>
          <Text style={styles.cardTitle}>Book Your Trip</Text>

          <View style={styles.inputGroup}>
            <Ionicons name="location" size={20} color={COLORS.primary} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="From (Origin)"
              value={origin}
              onChangeText={setOrigin}
            />
          </View>

          <View style={styles.inputGroup}>
            <Ionicons name="location" size={20} color={COLORS.primary} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="To (Destination)"
              value={destination}
              onChangeText={setDestination}
            />
          </View>

          <View style={styles.inputGroup}>
            <Ionicons name="calendar" size={20} color={COLORS.primary} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Date (YYYY-MM-DD)"
              value={date}
              onChangeText={setDate}
            />
          </View>

          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Ionicons name="search" size={20} color="#ffffff" />
            <Text style={styles.searchButtonText}>Search Buses</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.features}>
          <Text style={styles.featuresTitle}>Why Choose Us?</Text>
          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} />
            <Text style={styles.featureText}>Safe & Reliable</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="time" size={24} color={COLORS.primary} />
            <Text style={styles.featureText}>On-Time Departures</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="star" size={24} color={COLORS.primary} />
            <Text style={styles.featureText}>Comfortable Coaches</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  searchCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 20,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 12,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  features: {
    padding: 20,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 12,
  },
});
