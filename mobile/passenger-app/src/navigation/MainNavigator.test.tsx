import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';

// Simple test screen
function TestScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Test Screen - No Icons</Text>
    </View>
  );
}

const Tab = createBottomTabNavigator();

export default function MainNavigatorTest() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Test" 
        component={TestScreen} 
        options={{ title: 'Test' }} 
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
});
