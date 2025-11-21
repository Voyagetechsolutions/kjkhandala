import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainNavigatorTest from './MainNavigator.test';

// Booking flow screens
import SearchScreen from '../screens/SearchScreen';
import TripDetailsScreen from '../screens/TripDetailsScreen';
import SeatSelectionScreen from '../screens/SeatSelectionScreen';
import PassengerInfoScreen from '../screens/PassengerInfoScreen';
import PaymentScreen from '../screens/PaymentScreen';
import BookingConfirmationScreen from '../screens/BookingConfirmationScreen';
import BookingDetailsScreen from '../screens/BookingDetailsScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
        }}
      >
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainNavigatorTest} />
            <Stack.Screen 
              name="Search" 
              component={SearchScreen} 
              options={{ 
                headerShown: true,
                title: 'Search Trips',
                headerStyle: { backgroundColor: '#2563eb' },
                headerTintColor: '#fff',
              }}
            />
            <Stack.Screen 
              name="TripDetails" 
              component={TripDetailsScreen} 
              options={{ 
                headerShown: true,
                title: 'Trip Details',
                headerStyle: { backgroundColor: '#2563eb' },
                headerTintColor: '#fff',
              }}
            />
            <Stack.Screen 
              name="SeatSelection" 
              component={SeatSelectionScreen} 
              options={{ 
                headerShown: true,
                title: 'Select Seat',
                headerStyle: { backgroundColor: '#2563eb' },
                headerTintColor: '#fff',
              }}
            />
            <Stack.Screen 
              name="PassengerInfo" 
              component={PassengerInfoScreen} 
              options={{ 
                headerShown: true,
                title: 'Passenger Information',
                headerStyle: { backgroundColor: '#2563eb' },
                headerTintColor: '#fff',
              }}
            />
            <Stack.Screen 
              name="Payment" 
              component={PaymentScreen} 
              options={{ 
                headerShown: true,
                title: 'Payment',
                headerStyle: { backgroundColor: '#2563eb' },
                headerTintColor: '#fff',
              }}
            />
            <Stack.Screen 
              name="BookingConfirmation" 
              component={BookingConfirmationScreen} 
              options={{ 
                headerShown: true,
                title: 'Booking Confirmed', 
                headerLeft: () => null,
                headerStyle: { backgroundColor: '#2563eb' },
                headerTintColor: '#fff',
              }}
            />
            <Stack.Screen 
              name="BookingDetails" 
              component={BookingDetailsScreen} 
              options={{ 
                headerShown: true,
                title: 'Booking Details',
                headerStyle: { backgroundColor: '#2563eb' },
                headerTintColor: '#fff',
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
