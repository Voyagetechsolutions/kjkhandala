import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import TicketingLayout from '@/components/ticketing/TicketingLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Save, Settings as SettingsIcon, Printer, Bell, DollarSign } from 'lucide-react';

export default function Settings() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : TicketingLayout;
  
  const [settings, setSettings] = useState({
    // Printer Settings
    autoPrint: true,
    printReceipts: true,
    printerName: 'Default Printer',
    
    // Notification Settings
    soundAlerts: true,
    emailNotifications: false,
    smsNotifications: false,
    
    // Payment Settings
    acceptCash: true,
    acceptCard: true,
    acceptMobileMoney: true,
    
    // Booking Settings
    maxBookingsPerTransaction: 5,
    requirePassengerID: true,
    requirePhone: true,
    allowOverbooking: false,
    
    // Terminal Settings
    terminalId: 'TERM-001',
    terminalName: 'Main Terminal',
    sessionTimeout: 30,
  });

  const handleSave = () => {
    console.log('Saving settings:', settings);
    toast.success('Settings saved successfully');
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">Configure ticketing terminal preferences</p>
          </div>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </div>

        {/* Terminal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Terminal Information
            </CardTitle>
            <CardDescription>Basic terminal configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Terminal ID</Label>
                <Input
                  value={settings.terminalId}
                  onChange={(e) => setSettings({ ...settings, terminalId: e.target.value })}
                />
              </div>
              <div>
                <Label>Terminal Name</Label>
                <Input
                  value={settings.terminalName}
                  onChange={(e) => setSettings({ ...settings, terminalName: e.target.value })}
                />
              </div>
              <div>
                <Label>Session Timeout (minutes)</Label>
                <Input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Printer Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Printer Settings
            </CardTitle>
            <CardDescription>Configure ticket and receipt printing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Printer Name</Label>
              <Input
                value={settings.printerName}
                onChange={(e) => setSettings({ ...settings, printerName: e.target.value })}
              />
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-Print Tickets</Label>
                  <p className="text-sm text-muted-foreground">Automatically print after booking</p>
                </div>
                <Switch
                  checked={settings.autoPrint}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoPrint: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Print Receipts</Label>
                  <p className="text-sm text-muted-foreground">Print payment receipts</p>
                </div>
                <Switch
                  checked={settings.printReceipts}
                  onCheckedChange={(checked) => setSettings({ ...settings, printReceipts: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Alert and notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Sound Alerts</Label>
                <p className="text-sm text-muted-foreground">Play sound on successful booking</p>
              </div>
              <Switch
                checked={settings.soundAlerts}
                onCheckedChange={(checked) => setSettings({ ...settings, soundAlerts: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Send booking confirmation emails</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">Send booking confirmation SMS</p>
              </div>
              <Switch
                checked={settings.smsNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, smsNotifications: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Methods
            </CardTitle>
            <CardDescription>Enable or disable payment methods</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Accept Cash</Label>
                <p className="text-sm text-muted-foreground">Allow cash payments</p>
              </div>
              <Switch
                checked={settings.acceptCash}
                onCheckedChange={(checked) => setSettings({ ...settings, acceptCash: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Accept Card Payments</Label>
                <p className="text-sm text-muted-foreground">Allow credit/debit card payments</p>
              </div>
              <Switch
                checked={settings.acceptCard}
                onCheckedChange={(checked) => setSettings({ ...settings, acceptCard: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Accept Mobile Money</Label>
                <p className="text-sm text-muted-foreground">Allow mobile money payments</p>
              </div>
              <Switch
                checked={settings.acceptMobileMoney}
                onCheckedChange={(checked) => setSettings({ ...settings, acceptMobileMoney: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Booking Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Rules</CardTitle>
            <CardDescription>Configure booking constraints</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Max Bookings Per Transaction</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={settings.maxBookingsPerTransaction}
                onChange={(e) => setSettings({ ...settings, maxBookingsPerTransaction: parseInt(e.target.value) })}
              />
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Require Passenger ID</Label>
                  <p className="text-sm text-muted-foreground">Mandatory ID/Passport number</p>
                </div>
                <Switch
                  checked={settings.requirePassengerID}
                  onCheckedChange={(checked) => setSettings({ ...settings, requirePassengerID: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Require Phone Number</Label>
                  <p className="text-sm text-muted-foreground">Mandatory phone number</p>
                </div>
                <Switch
                  checked={settings.requirePhone}
                  onCheckedChange={(checked) => setSettings({ ...settings, requirePhone: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow Overbooking</Label>
                  <p className="text-sm text-muted-foreground">Book beyond bus capacity</p>
                </div>
                <Switch
                  checked={settings.allowOverbooking}
                  onCheckedChange={(checked) => setSettings({ ...settings, allowOverbooking: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg">
            <Save className="mr-2 h-4 w-4" />
            Save All Settings
          </Button>
        </div>
      </div>
    </Layout>
  );
}
