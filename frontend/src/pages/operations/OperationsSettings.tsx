import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import OperationsLayout from '@/components/operations/OperationsLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function OperationsSettings() {
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState({
    // Route Configurations
    defaultFareMultiplier: 1.0,
    maxRouteDistance: 1000,
    minRouteDistance: 50,
    
    // Trip Templates
    defaultDepartureTime: '06:00',
    defaultTripDuration: 360,
    minTripInterval: 30,
    
    // Fare Configurations
    baseFarePerKm: 0.50,
    peakHourMultiplier: 1.5,
    weekendMultiplier: 1.2,
    childFareDiscount: 0.5,
    seniorFareDiscount: 0.3,
    
    // Boarding Cut-off Times
    boardingCutoffMinutes: 15,
    lateBoardingAllowed: true,
    lateBoardingFee: 50,
    
    // Delay Thresholds
    minorDelayMinutes: 15,
    moderateDelayMinutes: 30,
    criticalDelayMinutes: 60,
    autoNotifyDelayMinutes: 20,
    
    // Safety Rules
    maxDrivingHoursPerDay: 10,
    mandatoryBreakMinutes: 30,
    maxSpeedLimit: 120,
    speedAlertThreshold: 110,
    
    // Driver Working Hours
    minRestHoursBetweenShifts: 8,
    maxConsecutiveDays: 6,
    overtimeThresholdHours: 8,
    nightShiftStartHour: 22,
    nightShiftEndHour: 6,
    
    // Notifications
    enableSMSNotifications: true,
    enableEmailNotifications: true,
    enablePushNotifications: true,
    
    // Emergency Settings
    emergencyContactNumber: '+267 71 234 567',
    emergencyResponseTime: 15,
    autoDispatchRescueBus: true,
  });

  // Fetch settings
  const { data: fetchedSettings, isLoading } = useQuery({
    queryKey: ['operations-settings'],
    queryFn: async () => {
      const response = await api.get('/operations/settings');
      const data = response.data?.settings || {};
      if (data && Object.keys(data).length > 0) {
        setSettings((prev) => ({ ...prev, ...data }));
      }
      return data;
    },
  });

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post('/operations/settings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations-settings'] });
      toast.success('Settings saved successfully');
    },
    onError: () => {
      toast.error('Failed to save settings');
    },
  });

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  const handleChange = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value });
  };

  return (
    <OperationsLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Operations Settings</h1>
            <p className="text-muted-foreground">Configure operational parameters and rules</p>
          </div>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>

        {/* Route Configurations */}
        <Card>
          <CardHeader>
            <CardTitle>Route Configurations</CardTitle>
            <CardDescription>Default settings for route management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Default Fare Multiplier</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={settings.defaultFareMultiplier}
                  onChange={(e) => handleChange('defaultFareMultiplier', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label>Max Route Distance (km)</Label>
                <Input
                  type="number"
                  value={settings.maxRouteDistance}
                  onChange={(e) => handleChange('maxRouteDistance', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label>Min Route Distance (km)</Label>
                <Input
                  type="number"
                  value={settings.minRouteDistance}
                  onChange={(e) => handleChange('minRouteDistance', parseInt(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trip Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Trip Templates</CardTitle>
            <CardDescription>Default trip scheduling parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Default Departure Time</Label>
                <Input
                  type="time"
                  value={settings.defaultDepartureTime}
                  onChange={(e) => handleChange('defaultDepartureTime', e.target.value)}
                />
              </div>
              <div>
                <Label>Default Trip Duration (min)</Label>
                <Input
                  type="number"
                  value={settings.defaultTripDuration}
                  onChange={(e) => handleChange('defaultTripDuration', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label>Min Trip Interval (min)</Label>
                <Input
                  type="number"
                  value={settings.minTripInterval}
                  onChange={(e) => handleChange('minTripInterval', parseInt(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fare Configurations */}
        <Card>
          <CardHeader>
            <CardTitle>Fare Configurations</CardTitle>
            <CardDescription>Pricing rules and multipliers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Base Fare per KM (P)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={settings.baseFarePerKm}
                  onChange={(e) => handleChange('baseFarePerKm', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label>Peak Hour Multiplier</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={settings.peakHourMultiplier}
                  onChange={(e) => handleChange('peakHourMultiplier', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label>Weekend Multiplier</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={settings.weekendMultiplier}
                  onChange={(e) => handleChange('weekendMultiplier', parseFloat(e.target.value))}
                />
              </div>
            </div>
            <Separator />
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Child Fare Discount (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={settings.childFareDiscount * 100}
                  onChange={(e) => handleChange('childFareDiscount', parseFloat(e.target.value) / 100)}
                />
              </div>
              <div>
                <Label>Senior Fare Discount (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={settings.seniorFareDiscount * 100}
                  onChange={(e) => handleChange('seniorFareDiscount', parseFloat(e.target.value) / 100)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Boarding Cut-off Times */}
        <Card>
          <CardHeader>
            <CardTitle>Boarding Cut-off Times</CardTitle>
            <CardDescription>Boarding window and late boarding rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Boarding Cut-off (minutes before departure)</Label>
                <Input
                  type="number"
                  value={settings.boardingCutoffMinutes}
                  onChange={(e) => handleChange('boardingCutoffMinutes', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label>Late Boarding Fee (P)</Label>
                <Input
                  type="number"
                  value={settings.lateBoardingFee}
                  onChange={(e) => handleChange('lateBoardingFee', parseFloat(e.target.value))}
                />
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Switch
                  checked={settings.lateBoardingAllowed}
                  onCheckedChange={(checked) => handleChange('lateBoardingAllowed', checked)}
                />
                <Label>Allow Late Boarding</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delay Thresholds */}
        <Card>
          <CardHeader>
            <CardTitle>Delay Thresholds</CardTitle>
            <CardDescription>Define delay severity levels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label>Minor Delay (min)</Label>
                <Input
                  type="number"
                  value={settings.minorDelayMinutes}
                  onChange={(e) => handleChange('minorDelayMinutes', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label>Moderate Delay (min)</Label>
                <Input
                  type="number"
                  value={settings.moderateDelayMinutes}
                  onChange={(e) => handleChange('moderateDelayMinutes', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label>Critical Delay (min)</Label>
                <Input
                  type="number"
                  value={settings.criticalDelayMinutes}
                  onChange={(e) => handleChange('criticalDelayMinutes', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label>Auto-Notify After (min)</Label>
                <Input
                  type="number"
                  value={settings.autoNotifyDelayMinutes}
                  onChange={(e) => handleChange('autoNotifyDelayMinutes', parseInt(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Safety Rules */}
        <Card>
          <CardHeader>
            <CardTitle>Safety Rules</CardTitle>
            <CardDescription>Driver safety and compliance settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label>Max Driving Hours/Day</Label>
                <Input
                  type="number"
                  value={settings.maxDrivingHoursPerDay}
                  onChange={(e) => handleChange('maxDrivingHoursPerDay', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label>Mandatory Break (min)</Label>
                <Input
                  type="number"
                  value={settings.mandatoryBreakMinutes}
                  onChange={(e) => handleChange('mandatoryBreakMinutes', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label>Max Speed Limit (km/h)</Label>
                <Input
                  type="number"
                  value={settings.maxSpeedLimit}
                  onChange={(e) => handleChange('maxSpeedLimit', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label>Speed Alert Threshold (km/h)</Label>
                <Input
                  type="number"
                  value={settings.speedAlertThreshold}
                  onChange={(e) => handleChange('speedAlertThreshold', parseInt(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Driver Working Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Driver Working Hours</CardTitle>
            <CardDescription>Work schedule and rest period rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Min Rest Hours Between Shifts</Label>
                <Input
                  type="number"
                  value={settings.minRestHoursBetweenShifts}
                  onChange={(e) => handleChange('minRestHoursBetweenShifts', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label>Max Consecutive Days</Label>
                <Input
                  type="number"
                  value={settings.maxConsecutiveDays}
                  onChange={(e) => handleChange('maxConsecutiveDays', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label>Overtime Threshold (hours)</Label>
                <Input
                  type="number"
                  value={settings.overtimeThresholdHours}
                  onChange={(e) => handleChange('overtimeThresholdHours', parseInt(e.target.value))}
                />
              </div>
            </div>
            <Separator />
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Night Shift Start Hour</Label>
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={settings.nightShiftStartHour}
                  onChange={(e) => handleChange('nightShiftStartHour', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label>Night Shift End Hour</Label>
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={settings.nightShiftEndHour}
                  onChange={(e) => handleChange('nightShiftEndHour', parseInt(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>Configure notification channels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send SMS alerts for critical events</p>
                </div>
                <Switch
                  checked={settings.enableSMSNotifications}
                  onCheckedChange={(checked) => handleChange('enableSMSNotifications', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send email updates and reports</p>
                </div>
                <Switch
                  checked={settings.enableEmailNotifications}
                  onCheckedChange={(checked) => handleChange('enableEmailNotifications', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send push notifications to mobile apps</p>
                </div>
                <Switch
                  checked={settings.enablePushNotifications}
                  onCheckedChange={(checked) => handleChange('enablePushNotifications', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Settings */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertCircle className="h-5 w-5" />
              Emergency Settings
            </CardTitle>
            <CardDescription>Critical emergency response configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Emergency Contact Number</Label>
                <Input
                  type="tel"
                  value={settings.emergencyContactNumber}
                  onChange={(e) => handleChange('emergencyContactNumber', e.target.value)}
                />
              </div>
              <div>
                <Label>Emergency Response Time (min)</Label>
                <Input
                  type="number"
                  value={settings.emergencyResponseTime}
                  onChange={(e) => handleChange('emergencyResponseTime', parseInt(e.target.value))}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.autoDispatchRescueBus}
                onCheckedChange={(checked) => handleChange('autoDispatchRescueBus', checked)}
              />
              <Label>Auto-Dispatch Rescue Bus on Breakdown</Label>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saveMutation.isPending} size="lg">
            <Save className="mr-2 h-4 w-4" />
            {saveMutation.isPending ? 'Saving Settings...' : 'Save All Settings'}
          </Button>
        </div>
      </div>
    </OperationsLayout>
  );
}
