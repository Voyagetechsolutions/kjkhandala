import { supabase } from '@/lib/supabase';

export async function generateApiKey(
  companyId: string,
  name: string,
  description?: string,
  allowedDomains?: string[]
) {
  const { data, error } = await supabase.rpc('generate_api_key', {
    company_id: companyId,
    name,
    description: description ?? null,
    allowed_domains: allowedDomains ?? null,
  });

  if (error) {
    console.error('generateApiKey error:', error);
    return null;
  }

  return data as any;
}

export async function getCompanyApiKeys(companyId: string) {
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getCompanyApiKeys error:', error);
    return [] as any[];
  }

  return (data || []) as any[];
}

export async function revokeApiKey(apiKeyId: string) {
  const { error } = await supabase
    .from('api_keys')
    .update({ is_active: false, revoked_at: new Date().toISOString() })
    .eq('id', apiKeyId);

  if (error) {
    console.error('revokeApiKey error:', error);
    return false;
  }

  return true;
}

export async function getApiKeyUsage(apiKeyId: string, days: number = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('api_key_usage')
    .select('*')
    .eq('api_key_id', apiKeyId)
    .gte('timestamp', since)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('getApiKeyUsage error:', error);
    return [] as any[];
  }

  return (data || []) as any[];
}

export async function getTenantSettings(companyId: string) {
  const { data, error } = await supabase
    .from('tenant_settings')
    .select('*')
    .eq('company_id', companyId)
    .single();

  if (error) {
    // not found is ok
    console.warn('getTenantSettings error:', error);
    return null;
  }

  return data as any;
}

export async function updateTenantSettings(
  companyId: string,
  settings: {
    slug?: string;
    domain_url?: string;
    booking_redirect_url?: string;
    support_email?: string;
    support_phone?: string;
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
  }
) {
  const payload = {
    company_id: companyId,
    slug: settings.slug ?? null,
    domain_url: settings.domain_url ?? null,
    booking_redirect_url: settings.booking_redirect_url ?? null,
    support_email: settings.support_email ?? null,
    support_phone: settings.support_phone ?? null,
    primary_color: settings.primary_color ?? '#003366',
    secondary_color: settings.secondary_color ?? '#0066cc',
    accent_color: settings.accent_color ?? '#ff6600',
  };

  const { error } = await supabase
    .from('tenant_settings')
    .upsert(payload, { onConflict: 'company_id' });

  if (error) {
    console.error('updateTenantSettings error:', error);
    return false;
  }

  return true;
}
