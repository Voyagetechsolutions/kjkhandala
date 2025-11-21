import React, { useEffect } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';

interface SplashScreenProps {
  onAuthStateChange: (isAuthenticated: boolean) => void;
}

export default function SplashScreen({ onAuthStateChange }: SplashScreenProps) {
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Wait 2 seconds for splash effect
      setTimeout(() => {
        onAuthStateChange(!!session);
      }, 2000);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setTimeout(() => {
        onAuthStateChange(false);
      }, 2000);
    }
  };

  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/images/logo.png')} 
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator 
        size="large" 
        color="#2563eb" 
        style={styles.loader}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 50,
  },
  loader: {
    marginTop: 20,
  },
});
