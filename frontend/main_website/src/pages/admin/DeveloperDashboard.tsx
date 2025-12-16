import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  Key,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Code,
  Webhook,
  BarChart3,
  Settings,
  Shield,
  Palette,
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ExternalLink,
  Download,
  Trash2,
  Building2,
  Plus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CompanyConfig {
  id: string;
  name: string;
  slug: string;
  code: string;
  api_key: string;
  api_secret: string;
  api_key_created_at: string;
  api_key_last_used_at: string;
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  email: string;
  phone: string;
  website_url: string;
  address: string;
  city: string;
  country: string;
  features: Record<string, boolean>;
  settings: Record<string, any>;
  subscription_tier: string;
  subscription_status: string;
  api_rate_limit: number;
  api_calls_this_month: number;
  webhook_url: string;
  webhook_secret: string;
  webhook_events: string[];
  is_active: boolean;
  is_verified: boolean;
}

interface ApiLog {
  id: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  ip_address: string;
  created_at: string;
  error_message: string;
}

export default function DeveloperDashboard() {
  const { user, userRoles } = useAuth();
  const navigate = useNavigate();
  const isDeveloper = userRoles.includes('DEVELOPER') || userRoles.includes('SUPER_ADMIN');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [config, setConfig] = useState<CompanyConfig | null>(null);
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [apiStats, setApiStats] = useState({
    totalCalls: 0,
    successRate: 0,
    avgResponseTime: 0,
    callsToday: 0,
  });

  useEffect(() => {
    fetchCompanyConfig();
    fetchApiLogs();
    fetchApiStats();
  }, []);

  const fetchCompanyConfig = async () => {
    try {
      // Get user's company
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      if (!profile?.company_id) {
        toast.error("No company associated with your account");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", profile.company_id)
        .single();

      if (error) throw error;
      setConfig(data);
    } catch (error) {
      console.error("Error fetching company config:", error);
      toast.error("Failed to load company configuration");
    } finally {
      setLoading(false);
    }
  };

  const fetchApiLogs = async () => {
    if (!config?.id) return;
    try {
      const { data, error } = await supabase
        .from("api_logs")
        .select("*")
        .eq("company_id", config.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setApiLogs(data || []);
    } catch (error) {
      console.error("Error fetching API logs:", error);
    }
  };

  const fetchApiStats = async () => {
    if (!config?.id) return;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: logs, error } = await supabase
        .from("api_logs")
        .select("status_code, response_time_ms, created_at")
        .eq("company_id", config.id);

      if (error) throw error;

      const totalCalls = logs?.length || 0;
      const successCalls = logs?.filter((l) => l.status_code >= 200 && l.status_code < 400).length || 0;
      const avgResponseTime = logs?.reduce((sum, l) => sum + (l.response_time_ms || 0), 0) / (totalCalls || 1);
      const callsToday = logs?.filter((l) => new Date(l.created_at) >= today).length || 0;

      setApiStats({
        totalCalls,
        successRate: totalCalls > 0 ? (successCalls / totalCalls) * 100 : 0,
        avgResponseTime: Math.round(avgResponseTime),
        callsToday,
      });
    } catch (error) {
      console.error("Error fetching API stats:", error);
    }
  };

  useEffect(() => {
    if (config?.id) {
      fetchApiLogs();
      fetchApiStats();
    }
  }, [config?.id]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const regenerateApiKey = async () => {
    if (!config?.id) return;
    setSaving(true);
    try {
      // Call RPC function to generate new API key
      const { data, error } = await supabase.rpc("generate_api_key");
      if (error) throw error;

      const newApiKey = data || `vts_${crypto.randomUUID().replace(/-/g, "")}`;
      const newApiSecret = `vts_secret_${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "")}`;

      const { error: updateError } = await supabase
        .from("companies")
        .update({
          api_key: newApiKey,
          api_secret: newApiSecret,
          api_key_created_at: new Date().toISOString(),
        })
        .eq("id", config.id);

      if (updateError) throw updateError;

      setConfig((prev) => prev ? { ...prev, api_key: newApiKey, api_secret: newApiSecret } : null);
      toast.success("API keys regenerated successfully");
      setRegenerateDialogOpen(false);
    } catch (error) {
      console.error("Error regenerating API key:", error);
      toast.error("Failed to regenerate API keys");
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = async (updates: Partial<CompanyConfig>) => {
    if (!config?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update(updates)
        .eq("id", config.id);

      if (error) throw error;

      setConfig((prev) => prev ? { ...prev, ...updates } : null);
      toast.success("Configuration updated successfully");
    } catch (error) {
      console.error("Error updating config:", error);
      toast.error("Failed to update configuration");
    } finally {
      setSaving(false);
    }
  };

  const updateFeature = (feature: string, enabled: boolean) => {
    const newFeatures = { ...config?.features, [feature]: enabled };
    updateConfig({ features: newFeatures });
  };

  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...config?.settings, [key]: value };
    updateConfig({ settings: newSettings });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!config) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <AlertTriangle className="h-16 w-16 text-yellow-500" />
          <h2 className="text-xl font-semibold">No Company Configuration</h2>
          <p className="text-muted-foreground">Please contact support to set up your company.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Developer Dashboard</h1>
            <p className="text-muted-foreground">
              Manage API keys, webhooks, and integration settings for {config.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isDeveloper && (
              <Button 
                onClick={() => navigate('/developer/onboarding')}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <Building2 className="h-4 w-4" />
                Onboard New Company
              </Button>
            )}
            <Badge variant={config.subscription_status === "active" ? "default" : "destructive"}>
              {config.subscription_tier?.toUpperCase()} Plan
            </Badge>
            <Badge variant={config.is_verified ? "default" : "secondary"}>
              {config.is_verified ? "Verified" : "Unverified"}
            </Badge>
          </div>
        </div>

        {/* API Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Calls This Month</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{config.api_calls_this_month?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">
                of {config.api_rate_limit?.toLocaleString() || 1000} limit
              </p>
              <div className="mt-2 h-2 rounded-full bg-secondary">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{
                    width: `${Math.min(((config.api_calls_this_month || 0) / (config.api_rate_limit || 1000)) * 100, 100)}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{apiStats.successRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {apiStats.totalCalls} total requests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{apiStats.avgResponseTime}ms</div>
              <p className="text-xs text-muted-foreground">
                {apiStats.callsToday} calls today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last API Call</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {config.api_key_last_used_at
                  ? new Date(config.api_key_last_used_at).toLocaleDateString()
                  : "Never"}
              </div>
              <p className="text-xs text-muted-foreground">
                {config.api_key_last_used_at
                  ? new Date(config.api_key_last_used_at).toLocaleTimeString()
                  : "No API calls yet"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="api-keys" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="api-keys" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Features
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="flex items-center gap-2">
              <Webhook className="h-4 w-4" />
              Webhooks
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              API Logs
            </TabsTrigger>
          </TabsList>

          {/* API Keys Tab */}
          <TabsContent value="api-keys" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  API Credentials
                </CardTitle>
                <CardDescription>
                  Use these credentials to authenticate API requests from your website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* API Key */}
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        value={config.api_key || ""}
                        readOnly
                        className="pr-20 font-mono"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(config.api_key || "", "API Key")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Include this in the <code className="bg-muted px-1 rounded">x-api-key</code> header
                  </p>
                </div>

                {/* API Secret */}
                <div className="space-y-2">
                  <Label>API Secret (for webhook verification)</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showApiSecret ? "text" : "password"}
                        value={config.api_secret || ""}
                        readOnly
                        className="pr-20 font-mono"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                        onClick={() => setShowApiSecret(!showApiSecret)}
                      >
                        {showApiSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(config.api_secret || "", "API Secret")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Regenerate Keys */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Regenerate API Keys</p>
                    <p className="text-sm text-muted-foreground">
                      This will invalidate your current keys. All integrations will need to be updated.
                    </p>
                  </div>
                  <Dialog open={regenerateDialogOpen} onOpenChange={setRegenerateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate Keys
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Regenerate API Keys?</DialogTitle>
                        <DialogDescription>
                          This action cannot be undone. Your current API keys will be invalidated immediately.
                          All external integrations using the old keys will stop working.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setRegenerateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={regenerateApiKey} disabled={saving}>
                          {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                          Regenerate
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <Separator />

                {/* Quick Start Code */}
                <div className="space-y-2">
                  <Label>Quick Start</Label>
                  <div className="bg-slate-950 text-slate-50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <pre>{`// Example: Fetch company configuration
const response = await fetch('${window.location.origin}/api/v1/config', {
  headers: {
    'x-api-key': '${showApiKey ? config.api_key : "vts_your_api_key_here"}'
  }
});

const { data } = await response.json();
console.log(data.branding); // Your company branding`}</pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API Documentation Link */}
            <Card>
              <CardHeader>
                <CardTitle>API Documentation</CardTitle>
                <CardDescription>
                  Learn how to integrate with our API
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <Button variant="outline" className="h-auto py-4 flex flex-col items-start gap-2">
                    <Code className="h-5 w-5" />
                    <div className="text-left">
                      <p className="font-medium">REST API Reference</p>
                      <p className="text-xs text-muted-foreground">Complete endpoint documentation</p>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex flex-col items-start gap-2">
                    <Download className="h-5 w-5" />
                    <div className="text-left">
                      <p className="font-medium">SDK Downloads</p>
                      <p className="text-xs text-muted-foreground">JavaScript, Python, PHP</p>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex flex-col items-start gap-2">
                    <ExternalLink className="h-5 w-5" />
                    <div className="text-left">
                      <p className="font-medium">Widget Builder</p>
                      <p className="text-xs text-muted-foreground">Embed booking on your site</p>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Brand Configuration</CardTitle>
                <CardDescription>
                  Customize how your company appears on external booking widgets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Logo URL */}
                  <div className="space-y-2">
                    <Label>Logo URL</Label>
                    <Input
                      value={config.logo_url || ""}
                      onChange={(e) => setConfig((prev) => prev ? { ...prev, logo_url: e.target.value } : null)}
                      placeholder="https://example.com/logo.png"
                    />
                    {config.logo_url && (
                      <img src={config.logo_url} alt="Logo preview" className="h-12 object-contain" />
                    )}
                  </div>

                  {/* Favicon URL */}
                  <div className="space-y-2">
                    <Label>Favicon URL</Label>
                    <Input
                      value={config.favicon_url || ""}
                      onChange={(e) => setConfig((prev) => prev ? { ...prev, favicon_url: e.target.value } : null)}
                      placeholder="https://example.com/favicon.ico"
                    />
                  </div>

                  {/* Primary Color */}
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.primary_color || "#1E40AF"}
                        onChange={(e) => setConfig((prev) => prev ? { ...prev, primary_color: e.target.value } : null)}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={config.primary_color || "#1E40AF"}
                        onChange={(e) => setConfig((prev) => prev ? { ...prev, primary_color: e.target.value } : null)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* Secondary Color */}
                  <div className="space-y-2">
                    <Label>Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.secondary_color || "#3B82F6"}
                        onChange={(e) => setConfig((prev) => prev ? { ...prev, secondary_color: e.target.value } : null)}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={config.secondary_color || "#3B82F6"}
                        onChange={(e) => setConfig((prev) => prev ? { ...prev, secondary_color: e.target.value } : null)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.accent_color || "#10B981"}
                        onChange={(e) => setConfig((prev) => prev ? { ...prev, accent_color: e.target.value } : null)}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={config.accent_color || "#10B981"}
                        onChange={(e) => setConfig((prev) => prev ? { ...prev, accent_color: e.target.value } : null)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* Font Family */}
                  <div className="space-y-2">
                    <Label>Font Family</Label>
                    <Select
                      value={config.font_family || "Inter"}
                      onValueChange={(value) => setConfig((prev) => prev ? { ...prev, font_family: value } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Roboto">Roboto</SelectItem>
                        <SelectItem value="Open Sans">Open Sans</SelectItem>
                        <SelectItem value="Poppins">Poppins</SelectItem>
                        <SelectItem value="Lato">Lato</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="font-medium">Contact Information</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Support Email</Label>
                      <Input
                        type="email"
                        value={config.email || ""}
                        onChange={(e) => setConfig((prev) => prev ? { ...prev, email: e.target.value } : null)}
                        placeholder="support@yourcompany.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Support Phone</Label>
                      <Input
                        value={config.phone || ""}
                        onChange={(e) => setConfig((prev) => prev ? { ...prev, phone: e.target.value } : null)}
                        placeholder="+263 77 123 4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Website URL</Label>
                      <Input
                        value={config.website_url || ""}
                        onChange={(e) => setConfig((prev) => prev ? { ...prev, website_url: e.target.value } : null)}
                        placeholder="https://yourcompany.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        value={config.city || ""}
                        onChange={(e) => setConfig((prev) => prev ? { ...prev, city: e.target.value } : null)}
                        placeholder="Harare"
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={() => updateConfig(config)} disabled={saving}>
                  {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Save Branding
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Feature Toggles</CardTitle>
                <CardDescription>
                  Enable or disable features for your external booking integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6">
                  {[
                    { key: "online_booking", label: "Online Booking", description: "Allow customers to book tickets online" },
                    { key: "seat_selection", label: "Seat Selection", description: "Let customers choose their seats" },
                    { key: "loyalty_program", label: "Loyalty Program", description: "Enable points and rewards system" },
                    { key: "live_tracking", label: "Live Tracking", description: "Show real-time bus locations" },
                    { key: "sms_notifications", label: "SMS Notifications", description: "Send booking confirmations via SMS" },
                    { key: "email_notifications", label: "Email Notifications", description: "Send booking confirmations via email" },
                    { key: "refunds_enabled", label: "Refunds", description: "Allow customers to request refunds" },
                    { key: "guest_checkout", label: "Guest Checkout", description: "Allow booking without account" },
                    { key: "multi_currency", label: "Multi-Currency", description: "Support multiple currencies" },
                  ].map((feature) => (
                    <div key={feature.key} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{feature.label}</p>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                      <Switch
                        checked={config.features?.[feature.key] ?? false}
                        onCheckedChange={(checked) => updateFeature(feature.key, checked)}
                      />
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Business Settings */}
                <div className="space-y-4">
                  <h3 className="font-medium">Business Settings</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select
                        value={config.settings?.currency || "USD"}
                        onValueChange={(value) => updateSetting("currency", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="ZWL">ZWL (Z$)</SelectItem>
                          <SelectItem value="ZAR">ZAR (R)</SelectItem>
                          <SelectItem value="BWP">BWP (P)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Select
                        value={config.settings?.timezone || "Africa/Harare"}
                        onValueChange={(value) => updateSetting("timezone", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Africa/Harare">Africa/Harare (CAT)</SelectItem>
                          <SelectItem value="Africa/Johannesburg">Africa/Johannesburg (SAST)</SelectItem>
                          <SelectItem value="Africa/Gaborone">Africa/Gaborone (CAT)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Booking Advance Days</Label>
                      <Input
                        type="number"
                        value={config.settings?.booking_advance_days || 30}
                        onChange={(e) => updateSetting("booking_advance_days", parseInt(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">How far in advance can customers book</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Minimum Booking Hours</Label>
                      <Input
                        type="number"
                        value={config.settings?.min_booking_hours || 2}
                        onChange={(e) => updateSetting("min_booking_hours", parseInt(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">Minimum hours before departure to book</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Cancellation Policy (hours)</Label>
                      <Input
                        type="number"
                        value={config.settings?.cancellation_policy_hours || 24}
                        onChange={(e) => updateSetting("cancellation_policy_hours", parseInt(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">Hours before departure for full refund</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Refund Percentage</Label>
                      <Input
                        type="number"
                        value={config.settings?.refund_percentage || 80}
                        onChange={(e) => updateSetting("refund_percentage", parseInt(e.target.value))}
                        max={100}
                        min={0}
                      />
                      <p className="text-xs text-muted-foreground">Percentage refunded for valid cancellations</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Webhooks Tab */}
          <TabsContent value="webhooks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Webhook Configuration</CardTitle>
                <CardDescription>
                  Receive real-time notifications when events occur
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <Input
                    value={config.webhook_url || ""}
                    onChange={(e) => setConfig((prev) => prev ? { ...prev, webhook_url: e.target.value } : null)}
                    placeholder="https://yoursite.com/api/webhooks/voyage"
                  />
                  <p className="text-xs text-muted-foreground">
                    We'll send POST requests to this URL when events occur
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Webhook Secret</Label>
                  <div className="flex gap-2">
                    <Input
                      value={config.webhook_secret || ""}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(config.webhook_secret || "", "Webhook Secret")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use this to verify webhook signatures
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-medium">Event Subscriptions</h3>
                  <div className="grid gap-4">
                    {[
                      { event: "booking.created", description: "When a new booking is created" },
                      { event: "booking.confirmed", description: "When a booking is confirmed" },
                      { event: "booking.cancelled", description: "When a booking is cancelled" },
                      { event: "payment.completed", description: "When payment is successful" },
                      { event: "payment.failed", description: "When payment fails" },
                      { event: "trip.departed", description: "When a trip departs" },
                      { event: "trip.arrived", description: "When a trip arrives" },
                    ].map((item) => (
                      <div key={item.event} className="flex items-center justify-between">
                        <div>
                          <code className="bg-muted px-2 py-1 rounded text-sm">{item.event}</code>
                          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                        </div>
                        <Switch
                          checked={config.webhook_events?.includes(item.event) ?? false}
                          onCheckedChange={(checked) => {
                            const events = config.webhook_events || [];
                            const newEvents = checked
                              ? [...events, item.event]
                              : events.filter((e) => e !== item.event);
                            updateConfig({ webhook_events: newEvents });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => updateConfig({ webhook_url: config.webhook_url })}
                  disabled={saving}
                >
                  {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Save Webhook Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent API Requests</CardTitle>
                <CardDescription>
                  View the last 50 API requests to your integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Response Time</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No API requests yet. Make your first API call to see logs here.
                        </TableCell>
                      </TableRow>
                    ) : (
                      apiLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {new Date(log.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.method}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm max-w-[200px] truncate">
                            {log.endpoint}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                log.status_code >= 200 && log.status_code < 300
                                  ? "default"
                                  : log.status_code >= 400
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {log.status_code || "—"}
                            </Badge>
                          </TableCell>
                          <TableCell>{log.response_time_ms ? `${log.response_time_ms}ms` : "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {log.ip_address || "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
