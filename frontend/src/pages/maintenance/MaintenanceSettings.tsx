import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import MaintenanceLayout from '@/components/maintenance/MaintenanceLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MaintenanceSettings() {
  const [settings, setSettings] = useState({
    oilChangeInterval: '5000',
    brakeInspectionInterval: '10000',
    tireRotationInterval: '8000',
    fullServiceInterval: '20000',
    lowStockAlert: '20',
    criticalStockAlert: '5',
  });

  const [issueCategories] = useState([
    'Engine',
    'Transmission',
    'Brakes',
    'Electrical',
    'Body',
    'Tires',
    'Suspension',
    'Cooling System',
  ]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post('/maintenance/settings', data);
    },
    onSuccess: () => {
      toast.success('Settings saved successfully');
    },
    onError: () => {
      toast.error('Failed to save settings');
    },
  });

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  return (
    <MaintenanceLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Maintenance Settings</h1>
            <p className="text-muted-foreground">Configure maintenance parameters</p>
          </div>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Service Intervals</CardTitle>
            <CardDescription>Define maintenance service intervals in kilometers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Oil Change Interval (km)</Label>
                <Input
                  type="number"
                  value={settings.oilChangeInterval}
                  onChange={(e) => setSettings({...settings, oilChangeInterval: e.target.value})}
                />
              </div>
              <div>
                <Label>Brake Inspection Interval (km)</Label>
                <Input
                  type="number"
                  value={settings.brakeInspectionInterval}
                  onChange={(e) => setSettings({...settings, brakeInspectionInterval: e.target.value})}
                />
              </div>
              <div>
                <Label>Tire Rotation Interval (km)</Label>
                <Input
                  type="number"
                  value={settings.tireRotationInterval}
                  onChange={(e) => setSettings({...settings, tireRotationInterval: e.target.value})}
                />
              </div>
              <div>
                <Label>Full Service Interval (km)</Label>
                <Input
                  type="number"
                  value={settings.fullServiceInterval}
                  onChange={(e) => setSettings({...settings, fullServiceInterval: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Issue Categories</CardTitle>
                <CardDescription>Manage maintenance issue categories</CardDescription>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {issueCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                  <span className="font-medium">{category}</span>
                  <div className="flex gap-2">
                    <Button>Edit</Button>
                    <Button>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Reorder Thresholds</CardTitle>
            <CardDescription>Set stock alert levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Low Stock Alert Level</Label>
                <Input
                  type="number"
                  value={settings.lowStockAlert}
                  onChange={(e) => setSettings({...settings, lowStockAlert: e.target.value})}
                />
                <p className="text-sm text-muted-foreground mt-1">Alert when stock falls below this level</p>
              </div>
              <div>
                <Label>Critical Stock Alert Level</Label>
                <Input
                  type="number"
                  value={settings.criticalStockAlert}
                  onChange={(e) => setSettings({...settings, criticalStockAlert: e.target.value})}
                />
                <p className="text-sm text-muted-foreground mt-1">Urgent alert when stock is critically low</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Priority Rules</CardTitle>
            <CardDescription>Define work order priority criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-red-600">Critical Priority</span>
                  <Button>Edit</Button>
                </div>
                <p className="text-sm text-muted-foreground">Safety issues, vehicle breakdown, unable to operate</p>
              </div>
              <div className="p-4 border rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-orange-600">High Priority</span>
                  <Button>Edit</Button>
                </div>
                <p className="text-sm text-muted-foreground">Performance issues, scheduled maintenance overdue</p>
              </div>
              <div className="p-4 border rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-yellow-600">Medium Priority</span>
                  <Button>Edit</Button>
                </div>
                <p className="text-sm text-muted-foreground">Minor issues, routine maintenance due soon</p>
              </div>
              <div className="p-4 border rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-blue-600">Low Priority</span>
                  <Button>Edit</Button>
                </div>
                <p className="text-sm text-muted-foreground">Cosmetic issues, preventive maintenance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} className="h-12 px-6" disabled={saveMutation.isPending}>
            <Save className="mr-2 h-5 w-5" />
            {saveMutation.isPending ? 'Saving...' : 'Save All Settings'}
          </Button>
        </div>
      </div>
    </MaintenanceLayout>
  );
}
