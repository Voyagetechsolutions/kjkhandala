/**
 * Account Setup Page
 * Displayed when a company owner clicks the invite link to set up their account
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Building2, CheckCircle, Loader2, Lock, Mail, Phone, User } from 'lucide-react';

// Role-based redirect paths
const getRedirectPathForRole = (role: string): string => {
  switch (role.toUpperCase()) {
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return '/admin';
    case 'OPERATIONS':
    case 'OPERATIONS_MANAGER':
      return '/operations';
    case 'FINANCE':
    case 'FINANCE_MANAGER':
      return '/finance';
    case 'HR':
    case 'HR_MANAGER':
      return '/hr';
    case 'MAINTENANCE':
    case 'MAINTENANCE_MANAGER':
      return '/maintenance';
    case 'TICKETING':
    case 'TICKETING_AGENT':
      return '/ticketing';
    case 'DRIVER':
      return '/driver';
    case 'DEVELOPER':
    case 'PLATFORM_ADMIN':
      return '/platform';
    default:
      return '/admin';
  }
};

interface CompanyInfo {
  id: string;
  name: string;
  logo_url?: string;
  primary_color?: string;
}

export default function SetupAccount() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const companyId = searchParams.get('company');
  const role = searchParams.get('role') || 'ADMIN';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [user, setUser] = useState<any>(null);
  const [setupComplete, setSetupComplete] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    checkAuthAndLoadCompany();
  }, [companyId]);

  const checkAuthAndLoadCompany = async () => {
    try {
      // Check if user is authenticated (came from magic link)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        
        // Pre-fill name from user metadata if available
        if (session.user.user_metadata?.full_name) {
          setFormData(prev => ({
            ...prev,
            fullName: session.user.user_metadata.full_name,
          }));
        }
      }

      // Load company info
      if (companyId) {
        const { data: companyData, error } = await supabase
          .from('companies')
          .select('id, name, logo_url, primary_color')
          .eq('id', companyId)
          .single();
        
        if (!error && companyData) {
          setCompany(companyData);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load account setup information');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please click the link in your email to authenticate first.');
      return;
    }

    if (!companyId) {
      toast.error('Company information is missing from the setup link.');
      return;
    }

    if (!formData.password) {
      toast.error('Please set a password for your account.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    setSubmitting(true);

    try {
      // Update password - this is required for first-time setup
      const { error: passwordError } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (passwordError) {
        throw new Error(`Failed to set password: ${passwordError.message}`);
      }

      console.log('Password updated successfully for user:', user.id);

      // Update or create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: formData.fullName,
          phone: formData.phone,
          company_id: companyId,
          is_active: true,
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error('Profile update error:', profileError);
      }

      // Create ADMIN role for the owner
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: user.id,
          role: role,
          role_level: role === 'ADMIN' ? 90 : 50,
          company_id: companyId,
          is_active: true,
        });

      if (roleError) {
        console.error('Role creation error:', roleError);
      }

      // Mark company as verified
      await supabase
        .from('companies')
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
        })
        .eq('id', companyId);

      // Create employee record for the owner
      await supabase
        .from('employees')
        .upsert({
          user_id: user.id,
          company_id: companyId,
          full_name: formData.fullName,
          phone: formData.phone,
          position: 'Company Owner',
          department: 'Management',
          hire_date: new Date().toISOString().split('T')[0],
          employment_type: 'full_time',
          employment_status: 'active',
        });

      setSetupComplete(true);

      toast.success('Account setup complete! Redirecting to dashboard...');

      // Redirect based on role
      const redirectPath = getRedirectPathForRole(role);
      setTimeout(() => {
        navigate(redirectPath);
      }, 2000);
    } catch (error: any) {
      console.error('Setup error:', error);
      toast.error(error.message || 'Failed to complete account setup');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-gray-600">Loading account setup...</p>
        </div>
      </div>
    );
  }

  if (setupComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Complete!</h2>
            <p className="text-gray-600 mb-4">
              Your account has been set up successfully. You will be redirected to the dashboard shortly.
            </p>
            <Button onClick={() => navigate(getRedirectPathForRole(role))} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Mail className="h-12 w-12 text-blue-600 mx-auto mb-2" />
            <CardTitle>Check Your Email</CardTitle>
            <CardDescription>
              Please click the link in your email to authenticate and set up your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 text-center">
              If you haven't received an email, please contact your administrator or check your spam folder.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {company?.logo_url ? (
            <img 
              src={company.logo_url} 
              alt={company.name} 
              className="h-16 mx-auto mb-4"
            />
          ) : (
            <Building2 
              className="h-12 w-12 mx-auto mb-2" 
              style={{ color: company?.primary_color || '#1E40AF' }}
            />
          )}
          <CardTitle className="text-2xl">Welcome to {company?.name || 'VTS'}</CardTitle>
          <CardDescription>
            Complete your account setup to get started
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="pl-10 bg-gray-50"
                />
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+27 XX XXX XXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Set Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  minLength={8}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={submitting}
              style={{ backgroundColor: company?.primary_color || '#1E40AF' }}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                'Complete Setup'
              )}
            </Button>
          </form>

          <p className="mt-4 text-xs text-center text-gray-500">
            By completing setup, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
