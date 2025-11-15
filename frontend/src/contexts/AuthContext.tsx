import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface User {
  id: string;
  email: string;
  role?: string;
  profile?: {
    fullName: string;
    phone?: string;
  };
  userRoles?: Array<{
    role: string;
    roleLevel: number;
  }>;
}

interface AuthContextType {
  user: User | null;
  session: any;
  isAdmin: boolean;
  userRoles: string[];
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any; user: User | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  useEffect(() => {
    checkAuth();
    // subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, sess) => {
      console.log('Auth state changed:', event);
      
      // Don't reload profile during sign-in - it's handled in signIn function
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        console.log('Skipping profile load - handled by sign-in');
        return;
      }
      
      if (sess?.user && !isLoadingProfile) {
        console.log('Auth state change - loading profile');
        await loadUserProfile(sess.user);
      } else if (!sess?.user) {
        setUser(null);
        setSession(null);
        setIsAdmin(false);
        setUserRoles([]);
      }
    });
    return () => subscription?.unsubscribe();
  }, [isLoadingProfile]);

  const loadUserProfile = async (sbUser: SupabaseUser) => {
    try {
      console.log('Loading profile for user:', sbUser.id);
      
      // Fetch profile
      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sbUser.id)
        .single();
      
      if (pErr) {
        console.error('Profile fetch error:', pErr);
        throw pErr;
      }
      console.log('Profile loaded:', profile);
      
      // Fetch roles
      const { data: rolesData, error: rErr } = await supabase
        .from('user_roles')
        .select('role, role_level, is_active')
        .eq('user_id', sbUser.id)
        .eq('is_active', true);
      
      if (rErr) {
        console.error('Roles fetch error:', rErr);
        throw rErr;
      }
      console.log('Roles loaded:', rolesData);
      
      const roles = rolesData?.map((r: any) => r.role) || [];
      const hasAdminRole = roles.some((role: string) => role === 'SUPER_ADMIN' || role === 'ADMIN');
      
      const mapped: User = {
        id: sbUser.id,
        email: sbUser.email || '',
        profile: {
          fullName: profile?.full_name || '',
          phone: profile?.phone,
        },
        userRoles: rolesData?.map((r: any) => ({ role: r.role, roleLevel: r.role_level })) || [],
      };
      
      setUser(mapped);
      setSession({ user: mapped });
      setUserRoles(roles);
      setIsAdmin(hasAdminRole);
      console.log('User profile loaded successfully');
    } catch (e) {
      console.error('Failed to load profile:', e);
      // Don't clear user state - let them stay authenticated
      // Just set minimal user info
      const minimalUser: User = {
        id: sbUser.id,
        email: sbUser.email || '',
        profile: {
          fullName: sbUser.email || '',
          phone: undefined,
        },
        userRoles: [],
      };
      setUser(minimalUser);
      setSession({ user: minimalUser });
      setUserRoles([]);
      setIsAdmin(false);
    }
  };

  const checkAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (session?.user) {
        await loadUserProfile(session.user);
      }
    } catch (e) {
      console.error('Auth check failed:', e);
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setUserRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, phone },
        },
      });
      
      if (error) throw error;
      if (!data.user) throw new Error('Signup failed');
      
      // Wait a moment for triggers to create profile and role
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Load the user profile (created by trigger)
      if (data.session?.user) {
        try {
          await loadUserProfile(data.session.user);
        } catch (profileError) {
          console.error('Profile loading error:', profileError);
          // Continue even if profile loading fails - user is authenticated
        }
      }
      
      return { error: null };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { error: error.message || error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Sign in started for:', email);
      setLoading(true);
      setIsLoadingProfile(true);
      
      console.log('Calling Supabase signInWithPassword...');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('Supabase auth error:', error);
        throw error;
      }
      if (!data.user) {
        console.error('No user returned from Supabase');
        throw new Error('Login failed');
      }
      
      console.log('Authentication successful, user:', data.user.id);
      
      // Load user profile with timeout
      try {
        console.log('Loading user profile...');
        const profilePromise = loadUserProfile(data.user);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile loading timeout')), 10000)
        );
        
        await Promise.race([profilePromise, timeoutPromise]);
        console.log('Profile loading completed');
      } catch (profileError) {
        console.error('Profile loading error:', profileError);
        // Continue even if profile loading fails - user is authenticated
      }
      
      console.log('Sign in completed successfully');
      return { error: null, user };
    } catch (error: any) {
      console.error('Login error:', error);
      return { error: error.message || error, user: null };
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
      setIsLoadingProfile(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Logout error:', error);
    }

    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setUserRoles([]);
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, userRoles, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}