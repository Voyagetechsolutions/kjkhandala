/**
 * API Integration Library
 * Handles API key validation, tenant data fetching, and website connections
 */

import { supabase } from "./supabase";

// Types
export interface TenantBranding {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  theme_settings: {
    mode: "light" | "dark";
    header_style: string;
    footer_style: string;
    button_style: string;
    card_style: string;
  };
}

export interface TenantCompany {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  domain_url: string | null;
  booking_redirect_url: string | null;
}

export interface TenantSettings {
  booking_settings: {
    allow_guest_booking: boolean;
    require_id_number: boolean;
    require_phone: boolean;
    allow_seat_selection: boolean;
    show_luggage_options: boolean;
    max_tickets_per_booking: number;
    booking_cutoff_minutes: number;
    cancellation_policy: string;
    refund_percentage: number;
  };
  enabled_modules: {
    online_booking: boolean;
    seat_selection: boolean;
    luggage_booking: boolean;
    parcel_delivery: boolean;
    charter_booking: boolean;
    loyalty_program: boolean;
    mobile_tickets: boolean;
    sms_notifications: boolean;
    email_notifications: boolean;
  };
  timezone: string;
  currency: string;
}

export interface TenantContact {
  support_email: string | null;
  support_phone: string | null;
  business_hours: Record<string, { open?: string; close?: string; closed?: boolean }>;
}

export interface TenantRoute {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distance_km: number;
  duration_hours: number;
  base_price: number;
}

export interface TenantTerminal {
  id: string;
  name: string;
  city: string;
  address: string | null;
}

export interface ValidatedTenant {
  verified: boolean;
  error?: string;
  company?: TenantCompany;
  branding?: TenantBranding;
  settings?: TenantSettings;
  contact?: TenantContact;
  permissions?: Record<string, any>;
}

export interface TenantData {
  company: TenantCompany;
  branding: TenantBranding;
  settings: TenantSettings;
  contact: TenantContact;
  routes: TenantRoute[];
  terminals: TenantTerminal[];
}

export interface WebsiteConnection {
  success: boolean;
  connection_id?: string;
  verification_token?: string;
  company?: TenantCompany;
  branding?: TenantBranding;
  embed_code?: string;
  booking_url?: string;
  error?: string;
}

/**
 * Validate an API key and get tenant data
 */
export async function validateApiKey(apiKey: string, origin?: string): Promise<ValidatedTenant> {
  try {
    const { data, error } = await supabase.rpc("validate_tenant_api_key", {
      p_api_key: apiKey,
      p_origin: origin || window.location.origin,
    });

    if (error) {
      console.error("API key validation error:", error);
      return { verified: false, error: error.message };
    }

    return data as ValidatedTenant;
  } catch (err: any) {
    console.error("API key validation failed:", err);
    return { verified: false, error: err.message };
  }
}

/**
 * Get tenant data by slug (for white-label booking pages)
 */
export async function getTenantBySlug(slug: string): Promise<TenantData | null> {
  try {
    const { data, error } = await supabase.rpc("get_tenant_public_data", {
      p_slug: slug,
    });

    if (error) {
      console.error("Get tenant error:", error);
      return null;
    }

    if (data?.error) {
      console.error("Tenant not found:", data.error);
      return null;
    }

    return data as TenantData;
  } catch (err) {
    console.error("Get tenant failed:", err);
    return null;
  }
}

/**
 * Register a website connection
 */
export async function registerWebsiteConnection(
  apiKey: string,
  websiteUrl: string,
  returnUrl?: string,
  webhookUrl?: string,
  integrationType: "embed" | "redirect" | "api" | "sdk" = "embed"
): Promise<WebsiteConnection> {
  try {
    const { data, error } = await supabase.rpc("register_tenant_website", {
      p_api_key: apiKey,
      p_website_url: websiteUrl,
      p_return_url: returnUrl,
      p_webhook_url: webhookUrl,
      p_integration_type: integrationType,
    });

    if (error) {
      console.error("Website connection error:", error);
      return { success: false, error: error.message };
    }

    return data as WebsiteConnection;
  } catch (err: any) {
    console.error("Website connection failed:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Generate a new API key (requires authentication)
 */
export async function generateApiKey(
  companyId: string,
  name: string,
  description?: string,
  allowedDomains?: string[]
): Promise<{ api_key: string; key_id: string; key_prefix: string } | null> {
  try {
    const { data, error } = await supabase.rpc("generate_tenant_api_key", {
      p_company_id: companyId,
      p_name: name,
      p_description: description,
      p_allowed_domains: allowedDomains,
    });

    if (error) {
      console.error("Generate API key error:", error);
      return null;
    }

    return data?.[0] || null;
  } catch (err) {
    console.error("Generate API key failed:", err);
    return null;
  }
}

/**
 * Get API keys for a company
 */
export async function getCompanyApiKeys(companyId: string) {
  const { data, error } = await supabase
    .from("api_keys")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get API keys error:", error);
    return [];
  }

  return data;
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(keyId: string): Promise<boolean> {
  const { error } = await supabase
    .from("api_keys")
    .update({ is_active: false })
    .eq("id", keyId);

  if (error) {
    console.error("Revoke API key error:", error);
    return false;
  }

  return true;
}

/**
 * Get API key usage statistics
 */
export async function getApiKeyUsage(keyId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from("api_key_usage")
    .select("*")
    .eq("api_key_id", keyId)
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get API key usage error:", error);
    return [];
  }

  return data;
}

/**
 * Update tenant settings
 */
export async function updateTenantSettings(
  companyId: string,
  settings: Partial<{
    slug: string;
    logo_url: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    domain_url: string;
    booking_redirect_url: string;
    support_email: string;
    support_phone: string;
    booking_settings: Record<string, any>;
    enabled_modules: Record<string, any>;
    theme_settings: Record<string, any>;
  }>
): Promise<boolean> {
  const { error } = await supabase
    .from("tenant_settings")
    .update({ ...settings, updated_at: new Date().toISOString() })
    .eq("company_id", companyId);

  if (error) {
    console.error("Update tenant settings error:", error);
    return false;
  }

  return true;
}

/**
 * Get tenant settings for a company
 */
export async function getTenantSettings(companyId: string) {
  const { data, error } = await supabase
    .from("tenant_settings")
    .select("*")
    .eq("company_id", companyId)
    .single();

  if (error) {
    console.error("Get tenant settings error:", error);
    return null;
  }

  return data;
}

/**
 * Apply tenant branding to the page
 */
export function applyTenantBranding(branding: TenantBranding) {
  const root = document.documentElement;
  
  // Set CSS variables
  root.style.setProperty("--tenant-primary", branding.primary_color);
  root.style.setProperty("--tenant-secondary", branding.secondary_color);
  root.style.setProperty("--tenant-accent", branding.accent_color);
  root.style.setProperty("--tenant-font", branding.font_family);
  
  // Apply theme mode
  if (branding.theme_settings?.mode === "dark") {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }
}

/**
 * Store tenant context in session
 */
export function setTenantContext(tenant: TenantData | ValidatedTenant) {
  if ("company" in tenant && tenant.company) {
    sessionStorage.setItem("tenant_slug", tenant.company.slug);
    sessionStorage.setItem("tenant_id", tenant.company.id);
    sessionStorage.setItem("tenant_name", tenant.company.name);
    sessionStorage.setItem("tenant_data", JSON.stringify(tenant));
  }
}

/**
 * Get tenant context from session
 */
export function getTenantContext(): TenantData | null {
  const data = sessionStorage.getItem("tenant_data");
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Clear tenant context
 */
export function clearTenantContext() {
  sessionStorage.removeItem("tenant_slug");
  sessionStorage.removeItem("tenant_id");
  sessionStorage.removeItem("tenant_name");
  sessionStorage.removeItem("tenant_data");
}
