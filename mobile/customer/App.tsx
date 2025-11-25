import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './src/context/AuthContext';
import { BookingProvider } from './src/context/BookingContext';
import AppNavigator from './src/navigation/AppNavigator';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BookingProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </BookingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
