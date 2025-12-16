/**
 * React Hook for VTS Authentication
 * 
 * Provides easy integration with VTS SaaS authentication system
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  parseAuthFromUrl,
  storeAuthToken,
  getStoredAuth,
  clearAuth,
  redirectToLogin,
  redirectToSignup,
  isAuthenticated as checkAuth,
} from '@/lib/vts-integration';

interface VTSUser {
  id: string;
  email?: string;
  fullName?: string;
  phone?: string;
  companyId?: string;
}

interface UseVTSAuthReturn {
  user: VTSUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (returnUrl?: string) => void;
  signup: (returnUrl?: string) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export function useVTSAuth(): UseVTSAuthReturn {
  const [user, setUser] = useState<VTSUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Check for auth token from URL (after redirect from VTS)
      const urlAuth = parseAuthFromUrl();
      if (urlAuth) {
        storeAuthToken(urlAuth.token, urlAuth.userId);
      }

      // Check stored auth
      const storedAuth = getStoredAuth();
      if (!storedAuth) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Try to get user session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Get profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone, company_id')
          .eq('id', session.user.id)
          .single();

        setUser({
          id: session.user.id,
          email: session.user.email,
          fullName: profile?.full_name,
          phone: profile?.phone,
          companyId: profile?.company_id,
        });
      } else {
        // Token might be expired, clear it
        clearAuth();
        setUser(null);
      }
    } catch (error) {
      console.error('Error loading VTS user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
        });
      } else if (event === 'SIGNED_OUT') {
        clearAuth();
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUser]);

  const login = useCallback((returnUrl?: string) => {
    redirectToLogin(returnUrl);
  }, []);

  const signup = useCallback((returnUrl?: string) => {
    redirectToSignup(returnUrl);
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      clearAuth();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    refreshUser,
  };
}

export default useVTSAuth;
