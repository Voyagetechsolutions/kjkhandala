import AdminLayout from '@/components/admin/AdminLayout';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Wrench,
  Calendar,
  UserCheck,
  Package,
  MapPin,
  BarChart3
} from 'lucide-react';

export default function CommandCenter() {
  const { user, userRoles, loading } = useAuth();
  const navigate = useNavigate();

  // Date helpers
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  // Fetch buses
  const { data: buses = [] } = useQuery({
    queryKey: ['command-buses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('buses').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch trips today
  const { data: tripsToday = [] } = useQuery({
    queryKey: ['command-trips-today'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .gte('scheduled_departure', `${today}T00:00:00`)
        .lte('scheduled_departure', `${today}T23:59:59`);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch bookings today
  const { data: bookingsToday = [] } = useQuery({
    queryKey: ['command-bookings-today'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .neq('booking_status', 'cancelled');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch bookings this month
  const { data: bookingsMonth = [] } = useQuery({
    queryKey: ['command-bookings-month'],
    queryFn: async () => {
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .gte('created_at', `${firstDayOfMonth}T00:00:00`)
        .lte('created_at', `${lastDay}T23:59:59`)
        .neq('booking_status', 'cancelled');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch expenses this month
  const { data: expensesMonth = [] } = useQuery({
    queryKey: ['command-expenses-month'],
    queryFn: async () => {
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .gte('expense_date', firstDayOfMonth)
        .lte('expense_date', lastDay);
      if (error) {
        console.warn('Expenses query error:', error);
        return [];
      }
      return data || [];
    },
  });

  // Fetch employees from multiple sources
  const { data: employeesData = [] } = useQuery({
    queryKey: ['command-employees'],
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: profilesData = [] } = useQuery({
    queryKey: ['command-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      if (error) {
        console.warn('Profiles query error:', error);
        return [];
      }
      // Filter out passengers on client side
      return (data || []).filter((p: any) => p.role !== 'PASSENGER');
    },
  });

  const { data: driversData = [] } = useQuery({
    queryKey: ['command-drivers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('drivers').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch attendance today
  const { data: attendanceToday = [] } = useQuery({
    queryKey: ['command-attendance-today'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', today);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch maintenance schedule (work_orders table)
  const { data: maintenanceSchedule = [] } = useQuery({
    queryKey: ['command-maintenance-schedule'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_orders')
        .select('*');
      if (error) {
        console.warn('Maintenance schedule query error:', error);
        return [];
      }
      return data || [];
    },
  });

  // Fetch payroll this month
  const { data: payrollMonth = [] } = useQuery({
    queryKey: ['command-payroll-month'],
    queryFn: async () => {
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('payroll')
        .select('*')
        .gte('period_start', firstDayOfMonth)
        .lte('period_end', lastDay);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch maintenance records this month
  const { data: maintenanceRecordsMonth = [] } = useQuery({
    queryKey: ['command-maintenance-records-month'],
    queryFn: async () => {
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('maintenance_records')
        .select('*')
        .gte('performed_at', `${firstDayOfMonth}T00:00:00`)
        .lte('performed_at', `${lastDay}T23:59:59`);
      if (error) {
        console.warn('Maintenance records query error:', error);
        return [];
      }
      return data || [];
    },
  });

  // Fetch fuel logs this month
  const { data: fuelLogsMonth = [] } = useQuery({
    queryKey: ['command-fuel-logs-month'],
    queryFn: async () => {
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('fuel_logs')
        .select('*')
        .gte('filled_at', `${firstDayOfMonth}T00:00:00`)
        .lte('filled_at', `${lastDay}T23:59:59`);
      if (error) {
        console.warn('Fuel logs query error:', error);
        return [];
      }
      return data || [];
    },
  });

  // Combine employees from all sources
  const totalEmployees = React.useMemo(() => {
    const allEmployees = new Map();
    employeesData.forEach((emp: any) => allEmployees.set(emp.id, emp));
    profilesData.forEach((profile: any) => {
      if (!allEmployees.has(profile.id)) allEmployees.set(profile.id, profile);
    });
    driversData.forEach((driver: any) => {
      if (!allEmployees.has(driver.id)) allEmployees.set(driver.id, driver);
    });
    return Array.from(allEmployees.values());
  }, [employeesData, profilesData, driversData]);

  const isLoading = false;

  // Check authentication and authorization
  useEffect(() => {
    if (!loading && !user) {
      console.log('CommandCenter: No user found, redirecting to auth');
      navigate('/auth');
      return;
    }

    if (!loading && user && userRoles && userRoles.length > 0) {
      console.log('CommandCenter: Checking access for roles:', userRoles);
      
      const hasAccess = userRoles.some((role: any) => {
        const roleName = typeof role === 'string' ? role : role.role;
        const normalizedRole = roleName?.toUpperCase();
        
        // Allow super_admin, admin, and operations roles
        const allowedRoles = [
          'SUPER_ADMIN', 
          'ADMIN', 
          'OPERATIONS_MANAGER', 
          'OPERATIONS_STAFF',
          'SUPER ADMIN'  // Handle space variant
        ];
        
        return allowedRoles.includes(normalizedRole);
      });
      
      console.log('CommandCenter: Has access:', hasAccess);
      
      if (!hasAccess) {
        console.log('CommandCenter: Access denied, redirecting to home');
        navigate('/');
      }
    }
  }, [user, userRoles, loading, navigate]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return null;
  }

  // Calculate comprehensive stats
  
  // Active buses = buses assigned to active trips
  const activeBusIds = new Set(
    tripsToday
      .filter((t: any) => t.status === 'BOARDING' || t.status === 'DEPARTED')
      .map((t: any) => t.bus_id)
      .filter(Boolean)
  );
  
  // Maintenance due = scheduled within 15 days
  const fifteenDaysFromNow = new Date();
  fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15);
  const maintenanceDue = maintenanceSchedule.filter((m: any) => {
    if (!m.scheduled_date) return false;
    const schedDate = new Date(m.scheduled_date);
    return schedDate <= fifteenDaysFromNow && m.status !== 'completed';
  }).length;
  
  // Completed trips = COMPLETED status OR eta passed by 30+ mins
  const now30MinsAgo = new Date(Date.now() - 30 * 60 * 1000);
  const completedTrips = tripsToday.filter((t: any) => {
    if (t.status === 'COMPLETED') return true;
    if (t.estimated_arrival) {
      const eta = new Date(t.estimated_arrival);
      return eta < now30MinsAgo;
    }
    return false;
  }).length;
  
  // Total expenses = expenses + payroll + maintenance + fuel
  const totalExpensesMonth = 
    expensesMonth.reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0) +
    payrollMonth.reduce((sum: number, p: any) => sum + parseFloat(p.net_salary || 0), 0) +
    maintenanceRecordsMonth.reduce((sum: number, m: any) => sum + parseFloat(m.cost || 0), 0) +
    fuelLogsMonth.reduce((sum: number, f: any) => sum + parseFloat(f.total_cost || 0), 0);
  
  // Revenue this month (total bookings)
  const totalRevenueMonth = bookingsMonth
    .filter((b: any) => b.payment_status === 'paid')
    .reduce((sum: number, b: any) => sum + parseFloat(b.total_amount || 0), 0);
  
  // Net revenue = revenue - expenses
  const netRevenueMonth = totalRevenueMonth - totalExpensesMonth;
  
  // Active employees = not on leave
  const activeEmployees = totalEmployees.filter((e: any) => {
    const status = e.employment_status || e.status;
    const isActive = status === 'active' || status === 'ACTIVE';
    // TODO: Check leave_requests table for active leaves
    return isActive;
  }).length;
  
  // Attendance percentage
  const attendancePercentage = totalEmployees.length > 0
    ? Math.round((attendanceToday.filter((a: any) => a.check_in).length / totalEmployees.length) * 100)
    : 0;
  
  const stats = {
    // Buses
    totalBuses: buses.length,
    activeBuses: activeBusIds.size,
    inMaintenance: buses.filter((b: any) => b.status === 'maintenance').length,
    maintenanceDue,
    
    // Trips
    tripsToday: tripsToday.length,
    activeTrips: tripsToday.filter((t: any) => 
      t.status === 'BOARDING' || t.status === 'DEPARTED'
    ).length,
    completedTrips,
    delayedTrips: tripsToday.filter((t: any) => t.status === 'DELAYED').length,
    
    // Passengers & Revenue
    passengersToday: bookingsToday.length, // Total number of bookings
    revenueToday: bookingsToday
      .reduce((sum: number, b: any) => sum + parseFloat(b.total_amount || 0), 0),
    revenueMonth: totalRevenueMonth,
    netRevenueMonth,
    
    // Expenses
    expensesMonth: totalExpensesMonth,
    
    // Employees
    totalEmployees: totalEmployees.length,
    activeEmployees,
    attendanceToday: attendanceToday.filter((a: any) => a.check_in).length,
    attendancePercentage,
    
    // Performance metrics
    onTimePerformance: tripsToday.length > 0 
      ? Math.round(((tripsToday.length - tripsToday.filter((t: any) => t.status === 'DELAYED').length) / tripsToday.length) * 100)
      : 0,
    busUtilization: buses.length > 0
      ? Math.round((activeBusIds.size / buses.length) * 100)
      : 0,
  };
  
  // Calculate profit margin (profit / revenue * 100)
  const profitMargin = totalRevenueMonth > 0
    ? Math.round((netRevenueMonth / totalRevenueMonth) * 100)
    : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Command Center</h1>
          <p className="text-muted-foreground">Complete company oversight and control</p>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              <Button onClick={() => navigate('/admin/trips')} variant="outline" className="justify-start">
                <Activity className="mr-2 h-4 w-4" />
                Manage Trips
              </Button>
              <Button onClick={() => navigate('/admin/fleet')} variant="outline" className="justify-start">
                <Bus className="mr-2 h-4 w-4" />
                Fleet Management
              </Button>
              <Button onClick={() => navigate('/ticketing')} variant="outline" className="justify-start">
                <Users className="mr-2 h-4 w-4" />
                Ticketing
              </Button>
              <Button onClick={() => navigate('/admin/tracking')} variant="outline" className="justify-start">
                <MapPin className="mr-2 h-4 w-4" />
                Live Tracking
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Fleet Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Buses</CardTitle>
              <Bus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBuses}</div>
              <p className="text-xs text-muted-foreground">Fleet size</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Buses</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeBuses}</div>
              <p className="text-xs text-muted-foreground">
                {stats.busUtilization}% Currently operating
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Maintenance</CardTitle>
              <Wrench className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inMaintenance}</div>
              <p className="text-xs text-muted-foreground">Under service</p>
            </CardContent>
          </Card>
        </div>

        {/* Operations Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trips Today</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tripsToday}</div>
              <p className="text-xs text-muted-foreground">Scheduled trips</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On-Time Performance</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.onTimePerformance}%</div>
              <p className="text-xs text-muted-foreground">vs delayed trips</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Passengers Today</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.passengersToday}</div>
              <p className="text-xs text-muted-foreground">Bookings today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {stats.revenueToday.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Daily income</p>
            </CardContent>
          </Card>
        </div>

        {/* Financial Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {stats.netRevenueMonth.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">After expenses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expenses This Month</CardTitle>
              <DollarSign className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {stats.expensesMonth.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Payroll + Maintenance + Fuel</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profitMargin}%</div>
              <p className="text-xs text-muted-foreground">Profit after expenses</p>
            </CardContent>
          </Card>
        </div>

        {/* KPIs */}
        <Card>
          <CardHeader>
            <CardTitle>Key Performance Indicators</CardTitle>
            <p className="text-xs text-muted-foreground">Updates after each trip and at end of day</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">On-Time Trips</div>
                <div className="text-2xl font-bold">{stats.onTimePerformance}%</div>
                <div className="text-xs text-muted-foreground">Target: &gt;95%</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Bus Utilization</div>
                <div className="text-2xl font-bold">{stats.busUtilization}%</div>
                <div className="text-xs text-muted-foreground">Target: &gt;85%</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Profit Margin</div>
                <div className="text-2xl font-bold">{profitMargin}%</div>
                <div className="text-xs text-muted-foreground">Target: &gt;30%</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Employee Attendance</div>
                <div className="text-2xl font-bold">{stats.attendancePercentage}%</div>
                <div className="text-xs text-muted-foreground">Target: &gt;95%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Departments Overview */}
        <div>
          <h2 className="text-xl font-bold mb-4">Departments Overview</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Fleet Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bus className="h-5 w-5" />
                  Fleet Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Buses</span>
                  <span className="font-bold">{stats.totalBuses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active</span>
                  <span className="font-bold text-green-600">{stats.activeBuses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Maintenance Due (15 days)</span>
                  <span className="font-bold text-orange-600">{stats.maintenanceDue}</span>
                </div>
                <Button onClick={() => navigate('/admin/fleet')} variant="outline" size="sm" className="w-full mt-2">
                  View Details
                </Button>
              </CardContent>
            </Card>

            {/* Operations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Operations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Today's Trips</span>
                  <span className="font-bold">{stats.tripsToday}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active</span>
                  <span className="font-bold">{stats.activeTrips}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <span className="font-bold">{stats.completedTrips}</span>
                </div>
                <Button onClick={() => navigate('/admin/trips')} variant="outline" size="sm" className="w-full mt-2">
                  View Details
                </Button>
              </CardContent>
            </Card>

            {/* Finance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Finance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Today's Revenue</span>
                  <span className="font-bold">P{stats.revenueToday.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Pending Payments</span>
                  <span className="font-bold">{bookingsToday.filter((b: any) => b.payment_status === 'pending').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Profit Margin</span>
                  <span className="font-bold">{profitMargin}%</span>
                </div>
                <Button onClick={() => navigate('/finance')} variant="outline" size="sm" className="w-full mt-2">
                  View Details
                </Button>
              </CardContent>
            </Card>

            {/* Human Resources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Human Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Employees</span>
                  <span className="font-bold">{stats.totalEmployees}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active (Not on leave)</span>
                  <span className="font-bold">{stats.activeEmployees}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Attendance Today</span>
                  <span className="font-bold">{stats.attendancePercentage}%</span>
                </div>
                <Button onClick={() => navigate('/hr')} variant="outline" size="sm" className="w-full mt-2">
                  View Details
                </Button>
              </CardContent>
            </Card>

            {/* Maintenance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Scheduled Services</span>
                  <span className="font-bold">{stats.maintenanceDue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Overdue</span>
                  <span className="font-bold text-red-600">
                    {maintenanceSchedule.filter((m: any) => {
                      if (!m.scheduled_date || m.status === 'completed') return false;
                      return new Date(m.scheduled_date) < new Date();
                    }).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">This Month Cost</span>
                  <span className="font-bold">
                    P{(maintenanceRecordsMonth.reduce((sum: number, m: any) => 
                      sum + parseFloat(m.cost || 0), 0
                    )).toLocaleString()}
                  </span>
                </div>
                <Button onClick={() => navigate('/maintenance')} variant="outline" size="sm" className="w-full mt-2">
                  View Details
                </Button>
              </CardContent>
            </Card>

            {/* Customer Service */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Customer Service
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Bookings Today</span>
                  <span className="font-bold">{bookingsToday.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Confirmed</span>
                  <span className="font-bold">{bookingsToday.filter((b: any) => b.booking_status === 'confirmed').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Inquiries</span>
                  <span className="font-bold">0</span>
                </div>
                <Button onClick={() => navigate('/ticketing')} variant="outline" size="sm" className="w-full mt-2">
                  View Details
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
