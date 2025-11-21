import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import TripDetailsScreen from '../screens/trips/TripDetailsScreen';
import PreTripInspectionScreen from '../screens/inspection/PreTripInspectionScreen';
import PostTripInspectionScreen from '../screens/inspection/PostTripInspectionScreen';
import FuelLogScreen from '../screens/fuel/FuelLogScreen';
import IncidentReportScreen from '../screens/incident/IncidentReportScreen';
import LiveTrackingScreen from '../screens/tracking/LiveTrackingScreen';
import QRScannerScreen from '../screens/checkin/QRScannerScreen';
import WalletScreen from '../screens/wallet/WalletScreen';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../lib/constants';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainNavigator} />
            <Stack.Screen 
              name="TripDetails" 
              component={TripDetailsScreen}
              options={{ 
                headerShown: true,
                title: 'Trip Details',
                headerStyle: { backgroundColor: COLORS.primary },
                headerTintColor: COLORS.white,
              }}
            />
            <Stack.Screen 
              name="PreTripInspection" 
              component={PreTripInspectionScreen}
              options={{ 
                headerShown: true,
                title: 'Pre-Trip Inspection',
                headerStyle: { backgroundColor: COLORS.primary },
                headerTintColor: COLORS.white,
              }}
            />
            <Stack.Screen 
              name="PostTripInspection" 
              component={PostTripInspectionScreen}
              options={{ 
                headerShown: true,
                title: 'Post-Trip Inspection',
                headerStyle: { backgroundColor: COLORS.primary },
                headerTintColor: COLORS.white,
              }}
            />
            <Stack.Screen 
              name="FuelLog" 
              component={FuelLogScreen}
              options={{ 
                headerShown: true,
                title: 'Fuel Log',
                headerStyle: { backgroundColor: COLORS.primary },
                headerTintColor: COLORS.white,
              }}
            />
            <Stack.Screen 
              name="IncidentReport" 
              component={IncidentReportScreen}
              options={{ 
                headerShown: true,
                title: 'Report Incident',
                headerStyle: { backgroundColor: COLORS.primary },
                headerTintColor: COLORS.white,
              }}
            />
            <Stack.Screen 
              name="LiveTracking" 
              component={LiveTrackingScreen}
              options={{ 
                headerShown: true,
                title: 'Live Tracking',
                headerStyle: { backgroundColor: COLORS.primary },
                headerTintColor: COLORS.white,
              }}
            />
            <Stack.Screen 
              name="QRScanner" 
              component={QRScannerScreen}
              options={{ 
                headerShown: true,
                title: 'Scan Passenger QR',
                headerStyle: { backgroundColor: COLORS.primary },
                headerTintColor: COLORS.white,
              }}
            />
            <Stack.Screen 
              name="Wallet" 
              component={WalletScreen}
              options={{ 
                headerShown: true,
                title: 'Wallet & Earnings',
                headerStyle: { backgroundColor: COLORS.primary },
                headerTintColor: COLORS.white,
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
    backgroundColor: COLORS.background,
  },
});
