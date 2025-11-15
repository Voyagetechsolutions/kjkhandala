import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation } from 'react-router-dom';
import { 
  Bus, 
  CheckCircle, 
  Wrench, 
  Calendar, 
  Clock, 
  Users, 
  DollarSign, 
  TrendingUp,
  AlertTriangle,
  Fuel,
  MapPin,
  BarChart3
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import OperationsLayout from '@/components/operations/OperationsLayout';
import RealTimeStatusBar from '@/components/dashboard/RealTimeStatusBar';
import LiveOperationsMap from '@/components/dashboard/LiveOperationsMap';
import AnalyticsCharts from '@/components/dashboard/AnalyticsCharts';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import UpcomingRenewals from '@/components/dashboard/UpcomingRenewals';
import QuickActionsToolbar from '@/components/dashboard/QuickActionsToolbar';
import KPIMetrics from '@/components/dashboard/KPIMetrics';
import DepartmentsSection from '@/components/dashboard/DepartmentsSection';

/**
 * Super Admin Dashboard - CEO Command Center
 * 
 * Provides comprehensive visibility and control over:
 * - Real-time operations monitoring
 * - Fleet and driver management
 * - Financial performance
 * - HR and staff oversight
 * - Maintenance tracking
 * - Analytics and reporting
 * 
 * All data is pulled from connected modules in real-time
 */
export default function SuperAdminDashboard() {
  const location = useLocation();
  
  // Determine which layout to use based on route
  const isOperationsRoute = location.pathname.startsWith('/operations');
  const Layout = isOperationsRoute ? OperationsLayout : AdminLayout;
  
  // Fetch real-time company-wide metrics
  const { data: companyMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['company-metrics'],
    queryFn: async () => {
      // Fetch all key metrics in parallel
      const [
        busesData,
        tripsData,
        bookingsData,
        revenueData,
        expensesData,
        driversData,
        maintenanceData,
        trackingData
      ] = await Promise.all([
        // Total buses
        supabase.from('buses').select('id, status'),
        
        // Today's trips
        supabase
          .from('trips')
          .select('id, departure_time')
          .gte('departure_time', new Date().toISOString().split('T')[0] + 'T00:00:00')
          .lte('departure_time', new Date().toISOString().split('T')[0] + 'T23:59:59'),
        
        // Bookings (today, week, month)
        supabase
          .from('bookings')
          .select('id, created_at, total_amount, status')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        
        // Revenue summary
        supabase
          .from('revenue_summary')
          .select('*')
          .order('date', { ascending: false })
          .limit(30),
        
        // Expenses
        supabase
          .from('expenses')
          .select('amount, category, date')
          .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        
        // Drivers
        supabase.from('drivers').select('id, status'),
        
        // Maintenance records
        supabase
          .from('maintenance_records')
          .select('id, status, bus_id')
          .in('status', ['scheduled', 'in_progress']),
        
        // GPS tracking (active buses)
        supabase
          .from('gps_tracking')
          .select('bus_id, timestamp')
          .gte('timestamp', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // Last 10 minutes
      ]);

      // Calculate metrics
      const buses = busesData.data || [];
      const trips = tripsData.data || [];
      const bookings = bookingsData.data || [];
      const revenue = revenueData.data || [];
      const expenses = expensesData.data || [];
      const drivers = driversData.data || [];
      const maintenance = maintenanceData.data || [];
      const tracking = trackingData.data || [];

      const today = new Date().toISOString().split('T')[0];
      const todayBookings = bookings.filter(b => b.created_at.startsWith(today));
      const thisMonthRevenue = revenue.reduce((sum, r) => sum + parseFloat(r.total_revenue || 0), 0);
      const thisMonthExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

      return {
        totalBuses: buses.length,
        activeBuses: new Set(tracking.map(t => t.bus_id)).size,
        busesInMaintenance: maintenance.length,
        tripsToday: trips.length,
        totalPassengersToday: todayBookings.reduce((sum, b) => sum + 1, 0),
        revenueToday: todayBookings.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0),
        revenueThisMonth: thisMonthRevenue,
        expensesThisMonth: thisMonthExpenses,
        profitMargin: thisMonthRevenue > 0 
          ? ((thisMonthRevenue - thisMonthExpenses) / thisMonthRevenue * 100).toFixed(2)
          : 0,
        activeDrivers: drivers.filter(d => d.status === 'active').length,
        totalDrivers: drivers.length,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch alerts and notifications
  const { data: alerts } = useQuery({
    queryKey: ['system-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch upcoming renewals
  const { data: renewals } = useQuery({
    queryKey: ['upcoming-renewals'],
    queryFn: async () => {
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];

      const [busRenewals, driverRenewals, maintenanceReminders] = await Promise.all([
        // Bus insurance and license renewals
        supabase
          .from('buses')
          .select('id, name, number_plate, insurance_expiry, license_expiry')
          .or(`insurance_expiry.lte.${thirtyDaysFromNow},license_expiry.lte.${thirtyDaysFromNow}`)
          .gte('insurance_expiry', today),
        
        // Driver license renewals
        supabase
          .from('drivers')
          .select('id, full_name, license_number, license_expiry')
          .lte('license_expiry', thirtyDaysFromNow)
          .gte('license_expiry', today),
        
        // Maintenance reminders
        supabase
          .from('maintenance_reminders')
          .select(`
            *,
            buses (name, number_plate)
          `)
          .eq('is_completed', false)
          .lte('due_date', thirtyDaysFromNow)
          .gte('due_date', today)
      ]);

      return {
        buses: busRenewals.data || [],
        drivers: driverRenewals.data || [],
        maintenance: maintenanceReminders.data || []
      };
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Command Center</h1>
            <p className="text-muted-foreground">Complete company oversight and control</p>
          </div>
          <QuickActionsToolbar />
        </div>

        {/* Real-Time Status Bar */}
        <RealTimeStatusBar 
          metrics={companyMetrics} 
          loading={metricsLoading} 
        />

        {/* Main Dashboard Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Operations Map (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live Operations Map */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Live Operations Map
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span>Active</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-orange-500" />
                      <span>Delayed</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <span>Breakdown</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-gray-400" />
                      <span>Idle</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <LiveOperationsMap />
              </CardContent>
            </Card>

            {/* Analytics Charts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsCharts />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Alerts & Info (1/3 width) */}
          <div className="space-y-6">
            {/* Alerts Panel */}
            <AlertsPanel alerts={alerts || []} />

            {/* Upcoming Renewals */}
            <UpcomingRenewals renewals={renewals} />

            {/* KPI Metrics */}
            <KPIMetrics metrics={companyMetrics} />
          </div>
        </div>

        {/* Departments Section */}
        <DepartmentsSection />
      </div>
    </Layout>
  );
}
