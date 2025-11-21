import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function MainNavigatorMinimal() {
  const { signOut, user } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Main App Loaded!</Text>
      <Text style={styles.subtitle}>User: {user?.email}</Text>
      
      <TouchableOpacity style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
