// =====================================================
// API CLIENT - Replaces Supabase Client
// Axios-based API client for backend communication
// =====================================================

import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/bridge`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for httpOnly authentication
  timeout: 30000, // 30 seconds
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    // Use Supabase session access token for Edge Functions auth
    const session = (window as any).__supabase_session;
    const setBearer = (jwt?: string) => {
      if (jwt) {
        config.headers.Authorization = `Bearer ${jwt}`;
      }
    };
    if (session?.access_token) {
      setBearer(session.access_token);
    } else {
      // Fallback: read current session synchronously where possible
      // Note: supabase-js getSession is async; we can't await here.
      // Consumers should ensure session is initialized at app start and cached on window.
      // As a safety, try to read from localStorage where Supabase persists the session.
      try {
        const raw = localStorage.getItem('supabase.auth.token');
        if (raw) {
          const parsed = JSON.parse(raw);
          setBearer(parsed?.currentSession?.access_token || parsed?.access_token);
        }
      } catch {}
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('supabase.auth.token');
      // Only redirect if not already on auth page
      if (!window.location.pathname.includes('/auth')) {
        window.location.href = '/auth';
      }
    }
    
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access denied:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

export default api;
