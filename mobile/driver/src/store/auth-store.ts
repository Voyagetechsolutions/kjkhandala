import { create } from 'zustand';
import { supabase, driverQueries } from '@/services/supabase';
import { storage, STORAGE_KEYS } from '@/services/storage';
import type { Driver } from '@/types';

interface AuthState {
  user: any | null;
  driver: Driver | null;
  session: any | null;
  loading: boolean;
  initialized: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshDriver: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  driver: null,
  session: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    try {
      set({ loading: true });

      // Check for existing session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        set({ session, user: session.user });
        
        // Load driver profile
        try {
          const driver = await driverQueries.getDriverProfile(session.user.id);
          set({ driver });
          await storage.set(STORAGE_KEYS.DRIVER_PROFILE, driver);
        } catch (error) {
          // Try to load from cache
          const cachedDriver = await storage.get<Driver>(STORAGE_KEYS.DRIVER_PROFILE);
          if (cachedDriver) {
            set({ driver: cachedDriver });
          }
        }
      }

      set({ initialized: true, loading: false });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ initialized: true, loading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session && data.user) {
        set({ session: data.session, user: data.user });

        // Load driver profile
        const driver = await driverQueries.getDriverProfile(data.user.id);
        set({ driver });
        await storage.set(STORAGE_KEYS.DRIVER_PROFILE, driver);

        set({ loading: false });
        return { success: true };
      }

      set({ loading: false });
      return { success: false, error: 'No session created' };
    } catch (error: any) {
      set({ loading: false });
      return { success: false, error: error.message };
    }
  },

  signOut: async () => {
    try {
      set({ loading: true });
      await supabase.auth.signOut();
      await storage.clear();
      set({ user: null, driver: null, session: null, loading: false });
    } catch (error) {
      console.error('Sign out error:', error);
      set({ loading: false });
    }
  },

  refreshDriver: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const driver = await driverQueries.getDriverProfile(user.id);
      set({ driver });
      await storage.set(STORAGE_KEYS.DRIVER_PROFILE, driver);
    } catch (error) {
      console.error('Refresh driver error:', error);
    }
  },
}));
