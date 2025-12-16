/**
 * Company Onboarding Service
 * Handles company creation, owner invitation, and authentication flow
 */

import { supabase } from './supabase';

export interface CompanyOnboardingData {
  // Company Details
  companyName: string;
  companyCode?: string;
  slug?: string;
  
  // Owner Details
  ownerEmail: string;
  ownerFullName: string;
  ownerPhone?: string;
  
  // Subscription
  subscriptionTier: 'starter' | 'small_fleet' | 'medium_fleet' | 'large_fleet';
  
  // Optional Settings
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  address?: string;
  city?: string;
  country?: string;
}

export interface OnboardingResult {
  success: boolean;
  companyId?: string;
  ownerId?: string;
  error?: string;
  inviteLink?: string;
}

/**
 * Generate a unique company code
 */
function generateCompanyCode(companyName: string): string {
  const prefix = companyName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 3);
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${suffix}`;
}

/**
 * Generate a URL-friendly slug from company name
 */
function generateSlug(companyName: string): string {
  return companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Create a new company and invite the owner
 */
export async function onboardCompany(data: CompanyOnboardingData): Promise<OnboardingResult> {
  try {
    // 1. Use the SQL function to create company with all settings
    const { data: result, error: rpcError } = await supabase.rpc('create_company_with_owner', {
      p_company_name: data.companyName,
      p_company_code: data.companyCode || null,
      p_slug: data.slug || null,
      p_owner_email: data.ownerEmail,
      p_owner_name: data.ownerFullName,
      p_owner_phone: data.ownerPhone || null,
      p_subscription_tier: data.subscriptionTier,
      p_primary_color: data.primaryColor || '#1E40AF',
      p_secondary_color: data.secondaryColor || '#3B82F6',
      p_address: data.address || null,
      p_city: data.city || null,
      p_country: data.country || 'South Africa',
    });

    if (rpcError) {
      console.error('RPC error creating company:', rpcError);
      // Fallback to direct insert if RPC fails
      return await onboardCompanyFallback(data);
    }

    if (!result?.success) {
      console.error('Company creation failed:', result?.error);
      return { success: false, error: result?.error || 'Failed to create company' };
    }

    const companyId = result.company_id;

    // 2. Send invitation email to company owner
    const inviteResult = await inviteCompanyOwner({
      companyId: companyId,
      companyName: data.companyName,
      ownerEmail: data.ownerEmail,
      ownerFullName: data.ownerFullName,
    });

    if (!inviteResult.success) {
      console.error('Error sending invite:', inviteResult.error);
      // Company was created, but invite failed
      return {
        success: true,
        companyId: companyId,
        error: `Company created but invitation failed: ${inviteResult.error}`,
      };
    }

    return {
      success: true,
      companyId: companyId,
      inviteLink: inviteResult.inviteLink,
    };
  } catch (error: any) {
    console.error('Onboarding error:', error);
    return { success: false, error: error.message || 'Unknown error during onboarding' };
  }
}

/**
 * Fallback function if RPC is not available
 */
async function onboardCompanyFallback(data: CompanyOnboardingData): Promise<OnboardingResult> {
  try {
    const companyCode = data.companyCode || generateCompanyCode(data.companyName);
    const slug = data.slug || generateSlug(data.companyName);

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: data.companyName,
        code: companyCode,
        slug: slug,
        email: data.ownerEmail,
        phone: data.ownerPhone,
        address: data.address,
        city: data.city,
        country: data.country || 'South Africa',
        primary_color: data.primaryColor || '#1E40AF',
        secondary_color: data.secondaryColor || '#3B82F6',
        logo_url: data.logoUrl,
        subscription_tier: data.subscriptionTier,
        subscription_status: 'active',
        subscription_started_at: new Date().toISOString(),
        is_active: true,
        is_verified: false,
      })
      .select()
      .single();

    if (companyError) {
      return { success: false, error: `Failed to create company: ${companyError.message}` };
    }

    // Create tenant settings
    await supabase
      .from('tenant_settings')
      .insert({
        company_id: company.id,
        slug: slug,
        primary_color: data.primaryColor || '#1E40AF',
        secondary_color: data.secondaryColor || '#3B82F6',
        logo_url: data.logoUrl,
        support_email: data.ownerEmail,
        support_phone: data.ownerPhone,
        is_active: true,
      });

    // Send invitation
    const inviteResult = await inviteCompanyOwner({
      companyId: company.id,
      companyName: data.companyName,
      ownerEmail: data.ownerEmail,
      ownerFullName: data.ownerFullName,
    });

    return {
      success: true,
      companyId: company.id,
      inviteLink: inviteResult.inviteLink,
      error: inviteResult.success ? undefined : `Invitation failed: ${inviteResult.error}`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Invite a company owner via email
 */
export async function inviteCompanyOwner(params: {
  companyId: string;
  companyName: string;
  ownerEmail: string;
  ownerFullName: string;
}): Promise<{ success: boolean; inviteLink?: string; error?: string }> {
  try {
    const { companyId, companyName, ownerEmail, ownerFullName } = params;

    // Use Supabase Auth to send an invite
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(ownerEmail, {
      data: {
        full_name: ownerFullName,
        company_id: companyId,
        role: 'ADMIN',
        invited_as: 'company_owner',
      },
      redirectTo: `${window.location.origin}/auth/setup-account?company=${companyId}`,
    });

    if (error) {
      // If admin invite fails (likely due to permissions), try magic link approach
      console.log('Admin invite failed, trying magic link approach:', error.message);
      
      // Generate a magic link for the user
      const { data: magicData, error: magicError } = await supabase.auth.signInWithOtp({
        email: ownerEmail,
        options: {
          data: {
            full_name: ownerFullName,
            company_id: companyId,
            role: 'ADMIN',
            invited_as: 'company_owner',
          },
          emailRedirectTo: `${window.location.origin}/auth/setup-account?company=${companyId}`,
        },
      });

      if (magicError) {
        return { success: false, error: magicError.message };
      }

      return {
        success: true,
        inviteLink: `Magic link sent to ${ownerEmail}`,
      };
    }

    return {
      success: true,
      inviteLink: data?.user?.id ? `Invite sent to ${ownerEmail}` : undefined,
    };
  } catch (error: any) {
    console.error('Invite error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Complete owner setup after they click the invite link
 */
export async function completeOwnerSetup(params: {
  userId: string;
  companyId: string;
  password?: string;
  fullName: string;
  phone?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId, companyId, fullName, phone } = params;

    // 1. Update the user's profile with company_id
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: fullName,
        phone: phone,
        company_id: companyId,
        is_active: true,
      });

    if (profileError) {
      console.error('Profile update error:', profileError);
      return { success: false, error: profileError.message };
    }

    // 2. Create the ADMIN role for this user linked to the company
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'ADMIN',
        role_level: 90, // High level for company admin
        company_id: companyId,
        is_active: true,
      });

    if (roleError) {
      console.error('Role creation error:', roleError);
      return { success: false, error: roleError.message };
    }

    // 3. Mark the company as verified
    const { error: companyError } = await supabase
      .from('companies')
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq('id', companyId);

    if (companyError) {
      console.error('Company verification error:', companyError);
      // Non-critical, continue
    }

    // 4. Create an employee record for the owner
    const { error: employeeError } = await supabase
      .from('employees')
      .insert({
        user_id: userId,
        company_id: companyId,
        full_name: fullName,
        phone: phone,
        position: 'Company Owner',
        department: 'Management',
        hire_date: new Date().toISOString().split('T')[0],
        employment_type: 'full_time',
        employment_status: 'active',
      });

    if (employeeError) {
      console.error('Employee creation error:', employeeError);
      // Non-critical, continue
    }

    return { success: true };
  } catch (error: any) {
    console.error('Setup completion error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Add a new user to a company
 */
export async function addUserToCompany(params: {
  email: string;
  fullName: string;
  companyId: string;
  role: string;
  department?: string;
  position?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { email, fullName, companyId, role, department, position } = params;

    // Send invite via magic link
    const { error: inviteError } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        data: {
          full_name: fullName,
          company_id: companyId,
          role: role,
          department: department,
          position: position,
        },
        emailRedirectTo: `${window.location.origin}/auth/setup-account?company=${companyId}&role=${role}`,
      },
    });

    if (inviteError) {
      return { success: false, error: inviteError.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get company details by ID
 */
export async function getCompanyById(companyId: string) {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get all companies (for platform admin)
 */
export async function getAllCompanies() {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Update company details
 */
export async function updateCompany(companyId: string, updates: Partial<CompanyOnboardingData>) {
  const { data, error } = await supabase
    .from('companies')
    .update({
      name: updates.companyName,
      email: updates.ownerEmail,
      phone: updates.ownerPhone,
      primary_color: updates.primaryColor,
      secondary_color: updates.secondaryColor,
      logo_url: updates.logoUrl,
      address: updates.address,
      city: updates.city,
      country: updates.country,
      subscription_tier: updates.subscriptionTier,
      updated_at: new Date().toISOString(),
    })
    .eq('id', companyId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export default {
  onboardCompany,
  inviteCompanyOwner,
  completeOwnerSetup,
  addUserToCompany,
  getCompanyById,
  getAllCompanies,
  updateCompany,
};
