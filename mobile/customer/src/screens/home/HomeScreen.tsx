import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import { fetchCities, searchTrips } from '../../services/tripService';
import Input from '../../components/Input';
import Button from '../../components/Button';
import CityPicker from '../../components/CityPicker';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { setSearchParams } = useBooking();

  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [showDepartureCal, setShowDepartureCal] = useState(false);
  const [showReturnCal, setShowReturnCal] = useState(false);

  // Search form state
  const [searchForm, setSearchForm] = useState({
    from: '',
    to: '',
    passengers: '1',
    departureDate: '',
    returnDate: '',
    tripType: 'one-way' as 'one-way' | 'return',
  });

  // Promotional slides
  const slides = [
    { id: 1, title: 'Travel in Comfort', color: '#2563eb' },
    { id: 2, title: 'Affordable Rates', color: '#10b981' },
    { id: 3, title: 'Safe Journey', color: '#7c3aed' },
  ];

  useEffect(() => {
    loadCities();
  }, []);

  // Auto-slide effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const loadCities = async () => {
    try {
      const citiesList = await fetchCities();
      setCities(citiesList);
    } catch (error) {
      console.error('Failed to load cities:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchForm.from || !searchForm.to || !searchForm.departureDate) {
      Alert.alert('Error', 'Please fill in From, To, and Departure Date');
      return;
    }

    if (searchForm.tripType === 'return' && !searchForm.returnDate) {
      Alert.alert('Error', 'Please select a return date');
      return;
    }

    setLoading(true);
    try {
      const searchParams = {
        from: searchForm.from,
        to: searchForm.to,
        travelDate: searchForm.departureDate,
        returnDate: searchForm.returnDate,
        passengers: parseInt(searchForm.passengers),
        tripType: searchForm.tripType,
      };

      // Store search params in context
      setSearchParams(searchParams);

      // Navigate to search results
      navigation.navigate('SearchResults' as never);
    } catch (error) {
      Alert.alert('Error', 'Failed to search trips');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>KJ Khandala Travel</Text>
            <Text style={styles.subtitle}>Book your next journey</Text>
          </View>
          {!user && (
            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => navigation.navigate('SignIn' as never)}
            >
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Widget */}
        <View style={styles.searchCard}>
          <Text style={styles.searchTitle}>Search for Tickets</Text>

          {/* Trip Type Toggle */}
          <View style={styles.tripTypeContainer}>
            <TouchableOpacity
              style={[
                styles.tripTypeButton,
                searchForm.tripType === 'one-way' && styles.tripTypeActive,
              ]}
              onPress={() => setSearchForm({ ...searchForm, tripType: 'one-way' })}
            >
              <Text
                style={[
                  styles.tripTypeText,
                  searchForm.tripType === 'one-way' && styles.tripTypeTextActive,
                ]}
              >
                One-Way
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tripTypeButton,
                searchForm.tripType === 'return' && styles.tripTypeActive,
              ]}
              onPress={() => setSearchForm({ ...searchForm, tripType: 'return' })}
            >
              <Text
                style={[
                  styles.tripTypeText,
                  searchForm.tripType === 'return' && styles.tripTypeTextActive,
                ]}
              >
                Return Trip
              </Text>
            </TouchableOpacity>
          </View>

          {/* From Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>From</Text>
            <View style={styles.selectContainer}>
              <TouchableOpacity 
                style={styles.selectButton}
                onPress={() => setShowFromPicker(true)}
              >
                <Ionicons name="location" size={20} color="#6b7280" />
                <Text style={[styles.selectText, !searchForm.from && styles.placeholderText]}>
                  {searchForm.from || 'Select departure city'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* To Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>To</Text>
            <View style={styles.selectContainer}>
              <TouchableOpacity 
                style={styles.selectButton}
                onPress={() => setShowToPicker(true)}
              >
                <Ionicons name="location" size={20} color="#6b7280" />
                <Text style={[styles.selectText, !searchForm.to && styles.placeholderText]}>
                  {searchForm.to || 'Select destination city'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Passengers */}
          <Input
            label="Passengers"
            value={searchForm.passengers}
            onChangeText={(text) => setSearchForm({ ...searchForm, passengers: text })}
            placeholder="Number of passengers"
            keyboardType="numeric"
          />

          {/* Departure Date */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Departure Date</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDepartureCal(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#6b7280" />
              <Text style={searchForm.departureDate ? styles.dateText : styles.datePlaceholder}>
                {searchForm.departureDate || 'Select departure date'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Return Date (if return trip) */}
          {searchForm.tripType === 'return' && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Return Date</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowReturnCal(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                <Text style={searchForm.returnDate ? styles.dateText : styles.datePlaceholder}>
                  {searchForm.returnDate || 'Select return date'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Search Button */}
          <Button
            title={loading ? 'Searching...' : 'Search Trips'}
            onPress={handleSearch}
            loading={loading}
            style={styles.searchButton}
          />
        </View>

        {/* Promotional Slideshow */}
        <View style={styles.slideshowContainer}>
          <View style={styles.slideshow}>
            {slides.map((slide, index) => (
              <View
                key={slide.id}
                style={[
                  styles.slide,
                  { backgroundColor: slide.color },
                  {
                    opacity: index === currentSlide ? 1 : 0,
                    transform: [
                      {
                        translateX: index === currentSlide ? 0 : width,
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.slideText}>{slide.title}</Text>
              </View>
            ))}
          </View>

          {/* Slide Indicators */}
          <View style={styles.indicators}>
            {slides.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.indicator,
                  index === currentSlide && styles.indicatorActive,
                ]}
                onPress={() => setCurrentSlide(index)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* City Pickers */}
      <CityPicker
        visible={showFromPicker}
        cities={cities}
        selectedCity={searchForm.from}
        onSelect={(city) => setSearchForm({ ...searchForm, from: city })}
        onClose={() => setShowFromPicker(false)}
        title="Select Departure City"
      />

      <CityPicker
        visible={showToPicker}
        cities={cities}
        selectedCity={searchForm.to}
        onSelect={(city) => setSearchForm({ ...searchForm, to: city })}
        onClose={() => setShowToPicker(false)}
        title="Select Destination City"
      />

      {/* Calendar Modals */}
      <Modal visible={showDepartureCal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Departure Date</Text>
              <TouchableOpacity onPress={() => setShowDepartureCal(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={(day: any) => {
                setSearchForm({ ...searchForm, departureDate: day.dateString });
                setShowDepartureCal(false);
              }}
              markedDates={{
                [searchForm.departureDate]: {
                  selected: true,
                  selectedColor: '#2563eb',
                },
              }}
              minDate={new Date().toISOString().split('T')[0]}
              theme={{
                selectedDayBackgroundColor: '#2563eb',
                todayTextColor: '#2563eb',
                arrowColor: '#2563eb',
              }}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={showReturnCal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Return Date</Text>
              <TouchableOpacity onPress={() => setShowReturnCal(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={(day: any) => {
                setSearchForm({ ...searchForm, returnDate: day.dateString });
                setShowReturnCal(false);
              }}
              markedDates={{
                [searchForm.returnDate]: {
                  selected: true,
                  selectedColor: '#2563eb',
                },
              }}
              minDate={searchForm.departureDate || new Date().toISOString().split('T')[0]}
              theme={{
                selectedDayBackgroundColor: '#2563eb',
                todayTextColor: '#2563eb',
                arrowColor: '#2563eb',
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  signInButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#2563eb',
    borderRadius: 8,
  },
  signInText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  searchCard: {
    margin: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  tripTypeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  tripTypeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  tripTypeActive: {
    backgroundColor: '#2563eb',
  },
  tripTypeText: {
    fontWeight: '500',
    color: '#6b7280',
  },
  tripTypeTextActive: {
    color: '#ffffff',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  selectContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  selectText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
  placeholderText: {
    color: '#9ca3af',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  searchButton: {
    marginTop: 8,
  },
  slideshowContainer: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    height: 150,
  },
  slideshow: {
    flex: 1,
    position: 'relative',
  },
  slide: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: '#ffffff',
    width: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 6,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  datePlaceholder: {
    flex: 1,
    fontSize: 16,
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
});

export default HomeScreen;
