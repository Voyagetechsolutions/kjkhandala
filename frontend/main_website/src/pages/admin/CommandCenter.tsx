import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Bus, Users, Ticket, Activity, Wrench, TrendingUp, TrendingDown, 
  Percent, DollarSign, Navigation, Calendar, MapPin, Clock,
  CheckCircle, AlertTriangle, ArrowRight, Briefcase, UserCheck,
  MessageSquare, RefreshCw, Zap
} from "lucide-react";

interface DashboardStats {
  // Fleet
  totalBuses: number;
  activeBuses: number;
  inMaintenance: number;
  maintenanceDue: number;
  // Operations
  tripsToday: number;
  activeTrips: number;
  completedTrips: number;
  onTimePerformance: number;
  // Finance
  revenueToday: number;
  revenueThisMonth: number;
  expensesThisMonth: number;
  profitMargin: number;
  pendingPayments: number;
  // HR
  totalEmployees: number;
  activeEmployees: number;
  attendanceToday: number;
  // Maintenance
  scheduledServices: number;
  overdueServices: number;
  maintenanceCostThisMonth: number;
  // Customer Service
  bookingsToday: number;
  confirmedBookings: number;
  inquiries: number;
  passengersToday: number;
  // KPIs
  busUtilization: number;
}

export default function CommandCenter() {
  const { user, isAdmin, companyId, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalBuses: 0,
    activeBuses: 0,
    inMaintenance: 0,
    maintenanceDue: 0,
    tripsToday: 0,
    activeTrips: 0,
    completedTrips: 0,
    onTimePerformance: 0,
    revenueToday: 0,
    revenueThisMonth: 0,
    expensesThisMonth: 0,
    profitMargin: 0,
    pendingPayments: 0,
    totalEmployees: 0,
    activeEmployees: 0,
    attendanceToday: 0,
    scheduledServices: 0,
    overdueServices: 0,
    maintenanceCostThisMonth: 0,
    bookingsToday: 0,
    confirmedBookings: 0,
    inquiries: 0,
    passengersToday: 0,
    busUtilization: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = async () => {
    setIsRefreshing(true);
    try {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
      const fifteenDaysFromNow = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString();

      // Build queries with company_id filter if available
      const busesQuery = supabase.from("buses").select("status, next_service_date");
      const todayTripsQuery = supabase.from("trips").select("status, scheduled_departure, scheduled_arrival").gte('scheduled_departure', todayStart).lte('scheduled_departure', todayEnd);
      const todayBookingsQuery = supabase.from("bookings").select("total_amount, payment_status, booking_status").gte('created_at', todayStart).lte('created_at', todayEnd);
      const monthBookingsQuery = supabase.from("bookings").select("total_amount, payment_status").gte('created_at', monthStart).lte('created_at', monthEnd);
      const monthExpensesQuery = supabase.from("expenses").select("amount").gte('expense_date', monthStart).lte('expense_date', monthEnd);
      const employeesQuery = supabase.from("employees").select("employment_status", { count: "exact" });
      const todayAttendanceQuery = supabase.from("attendance").select("status").eq('date', today.toISOString().split('T')[0]);
      const maintenanceSchedulesQuery = supabase.from("maintenance_schedules").select("next_service_date, is_active").eq('is_active', true);
      const maintenanceRecordsQuery = supabase.from("maintenance_records").select("cost").gte('performed_at', monthStart).lte('performed_at', monthEnd);
      const pendingPaymentsQuery = supabase.from("bookings").select("id", { count: "exact" }).eq('payment_status', 'pending');

      // Apply company_id filter if user has a company
      if (companyId) {
        busesQuery.eq('company_id', companyId);
        todayTripsQuery.eq('company_id', companyId);
        todayBookingsQuery.eq('company_id', companyId);
        monthBookingsQuery.eq('company_id', companyId);
        monthExpensesQuery.eq('company_id', companyId);
        employeesQuery.eq('company_id', companyId);
        todayAttendanceQuery.eq('company_id', companyId);
        maintenanceSchedulesQuery.eq('company_id', companyId);
        maintenanceRecordsQuery.eq('company_id', companyId);
        pendingPaymentsQuery.eq('company_id', companyId);
      }

      const [
        buses,
        todayTrips,
        todayBookings,
        monthBookings,
        monthExpenses,
        employees,
        todayAttendance,
        maintenanceSchedules,
        maintenanceRecords,
        pendingPaymentsData,
      ] = await Promise.all([
        busesQuery,
        todayTripsQuery,
        todayBookingsQuery,
        monthBookingsQuery,
        monthExpensesQuery,
        employeesQuery,
        todayAttendanceQuery,
        maintenanceSchedulesQuery,
        maintenanceRecordsQuery,
        pendingPaymentsQuery,
      ]);

      // Fleet calculations
      const totalBuses = buses.data?.length || 0;
      const activeBuses = buses.data?.filter(b => b.status === 'active').length || 0;
      const inMaintenance = buses.data?.filter(b => b.status === 'maintenance').length || 0;
      const maintenanceDue = buses.data?.filter(b => {
        if (!b.next_service_date) return false;
        return new Date(b.next_service_date) <= new Date(fifteenDaysFromNow);
      }).length || 0;

      // Operations calculations
      const tripsToday = todayTrips.data?.length || 0;
      const activeTrips = todayTrips.data?.filter(t => t.status === 'in_progress' || t.status === 'boarding').length || 0;
      const completedTrips = todayTrips.data?.filter(t => t.status === 'completed').length || 0;
      const onTimeTrips = todayTrips.data?.filter(t => t.status === 'completed').length || 0;
      const onTimePerformance = tripsToday > 0 ? (onTimeTrips / tripsToday * 100) : 0;

      // Finance calculations
      const todayPaidBookings = todayBookings.data?.filter(b => b.payment_status === 'paid') || [];
      const revenueToday = todayPaidBookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
      const passengersToday = todayPaidBookings.length;
      
      const monthPaidBookings = monthBookings.data?.filter(b => b.payment_status === 'paid') || [];
      const revenueThisMonth = monthPaidBookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
      
      const expensesThisMonth = monthExpenses.data?.reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;
      const profitMargin = revenueThisMonth > 0 ? ((revenueThisMonth - expensesThisMonth) / revenueThisMonth * 100) : 0;

      // HR calculations
      const totalEmployees = employees.count || 0;
      const activeEmployees = employees.data?.filter(e => e.employment_status === 'active').length || totalEmployees;
      const presentToday = todayAttendance.data?.filter(a => a.status === 'present' || a.status === 'late').length || 0;
      const attendanceToday = totalEmployees > 0 ? (presentToday / totalEmployees * 100) : 0;

      // Maintenance calculations
      const scheduledServices = maintenanceSchedules.data?.filter(s => {
        if (!s.next_service_date) return false;
        return new Date(s.next_service_date) <= new Date(fifteenDaysFromNow);
      }).length || 0;
      const overdueServices = maintenanceSchedules.data?.filter(s => {
        if (!s.next_service_date) return false;
        return new Date(s.next_service_date) < today;
      }).length || 0;
      const maintenanceCostThisMonth = maintenanceRecords.data?.reduce((sum, r) => sum + Number(r.cost || 0), 0) || 0;

      // Customer Service calculations
      const bookingsToday = todayBookings.data?.length || 0;
      const confirmedBookings = todayBookings.data?.filter(b => b.booking_status === 'confirmed').length || 0;

      // Bus utilization
      const busUtilization = totalBuses > 0 ? (activeBuses / totalBuses * 100) : 0;

      setStats({
        totalBuses,
        activeBuses,
        inMaintenance,
        maintenanceDue,
        tripsToday,
        activeTrips,
        completedTrips,
        onTimePerformance,
        revenueToday,
        revenueThisMonth,
        expensesThisMonth,
        profitMargin,
        pendingPayments: pendingPaymentsData.count || 0,
        totalEmployees,
        activeEmployees,
        attendanceToday,
        scheduledServices,
        overdueServices,
        maintenanceCostThisMonth,
        bookingsToday,
        confirmedBookings,
        inquiries: 0,
        passengersToday,
        busUtilization,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/");
      return;
    }
    
    if (isAdmin) {
      fetchStats();
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) return null;

  const formatCurrency = (amount: number) => `P ${amount.toLocaleString()}`;

  const quickActions = [
    { label: "Manage Trips", path: "/admin/trips", icon: Calendar },
    { label: "Fleet Management", path: "/admin/fleet", icon: Bus },
    { label: "Ticketing", path: "/admin/ticketing", icon: Ticket },
    { label: "Live Tracking", path: "/admin/tracking", icon: Navigation },
  ];

  const kpis = [
    { 
      label: "On-Time Trips", 
      value: stats.onTimePerformance, 
      target: 95, 
      color: stats.onTimePerformance >= 95 ? "bg-green-500" : stats.onTimePerformance >= 80 ? "bg-yellow-500" : "bg-red-500" 
    },
    { 
      label: "Bus Utilization", 
      value: stats.busUtilization, 
      target: 85, 
      color: stats.busUtilization >= 85 ? "bg-green-500" : stats.busUtilization >= 70 ? "bg-yellow-500" : "bg-red-500" 
    },
    { 
      label: "Profit Margin", 
      value: stats.profitMargin, 
      target: 30, 
      color: stats.profitMargin >= 30 ? "bg-green-500" : stats.profitMargin >= 15 ? "bg-yellow-500" : "bg-red-500" 
    },
    { 
      label: "Employee Attendance", 
      value: stats.attendanceToday, 
      target: 95, 
      color: stats.attendanceToday >= 95 ? "bg-green-500" : stats.attendanceToday >= 80 ? "bg-yellow-500" : "bg-red-500" 
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Zap className="h-8 w-8 text-primary" />
              Command Center
            </h1>
            <p className="text-muted-foreground mt-1">Complete company oversight and control</p>
          </div>
          <Button 
            variant="outline" 
            onClick={fetchStats} 
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickActions.map((action) => (
                <Button
                  key={action.path}
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary hover:text-white transition-all"
                  asChild
                >
                  <Link to={action.path}>
                    <action.icon className="h-6 w-6" />
                    <span className="text-sm font-medium">{action.label}</span>
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Total Buses */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Buses</p>
                  <p className="text-2xl font-bold mt-1">{stats.totalBuses}</p>
                  <p className="text-xs text-muted-foreground">Fleet size</p>
                </div>
                <Bus className="h-8 w-8 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          {/* Active Buses */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Active Buses</p>
                  <p className="text-2xl font-bold mt-1">{stats.activeBuses}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalBuses > 0 ? `${((stats.activeBuses / stats.totalBuses) * 100).toFixed(0)}%` : '0%'} Operating
                  </p>
                </div>
                <Activity className="h-8 w-8 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          {/* In Maintenance */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">In Maintenance</p>
                  <p className="text-2xl font-bold mt-1">{stats.inMaintenance}</p>
                  <p className="text-xs text-muted-foreground">Under service</p>
                </div>
                <Wrench className="h-8 w-8 text-orange-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          {/* Trips Today */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Trips Today</p>
                  <p className="text-2xl font-bold mt-1">{stats.tripsToday}</p>
                  <p className="text-xs text-muted-foreground">Scheduled trips</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          {/* On-Time Performance */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">On-Time Performance</p>
                  <p className="text-2xl font-bold mt-1">{stats.onTimePerformance.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">vs delayed trips</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          {/* Passengers Today */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Passengers Today</p>
                  <p className="text-2xl font-bold mt-1">{stats.passengersToday}</p>
                  <p className="text-xs text-muted-foreground">Bookings today</p>
                </div>
                <Users className="h-8 w-8 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          {/* Revenue Today */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Revenue Today</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(stats.revenueToday)}</p>
                  <p className="text-xs text-muted-foreground">Daily income</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          {/* Revenue This Month */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Revenue This Month</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(stats.revenueThisMonth)}</p>
                  <p className="text-xs text-muted-foreground">After expenses</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          {/* Expenses This Month */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Expenses This Month</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(stats.expensesThisMonth)}</p>
                  <p className="text-xs text-muted-foreground">Payroll + Maintenance + Fuel</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          {/* Profit Margin */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Profit Margin</p>
                  <p className="text-2xl font-bold mt-1">{stats.profitMargin.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Profit after expenses</p>
                </div>
                <Percent className={`h-8 w-8 opacity-20 ${stats.profitMargin >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KPIs Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Key Performance Indicators</CardTitle>
            <CardDescription>Updates after each trip and at end of day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {kpis.map((kpi) => (
                <div key={kpi.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{kpi.label}</span>
                    <span className="text-sm text-muted-foreground">Target: &gt;{kpi.target}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={Math.min(kpi.value, 100)} className="flex-1" />
                    <span className="text-lg font-bold w-14 text-right">{kpi.value.toFixed(0)}%</span>
                  </div>
                  <div className={`h-1 rounded-full ${kpi.color}`} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Departments Overview */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Departments Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Fleet Management */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bus className="h-5 w-5 text-blue-500" />
                    Fleet Management
                  </CardTitle>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Fleet
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-2xl font-bold">{stats.totalBuses}</p>
                    <p className="text-xs text-muted-foreground">Total Buses</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{stats.activeBuses}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{stats.maintenanceDue}</p>
                    <p className="text-xs text-muted-foreground">Due (15 days)</p>
                  </div>
                </div>
                <Button variant="ghost" className="w-full justify-between" asChild>
                  <Link to="/admin/fleet">
                    View Details <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Operations */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Navigation className="h-5 w-5 text-purple-500" />
                    Operations
                  </CardTitle>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    Ops
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-2xl font-bold">{stats.tripsToday}</p>
                    <p className="text-xs text-muted-foreground">Today's Trips</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{stats.activeTrips}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{stats.completedTrips}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                </div>
                <Button variant="ghost" className="w-full justify-between" asChild>
                  <Link to="/admin/trips">
                    View Details <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Finance */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    Finance
                  </CardTitle>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Finance
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold">{formatCurrency(stats.revenueToday)}</p>
                    <p className="text-xs text-muted-foreground">Today's Revenue</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-orange-600">{stats.pendingPayments}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-600">{stats.profitMargin.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">Profit Margin</p>
                  </div>
                </div>
                <Button variant="ghost" className="w-full justify-between" asChild>
                  <Link to="/admin/finance">
                    View Details <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Human Resources */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-indigo-500" />
                    Human Resources
                  </CardTitle>
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                    HR
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-2xl font-bold">{stats.totalEmployees}</p>
                    <p className="text-xs text-muted-foreground">Total Employees</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{stats.activeEmployees}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{stats.attendanceToday.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">Attendance</p>
                  </div>
                </div>
                <Button variant="ghost" className="w-full justify-between" asChild>
                  <Link to="/admin/hr">
                    View Details <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Maintenance */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-orange-500" />
                    Maintenance
                  </CardTitle>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    Maint.
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-2xl font-bold">{stats.scheduledServices}</p>
                    <p className="text-xs text-muted-foreground">Scheduled</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{stats.overdueServices}</p>
                    <p className="text-xs text-muted-foreground">Overdue</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{formatCurrency(stats.maintenanceCostThisMonth)}</p>
                    <p className="text-xs text-muted-foreground">This Month</p>
                  </div>
                </div>
                <Button variant="ghost" className="w-full justify-between" asChild>
                  <Link to="/admin/maintenance">
                    View Details <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Customer Service */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-teal-500" />
                    Customer Service
                  </CardTitle>
                  <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                    Support
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-2xl font-bold">{stats.bookingsToday}</p>
                    <p className="text-xs text-muted-foreground">Bookings Today</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{stats.confirmedBookings}</p>
                    <p className="text-xs text-muted-foreground">Confirmed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{stats.inquiries}</p>
                    <p className="text-xs text-muted-foreground">Inquiries</p>
                  </div>
                </div>
                <Button variant="ghost" className="w-full justify-between" asChild>
                  <Link to="/admin/ticketing">
                    View Details <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
