import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

// Screens
import SplashScreen from '../screens/auth/SplashScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import HomeScreen from '../screens/home/HomeScreen';
import SearchResultsScreen from '../screens/booking/SearchResultsScreen';
import SeatSelectionScreen from '../screens/booking/SeatSelectionScreen';
import PassengerDetailsScreen from '../screens/booking/PassengerDetailsScreen';
import PaymentScreen from '../screens/booking/PaymentScreen';
import TicketScreen from '../screens/booking/TicketScreen';
import MyTripsScreen from '../screens/tickets/MyTripsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import DeparturesScreen from '../screens/departures/DeparturesScreen';
import LoyaltyScreen from '../screens/loyalty/LoyaltyScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'MyTrips') {
            iconName = focused ? 'ticket' : 'ticket-outline';
          } else if (route.name === 'Departures') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Loyalty') {
            iconName = focused ? 'card' : 'card-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen 
        name="MyTrips" 
        component={MyTripsScreen}
        options={{ title: 'My Trips' }}
      />
      <Tab.Screen name="Departures" component={DeparturesScreen} />
      <Tab.Screen name="Loyalty" component={LoyaltyScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Simple loading component that doesn't use navigation
const LoadingScreen = () => (
  <LinearGradient
    colors={['#2563eb', '#1e40af']}
    style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
  >
    <View style={{ alignItems: 'center' }}>
      <View style={{
        width: 120,
        height: 120,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
      }}>
        <Ionicons name="bus" size={64} color="#ffffff" />
      </View>
      <Text style={{
        fontSize: 36,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
      }}>KJ Khandala</Text>
      <Text style={{
        fontSize: 20,
        color: 'rgba(255, 255, 255, 0.9)',
      }}>Travel & Tours</Text>
    </View>
  </LinearGradient>
);

const AppNavigator = () => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
        <Stack.Screen name="SeatSelection" component={SeatSelectionScreen} />
        <Stack.Screen name="PassengerDetails" component={PassengerDetailsScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="Ticket" component={TicketScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
