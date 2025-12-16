import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Building2, Bell, Key, Database, Palette, Mail, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    companyName: 'KJ Khandala Bus Company',
    companyEmail: 'info@kjkhandala.com',
    companyPhone: '+267 1234567',
    companyAddress: 'Gaborone, Botswana',
    currency: 'BWP',
    timezone: 'Africa/Gaborone',
    emailNotifications: true,
    smsNotifications: true,
    whatsappNotifications: false,
    maintenanceMode: false,
    googleMapsApiKey: '',
    dpoPaygateId: '',
    dpoPaygateSecret: '',
    smtpHost: '',
    smtpPort: '',
    smtpUsername: '',
    smtpPassword: '',
  });

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">System Settings</h1>
            <p className="text-muted-foreground">Configure system-wide settings and integrations</p>
          </div>
          <Button onClick={handleSave}>
            <Settings className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="company" className="space-y-4">
          <TabsList>
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
          </TabsList>

          {/* Company Settings */}
          <TabsContent value="company" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={settings.companyName}
                      onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">Company Email</Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      value={settings.companyEmail}
                      onChange={(e) => setSettings({...settings, companyEmail: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">Company Phone</Label>
                    <Input
                      id="companyPhone"
                      value={settings.companyPhone}
                      onChange={(e) => setSettings({...settings, companyPhone: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <select
                      id="currency"
                      value={settings.currency}
                      onChange={(e) => setSettings({...settings, currency: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="BWP">BWP - Botswana Pula</option>
                      <option value="ZAR">ZAR - South African Rand</option>
                      <option value="USD">USD - US Dollar</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyAddress">Company Address</Label>
                  <Textarea
                    id="companyAddress"
                    value={settings.companyAddress}
                    onChange={(e) => setSettings({...settings, companyAddress: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    value={settings.timezone}
                    onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="Africa/Gaborone">Africa/Gaborone</option>
                    <option value="Africa/Johannesburg">Africa/Johannesburg</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-blue-500" />
                    <div>
                      <Label htmlFor="emailNotifications" className="text-base">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send booking confirmations and alerts via email</p>
                    </div>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-green-500" />
                    <div>
                      <Label htmlFor="smsNotifications" className="text-base">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send booking confirmations via SMS</p>
                    </div>
                  </div>
                  <Switch
                    id="smsNotifications"
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) => setSettings({...settings, smsNotifications: checked})}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    <div>
                      <Label htmlFor="whatsappNotifications" className="text-base">WhatsApp Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send booking confirmations via WhatsApp</p>
                    </div>
                  </div>
                  <Switch
                    id="whatsappNotifications"
                    checked={settings.whatsappNotifications}
                    onCheckedChange={(checked) => setSettings({...settings, whatsappNotifications: checked})}
                  />
                </div>

                {/* SMTP Configuration */}
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-4">Email Server (SMTP) Configuration</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpHost">SMTP Host</Label>
                      <Input
                        id="smtpHost"
                        value={settings.smtpHost}
                        onChange={(e) => setSettings({...settings, smtpHost: e.target.value})}
                        placeholder="smtp.gmail.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input
                        id="smtpPort"
                        value={settings.smtpPort}
                        onChange={(e) => setSettings({...settings, smtpPort: e.target.value})}
                        placeholder="587"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smtpUsername">SMTP Username</Label>
                      <Input
                        id="smtpUsername"
                        value={settings.smtpUsername}
                        onChange={(e) => setSettings({...settings, smtpUsername: e.target.value})}
                        placeholder="your-email@gmail.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smtpPassword">SMTP Password</Label>
                      <Input
                        id="smtpPassword"
                        type="password"
                        value={settings.smtpPassword}
                        onChange={(e) => setSettings({...settings, smtpPassword: e.target.value})}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations */}
          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Keys & Integrations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Google Maps */}
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    🗺️ Google Maps API
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Required for live GPS tracking and route mapping
                  </p>
                  <Input
                    value={settings.googleMapsApiKey}
                    onChange={(e) => setSettings({...settings, googleMapsApiKey: e.target.value})}
                    placeholder="Enter your Google Maps API key"
                    type="password"
                  />
                  <a 
                    href="https://developers.google.com/maps/documentation/javascript/get-api-key" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline mt-2 inline-block"
                  >
                    Get API Key →
                  </a>
                </div>

                {/* DPO PayGate */}
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    💳 DPO PayGate
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Payment gateway for online bookings
                  </p>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="dpoPaygateId">PayGate ID</Label>
                      <Input
                        id="dpoPaygateId"
                        value={settings.dpoPaygateId}
                        onChange={(e) => setSettings({...settings, dpoPaygateId: e.target.value})}
                        placeholder="Enter your PayGate ID"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dpoPaygateSecret">PayGate Secret Key</Label>
                      <Input
                        id="dpoPaygateSecret"
                        type="password"
                        value={settings.dpoPaygateSecret}
                        onChange={(e) => setSettings({...settings, dpoPaygateSecret: e.target.value})}
                        placeholder="Enter your PayGate Secret"
                      />
                    </div>
                  </div>
                </div>

                {/* WhatsApp Business */}
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    💬 WhatsApp Business API
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Send booking confirmations via WhatsApp
                  </p>
                  <Input
                    placeholder="WhatsApp Business API Key"
                    type="password"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding */}
          <TabsContent value="branding" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Branding & Appearance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Company Logo</Label>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center">
                      <span className="text-sm text-muted-foreground">Upload Logo</span>
                    </div>
                    <Button variant="outline">Choose File</Button>
                  </div>
                </div>

                <div>
                  <Label>Primary Color</Label>
                  <div className="mt-2 flex items-center gap-4">
                    <Input type="color" value="#DC2626" className="w-20 h-10" />
                    <span className="text-sm text-muted-foreground">#DC2626 (Red)</span>
                  </div>
                </div>

                <div>
                  <Label>Secondary Color</Label>
                  <div className="mt-2 flex items-center gap-4">
                    <Input type="color" value="#1E3A8A" className="w-20 h-10" />
                    <span className="text-sm text-muted-foreground">#1E3A8A (Navy Blue)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backup & Restore */}
          <TabsContent value="backup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Backup & Restore
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Database Backup</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create a backup of your entire database
                  </p>
                  <Button>
                    <Database className="h-4 w-4 mr-2" />
                    Create Backup
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Restore from Backup</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Restore your database from a previous backup
                  </p>
                  <Button variant="outline">
                    <Database className="h-4 w-4 mr-2" />
                    Choose Backup File
                  </Button>
                </div>

                <div className="p-4 border rounded-lg bg-orange-50">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Maintenance Mode
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Enable maintenance mode to prevent user access during updates
                  </p>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={settings.maintenanceMode}
                      onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
                    />
                    <span className="text-sm font-medium">
                      {settings.maintenanceMode ? 'Maintenance Mode Active' : 'Maintenance Mode Inactive'}
                    </span>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">System Logs</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    View and download system logs for debugging
                  </p>
                  <Button variant="outline">View Logs</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
