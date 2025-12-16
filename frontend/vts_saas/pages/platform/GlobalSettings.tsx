import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Globe,
  Mail,
  Bell,
  Shield,
  Palette,
  Save,
  RefreshCw,
} from "lucide-react";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function GlobalSettings() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if platform admin is logged in
    const token = localStorage.getItem("platform_admin_token");
    if (!token) {
      navigate("/platform/login");
      return;
    }
    fetchSettings();
  }, [navigate]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("key, value");

      if (error) throw error;

      if (data) {
        const settingsMap: Record<string, any> = {};
        data.forEach(s => {
          try {
            settingsMap[s.key] = JSON.parse(s.value);
          } catch {
            settingsMap[s.key] = s.value;
          }
        });

        setGeneralSettings(prev => ({
          ...prev,
          platformName: settingsMap.platform_name || prev.platformName,
          supportEmail: settingsMap.support_email || prev.supportEmail,
          defaultTimezone: settingsMap.default_timezone || prev.defaultTimezone,
          defaultCurrency: settingsMap.default_currency || prev.defaultCurrency,
          maintenanceMode: settingsMap.maintenance_mode || false,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const [generalSettings, setGeneralSettings] = useState({
    platformName: "Voyage Tech Solutions",
    supportEmail: "support@voyagetech.com",
    defaultTimezone: "Africa/Harare",
    defaultCurrency: "USD",
    maintenanceMode: false,
  });

  const [emailSettings, setEmailSettings] = useState({
    smtpHost: "smtp.sendgrid.net",
    smtpPort: "587",
    smtpUser: "apikey",
    fromEmail: "noreply@voyagetech.com",
    fromName: "Voyage Tech Solutions",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    enableEmailNotifications: true,
    enableSmsNotifications: true,
    enablePushNotifications: false,
    bookingConfirmation: true,
    paymentReceipt: true,
    tripReminder: true,
    systemAlerts: true,
  });

  const [securitySettings, setSecuritySettings] = useState({
    enforceStrongPasswords: true,
    sessionTimeout: "30",
    maxLoginAttempts: "5",
    enable2FA: false,
    ipWhitelist: "",
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = [
        { key: "platform_name", value: JSON.stringify(generalSettings.platformName) },
        { key: "support_email", value: JSON.stringify(generalSettings.supportEmail) },
        { key: "default_timezone", value: JSON.stringify(generalSettings.defaultTimezone) },
        { key: "default_currency", value: JSON.stringify(generalSettings.defaultCurrency) },
        { key: "maintenance_mode", value: JSON.stringify(generalSettings.maintenanceMode) },
      ];

      for (const update of updates) {
        await supabase
          .from("platform_settings")
          .update({ value: update.value })
          .eq("key", update.key);
      }

      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PlatformLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Global Settings</h1>
            <p className="text-muted-foreground">
              Configure platform-wide settings that affect all tenants
            </p>
          </div>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Basic platform configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="platformName">Platform Name</Label>
                    <Input
                      id="platformName"
                      value={generalSettings.platformName}
                      onChange={(e) =>
                        setGeneralSettings({ ...generalSettings, platformName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={generalSettings.supportEmail}
                      onChange={(e) =>
                        setGeneralSettings({ ...generalSettings, supportEmail: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Default Timezone</Label>
                    <Select
                      value={generalSettings.defaultTimezone}
                      onValueChange={(value) =>
                        setGeneralSettings({ ...generalSettings, defaultTimezone: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Africa/Harare">Africa/Harare (CAT)</SelectItem>
                        <SelectItem value="Africa/Johannesburg">Africa/Johannesburg (SAST)</SelectItem>
                        <SelectItem value="Africa/Lagos">Africa/Lagos (WAT)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select
                      value={generalSettings.defaultCurrency}
                      onValueChange={(value) =>
                        setGeneralSettings({ ...generalSettings, defaultCurrency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="ZWL">ZWL - Zimbabwe Dollar</SelectItem>
                        <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
                        <SelectItem value="BWP">BWP - Botswana Pula</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-red-50">
                  <div>
                    <Label htmlFor="maintenance" className="text-red-700">Maintenance Mode</Label>
                    <p className="text-sm text-red-600">
                      Enable to show maintenance page to all users
                    </p>
                  </div>
                  <Switch
                    id="maintenance"
                    checked={generalSettings.maintenanceMode}
                    onCheckedChange={(checked) =>
                      setGeneralSettings({ ...generalSettings, maintenanceMode: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Email Configuration</CardTitle>
                <CardDescription>SMTP settings for sending emails</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={emailSettings.smtpHost}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, smtpHost: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      value={emailSettings.smtpPort}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, smtpPort: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpUser">SMTP Username</Label>
                    <Input
                      id="smtpUser"
                      value={emailSettings.smtpUser}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, smtpUser: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPass">SMTP Password</Label>
                    <Input id="smtpPass" type="password" placeholder="••••••••" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fromEmail">From Email</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      value={emailSettings.fromEmail}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, fromEmail: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fromName">From Name</Label>
                    <Input
                      id="fromName"
                      value={emailSettings.fromName}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, fromName: e.target.value })
                      }
                    />
                  </div>
                </div>
                <Button variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Test Email
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure default notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Notification Channels</h4>
                  <div className="space-y-3">
                    {[
                      { key: "enableEmailNotifications", label: "Email Notifications" },
                      { key: "enableSmsNotifications", label: "SMS Notifications" },
                      { key: "enablePushNotifications", label: "Push Notifications" },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between">
                        <Label htmlFor={item.key}>{item.label}</Label>
                        <Switch
                          id={item.key}
                          checked={notificationSettings[item.key as keyof typeof notificationSettings] as boolean}
                          onCheckedChange={(checked) =>
                            setNotificationSettings({ ...notificationSettings, [item.key]: checked })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Notification Types</h4>
                  <div className="space-y-3">
                    {[
                      { key: "bookingConfirmation", label: "Booking Confirmation" },
                      { key: "paymentReceipt", label: "Payment Receipt" },
                      { key: "tripReminder", label: "Trip Reminder" },
                      { key: "systemAlerts", label: "System Alerts" },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between">
                        <Label htmlFor={item.key}>{item.label}</Label>
                        <Switch
                          id={item.key}
                          checked={notificationSettings[item.key as keyof typeof notificationSettings] as boolean}
                          onCheckedChange={(checked) =>
                            setNotificationSettings({ ...notificationSettings, [item.key]: checked })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Platform security configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {[
                    { key: "enforceStrongPasswords", label: "Enforce Strong Passwords", desc: "Require complex passwords for all users" },
                    { key: "enable2FA", label: "Enable Two-Factor Authentication", desc: "Allow users to enable 2FA" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label htmlFor={item.key}>{item.label}</Label>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch
                        id={item.key}
                        checked={securitySettings[item.key as keyof typeof securitySettings] as boolean}
                        onCheckedChange={(checked) =>
                          setSecuritySettings({ ...securitySettings, [item.key]: checked })
                        }
                      />
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) =>
                        setSecuritySettings({ ...securitySettings, sessionTimeout: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      value={securitySettings.maxLoginAttempts}
                      onChange={(e) =>
                        setSecuritySettings({ ...securitySettings, maxLoginAttempts: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ipWhitelist">IP Whitelist (comma-separated)</Label>
                  <Textarea
                    id="ipWhitelist"
                    placeholder="192.168.1.1, 10.0.0.0/24"
                    value={securitySettings.ipWhitelist}
                    onChange={(e) =>
                      setSecuritySettings({ ...securitySettings, ipWhitelist: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to allow all IPs
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PlatformLayout>
  );
}
