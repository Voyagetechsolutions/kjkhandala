import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Bus, Fuel, Wrench, Calendar, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import BusForm from '@/components/fleet/BusForm';
import FuelRecordForm from '@/components/fleet/FuelRecordForm';
import BusCard from '@/components/fleet/BusCard';
import FuelRecordsList from '@/components/fleet/FuelRecordsList';
import MaintenanceAlerts from '@/components/fleet/MaintenanceAlerts';

/**
 * Fleet Management Page
 * Comprehensive fleet management including buses, fuel tracking, and maintenance
 */
export default function FleetManagement() {
  const [showBusForm, setShowBusForm] = useState(false);
  const [showFuelForm, setShowFuelForm] = useState(false);
  const [selectedBus, setSelectedBus] = useState<any>(null);
  const queryClient = useQueryClient();

  // Fetch all buses with extended fleet data
  const { data: buses, isLoading: busesLoading } = useQuery({
    queryKey: ['fleet-buses'],
    queryFn: async () => {
      const response = await api.get('/buses');
      return response.data.data || [];
    },
  });

  // Fetch fuel records
  const { data: fuelRecords } = useQuery({
    queryKey: ['fuel-records'],
    queryFn: async () => {
      const response = await api.get('/fuel_records');
      return response.data.data || [];
    },
  });

  // Fetch maintenance reminders
  const { data: maintenanceReminders } = useQuery({
    queryKey: ['maintenance-reminders'],
    queryFn: async () => {
      const response = await api.get('/maintenance_reminders?upcoming=true');
      return response.data.data || [];
    },
  });

  const handleEditBus = (bus: any) => {
    setSelectedBus(bus);
    setShowBusForm(true);
  };

  const handleAddFuel = (bus: any) => {
    setSelectedBus(bus);
    setShowFuelForm(true);
  };

  const handleCloseForm = () => {
    setShowBusForm(false);
    setShowFuelForm(false);
    setSelectedBus(null);
  };

  // Calculate fleet statistics
  const fleetStats = {
    total: buses?.length || 0,
    active: buses?.filter((b: any) => b.status === 'ACTIVE').length || 0,
    maintenance: buses?.filter((b: any) => b.status === 'MAINTENANCE').length || 0,
    outOfService: buses?.filter((b: any) => b.status === 'RETIRED').length || 0,
    totalMileage: buses?.reduce((sum: number, b: any) => sum + (parseFloat(b.mileage) || 0), 0) || 0,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Fleet Management</h1>
            <p className="text-muted-foreground">Manage buses, fuel, and maintenance</p>
          </div>
          <Button onClick={() => setShowBusForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Bus
          </Button>
        </div>

        {/* Fleet Statistics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Buses</CardTitle>
              <Bus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fleetStats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <div className="h-3 w-3 rounded-full bg-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fleetStats.active}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Maintenance</CardTitle>
              <Wrench className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fleetStats.maintenance}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Service</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fleetStats.outOfService}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Mileage</CardTitle>
              <Fuel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fleetStats.totalMileage.toLocaleString()} km</div>
            </CardContent>
          </Card>
        </div>

        {/* Maintenance Alerts */}
        {maintenanceReminders && maintenanceReminders.length > 0 && (
          <MaintenanceAlerts reminders={maintenanceReminders} />
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="buses" className="space-y-4">
          <TabsList>
            <TabsTrigger value="buses" className="gap-2">
              <Bus className="h-4 w-4" />
              Buses
            </TabsTrigger>
            <TabsTrigger value="fuel" className="gap-2">
              <Fuel className="h-4 w-4" />
              Fuel Records
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buses" className="space-y-4">
            {busesLoading ? (
              <div className="text-center py-8">Loading buses...</div>
            ) : buses && buses.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {buses.map((bus) => (
                  <BusCard
                    key={bus.id}
                    bus={bus}
                    onEdit={handleEditBus}
                    onAddFuel={handleAddFuel}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Bus className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No buses in fleet</p>
                  <Button onClick={() => setShowBusForm(true)}>
                    Add Your First Bus
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="fuel" className="space-y-4">
            <FuelRecordsList records={fuelRecords || []} />
          </TabsContent>
        </Tabs>

        {/* Bus Form Dialog */}
        {showBusForm && (
          <BusForm
            bus={selectedBus}
            onClose={handleCloseForm}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['fleet-buses'] });
              handleCloseForm();
            }}
          />
        )}

        {/* Fuel Record Form Dialog */}
        {showFuelForm && selectedBus && (
          <FuelRecordForm
            bus={selectedBus}
            onClose={handleCloseForm}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['fuel-records'] });
              queryClient.invalidateQueries({ queryKey: ['fleet-buses'] });
              handleCloseForm();
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}
