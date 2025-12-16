import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Key,
  Plus,
  Copy,
  Eye,
  EyeOff,
  MoreHorizontal,
  Trash2,
  RefreshCw,
  Globe,
  Code,
  Link,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Clock,
  Shield,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  generateApiKey,
  getCompanyApiKeys,
  revokeApiKey,
  getApiKeyUsage,
  getTenantSettings,
  updateTenantSettings,
} from "@/lib/api-integration";
import AdminLayout from "@/components/admin/AdminLayout";

interface ApiKey {
  id: string;
  key_prefix: string;
  name: string;
  description: string | null;
  permissions: Record<string, any>;
  allowed_domains: string[] | null;
  rate_limit_per_minute: number;
  rate_limit_per_day: number;
  last_used_at: string | null;
  total_requests: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

interface TenantSettings {
  id: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  domain_url: string | null;
  booking_redirect_url: string | null;
  support_email: string | null;
  support_phone: string | null;
  booking_settings: Record<string, any>;
  enabled_modules: Record<string, any>;
}

export default function ApiIntegration() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [tenantSettings, setTenantSettings] = useState<TenantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");

  // Dialog states
  const [isCreateKeyOpen, setIsCreateKeyOpen] = useState(false);
  const [newKeyData, setNewKeyData] = useState({ name: "", description: "", domains: "" });
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  // Settings form
  const [settingsForm, setSettingsForm] = useState({
    slug: "",
    domain_url: "",
    booking_redirect_url: "",
    support_email: "",
    support_phone: "",
    primary_color: "#003366",
    secondary_color: "#0066cc",
    accent_color: "#ff6600",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get current user's company
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id, companies(id, name)")
        .eq("id", user.id)
        .single();

      if (profile?.company_id) {
        setCompanyId(profile.company_id);
        setCompanyName((profile.companies as any)?.name || "");

        // Fetch API keys
        const keys = await getCompanyApiKeys(profile.company_id);
        setApiKeys(keys);

        // Fetch tenant settings
        const settings = await getTenantSettings(profile.company_id);
        if (settings) {
          setTenantSettings(settings);
          setSettingsForm({
            slug: settings.slug || "",
            domain_url: settings.domain_url || "",
            booking_redirect_url: settings.booking_redirect_url || "",
            support_email: settings.support_email || "",
            support_phone: settings.support_phone || "",
            primary_color: settings.primary_color || "#003366",
            secondary_color: settings.secondary_color || "#0066cc",
            accent_color: settings.accent_color || "#ff6600",
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load API integration data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!companyId || !newKeyData.name) {
      toast.error("Please enter a key name");
      return;
    }

    try {
      const domains = newKeyData.domains
        ? newKeyData.domains.split(",").map((d) => d.trim()).filter(Boolean)
        : undefined;

      const result = await generateApiKey(
        companyId,
        newKeyData.name,
        newKeyData.description || undefined,
        domains
      );

      if (result) {
        setGeneratedKey(result.api_key);
        toast.success("API key created successfully");
        fetchData();
      } else {
        toast.error("Failed to create API key");
      }
    } catch (error) {
      console.error("Create key error:", error);
      toast.error("Failed to create API key");
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
      return;
    }

    const success = await revokeApiKey(keyId);
    if (success) {
      toast.success("API key revoked");
      fetchData();
    } else {
      toast.error("Failed to revoke API key");
    }
  };

  const handleSaveSettings = async () => {
    if (!companyId) return;

    const success = await updateTenantSettings(companyId, settingsForm);
    if (success) {
      toast.success("Settings saved successfully");
      fetchData();
    } else {
      toast.error("Failed to save settings");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getEmbedCode = () => {
    const slug = settingsForm.slug || tenantSettings?.slug;
    return `<!-- VTS Booking Widget -->
<script 
  src="https://voyagetechsolutions.com/sdk/booking.js" 
  data-tenant="${slug}"
  data-theme="auto"
></script>

<!-- Or use a direct link -->
<a href="https://voyagetechsolutions.com/book/${slug}" 
   class="vts-book-button">
  Book Now
</a>`;
  };

  const getBookingUrl = () => {
    const slug = settingsForm.slug || tenantSettings?.slug;
    return `https://voyagetechsolutions.com/book/${slug}`;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">API Integration</h1>
            <p className="text-muted-foreground">
              Connect your website to the booking system
            </p>
          </div>
          <Badge variant="outline" className="text-green-600 border-green-300">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {companyName}
          </Badge>
        </div>

        <Tabs defaultValue="keys" className="space-y-6">
          <TabsList>
            <TabsTrigger value="keys">
              <Key className="h-4 w-4 mr-2" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Globe className="h-4 w-4 mr-2" />
              Website Settings
            </TabsTrigger>
            <TabsTrigger value="embed">
              <Code className="h-4 w-4 mr-2" />
              Embed Code
            </TabsTrigger>
          </TabsList>

          {/* API Keys Tab */}
          <TabsContent value="keys" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>
                    Manage API keys for external integrations
                  </CardDescription>
                </div>
                <Dialog open={isCreateKeyOpen} onOpenChange={setIsCreateKeyOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setNewKeyData({ name: "", description: "", domains: "" });
                      setGeneratedKey(null);
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create API Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>
                        {generatedKey ? "API Key Created" : "Create New API Key"}
                      </DialogTitle>
                      <DialogDescription>
                        {generatedKey
                          ? "Copy your API key now. You won't be able to see it again!"
                          : "Create a new API key for website integration"}
                      </DialogDescription>
                    </DialogHeader>

                    {generatedKey ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                            <div className="text-sm text-amber-800">
                              <p className="font-medium">Important!</p>
                              <p>This is the only time you'll see this key. Copy it now and store it securely.</p>
                            </div>
                          </div>
                        </div>
                        <div className="relative">
                          <Input
                            value={showKey ? generatedKey : "•".repeat(40)}
                            readOnly
                            className="pr-20 font-mono text-sm"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => setShowKey(!showKey)}
                            >
                              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => copyToClipboard(generatedKey, "API Key")}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Key Name *</Label>
                          <Input
                            placeholder="e.g., Production Website"
                            value={newKeyData.name}
                            onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            placeholder="What is this key used for?"
                            value={newKeyData.description}
                            onChange={(e) => setNewKeyData({ ...newKeyData, description: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Allowed Domains (optional)</Label>
                          <Input
                            placeholder="e.g., example.com, www.example.com"
                            value={newKeyData.domains}
                            onChange={(e) => setNewKeyData({ ...newKeyData, domains: e.target.value })}
                          />
                          <p className="text-xs text-muted-foreground">
                            Comma-separated list of domains that can use this key
                          </p>
                        </div>
                      </div>
                    )}

                    <DialogFooter>
                      {generatedKey ? (
                        <Button onClick={() => setIsCreateKeyOpen(false)}>
                          Done
                        </Button>
                      ) : (
                        <>
                          <Button variant="outline" onClick={() => setIsCreateKeyOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleCreateKey}>
                            Create Key
                          </Button>
                        </>
                      )}
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {apiKeys.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No API keys yet</p>
                    <p className="text-sm">Create your first API key to get started</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Key</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Used</TableHead>
                        <TableHead>Requests</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiKeys.map((key) => (
                        <TableRow key={key.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{key.name}</p>
                              {key.description && (
                                <p className="text-xs text-muted-foreground">{key.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {key.key_prefix}
                            </code>
                          </TableCell>
                          <TableCell>
                            {key.is_active ? (
                              <Badge variant="outline" className="text-green-600 border-green-300">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-red-600 border-red-300">
                                Revoked
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {key.last_used_at ? (
                              <span className="text-sm">
                                {new Date(key.last_used_at).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">Never</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{key.total_requests.toLocaleString()}</span>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Activity className="h-4 w-4 mr-2" />
                                  View Usage
                                </DropdownMenuItem>
                                {key.is_active && (
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleRevokeKey(key.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Revoke Key
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Website Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Website Integration</CardTitle>
                  <CardDescription>
                    Configure how your website connects to the booking system
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Company Slug *</Label>
                    <Input
                      placeholder="e.g., kj-khandala"
                      value={settingsForm.slug}
                      onChange={(e) => setSettingsForm({ ...settingsForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Used in booking URLs: /book/{settingsForm.slug || "your-slug"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Your Website URL</Label>
                    <Input
                      placeholder="https://yourcompany.co.za"
                      value={settingsForm.domain_url}
                      onChange={(e) => setSettingsForm({ ...settingsForm, domain_url: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Redirect After Booking</Label>
                    <Input
                      placeholder="https://yourcompany.co.za/thank-you"
                      value={settingsForm.booking_redirect_url}
                      onChange={(e) => setSettingsForm({ ...settingsForm, booking_redirect_url: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Where customers go after completing a booking
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Support Contact</CardTitle>
                  <CardDescription>
                    Contact details shown on booking pages
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Support Email</Label>
                    <Input
                      type="email"
                      placeholder="support@yourcompany.co.za"
                      value={settingsForm.support_email}
                      onChange={(e) => setSettingsForm({ ...settingsForm, support_email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Support Phone</Label>
                    <Input
                      placeholder="+27 11 123 4567"
                      value={settingsForm.support_phone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, support_phone: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Branding Colors</CardTitle>
                  <CardDescription>
                    Customize the look of your booking pages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settingsForm.primary_color}
                          onChange={(e) => setSettingsForm({ ...settingsForm, primary_color: e.target.value })}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={settingsForm.primary_color}
                          onChange={(e) => setSettingsForm({ ...settingsForm, primary_color: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Secondary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settingsForm.secondary_color}
                          onChange={(e) => setSettingsForm({ ...settingsForm, secondary_color: e.target.value })}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={settingsForm.secondary_color}
                          onChange={(e) => setSettingsForm({ ...settingsForm, secondary_color: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Accent Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settingsForm.accent_color}
                          onChange={(e) => setSettingsForm({ ...settingsForm, accent_color: e.target.value })}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={settingsForm.accent_color}
                          onChange={(e) => setSettingsForm({ ...settingsForm, accent_color: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="mt-6 p-4 border rounded-lg">
                    <p className="text-sm font-medium mb-3">Preview</p>
                    <div className="flex gap-2">
                      <Button
                        style={{ backgroundColor: settingsForm.primary_color }}
                        className="text-white"
                      >
                        Primary Button
                      </Button>
                      <Button
                        style={{ backgroundColor: settingsForm.secondary_color }}
                        className="text-white"
                      >
                        Secondary
                      </Button>
                      <Button
                        style={{ backgroundColor: settingsForm.accent_color }}
                        className="text-white"
                      >
                        Accent
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveSettings}>
                Save Settings
              </Button>
            </div>
          </TabsContent>

          {/* Embed Code Tab */}
          <TabsContent value="embed" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Direct Booking Link</CardTitle>
                  <CardDescription>
                    Link directly to your branded booking page
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input value={getBookingUrl()} readOnly className="font-mono text-sm" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(getBookingUrl(), "Booking URL")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(getBookingUrl(), "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use this link on your website's "Book Now" button
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Embed Widget</CardTitle>
                  <CardDescription>
                    Add the booking widget to your website
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
                      <code>{getEmbedCode()}</code>
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(getEmbedCode(), "Embed code")}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Integration Guide */}
            <Card>
              <CardHeader>
                <CardTitle>Integration Guide</CardTitle>
                <CardDescription>
                  How to connect your website to the booking system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">Create an API Key</h4>
                      <p className="text-sm text-muted-foreground">
                        Go to the API Keys tab and create a new key for your website.
                        Add your domain to the allowed domains list for security.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">Configure Your Settings</h4>
                      <p className="text-sm text-muted-foreground">
                        Set your company slug, website URL, and branding colors.
                        This ensures the booking page matches your brand.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">Add to Your Website</h4>
                      <p className="text-sm text-muted-foreground">
                        Copy the embed code or booking link and add it to your website.
                        Customers will see your branded booking experience.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <div>
                      <h4 className="font-medium">Test Your Integration</h4>
                      <p className="text-sm text-muted-foreground">
                        Visit your booking page and make a test booking.
                        Verify that branding, routes, and payments work correctly.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
