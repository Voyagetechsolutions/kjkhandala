import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Bus,
  Loader2,
  Globe,
  Server,
  Key,
  Building2,
  ArrowRight,
  CheckCircle2,
  Shield,
  Zap,
  Users,
  ExternalLink,
  Copy,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { validateApiKey as validateTenantApiKey } from "@/lib/api-integration";

// Validation schemas
const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().min(8, "Phone number is required").max(20),
});

const apiKeySchema = z.object({
  apiKey: z.string().min(10, "Invalid API key format").startsWith("vts_", "API key must start with 'vts_'"),
});

interface CompanyBranding {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
}

interface ConnectionStatus {
  connected: boolean;
  company_id: string | null;
  company_name: string | null;
  slug: string | null;
  connected_at: string | null;
}

// Helper function to get dashboard route based on user role
const getDashboardRoute = (userRoles: string[]) => {
  if (!userRoles || userRoles.length === 0) {
    return "/";
  }
  
  const role = userRoles[0];
  
  switch (role) {
    case "SUPER_ADMIN":
    case "ADMIN":
      return "/admin";
    case "OPERATIONS_MANAGER":
      return "/operations";
    case "FINANCE_MANAGER":
      return "/finance";
    case "HR_MANAGER":
      return "/hr";
    case "MAINTENANCE_MANAGER":
      return "/maintenance";
    case "TICKETING_AGENT":
    case "TICKETING_SUPERVISOR":
      return "/ticketing";
    case "DRIVER":
      return "/driver";
    case "PASSENGER":
    default:
      return "/";
  }
};

export default function SaasLogin() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [validatingKey, setValidatingKey] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [connectionMode, setConnectionMode] = useState<"hosted" | "api">("hosted");
  const [companyBranding, setCompanyBranding] = useState<CompanyBranding | null>(null);
  const [apiKeyValidated, setApiKeyValidated] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [checkingConnection, setCheckingConnection] = useState(true);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    apiKey: "",
    companySlug: "",
  });
  
  const { signUp, signIn, userRoles } = useAuth();
  const navigate = useNavigate();

  // Check for existing connection and URL params
  useEffect(() => {
    const checkExistingConnection = async () => {
      setCheckingConnection(true);
      
      try {
        // Check if user is already logged in
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Get user's company connection
          const { data: profile } = await supabase
            .from("profiles")
            .select("company_id, companies(id, name, slug, logo_url, primary_color, secondary_color, accent_color)")
            .eq("id", session.user.id)
            .single();
          
          if (profile?.company_id && profile.companies) {
            const company = profile.companies as any;
            setConnectionStatus({
              connected: true,
              company_id: company.id,
              company_name: company.name,
              slug: company.slug,
              connected_at: new Date().toISOString(),
            });
            setCompanyBranding({
              id: company.id,
              name: company.name,
              slug: company.slug,
              logo_url: company.logo_url,
              primary_color: company.primary_color || "#1E40AF",
              secondary_color: company.secondary_color || "#3B82F6",
              accent_color: company.accent_color || "#10B981",
            });
          }
        }
      } catch (error) {
        console.error("Error checking connection:", error);
      } finally {
        setCheckingConnection(false);
      }
    };
    
    checkExistingConnection();
    
    // Handle URL params
    const companySlug = searchParams.get("company");
    const apiKey = searchParams.get("api_key");
    const returnUrl = searchParams.get("return_url");
    
    if (companySlug) {
      setFormData(prev => ({ ...prev, companySlug }));
      fetchCompanyBranding(companySlug);
    }
    
    if (apiKey) {
      setFormData(prev => ({ ...prev, apiKey }));
      setConnectionMode("api");
    }
    
    // Store return URL for redirect after login
    if (returnUrl) {
      sessionStorage.setItem("saas_return_url", returnUrl);
    }
  }, [searchParams]);

  // Fetch company branding by slug
  const fetchCompanyBranding = async (slug: string) => {
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, slug, logo_url, primary_color, secondary_color, accent_color")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      
      if (data) {
        setCompanyBranding({
          id: data.id,
          name: data.name,
          slug: data.slug,
          logo_url: data.logo_url,
          primary_color: data.primary_color || "#1E40AF",
          secondary_color: data.secondary_color || "#3B82F6",
          accent_color: data.accent_color || "#10B981",
        });
        // Apply company branding colors
        document.documentElement.style.setProperty("--primary", data.primary_color || "#1E40AF");
      }
    } catch (error) {
      console.error("Failed to fetch company branding:", error);
    }
  };

  // Validate API key and fetch company info
  const validateApiKey = async () => {
    try {
      const validated = apiKeySchema.parse({ apiKey: formData.apiKey });
      setValidatingKey(true);

      // Use the new tenant API key validation
      const result = await validateTenantApiKey(validated.apiKey);
      
      if (!result.verified) {
        throw new Error(result.error || "Invalid API key");
      }

      // Also check directly in companies table for legacy keys
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, slug, logo_url, primary_color, secondary_color, accent_color, is_active, subscription_status")
        .eq("api_key", validated.apiKey)
        .single();

      if (error || !data) {
        // If not found in legacy, use the validated result
        if (result.company) {
          setCompanyBranding({
            id: result.company.id,
            name: result.company.name,
            slug: result.company.slug,
            logo_url: result.company.logo_url || null,
            primary_color: result.branding?.primary_color || "#1E40AF",
            secondary_color: result.branding?.secondary_color || "#3B82F6",
            accent_color: result.branding?.accent_color || "#10B981",
          });
          setApiKeyValidated(true);
          sessionStorage.setItem("saas_api_key", validated.apiKey);
          sessionStorage.setItem("saas_company_id", result.company.id);
          
          toast.success(`Connected to ${result.company.name}`);
          return;
        }
        throw new Error("Invalid API key");
      }

      if (!data.is_active) {
        throw new Error("This company account is inactive");
      }

      if (data.subscription_status !== "active" && data.subscription_status !== "trial") {
        throw new Error("Subscription expired. Please contact support.");
      }

      setCompanyBranding({
        id: data.id,
        name: data.name,
        slug: data.slug,
        logo_url: data.logo_url,
        primary_color: data.primary_color || "#1E40AF",
        secondary_color: data.secondary_color || "#3B82F6",
        accent_color: data.accent_color || "#10B981",
      });
      setApiKeyValidated(true);
      
      // Store API key for subsequent requests
      sessionStorage.setItem("saas_api_key", validated.apiKey);
      sessionStorage.setItem("saas_company_id", data.id);
      
      toast.success(`Connected to ${data.name}`);
    } catch (error: any) {
      toast.error(error.message || "Invalid API key");
      setApiKeyValidated(false);
    } finally {
      setValidatingKey(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const validated = signUpSchema.parse(formData);
        const { error } = await signUp(
          validated.email,
          validated.password,
          validated.fullName,
          validated.phone
        );

        if (error) throw error;

        toast.success("Account created! Please check your email to verify.");
        setIsSignUp(false);
      } else {
        const validated = signInSchema.parse({
          email: formData.email,
          password: formData.password,
        });
        
        const { error } = await signIn(validated.email, validated.password);

        if (error) throw error;

        // Wait for session and fetch user roles
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error("Failed to establish session");
        }

        // Get user's roles from database
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("is_active", true);
        
        const roles = rolesData?.map(r => r.role) || [];

        // Check for return URL (external website redirect)
        const returnUrl = sessionStorage.getItem("saas_return_url");
        if (returnUrl && connectionMode === "api") {
          // Redirect back to external website with session token
          const redirectUrl = new URL(returnUrl);
          redirectUrl.searchParams.set("token", session.access_token);
          redirectUrl.searchParams.set("user_id", session.user.id);
          window.location.href = redirectUrl.toString();
          return;
        }

        // Standard redirect for hosted solution - based on role
        const dashboardRoute = getDashboardRoute(roles);
        
        toast.success("Welcome back! Redirecting to your dashboard...");
        
        navigate(dashboardRoute);
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Copy to clipboard helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  // Dynamic styles based on company branding
  const brandingStyles = companyBranding ? {
    "--brand-primary": companyBranding.primary_color,
    "--brand-secondary": companyBranding.secondary_color,
    "--brand-accent": companyBranding.accent_color,
  } as React.CSSProperties : {};

  return (
    <div 
      className="min-h-screen flex flex-col lg:flex-row"
      style={brandingStyles}
    >
      {/* Left Panel - Branding & Info */}
      <div className="lg:w-1/2 bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 text-white p-8 lg:p-12 flex flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            {companyBranding?.logo_url ? (
              <img 
                src={companyBranding.logo_url} 
                alt={companyBranding.name} 
                className="h-12 w-auto"
              />
            ) : (
              <Bus className="h-10 w-10" />
            )}
            <div>
              <h1 className="text-2xl font-bold">
                {companyBranding?.name || "Voyage Tech Solutions"}
              </h1>
              <p className="text-white/70 text-sm">Bus Management Platform</p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-6 mb-12">
            <h2 className="text-3xl font-bold leading-tight">
              {connectionMode === "api" 
                ? "Connect Your Website" 
                : "Your Complete Bus Management Solution"
              }
            </h2>
            <p className="text-white/80 text-lg">
              {connectionMode === "api"
                ? "Integrate our powerful booking system into your existing website with just a few lines of code."
                : "Access all features from fleet management to ticketing, all in one place."
              }
            </p>
          </div>

          {/* Feature List */}
          <div className="grid gap-4">
            {[
              { icon: Zap, text: "Real-time seat availability" },
              { icon: Shield, text: "Secure payment processing" },
              { icon: Users, text: "Multi-user access control" },
              { icon: Globe, text: "Custom branding support" },
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="p-2 bg-blue-400/30 rounded-lg">
                  <feature.icon className="h-5 w-5" />
                </div>
                <span className="text-white/90">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-white/20">
          <p className="text-white/60 text-sm">
            Powered by Voyage Tech Solutions
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Loading State */}
          {checkingConnection && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Already Connected State */}
          {!checkingConnection && connectionStatus?.connected && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Connected
                  </CardTitle>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Active
                  </Badge>
                </div>
                <CardDescription>
                  Your website is connected to {connectionStatus.company_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Booking Link</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm bg-background p-2 rounded border truncate">
                      {window.location.origin}/book/{connectionStatus.slug}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(
                        `${window.location.origin}/book/${connectionStatus.slug}`,
                        "Booking link"
                      )}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    className="flex-1"
                    onClick={() => navigate(`/book/${connectionStatus.slug}`)}
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Open Booking Page
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate("/admin")}
                  >
                    Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Connection Mode Tabs */}
          {!checkingConnection && (
          <Tabs 
            value={connectionMode} 
            onValueChange={(v: string) => setConnectionMode(v as "hosted" | "api")}
            className="mb-6"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="hosted" className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                Hosted Solution
              </TabsTrigger>
              <TabsTrigger value="api" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                API Integration
              </TabsTrigger>
            </TabsList>

            {/* Hosted Solution Tab */}
            <TabsContent value="hosted" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    {isSignUp ? "Create Account" : "Sign In"}
                  </CardTitle>
                  <CardDescription>
                    {isSignUp 
                      ? "Create your account to get started" 
                      : "Access your bus management dashboard"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {isSignUp && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input
                            id="fullName"
                            placeholder="John Doe"
                            value={formData.fullName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, fullName: e.target.value })}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+263 77 123 4567"
                            value={formData.phone}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })}
                            required
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@company.com"
                        value={formData.email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength={6}
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isSignUp ? "Create Account" : "Sign In"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-sm text-primary hover:underline"
                    >
                      {isSignUp
                        ? "Already have an account? Sign in"
                        : "Don't have an account? Sign up"}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* API Integration Tab */}
            <TabsContent value="api" className="mt-6 space-y-6">
              {/* Step 1: API Key Validation */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5 text-primary" />
                      Step 1: Connect Your API Key
                    </CardTitle>
                    {apiKeyValidated && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    Enter your API key from the Developer Dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="vts_your_api_key_here"
                      value={formData.apiKey}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setFormData({ ...formData, apiKey: e.target.value });
                        setApiKeyValidated(false);
                      }}
                      className="font-mono"
                      disabled={apiKeyValidated}
                    />
                    <Button 
                      onClick={validateApiKey} 
                      disabled={validatingKey || apiKeyValidated || !formData.apiKey}
                      variant={apiKeyValidated ? "outline" : "default"}
                    >
                      {validatingKey ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : apiKeyValidated ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        "Validate"
                      )}
                    </Button>
                  </div>
                  
                  {companyBranding && apiKeyValidated && (
                    <div className="mt-4 p-3 bg-muted rounded-lg flex items-center gap-3">
                      {companyBranding.logo_url ? (
                        <img 
                          src={companyBranding.logo_url} 
                          alt={companyBranding.name}
                          className="h-8 w-8 rounded"
                        />
                      ) : (
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">{companyBranding.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {companyBranding.slug}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Step 2: User Authentication */}
              {apiKeyValidated && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Step 2: Authenticate User
                    </CardTitle>
                    <CardDescription>
                      Sign in or create an account for your customers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {isSignUp && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="api-fullName">Full Name</Label>
                            <Input
                              id="api-fullName"
                              placeholder="John Doe"
                              value={formData.fullName}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, fullName: e.target.value })}
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="api-phone">Phone Number</Label>
                            <Input
                              id="api-phone"
                              type="tel"
                              placeholder="+263 77 123 4567"
                              value={formData.phone}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })}
                              required
                            />
                          </div>
                        </>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="api-email">Email</Label>
                        <Input
                          id="api-email"
                          type="email"
                          placeholder="customer@example.com"
                          value={formData.email}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="api-password">Password</Label>
                        <Input
                          id="api-password"
                          type="password"
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })}
                          required
                          minLength={6}
                        />
                      </div>

                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSignUp ? "Create Account" : "Sign In"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>

                    <div className="mt-4 text-center">
                      <button
                        type="button"
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-sm text-primary hover:underline"
                      >
                        {isSignUp
                          ? "Already have an account? Sign in"
                          : "Don't have an account? Sign up"}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Integration Help */}
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Integration Guide
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    Embed this login page in your website:
                  </p>
                  <div className="bg-slate-950 text-slate-50 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                    <pre>{`<a href="${window.location.origin}/saas-login?api_key=YOUR_KEY&return_url=YOUR_CALLBACK">
  Book Now
</a>`}</pre>
                  </div>
                  <p className="text-muted-foreground">
                    Or use our JavaScript SDK for seamless integration.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          )}

          {/* Footer Links */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              By continuing, you agree to our{" "}
              <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
              {" "}and{" "}
              <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
