import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Searchbar, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { useShifts } from '@/hooks';
import { NetworkStatus, ShiftCard } from '@/components';
import { isToday, isFuture, isPast } from 'date-fns';

export default function ShiftsScreen() {
  const router = useRouter();
  const { driver } = useAuthStore();
  const { shifts, loading, refresh, updateShiftStatus } = useShifts(driver?.id || null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleStartShift = async (shiftId: string) => {
    try {
      await updateShiftStatus(shiftId, 'active');
    } catch (error) {
      console.error('Failed to start shift:', error);
    }
  };

  const handleEndShift = async (shiftId: string) => {
    try {
      await updateShiftStatus(shiftId, 'completed');
    } catch (error) {
      console.error('Failed to end shift:', error);
    }
  };

  const filteredShifts = shifts.filter(shift => {
    const shiftDate = new Date(shift.start_time);
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'today' && isToday(shiftDate)) ||
      (filter === 'upcoming' && isFuture(shiftDate)) ||
      (filter === 'past' && isPast(shiftDate));

    const matchesSearch = 
      !searchQuery ||
      shift.bus?.bus_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shift.route?.route_name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <NetworkStatus />
      
      <View style={styles.header}>
        <Searchbar
          placeholder="Search shifts..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        <SegmentedButtons
          value={filter}
          onValueChange={setFilter}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'today', label: 'Today' },
            { value: 'upcoming', label: 'Upcoming' },
            { value: 'past', label: 'Past' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredShifts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No shifts found
            </Text>
          </View>
        ) : (
          filteredShifts.map(shift => (
            <ShiftCard
              key={shift.id}
              shift={shift}
              onPress={() => console.log('View shift:', shift.id)}
              onStartShift={
                shift.status === 'scheduled' 
                  ? () => handleStartShift(shift.id) 
                  : undefined
              }
              onEndShift={
                shift.status === 'active' 
                  ? () => handleEndShift(shift.id) 
                  : undefined
              }
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchbar: {
    marginBottom: 12,
  },
  segmentedButtons: {
    marginBottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    color: '#999',
  },
});
