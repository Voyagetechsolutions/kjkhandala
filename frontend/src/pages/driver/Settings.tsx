import { useState } from 'react';
import DriverLayout from '@/components/driver/DriverLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { User, Lock, CreditCard, Moon, Wifi } from 'lucide-react';

export default function Settings() {
  const [darkMode, setDarkMode] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);

  const driverInfo = {
    name: 'John Driver',
    email: 'driver@kjkhandala.com',
    phone: '+267 71234567',
    licenseNumber: 'DL-12345',
    licenseExpiry: '2025-12-31',
    employeeId: 'EMP-001',
  };

  return (
    <DriverLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings & Profile</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <Input defaultValue={driverInfo.name} />
              </div>
              <div>
                <Label>Email</Label>
                <Input defaultValue={driverInfo.email} />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input defaultValue={driverInfo.phone} />
              </div>
              <div>
                <Label>Employee ID</Label>
                <Input defaultValue={driverInfo.employeeId} disabled />
              </div>
            </div>
            <Button>Update Profile</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              License Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>License Number</Label>
                <Input defaultValue={driverInfo.licenseNumber} disabled />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input defaultValue={driverInfo.licenseExpiry} disabled />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Contact HR to update license information
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Current Password</Label>
              <Input type="password" />
            </div>
            <div>
              <Label>New Password</Label>
              <Input type="password" />
            </div>
            <div>
              <Label>Confirm New Password</Label>
              <Input type="password" />
            </div>
            <Button>Change Password</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="h-5 w-5" />
                <div>
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Enable dark theme</p>
                </div>
              </div>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                <div>
                  <Label>Offline Mode</Label>
                  <p className="text-sm text-muted-foreground">Store data locally for low-network areas</p>
                </div>
              </div>
              <Switch checked={offlineMode} onCheckedChange={setOfflineMode} />
            </div>
          </CardContent>
        </Card>
      </div>
    </DriverLayout>
  );
}
