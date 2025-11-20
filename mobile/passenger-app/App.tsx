import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const mockRecentSearches = [
  { id: '1', from: 'Gaborone', to: 'Johannesburg' },
  { id: '2', from: 'Francistown', to: 'Gaborone' },
  { id: '3', from: 'Cape Town', to: 'Bloemfontein' },
];

const mockAnnouncements = [
  { id: '1', type: 'info', message: 'All routes operating normally today.' },
  { id: '2', type: 'warning', message: 'Delay on Gaborone → Johannesburg evening trip due to roadworks.' },
];

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchPress = () => {
    Alert.alert('Trip Search', 'Search flow will be implemented next.');
  };

  const handleMyTripsPress = () => {
    Alert.alert('My Trips', 'My Trips screen will be implemented next.');
  };

  const handleSupportPress = () => {
    Alert.alert('Support', 'Support screen will be implemented next.');
  };

  const handleEmergencyPress = () => {
    Alert.alert('Emergency', 'Emergency contact will be implemented next.');
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#4F46E5', '#7C3AED']}
        style={styles.header}
      >
        <View style={styles.headerTopRow}>
          <Text style={styles.greeting}>Good morning! 👋</Text>
          <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
        </View>
        <Text style={styles.location}>Gaborone, Botswana</Text>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchHeader}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <Text style={styles.searchTitle}>Where would you like to go?</Text>
          </View>
          
          <View style={styles.searchInputContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search destinations..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={handleSearchPress}
            >
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
          
          {/* Quick Search Options */}
          <View style={styles.quickSearchGrid}>
            <TouchableOpacity style={styles.quickSearchItem} onPress={() => Alert.alert('From', 'Location picker coming soon')}>
              <Ionicons name="location-outline" size={16} color="#6366F1" />
              <Text style={styles.quickSearchText}>From</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickSearchItem} onPress={() => Alert.alert('To', 'Destination picker coming soon')}>
              <Ionicons name="flag-outline" size={16} color="#6366F1" />
              <Text style={styles.quickSearchText}>To</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickSearchItem} onPress={() => Alert.alert('Date', 'Date picker coming soon')}>
              <Ionicons name="calendar-outline" size={16} color="#6366F1" />
              <Text style={styles.quickSearchText}>Date</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickSearchItem} onPress={() => Alert.alert('Return', 'Return date picker coming soon')}>
              <Ionicons name="swap-horizontal-outline" size={16} color="#6366F1" />
              <Text style={styles.quickSearchText}>Return</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickSearchItem} onPress={() => Alert.alert('Passengers', 'Passenger selector coming soon')}>
              <Ionicons name="people-outline" size={16} color="#6366F1" />
              <Text style={styles.quickSearchText}>Passengers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickSearchItem} onPress={() => Alert.alert('Time', 'Time picker coming soon')}>
              <Ionicons name="time-outline" size={16} color="#6366F1" />
              <Text style={styles.quickSearchText}>Time</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionItem} onPress={handleMyTripsPress}>
              <Ionicons name="car-outline" size={24} color="#6366F1" />
              <Text style={styles.quickActionText}>My Trips</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionItem} onPress={() => Alert.alert('New Booking', 'Booking flow coming soon')}>
              <Ionicons name="add-circle-outline" size={24} color="#6366F1" />
              <Text style={styles.quickActionText}>New Booking</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionItem} onPress={handleSupportPress}>
              <Ionicons name="help-circle-outline" size={24} color="#6366F1" />
              <Text style={styles.quickActionText}>Support</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionItem} onPress={handleEmergencyPress}>
              <Ionicons name="shield-outline" size={24} color="#DC2626" />
              <Text style={styles.quickActionTextRed}>Emergency</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Searches */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            <TouchableOpacity onPress={() => Alert.alert('See All', 'Recent searches list coming soon')}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          
          {mockRecentSearches.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.recentItem}
              onPress={() => Alert.alert('Search Again', `${item.from} → ${item.to}`)}
            >
              <View style={styles.recentItemLeft}>
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text style={styles.recentRoute}>{item.from} → {item.to}</Text>
              </View>
              <Text style={styles.recentAction}>Tap to search again</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Promotions */}
        <View style={styles.promosSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Special Offers</Text>
          </View>
          
          <TouchableOpacity onPress={() => Alert.alert('Promo', 'Promotion details coming soon')}>
            <LinearGradient
              colors={['#F59E0B', '#EF4444']}
              style={styles.promoCard}
            >
              <View style={styles.promoContent}>
                <Ionicons name="gift-outline" size={24} color="white" />
                <Text style={styles.promoTitle}>Limited-time offer</Text>
                <Text style={styles.promoDescription}>
                  Save 20% on mid-week trips until December 31st
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Announcements */}
        <View style={styles.announcementsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Announcements</Text>
            <Ionicons name="megaphone-outline" size={16} color="#6B7280" />
          </View>
          
          {mockAnnouncements.map((a) => (
            <View key={a.id} style={[styles.announcementItem, a.type === 'warning' && styles.announcementWarning]}>
              <Ionicons 
                name={a.type === 'warning' ? 'warning-outline' : 'information-circle-outline'} 
                size={16} 
                color={a.type === 'warning' ? '#F59E0B' : '#3B82F6'} 
              />
              <Text style={styles.announcementText}>{a.message}</Text>
            </View>
          ))}
        </View>

        {/* Support & Help */}
        <View style={styles.supportSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Support & Help</Text>
          </View>
          
          <View style={styles.supportGrid}>
            <TouchableOpacity style={styles.supportItem} onPress={() => Alert.alert('WhatsApp', 'WhatsApp support coming soon')}>
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
              <Text style={styles.supportText}>WhatsApp</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.supportItem} onPress={() => Alert.alert('Call Centre', 'Call centre coming soon')}>
              <Ionicons name="call-outline" size={20} color="#6366F1" />
              <Text style={styles.supportText}>Call Centre</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.supportItem} onPress={() => Alert.alert('FAQ', 'FAQ section coming soon')}>
              <Ionicons name="help-circle-outline" size={20} color="#6366F1" />
              <Text style={styles.supportText}>FAQ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Emergency Contact */}
        <TouchableOpacity 
          style={styles.emergencyButton}
          onPress={() => Alert.alert('Emergency Contact', 'Calling emergency number: 0800 123 456')}
        >
          <Ionicons name="call" size={20} color="white" />
          <Text style={styles.emergencyText}>Emergency contact: 0800 123 456</Text>
        </TouchableOpacity>
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  location: {
    fontSize: 14,
    color: '#E0E7FF',
    marginTop: 4,
  },
  content: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#374151',
  },
  searchButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginLeft: 8,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  quickSearchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  quickSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  quickSearchText: {
    fontSize: 13,
    color: '#6366F1',
    marginLeft: 6,
    fontWeight: '500',
  },
  quickActionsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
  },
  quickActionTextRed: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    marginTop: 8,
  },
  recentSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  recentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentRoute: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 8,
  },
  recentAction: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  promosSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  promoCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  promoContent: {
    alignItems: 'flex-start',
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  promoDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 4,
    opacity: 0.9,
  },
  announcementsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  announcementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  announcementWarning: {
    backgroundColor: '#FEF3C7',
  },
  announcementText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    marginLeft: 8,
    lineHeight: 18,
  },
  supportSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  supportGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  supportItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  supportText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginTop: 6,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emergencyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
