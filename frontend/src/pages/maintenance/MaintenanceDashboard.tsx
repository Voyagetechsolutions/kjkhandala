import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import MaintenanceLayout from '@/components/maintenance/MaintenanceLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bus, 
  Wrench, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  TrendingUp,
  Calendar
} from 'lucide-react';

export default function MaintenanceDashboard() {
  const { user, userRoles, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : MaintenanceLayout;

  useEffect(() => {
    if (!loading && (!user || !userRoles?.includes('MAINTENANCE_MANAGER'))) {
      navigate('/');
      return;
    }
  }, [user, userRoles, loading, navigate]);

  // Fetch buses
  const { data: buses = [] } = useQuery({
    queryKey: ['buses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('buses').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch work orders
  const { data: workOrdersData = [] } = useQuery({
    queryKey: ['work-orders'],
    queryFn: async () => {
      const { data, error } = await supabase.from('work_orders').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch maintenance costs
  const { data: costsData = [] } = useQuery({
    queryKey: ['maintenance-costs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('maintenance_costs').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch maintenance schedules
  const { data: schedulesData = [] } = useQuery({
    queryKey: ['maintenance-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase.from('maintenance_schedules').select('*, bus:buses(*)');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch repairs
  const { data: repairsData = [] } = useQuery({
    queryKey: ['repairs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('repairs').select('*, bus:buses(*)');
      if (error) throw error;
      return data || [];
    },
  });

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!userRoles?.includes('MAINTENANCE_MANAGER')) return null;

  // Calculate fleet status
  const fleetStatus = {
    totalBuses: buses.length,
    active: buses.filter((b: any) => b.status === 'ACTIVE').length,
    inMaintenance: buses.filter((b: any) => b.status === 'MAINTENANCE').length,
    awaitingParts: workOrdersData.filter((wo: any) => wo.status === 'PENDING' && wo.priority === 'HIGH').length,
  };

  // Calculate work orders
  const workOrders = {
    pending: workOrdersData.filter((wo: any) => wo.status === 'PENDING').length,
    inProgress: workOrdersData.filter((wo: any) => wo.status === 'IN_PROGRESS').length,
    completed: workOrdersData.filter((wo: any) => wo.status === 'COMPLETED').length,
  };

  // Calculate maintenance costs
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = new Date().toISOString().slice(0, 7);
  const todayCosts = costsData.filter((c: any) => c.date?.startsWith(today));
  const monthCosts = costsData.filter((c: any) => c.date?.startsWith(thisMonth));
  
  const maintenanceCosts = {
    today: todayCosts.reduce((sum: number, c: any) => sum + (parseFloat(c.amount) || 0), 0),
    month: monthCosts.reduce((sum: number, c: any) => sum + (parseFloat(c.amount) || 0), 0),
    perVehicle: buses.length > 0 ? monthCosts.reduce((sum: number, c: any) => sum + (parseFloat(c.amount) || 0), 0) / buses.length : 0,
  };

  // Get alerts (overdue schedules)
  const alerts = schedulesData
    .filter((s: any) => new Date(s.nextServiceDate) < new Date())
    .slice(0, 3)
    .map((s: any) => ({
      id: s.id,
      bus: buses.find((b: any) => b.id === s.busId)?.registrationNumber || 'Unknown',
      issue: `${s.serviceType} overdue`,
      priority: 'high',
      days: Math.floor((new Date().getTime() - new Date(s.nextServiceDate).getTime()) / (1000 * 60 * 60 * 24)),
    }));

  // Get recent repairs (breakdowns)
  const recentBreakdowns = repairsData
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 2)
    .map((r: any) => ({
      id: r.id,
      bus: buses.find((b: any) => b.id === r.busId)?.registrationNumber || 'Unknown',
      issue: r.description,
      driver: r.mechanicId || 'N/A',
      date: new Date(r.date).toISOString().split('T')[0],
    }));

  // Calculate top issues
  const issueGroups = repairsData.reduce((acc: any, r: any) => {
    const issue = r.description?.toLowerCase() || 'other';
    if (!acc[issue]) acc[issue] = { count: 0, cost: 0 };
    acc[issue].count++;
    acc[issue].cost += (parseFloat(r.partsCost) || 0) + (parseFloat(r.laborCost) || 0);
    return acc;
  }, {});

  const topIssues = Object.entries(issueGroups)
    .map(([issue, data]: any) => ({ issue, count: data.count, cost: data.cost }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Get upcoming services
  const upcomingServices = schedulesData
    .filter((s: any) => new Date(s.nextServiceDate) >= new Date())
    .sort((a: any, b: any) => new Date(a.nextServiceDate).getTime() - new Date(b.nextServiceDate).getTime())
    .slice(0, 3)
    .map((s: any) => {
      const bus = buses.find((b: any) => b.id === s.busId);
      return {
        bus: bus?.registrationNumber || 'Unknown',
        service: s.serviceType,
        dueDate: new Date(s.nextServiceDate).toISOString().split('T')[0],
        mileage: `${bus?.mileage?.toLocaleString() || 0} km`,
      };
    });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Maintenance Dashboard</h1>
          <p className="text-muted-foreground">Fleet health and workshop management overview</p>
        </div>

        {/* Fleet Status */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Buses</CardTitle>
              <Bus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fleetStatus.totalBuses}</div>
              <p className="text-xs text-muted-foreground">Fleet size</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fleetStatus.active}</div>
              <p className="text-xs text-muted-foreground">Operational</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Maintenance</CardTitle>
              <Wrench className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fleetStatus.inMaintenance}</div>
              <p className="text-xs text-muted-foreground">Under repair</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Awaiting Parts</CardTitle>
              <Clock className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fleetStatus.awaitingParts}</div>
              <p className="text-xs text-muted-foreground">Parts on order</p>
            </CardContent>
          </Card>
        </div>

        {/* Work Orders & Costs */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Work Orders</CardTitle>
              <CardDescription>Current maintenance jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pending</span>
                  <Badge className="bg-yellow-500">{workOrders.pending}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">In Progress</span>
                  <Badge className="bg-blue-500">{workOrders.inProgress}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Completed (This Month)</span>
                  <Badge className="bg-green-500">{workOrders.completed}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Maintenance Costs
              </CardTitle>
              <CardDescription>Expense summary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Today</span>
                  <span className="font-bold">P {maintenanceCosts.today.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">This Month</span>
                  <span className="font-bold">P {maintenanceCosts.month.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Per Vehicle (Avg)</span>
                  <span className="font-bold">P {maintenanceCosts.perVehicle.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Maintenance Alerts
            </CardTitle>
            <CardDescription>Critical notifications requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className={`h-5 w-5 ${alert.priority === 'high' ? 'text-red-500' : 'text-yellow-500'}`} />
                    <div>
                      <div className="font-medium">{alert.bus}</div>
                      <div className="text-sm text-muted-foreground">{alert.issue}</div>
                    </div>
                  </div>
                  <Badge className={alert.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500'}>
                    {alert.days} days
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Breakdowns */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Breakdowns</CardTitle>
            <CardDescription>Latest reported issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentBreakdowns.map((breakdown) => (
                <div key={breakdown.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{breakdown.bus} - {breakdown.issue}</div>
                    <div className="text-sm text-muted-foreground">
                      Driver: {breakdown.driver} | {breakdown.date}
                    </div>
                  </div>
                  <Badge>View Details</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Recurring Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Recurring Issues
            </CardTitle>
            <CardDescription>Most frequent maintenance problems</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topIssues.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{item.issue}</div>
                    <div className="text-sm text-muted-foreground">{item.count} occurrences</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-600">P {item.cost.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Total cost</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Next Service Due Soon
            </CardTitle>
            <CardDescription>Scheduled maintenance coming up</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingServices.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{service.bus} - {service.service}</div>
                    <div className="text-sm text-muted-foreground">{service.mileage}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{service.dueDate}</div>
                    <div className="text-xs text-muted-foreground">Due date</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
