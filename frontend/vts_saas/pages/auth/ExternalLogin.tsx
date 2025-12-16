/**
 * External Login Page
 * Used by external company websites to authenticate users
 * 
 * URL: /auth/external-login?company={slug}&redirect={url}
 * 
 * Flow:
 * 1. Company website redirects user here with company slug and return URL
 * 2. User logs in or signs up
 * 3. System redirects back to company website with auth token
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Building2, Loader2, Lock, Mail, User, ArrowLeft } from 'lucide-react';

interface CompanyBranding {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
}

export default function ExternalLogin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const companySlug = searchParams.get('company');
  const redirectUrl = searchParams.get('redirect');
  const returnTo = searchParams.get('return_to');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [company, setCompany] = useState<CompanyBranding | null>(null);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '',
    fullName: '',
    phone: ''
  });

  useEffect(() => {
    loadCompanyBranding();
    checkExistingSession();
  }, [companySlug]);

  const loadCompanyBranding = async () => {
    if (!companySlug) {
      setLoading(false);
      return;
    }

    try {
      // Try to get company by slug from tenant_settings
      const { data: settings } = await supabase
        .from('tenant_settings')
        .select('company_id, slug, logo_url, primary_color, secondary_color')
        .eq('slug', companySlug)
        .single();

      if (settings) {
        // Get company name
        const { data: companyData } = await supabase
          .from('companies')
          .select('id, name')
          .eq('id', settings.company_id)
          .single();

        if (companyData) {
          setCompany({
            id: companyData.id,
            name: companyData.name,
            slug: settings.slug,
            logo_url: settings.logo_url,
            primary_color: settings.primary_color || '#1E40AF',
            secondary_color: settings.secondary_color || '#3B82F6',
          });
        }
      }
    } catch (error) {
      console.error('Error loading company:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      // User already logged in, redirect back
      handleSuccessfulAuth(session.access_token, session.user.id);
    }
  };

  const handleSuccessfulAuth = (accessToken: string, userId: string) => {
    const finalRedirect = redirectUrl || returnTo;
    
    if (finalRedirect) {
      // Redirect back to company website with token
      const separator = finalRedirect.includes('?') ? '&' : '?';
      const redirectWithToken = `${finalRedirect}${separator}token=${accessToken}&user_id=${userId}`;
      window.location.href = redirectWithToken;
    } else {
      // No redirect specified, go to booking page
      navigate(`/book/${companySlug || ''}`);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      });

      if (error) throw error;

      if (data.session) {
        toast.success('Login successful!');
        handleSuccessfulAuth(data.session.access_token, data.user.id);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signupForm.password !== signupForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (signupForm.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupForm.email,
        password: signupForm.password,
        options: {
          data: {
            full_name: signupForm.fullName,
            phone: signupForm.phone,
            company_slug: companySlug,
          },
        },
      });

      if (error) throw error;

      if (data.session) {
        // Auto-confirmed, redirect
        toast.success('Account created successfully!');
        handleSuccessfulAuth(data.session.access_token, data.user!.id);
      } else {
        // Email confirmation required
        toast.success('Please check your email to confirm your account');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    const finalRedirect = redirectUrl || returnTo || `${window.location.origin}/book/${companySlug || ''}`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(finalRedirect)}`,
      },
    });

    if (error) {
      toast.error('Google login failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const primaryColor = company?.primary_color || '#1E40AF';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {company?.logo_url ? (
            <img 
              src={company.logo_url} 
              alt={company.name} 
              className="h-16 mx-auto mb-4 object-contain"
            />
          ) : (
            <Building2 
              className="h-12 w-12 mx-auto mb-2" 
              style={{ color: primaryColor }}
            />
          )}
          <CardTitle className="text-2xl">
            {company ? `Welcome to ${company.name}` : 'Sign In'}
          </CardTitle>
          <CardDescription>
            {company 
              ? 'Sign in to book tickets and manage your trips'
              : 'Sign in to your account'
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={submitting}
                  style={{ backgroundColor: primaryColor }}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={signupForm.fullName}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, fullName: e.target.value }))}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Minimum 8 characters"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, password: e.target.value }))}
                      required
                      minLength={8}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-confirm"
                      type="password"
                      placeholder="Confirm password"
                      value={signupForm.confirmPassword}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={submitting}
                  style={{ backgroundColor: primaryColor }}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleGoogleLogin}
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          {returnTo && (
            <Button 
              variant="ghost" 
              className="w-full mt-4"
              onClick={() => window.location.href = returnTo}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {company?.name || 'website'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
