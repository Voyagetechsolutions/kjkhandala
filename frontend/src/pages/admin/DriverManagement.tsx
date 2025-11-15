import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import OperationsLayout from '@/components/operations/OperationsLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import DriverCard from '@/components/drivers/DriverCard';
import DriverForm from '@/components/drivers/DriverForm';
import DriverAssignments from '@/components/drivers/DriverAssignments';
import DriverPerformance from '@/components/drivers/DriverPerformance';

/**
 * Driver Management Page
 * Manage drivers, assignments, and performance tracking
 */
export default function DriverManagement() {
  const location = useLocation();
  const isOperationsRoute = location.pathname.startsWith('/operations');
  const Layout = isOperationsRoute ? OperationsLayout : AdminLayout;

  const [showDriverForm, setShowDriverForm] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const queryClient = useQueryClient();

  // Fetch all drivers
  const { data: driversData, isLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('full_name');
      if (error) throw error;
      return { drivers: data || [] };
    },
  });

  // Fetch driver assignments
  const { data: assignments } = useQuery({
    queryKey: ['driver-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch performance summary (fallback to empty for now)
  const { data: performance } = useQuery({
    queryKey: ['driver-performance'],
    queryFn: async () => {
      // For now, return empty array until performance tracking is implemented
      return [];
    },
  });

  const handleEditDriver = (driver: any) => {
    setSelectedDriver(driver);
    setShowDriverForm(true);
  };

  const handleCloseForm = () => {
    setShowDriverForm(false);
    setSelectedDriver(null);
  };

  // Calculate driver statistics
  const drivers = driversData?.drivers || [];
  const driverStats = {
    total: drivers.length,
    active: drivers.filter((d: any) => d.status === 'ACTIVE').length,
    onLeave: drivers.filter((d: any) => d.status === 'ON_LEAVE').length,
    suspended: drivers.filter((d: any) => d.status === 'SUSPENDED').length,
    avgRating: '4.5', // TODO: Implement rating system
  };

  // Check for license expiries
  const expiringLicenses = drivers.filter((d: any) => {
    if (!d.licenseExpiry) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(d.licenseExpiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  }) || [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Driver Management</h1>
            <p className="text-muted-foreground">Manage drivers, assignments, and performance</p>
          </div>
          <Button onClick={() => setShowDriverForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Driver
          </Button>
        </div>

        {/* Driver Statistics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{driverStats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <div className="h-3 w-3 rounded-full bg-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{driverStats.active}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On Leave</CardTitle>
              <Calendar className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{driverStats.onLeave}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspended</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{driverStats.suspended}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">⭐ {driverStats.avgRating}</div>
            </CardContent>
          </Card>
        </div>

        {/* License Expiry Alerts */}
        {expiringLicenses.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-orange-900">License Expiry Alerts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {expiringLicenses.map((driver: any) => (
                  <div key={driver.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div>
                      <p className="font-medium">{driver.firstName} {driver.lastName}</p>
                      <p className="text-sm text-muted-foreground">License: {driver.licenseNumber}</p>
                    </div>
                    <p className="text-sm text-orange-700 font-medium">
                      Expires: {new Date(driver.licenseExpiry).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="drivers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="drivers" className="gap-2">
              <Users className="h-4 w-4" />
              Drivers
            </TabsTrigger>
            <TabsTrigger value="assignments" className="gap-2">
              <Calendar className="h-4 w-4" />
              Assignments
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="drivers" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">Loading drivers...</div>
            ) : drivers && drivers.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {drivers.map((driver) => (
                  <DriverCard
                    key={driver.id}
                    driver={driver}
                    onEdit={handleEditDriver}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No drivers registered</p>
                  <Button onClick={() => setShowDriverForm(true)}>
                    Add Your First Driver
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <DriverAssignments assignments={assignments || []} drivers={drivers || []} />
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <DriverPerformance performance={performance || []} />
          </TabsContent>
        </Tabs>

        {/* Driver Form Dialog */}
        {showDriverForm && (
          <DriverForm
            driver={selectedDriver}
            onClose={handleCloseForm}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['drivers'] });
              handleCloseForm();
            }}
          />
        )}
      </div>
    </Layout>
  );
}
