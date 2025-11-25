import { supabase } from '../lib/supabase';
import { User } from '../types';

/**
 * Sign up a new user
 */
export const signUp = async (
  email: string,
  password: string,
  fullName: string,
  phone: string
): Promise<User> => {
  try {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
        },
      },
    });

    if (authError) {
      console.error('Supabase sign up error:', authError);
      throw new Error(authError.message || 'Failed to sign up');
    }
    
    if (!authData.user) {
      throw new Error('Failed to create user account');
    }

    return {
      id: authData.user.id,
      email: authData.user.email!,
      full_name: fullName,
      phone,
    };
  } catch (error: any) {
    console.error('Sign up error:', error);
    throw new Error(error?.message || 'An error occurred during sign up');
  }
};

/**
 * Sign in a user
 */
export const signIn = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      console.error('Supabase sign in error:', authError);
      throw new Error(authError.message || 'Failed to sign in');
    }
    
    if (!authData.user) {
      throw new Error('Failed to authenticate user');
    }

    return {
      id: authData.user.id,
      email: authData.user.email!,
      full_name: authData.user.user_metadata?.full_name || '',
      phone: authData.user.user_metadata?.phone || '',
    };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw new Error(error?.message || 'An error occurred during sign in');
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    return {
      id: user.id,
      email: user.email!,
      full_name: user.user_metadata?.full_name || '',
      phone: user.user_metadata?.phone || '',
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (
  fullName: string,
  phone: string
): Promise<User> => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        phone,
      },
    });

    if (error) throw error;
    if (!data.user) throw new Error('Failed to update profile');

    return {
      id: data.user.id,
      email: data.user.email!,
      full_name: fullName,
      phone,
    };
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};
