import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';

export default function AppNavigatorMinimal() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    // This will trigger the auth state change and show login screen
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to KJ Khandala</Text>
      <Text style={styles.subtitle}>Minimal Navigation Test</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 40,
    textAlign: 'center',
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
