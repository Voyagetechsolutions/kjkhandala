import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import OperationsLayout from '@/components/operations/OperationsLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bus, 
  Activity, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Wrench
} from 'lucide-react';

export default function OperationsDashboard() {
  const { user, userRoles, loading } = useAuth();
  const navigate = useNavigate();

  // Call useQuery hook unconditionally (before any returns)
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['operations-dashboard'],
    queryFn: async () => {
      const today = new Date();
      const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();
      
      // Fetch trips summary
      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select('id, status, scheduled_departure')
        .gte('scheduled_departure', todayStart)
        .lte('scheduled_departure', todayEnd);
      
      if (tripsError) throw tripsError;
      
      const tripsSummary = {
        total: trips?.length || 0,
        departed: trips?.filter(t => t.status === 'DEPARTED').length || 0,
        delayed: trips?.filter(t => t.status === 'DELAYED').length || 0,
        cancelled: trips?.filter(t => t.status === 'CANCELLED').length || 0,
        arrived: trips?.filter(t => t.status === 'COMPLETED').length || 0,
      };
      
      // Fetch fleet status
      const { data: buses, error: busesError } = await supabase
        .from('buses')
        .select('id, status');
      
      if (busesError) throw busesError;
      
      const fleetStatus = {
        active: buses?.filter(b => b.status === 'active').length || 0,
        inMaintenance: buses?.filter(b => b.status === 'maintenance').length || 0,
        parked: buses?.filter(b => b.status === 'inactive' || b.status === 'parked').length || 0,
        offRoute: 0,
      };
      
      // Fetch driver status
      const { data: drivers, error: driversError } = await supabase
        .from('drivers')
        .select('id, status');
      
      if (driversError) throw driversError;
      
      const driverStatus = {
        onDuty: drivers?.filter(d => d.status === 'active').length || 0,
        offDuty: drivers?.filter(d => d.status === 'inactive').length || 0,
        requireReplacement: 0,
      };
      
      // Fetch revenue snapshot
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('total_amount, payment_status, created_at')
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd);
      
      if (bookingsError) throw bookingsError;
      
      const revenueSnapshot = {
        ticketsSold: bookings?.filter(b => b.payment_status === 'paid').length || 0,
        revenueCollected: bookings?.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + Number(b.total_amount || 0), 0) || 0,
        unpaidReserved: bookings?.filter(b => b.payment_status !== 'paid').reduce((sum, b) => sum + Number(b.total_amount || 0), 0) || 0,
      };
      
      // Generate alerts
      const alerts: any[] = [];
      if (tripsSummary.delayed > 0) {
        alerts.push({ priority: 'high', message: `${tripsSummary.delayed} trip(s) are delayed` });
      }
      if (fleetStatus.inMaintenance > 5) {
        alerts.push({ priority: 'medium', message: `${fleetStatus.inMaintenance} buses in maintenance` });
      }
      
      return { tripsSummary, fleetStatus, driverStatus, revenueSnapshot, alerts };
    },
    refetchInterval: 30000,
    enabled: !loading && userRoles?.includes('OPERATIONS_MANAGER'),
  });

  useEffect(() => {
    if (!loading && (!user || !userRoles?.includes('OPERATIONS_MANAGER'))) {
      navigate('/');
      return;
    }
  }, [user, userRoles, loading, navigate]);

  // Early returns after all hooks
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!userRoles?.includes('OPERATIONS_MANAGER')) return null;

  const tripsSummary = dashboard?.tripsSummary || {};
  const fleetStatus = dashboard?.fleetStatus || {};
  const driverStatus = dashboard?.driverStatus || {};
  const revenueSnapshot = dashboard?.revenueSnapshot || {};
  const alerts = dashboard?.alerts || [];

  if (isLoading) {
    return (
      <OperationsLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </OperationsLayout>
    );
  }

  return (
    <OperationsLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Control Center</h1>
          <p className="text-muted-foreground">Real-time operations monitoring and management</p>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert: any, index: number) => (
              <div
                key={index}
                className={`flex items-center gap-2 p-3 rounded-lg border ${
                  alert.priority === 'high'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <AlertCircle
                  className={`h-5 w-5 ${
                    alert.priority === 'high' ? 'text-red-600' : 'text-yellow-600'
                  }`}
                />
                <span className="text-sm font-medium">{alert.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Today's Trips Summary */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Today's Trips Summary</h2>
          <div className="grid md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
                <Activity className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tripsSummary.total || 0}</div>
                <p className="text-xs text-muted-foreground">Scheduled for today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Departed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tripsSummary.departed || 0}</div>
                <p className="text-xs text-muted-foreground">Currently on route</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delayed</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tripsSummary.delayed || 0}</div>
                <p className="text-xs text-muted-foreground">Behind schedule</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tripsSummary.cancelled || 0}</div>
                <p className="text-xs text-muted-foreground">Not operating</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Arrived</CardTitle>
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tripsSummary.arrived || 0}</div>
                <p className="text-xs text-muted-foreground">Completed trips</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Fleet & Driver Status */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Fleet Status */}
          <Card>
            <CardHeader>
              <CardTitle>Fleet Status Overview</CardTitle>
              <CardDescription>Current bus deployment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bus className="h-5 w-5 text-green-600" />
                    <span>Active Buses</span>
                  </div>
                  <Badge variant="default">{fleetStatus.active || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-orange-600" />
                    <span>In Maintenance</span>
                  </div>
                  <Badge variant="secondary">{fleetStatus.inMaintenance || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bus className="h-5 w-5 text-gray-600" />
                    <span>Parked</span>
                  </div>
                  <Badge variant="outline">{fleetStatus.parked || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span>Off-Route Alerts</span>
                  </div>
                  <Badge variant="destructive">{fleetStatus.offRoute || 0}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Driver Status */}
          <Card>
            <CardHeader>
              <CardTitle>Driver Status</CardTitle>
              <CardDescription>Current driver availability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    <span>Drivers on Duty</span>
                  </div>
                  <Badge variant="default">{driverStatus.onDuty || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-600" />
                    <span>Drivers Off Duty</span>
                  </div>
                  <Badge variant="outline">{driverStatus.offDuty || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span>Require Replacement</span>
                  </div>
                  <Badge variant="secondary">{driverStatus.requireReplacement || 0}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Snapshot */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Snapshot (Today)</CardTitle>
            <CardDescription>Daily financial overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">Tickets Sold</span>
                </div>
                <div className="text-2xl font-bold">{revenueSnapshot.ticketsSold || 0}</div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Revenue Collected</span>
                </div>
                <div className="text-2xl font-bold">
                  P {(revenueSnapshot.revenueCollected || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium">Unpaid/Reserved</span>
                </div>
                <div className="text-2xl font-bold">
                  P {(revenueSnapshot.unpaidReserved || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
            <CardDescription>Navigate to key operations modules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                onClick={() => navigate('/operations/trips')}
                className="p-4 border rounded-lg hover:bg-accent transition-colors text-left"
              >
                <Activity className="h-6 w-6 mb-2 text-blue-600" />
                <div className="font-medium">Trip Management</div>
                <div className="text-sm text-muted-foreground">Monitor & manage trips</div>
              </button>
              <button 
                onClick={() => navigate('/operations/fleet')}
                className="p-4 border rounded-lg hover:bg-accent transition-colors text-left"
              >
                <Bus className="h-6 w-6 mb-2 text-green-600" />
                <div className="font-medium">Fleet Operations</div>
                <div className="text-sm text-muted-foreground">Manage bus fleet</div>
              </button>
              <button 
                onClick={() => navigate('/operations/drivers')}
                className="p-4 border rounded-lg hover:bg-accent transition-colors text-left"
              >
                <Users className="h-6 w-6 mb-2 text-purple-600" />
                <div className="font-medium">Driver Operations</div>
                <div className="text-sm text-muted-foreground">Driver assignments</div>
              </button>
              <button 
                onClick={() => navigate('/operations/incidents')}
                className="p-4 border rounded-lg hover:bg-accent transition-colors text-left"
              >
                <AlertCircle className="h-6 w-6 mb-2 text-red-600" />
                <div className="font-medium">Incidents</div>
                <div className="text-sm text-muted-foreground">Handle incidents</div>
              </button>
            </div>
            
            {/* Additional Quick Actions */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <button 
                onClick={() => {
                  // Navigate to trips page first, then they can select a trip to assign
                  navigate('/operations/trips');
                }}
                className="p-4 border rounded-lg hover:bg-accent transition-colors text-left border-green-200 bg-green-50/50"
              >
                <Bus className="h-6 w-6 mb-2 text-green-600" />
                <div className="font-medium">Assign Bus</div>
                <div className="text-sm text-muted-foreground">Smart bus assignment</div>
              </button>
              <button 
                onClick={() => navigate('/operations/passenger-manifest')}
                className="p-4 border rounded-lg hover:bg-accent transition-colors text-left"
              >
                <Users className="h-6 w-6 mb-2 text-indigo-600" />
                <div className="font-medium">Manifests</div>
                <div className="text-sm text-muted-foreground">Passenger lists</div>
              </button>
              <button 
                onClick={() => navigate('/operations/driver-shifts')}
                className="p-4 border rounded-lg hover:bg-accent transition-colors text-left"
              >
                <Clock className="h-6 w-6 mb-2 text-orange-600" />
                <div className="font-medium">Driver Shifts</div>
                <div className="text-sm text-muted-foreground">Shift calendar</div>
              </button>
              <button 
                onClick={() => navigate('/operations/live-tracking')}
                className="p-4 border rounded-lg hover:bg-accent transition-colors text-left"
              >
                <TrendingUp className="h-6 w-6 mb-2 text-cyan-600" />
                <div className="font-medium">Live Tracking</div>
                <div className="text-sm text-muted-foreground">Real-time GPS</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </OperationsLayout>
  );
}
