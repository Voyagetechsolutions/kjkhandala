import React, { useState } from 'react';
import { View } from 'react-native';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';

type Screen = 'splash' | 'login' | 'signup';

export default function AuthNavigator() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');

  const handleAuthStateChange = (isAuthenticated: boolean) => {
    if (!isAuthenticated) {
      setCurrentScreen('login');
    }
  };

  const handleAuthSuccess = () => {
    // This will be handled by the AuthContext
    // The user state will change and MainNavigator will load
  };

  const navigateToSignUp = () => {
    setCurrentScreen('signup');
  };

  const navigateToLogin = () => {
    setCurrentScreen('login');
  };

  if (currentScreen === 'splash') {
    return <SplashScreen onAuthStateChange={handleAuthStateChange} />;
  }

  if (currentScreen === 'login') {
    return (
      <LoginScreen 
        onAuthSuccess={handleAuthSuccess}
        onNavigateToSignUp={navigateToSignUp}
      />
    );
  }

  return (
    <SignUpScreen 
      onAuthSuccess={handleAuthSuccess}
      onNavigateToLogin={navigateToLogin}
    />
  );
}
