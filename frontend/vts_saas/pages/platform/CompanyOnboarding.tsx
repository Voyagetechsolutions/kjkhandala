/**
 * Company Onboarding Page
 * Used by platform admins/developers to create new bus companies
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PlatformLayout from '@/components/platform/PlatformLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  CreditCard,
  CheckCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Send
} from 'lucide-react';

type Step = 'company' | 'owner' | 'subscription' | 'review';

interface CompanyOnboardingData {
  companyName: string;
  companyCode: string;
  slug: string;
  ownerEmail: string;
  ownerFullName: string;
  ownerPhone: string;
  subscriptionTier: 'starter' | 'small_fleet' | 'medium_fleet' | 'large_fleet';
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  address: string;
  city: string;
  country: string;
}

export default function CompanyOnboarding() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<Step>('company');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdCompanyId, setCreatedCompanyId] = useState<string | null>(null);

  const [formData, setFormData] = useState<CompanyOnboardingData>({
    companyName: '',
    companyCode: '',
    slug: '',
    ownerEmail: '',
    ownerFullName: '',
    ownerPhone: '',
    subscriptionTier: 'starter',
    primaryColor: '#1E40AF',
    secondaryColor: '#3B82F6',
    logoUrl: '',
    address: '',
    city: '',
    country: 'South Africa',
  });

  const updateField = (field: keyof CompanyOnboardingData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-generate slug from company name
    if (field === 'companyName') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const validateStep = (step: Step): boolean => {
    switch (step) {
      case 'company':
        if (!formData.companyName.trim()) {
          toast.error('Company name is required');
          return false;
        }
        return true;
      case 'owner':
        if (!formData.ownerEmail.trim()) {
          toast.error('Owner email is required');
          return false;
        }
        if (!formData.ownerFullName.trim()) {
          toast.error('Owner name is required');
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail)) {
          toast.error('Please enter a valid email address');
          return false;
        }
        return true;
      case 'subscription':
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) return;

    const steps: Step[] = ['company', 'owner', 'subscription', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: Step[] = ['company', 'owner', 'subscription', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const generateCompanyCode = (name: string): string => {
    const prefix = name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 3);
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${suffix}`;
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      const companyCode = formData.companyCode || generateCompanyCode(formData.companyName);
      const slug = formData.slug || formData.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      // 1. Create the company using RPC function (bypasses RLS)
      const { data: result, error: rpcError } = await supabase.rpc('platform_create_company', {
        p_name: formData.companyName,
        p_code: companyCode,
        p_slug: slug,
        p_email: formData.ownerEmail,
        p_phone: formData.ownerPhone || null,
        p_address: formData.address || null,
        p_city: formData.city || null,
        p_country: formData.country || 'South Africa',
        p_primary_color: formData.primaryColor || '#1E40AF',
        p_secondary_color: formData.secondaryColor || '#3B82F6',
        p_logo_url: formData.logoUrl || null,
        p_subscription_tier: formData.subscriptionTier,
      });

      if (rpcError) {
        throw new Error(`Failed to create company: ${rpcError.message}`);
      }

      if (!result?.success) {
        // Show more details for debugging
        console.error('RPC result:', result);
        if (result?.user_id) {
          throw new Error(`${result?.error}. Your user_id is: ${result.user_id}. Run this SQL in Supabase: INSERT INTO platform_admins (user_id, email, role, is_active) VALUES ('${result.user_id}', 'your-email', 'DEVELOPER', true);`);
        }
        throw new Error(result?.error || 'Failed to create company');
      }

      const companyId = result.company_id;

      // 2. Store owner info
      await supabase.rpc('platform_invite_owner', {
        p_company_id: companyId,
        p_email: formData.ownerEmail,
        p_full_name: formData.ownerFullName,
        p_phone: formData.ownerPhone || null,
      });

      // 3. Send invitation email to company owner via magic link (OTP)
      // This creates a new user in auth.users if they don't exist
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: formData.ownerEmail,
        options: {
          data: {
            full_name: formData.ownerFullName,
            company_id: companyId,
            role: 'ADMIN',
            invited_as: 'company_owner',
          },
          emailRedirectTo: `${window.location.origin}/auth/setup-account?company=${companyId}`,
          shouldCreateUser: true,
        },
      });

      if (otpError) {
        console.error('Error sending invite:', otpError);
        toast.warning(`Company created but invitation failed: ${otpError.message}. Please manually invite the owner.`);
      }

      setCreatedCompanyId(companyId);
      setSuccess(true);

      toast.success('Company created successfully!');
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast.error(error.message || 'Failed to create company');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Company Created!</h2>
              <p className="text-gray-600 mb-4">
                <strong>{formData.companyName}</strong> has been created successfully.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                An invitation email has been sent to <strong>{formData.ownerEmail}</strong>.
                They will receive instructions to set up their account.
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={() => {
                    setSuccess(false);
                    setFormData({
                      companyName: '',
                      companyCode: '',
                      slug: '',
                      ownerEmail: '',
                      ownerFullName: '',
                      ownerPhone: '',
                      subscriptionTier: 'starter',
                      primaryColor: '#1E40AF',
                      secondaryColor: '#3B82F6',
                      logoUrl: '',
                      address: '',
                      city: '',
                      country: 'South Africa',
                    });
                    setCurrentStep('company');
                  }} 
                  className="w-full"
                >
                  Create Another Company
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/platform/tenants')}
                  className="w-full"
                >
                  View All Companies
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Onboard New Company</h1>
          <p className="text-gray-600">Create a new bus company and invite the owner</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { key: 'company', label: 'Company', icon: Building2 },
              { key: 'owner', label: 'Owner', icon: User },
              { key: 'subscription', label: 'Plan', icon: CreditCard },
              { key: 'review', label: 'Review', icon: CheckCircle },
            ].map((step, index) => {
              const StepIcon = step.icon;
              const steps: Step[] = ['company', 'owner', 'subscription', 'review'];
              const isActive = currentStep === step.key;
              const isCompleted = steps.indexOf(currentStep) > steps.indexOf(step.key as Step);

              return (
                <div key={step.key} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isActive ? 'border-blue-600 bg-blue-600 text-white' :
                    isCompleted ? 'border-green-500 bg-green-500 text-white' :
                    'border-gray-300 text-gray-400'
                  }`}>
                    <StepIcon className="h-5 w-5" />
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    isActive ? 'text-blue-600' :
                    isCompleted ? 'text-green-600' :
                    'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                  {index < 3 && (
                    <div className={`w-12 h-0.5 mx-2 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            {/* Step 1: Company Details */}
            {currentStep === 'company' && (
              <div className="space-y-4">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Company Details
                  </CardTitle>
                  <CardDescription>
                    Enter the basic information about the bus company
                  </CardDescription>
                </CardHeader>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      placeholder="e.g., KJ Khandala Bus Services"
                      value={formData.companyName}
                      onChange={(e) => updateField('companyName', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyCode">Company Code</Label>
                      <Input
                        id="companyCode"
                        placeholder="Auto-generated"
                        value={formData.companyCode}
                        onChange={(e) => updateField('companyCode', e.target.value)}
                      />
                      <p className="text-xs text-gray-500">Leave blank to auto-generate</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">URL Slug</Label>
                      <Input
                        id="slug"
                        placeholder="kj-khandala"
                        value={formData.slug}
                        onChange={(e) => updateField('slug', e.target.value)}
                      />
                      <p className="text-xs text-gray-500">Used in booking URLs</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      placeholder="Street address"
                      value={formData.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="e.g., Johannesburg"
                        value={formData.city}
                        onChange={(e) => updateField('city', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Select 
                        value={formData.country} 
                        onValueChange={(value) => updateField('country', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="South Africa">South Africa</SelectItem>
                          <SelectItem value="Zimbabwe">Zimbabwe</SelectItem>
                          <SelectItem value="Botswana">Botswana</SelectItem>
                          <SelectItem value="Namibia">Namibia</SelectItem>
                          <SelectItem value="Mozambique">Mozambique</SelectItem>
                          <SelectItem value="Zambia">Zambia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={formData.primaryColor}
                          onChange={(e) => updateField('primaryColor', e.target.value)}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={formData.primaryColor}
                          onChange={(e) => updateField('primaryColor', e.target.value)}
                          placeholder="#1E40AF"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondaryColor">Secondary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={formData.secondaryColor}
                          onChange={(e) => updateField('secondaryColor', e.target.value)}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={formData.secondaryColor}
                          onChange={(e) => updateField('secondaryColor', e.target.value)}
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Owner Details */}
            {currentStep === 'owner' && (
              <div className="space-y-4">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Company Owner
                  </CardTitle>
                  <CardDescription>
                    Enter the details of the company owner/admin who will manage this company
                  </CardDescription>
                </CardHeader>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerFullName">Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="ownerFullName"
                        placeholder="John Smith"
                        value={formData.ownerFullName}
                        onChange={(e) => updateField('ownerFullName', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ownerEmail">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="ownerEmail"
                        type="email"
                        placeholder="owner@company.com"
                        value={formData.ownerEmail}
                        onChange={(e) => updateField('ownerEmail', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      An invitation email will be sent to this address
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ownerPhone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="ownerPhone"
                        type="tel"
                        placeholder="+27 XX XXX XXXX"
                        value={formData.ownerPhone}
                        onChange={(e) => updateField('ownerPhone', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Subscription */}
            {currentStep === 'subscription' && (
              <div className="space-y-4">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Subscription Plan
                  </CardTitle>
                  <CardDescription>
                    Select the subscription tier for this company
                  </CardDescription>
                </CardHeader>

                <div className="grid gap-4">
                  {[
                    { 
                      value: 'starter', 
                      label: 'Starter Operator', 
                      price: 'R2,500/month',
                      setup: 'R3,500 setup',
                      desc: '1-3 buses, basic features' 
                    },
                    { 
                      value: 'small_fleet', 
                      label: 'Small Fleet', 
                      price: 'R7,500/month',
                      setup: 'R8,500 setup',
                      desc: '3-10 buses, full system' 
                    },
                    { 
                      value: 'medium_fleet', 
                      label: 'Medium Fleet', 
                      price: 'R8,000/month',
                      setup: 'R11,000 setup',
                      desc: '10-25 buses, advanced features',
                      popular: true
                    },
                    { 
                      value: 'large_fleet', 
                      label: 'Large Fleet / Enterprise', 
                      price: 'R10,500/month',
                      setup: 'R13,000 setup',
                      desc: '25+ buses, unlimited everything' 
                    },
                  ].map((tier) => (
                    <div
                      key={tier.value}
                      onClick={() => updateField('subscriptionTier', tier.value as any)}
                      className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.subscriptionTier === tier.value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {tier.popular && (
                        <span className="absolute -top-2 right-4 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                          Most Popular
                        </span>
                      )}
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{tier.label}</h3>
                          <p className="text-sm text-gray-500">{tier.desc}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">{tier.price}</p>
                          <p className="text-xs text-gray-500">{tier.setup}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 'review' && (
              <div className="space-y-4">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Review & Create
                  </CardTitle>
                  <CardDescription>
                    Review the company details before creating
                  </CardDescription>
                </CardHeader>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Building2 className="h-4 w-4" /> Company
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-gray-500">Name:</span>
                      <span className="font-medium">{formData.companyName}</span>
                      <span className="text-gray-500">Slug:</span>
                      <span className="font-medium">{formData.slug || 'Auto-generated'}</span>
                      <span className="text-gray-500">Location:</span>
                      <span className="font-medium">{formData.city}, {formData.country}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <User className="h-4 w-4" /> Owner
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-gray-500">Name:</span>
                      <span className="font-medium">{formData.ownerFullName}</span>
                      <span className="text-gray-500">Email:</span>
                      <span className="font-medium">{formData.ownerEmail}</span>
                      <span className="text-gray-500">Phone:</span>
                      <span className="font-medium">{formData.ownerPhone || 'Not provided'}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <CreditCard className="h-4 w-4" /> Subscription
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-gray-500">Plan:</span>
                      <span className="font-medium capitalize">{formData.subscriptionTier.replace('_', ' ')}</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Send className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-900">Invitation Email</h4>
                        <p className="text-sm text-blue-700">
                          An email will be sent to <strong>{formData.ownerEmail}</strong> with 
                          instructions to set up their account and access the dashboard.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 'company'}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              {currentStep === 'review' ? (
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Create Company & Send Invite
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={nextStep}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PlatformLayout>
  );
}
