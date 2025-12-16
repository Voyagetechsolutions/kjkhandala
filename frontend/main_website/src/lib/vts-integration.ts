/**
 * VTS SaaS Integration Library
 * 
 * This library allows external company websites to integrate with the VTS booking system.
 * 
 * Usage:
 * 1. Configure your company slug and VTS SaaS URL
 * 2. Use the auth functions to handle user authentication
 * 3. Use the booking functions to search and book trips
 */

// Configuration - Update these for your company
// @ts-ignore - Vite env types
const VTS_SAAS_URL = (import.meta as any).env?.VITE_VTS_SAAS_URL || 'http://localhost:5174';
// @ts-ignore - Vite env types  
const COMPANY_SLUG = (import.meta as any).env?.VITE_COMPANY_SLUG || 'kj-khandala';

export interface VTSConfig {
  saasUrl: string;
  companySlug: string;
  apiKey?: string;
}

let config: VTSConfig = {
  saasUrl: VTS_SAAS_URL,
  companySlug: COMPANY_SLUG,
};

/**
 * Initialize the VTS integration with your company settings
 */
export function initVTS(options: Partial<VTSConfig>) {
  config = { ...config, ...options };
}

/**
 * Get the current VTS configuration
 */
export function getVTSConfig(): VTSConfig {
  return config;
}

/**
 * Redirect user to VTS login page
 * After login, user will be redirected back to the specified URL with auth token
 */
export function redirectToLogin(returnUrl?: string): void {
  const currentUrl = returnUrl || window.location.href;
  const loginUrl = `${config.saasUrl}/auth/external-login?company=${config.companySlug}&return_to=${encodeURIComponent(currentUrl)}`;
  window.location.href = loginUrl;
}

/**
 * Redirect user to VTS signup page
 */
export function redirectToSignup(returnUrl?: string): void {
  const currentUrl = returnUrl || window.location.href;
  const signupUrl = `${config.saasUrl}/auth/external-login?company=${config.companySlug}&return_to=${encodeURIComponent(currentUrl)}&tab=signup`;
  window.location.href = signupUrl;
}

/**
 * Redirect user to VTS booking page
 */
export function redirectToBooking(options?: { 
  from?: string; 
  to?: string; 
  date?: string;
  returnDate?: string;
  passengers?: number;
  tripType?: 'one-way' | 'return';
  returnUrl?: string;
}): void {
  let bookingUrl = `${config.saasUrl}/book/${config.companySlug}`;
  
  const params = new URLSearchParams();
  if (options?.from) params.set('from', options.from);
  if (options?.to) params.set('to', options.to);
  if (options?.date) params.set('date', options.date);
  if (options?.returnDate) params.set('returnDate', options.returnDate);
  if (options?.passengers) params.set('passengers', options.passengers.toString());
  if (options?.tripType) params.set('tripType', options.tripType);
  if (options?.returnUrl) params.set('return_to', options.returnUrl);
  
  if (params.toString()) {
    bookingUrl += `?${params.toString()}`;
  }
  
  window.location.href = bookingUrl;
}

/**
 * Get the VTS booking URL without redirecting
 */
export function getBookingUrl(options?: { 
  from?: string; 
  to?: string; 
  date?: string;
  returnDate?: string;
  passengers?: number;
  tripType?: 'one-way' | 'return';
}): string {
  let bookingUrl = `${config.saasUrl}/book/${config.companySlug}`;
  
  const params = new URLSearchParams();
  if (options?.from) params.set('from', options.from);
  if (options?.to) params.set('to', options.to);
  if (options?.date) params.set('date', options.date);
  if (options?.returnDate) params.set('returnDate', options.returnDate);
  if (options?.passengers) params.set('passengers', options.passengers.toString());
  if (options?.tripType) params.set('tripType', options.tripType);
  
  if (params.toString()) {
    bookingUrl += `?${params.toString()}`;
  }
  
  return bookingUrl;
}

/**
 * Open VTS booking in a popup window
 */
export function openBookingPopup(options?: {
  from?: string;
  to?: string;
  date?: string;
  width?: number;
  height?: number;
}): Window | null {
  const width = options?.width || 800;
  const height = options?.height || 700;
  const left = (window.innerWidth - width) / 2;
  const top = (window.innerHeight - height) / 2;
  
  let bookingUrl = `${config.saasUrl}/book/${config.companySlug}?popup=true`;
  
  if (options?.from) bookingUrl += `&from=${encodeURIComponent(options.from)}`;
  if (options?.to) bookingUrl += `&to=${encodeURIComponent(options.to)}`;
  if (options?.date) bookingUrl += `&date=${options.date}`;
  
  return window.open(
    bookingUrl,
    'vts-booking',
    `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
  );
}

/**
 * Parse auth token from URL (after redirect from VTS login)
 */
export function parseAuthFromUrl(): { token: string; userId: string } | null {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const userId = params.get('user_id');
  
  if (token && userId) {
    // Clean up URL
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);
    
    return { token, userId };
  }
  
  return null;
}

/**
 * Store auth token in localStorage
 */
export function storeAuthToken(token: string, userId: string): void {
  localStorage.setItem('vts_auth_token', token);
  localStorage.setItem('vts_user_id', userId);
}

/**
 * Get stored auth token
 */
export function getStoredAuth(): { token: string; userId: string } | null {
  const token = localStorage.getItem('vts_auth_token');
  const userId = localStorage.getItem('vts_user_id');
  
  if (token && userId) {
    return { token, userId };
  }
  
  return null;
}

/**
 * Clear stored auth
 */
export function clearAuth(): void {
  localStorage.removeItem('vts_auth_token');
  localStorage.removeItem('vts_user_id');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getStoredAuth();
}

/**
 * Generate embed code for booking widget
 */
export function getEmbedCode(options?: {
  width?: string;
  height?: string;
  from?: string;
  to?: string;
}): string {
  const width = options?.width || '100%';
  const height = options?.height || '600px';
  
  let src = `${config.saasUrl}/book/${config.companySlug}?embed=true`;
  if (options?.from) src += `&from=${encodeURIComponent(options.from)}`;
  if (options?.to) src += `&to=${encodeURIComponent(options.to)}`;
  
  return `<iframe 
  src="${src}" 
  width="${width}" 
  height="${height}" 
  frameborder="0" 
  allow="payment"
  style="border: none; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
></iframe>`;
}

/**
 * Create a booking button that redirects to VTS
 */
export function createBookingButton(containerId: string, options?: {
  text?: string;
  className?: string;
  from?: string;
  to?: string;
}): void {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const button = document.createElement('button');
  button.textContent = options?.text || 'Book Now';
  button.className = options?.className || 'vts-booking-btn';
  button.onclick = () => redirectToBooking({ from: options?.from, to: options?.to });
  
  container.appendChild(button);
}

// Auto-initialize from URL params if present
if (typeof window !== 'undefined') {
  const auth = parseAuthFromUrl();
  if (auth) {
    storeAuthToken(auth.token, auth.userId);
  }
}

export default {
  initVTS,
  getVTSConfig,
  redirectToLogin,
  redirectToSignup,
  redirectToBooking,
  openBookingPopup,
  parseAuthFromUrl,
  storeAuthToken,
  getStoredAuth,
  clearAuth,
  isAuthenticated,
  getEmbedCode,
  createBookingButton,
};
