import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { checkinService } from '../../services/checkinService';
import PassengerCard from '../../components/PassengerCard';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { Booking } from '../../types';
import { COLORS, SPACING, TYPOGRAPHY } from '../../lib/constants';

export default function PassengerManifestScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { driver } = useAuth();
  const { tripId } = route.params as { tripId: string };
  const [passengers, setPassengers] = useState<Booking[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    boarded: 0,
    pending: 0,
    noShow: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadManifest();
  }, [tripId]);

  const loadManifest = async () => {
    try {
      setLoading(true);
      const [manifestData, statsData] = await Promise.all([
        checkinService.getPassengerManifest(tripId),
        checkinService.getCheckinStats(tripId),
      ]);
      setPassengers(manifestData);
      setStats(statsData);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load passenger manifest');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadManifest();
    setRefreshing(false);
  };

  const handleCheckIn = async (bookingId: string) => {
    if (!driver?.id) return;

    try {
      await checkinService.checkInPassengerManual(bookingId, tripId, driver.id);
      Alert.alert('Success', 'Passenger checked in successfully');
      loadManifest();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to check in passenger');
    }
  };

  const handleNoShow = async (bookingId: string) => {
    Alert.alert(
      'Mark as No Show',
      'Are you sure this passenger did not show up?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              await checkinService.markNoShow(bookingId);
              Alert.alert('Success', 'Passenger marked as no-show');
              loadManifest();
            } catch (error: any) {
              Alert.alert('Error', 'Failed to mark passenger as no-show');
            }
          },
        },
      ]
    );
  };

  const handleAddNotes = (bookingId: string) => {
    Alert.prompt(
      'Add Notes',
      'Enter notes for this passenger:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (notes) => {
            try {
              await checkinService.addPassengerNotes(bookingId, notes || '');
              Alert.alert('Success', 'Notes added successfully');
            } catch (error: any) {
              Alert.alert('Error', 'Failed to add notes');
            }
          },
        },
      ]
    );
  };

  const handleScanQR = () => {
    navigation.navigate('QRScanner' as never, { tripId } as never);
  };

  const filteredPassengers = passengers.filter((p) =>
    p.passenger_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.seat_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Passenger Manifest</Text>
        <Button
          title="Scan QR"
          onPress={handleScanQR}
          size="small"
          style={styles.scanButton}
        />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, styles.statSuccess]}>
          <Text style={[styles.statValue, { color: COLORS.success }]}>
            {stats.boarded}
          </Text>
          <Text style={styles.statLabel}>Boarded</Text>
        </View>
        <View style={[styles.statCard, styles.statWarning]}>
          <Text style={[styles.statValue, { color: COLORS.warning }]}>
            {stats.pending}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, styles.statDanger]}>
          <Text style={[styles.statValue, { color: COLORS.danger }]}>
            {stats.noShow}
          </Text>
          <Text style={styles.statLabel}>No Show</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.gray[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or seat..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.gray[400]}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.gray[400]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Passengers List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <Card>
            <Text style={styles.emptyText}>Loading passengers...</Text>
          </Card>
        ) : filteredPassengers.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="people-outline" size={64} color={COLORS.gray[400]} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No passengers found' : 'No passengers'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Try a different search term'
                : 'No passengers booked for this trip'}
            </Text>
          </Card>
        ) : (
          filteredPassengers.map((passenger) => (
            <PassengerCard
              key={passenger.id}
              booking={passenger}
              onCheckIn={() => handleCheckIn(passenger.id)}
              onNoShow={() => handleNoShow(passenger.id)}
              onAddNotes={() => handleAddNotes(passenger.id)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text.primary,
  },
  scanButton: {
    paddingHorizontal: SPACING.md,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.gray[50],
  },
  statSuccess: {
    backgroundColor: `${COLORS.success}10`,
  },
  statWarning: {
    backgroundColor: `${COLORS.warning}10`,
  },
  statDanger: {
    backgroundColor: `${COLORS.danger}10`,
  },
  statValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  emptyCard: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
    marginTop: SPACING.md,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});
