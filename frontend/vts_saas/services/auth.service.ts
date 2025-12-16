// =====================================================
// AUTHENTICATION SERVICE
// Production-ready with email verification and role-based access
// =====================================================

import { supabase } from '../lib/supabase';

export interface UserRole {
  role: string;
  role_level: number;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  roles: UserRole[];
}

export class AuthService {
  // =====================================================
  // REGISTER NEW USER (WITH EMAIL VERIFICATION)
  // =====================================================
  async register(data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          phone: data.phone,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      throw new Error(authError.message);
    }

    // Check if email confirmation is required
    if (authData.user && !authData.session) {
      return {
        user: authData.user,
        session: null,
        requiresEmailVerification: true,
        message: 'Please check your email to verify your account.',
      };
    }

    return {
      user: authData.user,
      session: authData.session,
      requiresEmailVerification: false,
    };
  }

  // =====================================================
  // LOGIN
  // =====================================================
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    // Update last login in profile
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id);
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  // =====================================================
  // LOGOUT
  // =====================================================
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }

  // =====================================================
  // GET CURRENT USER
  // =====================================================
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      throw new Error(error.message);
    }
    return user;
  }

  // =====================================================
  // GET USER PROFILE WITH ROLES
  // =====================================================
  async getUserProfile(userId: string): Promise<UserProfile> {
    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      throw new Error(profileError.message);
    }

    // Get roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role, role_level')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('role_level', { ascending: false });

    if (rolesError) {
      throw new Error(rolesError.message);
    }

    return {
      ...profile,
      roles: roles || [],
    };
  }

  // =====================================================
  // CHECK USER ROLE
  // =====================================================
  async hasRole(userId: string, roleName: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', roleName)
      .eq('is_active', true)
      .single();

    return !error && !!data;
  }

  // =====================================================
  // CHECK IF USER HAS ANY OF MULTIPLE ROLES
  // =====================================================
  async hasAnyRole(userId: string, roleNames: string[]): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .in('role', roleNames)
      .eq('is_active', true)
      .limit(1);

    return !error && data && data.length > 0;
  }

  // =====================================================
  // GET USER ROLES
  // =====================================================
  async getUserRoles(userId: string): Promise<UserRole[]> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role, role_level')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('role_level', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  // =====================================================
  // GET PRIMARY ROLE (HIGHEST LEVEL)
  // =====================================================
  async getPrimaryRole(userId: string): Promise<string | null> {
    const roles = await this.getUserRoles(userId);
    return roles.length > 0 ? roles[0].role : null;
  }

  // =====================================================
  // CHANGE PASSWORD
  // =====================================================
  async changePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(error.message);
    }

    return { message: 'Password changed successfully' };
  }

  // =====================================================
  // RESET PASSWORD
  // =====================================================
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw new Error(error.message);
    }

    return { message: 'Password reset email sent' };
  }

  // =====================================================
  // GET SESSION
  // =====================================================
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      throw new Error(error.message);
    }
    return session;
  }
}

export default new AuthService();
