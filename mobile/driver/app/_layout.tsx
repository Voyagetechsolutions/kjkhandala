import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/auth-store';
import { initDatabase } from '@/services/storage';
import { backgroundSyncService } from '@/services/background-sync';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { user, initialized, initialize } = useAuthStore();
  const [initError, setInitError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Initialize app
    const init = async () => {
      try {
        console.log('🚀 Starting app initialization...');
        console.log('📡 Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
        console.log('🔑 Supabase Key:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
        
        console.log('💾 Initializing database...');
        await initDatabase();
        console.log('✅ Database initialized');
        
        console.log('🔐 Initializing auth...');
        await initialize();
        console.log('✅ Auth initialized');
        
        console.log('🔄 Registering background sync...');
        await backgroundSyncService.register();
        console.log('✅ Background sync registered');
        
        console.log('🎉 App initialization complete!');
        setIsInitializing(false);
      } catch (error) {
        console.error('❌ App initialization error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        setInitError(errorMessage);
        setIsInitializing(false);
      }
    };

    init();

    return () => {
      // Cleanup is handled by individual services
    };
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Redirect to sign in
      router.replace('/(auth)/sign-in');
    } else if (user && inAuthGroup) {
      // Redirect to app
      router.replace('/(driver)');
    }
  }, [user, initialized, segments]);

  // Show error screen if initialization failed
  if (initError) {
    return (
      <PaperProvider>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>❌ Initialization Error</Text>
          <Text style={styles.errorMessage}>{initError}</Text>
          <Text style={styles.errorHint}>
            Check the console logs for more details.
          </Text>
        </View>
      </PaperProvider>
    );
  }

  // Show loading screen while initializing
  if (isInitializing) {
    return (
      <PaperProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Initializing app...</Text>
        </View>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(driver)" />
      </Stack>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f44336',
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
