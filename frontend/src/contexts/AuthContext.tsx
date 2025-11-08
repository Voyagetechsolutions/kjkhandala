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

  useEffect(() => {
    checkAuth();
    // subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      if (sess?.user) {
        await loadUserProfile(sess.user);
      } else {
        setUser(null);
        setSession(null);
        setIsAdmin(false);
        setUserRoles([]);
      }
    });
    return () => subscription?.unsubscribe();
  }, []);

  const loadUserProfile = async (sbUser: SupabaseUser) => {
    try {
      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sbUser.id)
        .single();
      if (pErr) throw pErr;
      const { data: rolesData, error: rErr } = await supabase
        .from('user_roles')
        .select('role, role_level, is_active')
        .eq('user_id', sbUser.id)
        .eq('is_active', true);
      if (rErr) throw rErr;
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
    } catch (e) {
      console.error('Failed to load profile:', e);
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setUserRoles([]);
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, phone },
        },
      });
      if (error) throw error;
      if (!data.user) throw new Error('Signup failed');
      const { error: perr } = await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
        email,
        phone,
      });
      if (perr) throw perr;
      // default role
      const { error: rerr } = await supabase.from('user_roles').insert({
        user_id: data.user.id,
        role: 'PASSENGER',
        role_level: 0,
        is_active: true,
      });
      if (rerr) throw rerr;
      if (data.session?.user) await loadUserProfile(data.session.user);
      return { error: null };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { error: error.message || error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error('Login failed');
      await loadUserProfile(data.user);
      return { error: null, user };
    } catch (error: any) {
      console.error('Login error:', error);
      return { error: error.message || error, user: null };
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