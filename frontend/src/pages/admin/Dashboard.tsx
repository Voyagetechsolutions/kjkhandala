import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/admin/AdminLayout";
import LiveOperationsMap from "@/components/admin/LiveOperationsMap";
import { Card } from "@/components/ui/card";
import { DollarSign, Users, Bus, Ticket, Activity, Wrench, TrendingUp, TrendingDown, Percent } from "lucide-react";

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  
  // All hooks before conditional returns
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    totalBuses: 0,
    totalRoutes: 0,
    activeBuses: 0,
    inMaintenance: 0,
    tripsToday: 0,
    onTimePerformance: 0,
    passengersToday: 0,
    revenueToday: 0,
    revenueThisMonth: 0,
    expensesThisMonth: 0,
    profitMargin: 0,
  });

  const fetchStats = async () => {
    try {
      const today = new Date();
      const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();
      
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

      const [
        allBookings,
        todayBookings,
        monthBookings,
        buses,
        routes,
        todayTrips,
        monthExpenses
      ] = await Promise.all([
        supabase.from("bookings").select("total_amount", { count: "exact" }),
        supabase.from("bookings").select("total_amount, payment_status").gte('created_at', todayStart).lte('created_at', todayEnd),
        supabase.from("bookings").select("total_amount, payment_status").gte('created_at', monthStart).lte('created_at', monthEnd),
        supabase.from("buses").select("status", { count: "exact" }),
        supabase.from("routes").select("*", { count: "exact" }),
        supabase.from("trips").select("status, scheduled_departure, actual_departure").gte('scheduled_departure', todayStart).lte('scheduled_departure', todayEnd),
        supabase.from("expenses").select("amount").gte('expense_date', monthStart).lte('expense_date', monthEnd),
      ]);

      const totalRevenue = allBookings.data?.reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;
      
      const todayPaidBookings = todayBookings.data?.filter(b => b.payment_status === 'paid') || [];
      const revenueToday = todayPaidBookings.reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;
      const passengersToday = todayPaidBookings.length;
      
      const monthPaidBookings = monthBookings.data?.filter(b => b.payment_status === 'paid') || [];
      const revenueThisMonth = monthPaidBookings.reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;
      
      const expensesThisMonth = monthExpenses.data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const profitMargin = revenueThisMonth > 0 ? ((revenueThisMonth - expensesThisMonth) / revenueThisMonth * 100) : 0;
      
      const activeBuses = buses.data?.filter(b => b.status === 'active').length || 0;
      const inMaintenance = buses.data?.filter(b => b.status === 'maintenance').length || 0;
      
      const tripsToday = todayTrips.data?.length || 0;
      const onTimeTrips = todayTrips.data?.filter(t => {
        if (!t.actual_departure || !t.scheduled_departure) return false;
        const scheduled = new Date(t.scheduled_departure).getTime();
        const actual = new Date(t.actual_departure).getTime();
        const diffMinutes = (actual - scheduled) / (1000 * 60);
        return diffMinutes <= 15; // On time if within 15 minutes
      }).length || 0;
      const onTimePerformance = tripsToday > 0 ? (onTimeTrips / tripsToday * 100) : 95;

      setStats({
        totalBookings: allBookings.count || 0,
        totalRevenue,
        totalBuses: buses.count || 0,
        totalRoutes: routes.count || 0,
        activeBuses,
        inMaintenance,
        tripsToday,
        onTimePerformance,
        passengersToday,
        revenueToday,
        revenueThisMonth,
        expensesThisMonth,
        profitMargin,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
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
  }, [user, isAdmin, loading]);

  // Conditional returns after all hooks
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAdmin) return null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your bus booking system</p>
        </div>

        {/* Fleet Status */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Fleet Overview</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Buses</p>
                  <p className="text-3xl font-bold mt-2">{stats.totalBuses}</p>
                  <p className="text-xs text-muted-foreground mt-1">Fleet size</p>
                </div>
                <Bus className="h-12 w-12 text-blue-500 opacity-20" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Buses</p>
                  <p className="text-3xl font-bold mt-2">{stats.activeBuses}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stats.totalBuses > 0 ? ((stats.activeBuses / stats.totalBuses) * 100).toFixed(0) : 0}% Currently operating</p>
                </div>
                <Activity className="h-12 w-12 text-green-500 opacity-20" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Maintenance</p>
                  <p className="text-3xl font-bold mt-2">{stats.inMaintenance}</p>
                  <p className="text-xs text-muted-foreground mt-1">Under service</p>
                </div>
                <Wrench className="h-12 w-12 text-orange-500 opacity-20" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Trips Today</p>
                  <p className="text-3xl font-bold mt-2">{stats.tripsToday}</p>
                  <p className="text-xs text-muted-foreground mt-1">Scheduled trips</p>
                </div>
                <Ticket className="h-12 w-12 text-purple-500 opacity-20" />
              </div>
            </Card>
          </div>
        </div>

        {/* Performance & Revenue */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Performance & Revenue</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">On-Time Performance</p>
                  <p className="text-3xl font-bold mt-2">{stats.onTimePerformance.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">vs delayed trips</p>
                </div>
                <TrendingUp className="h-12 w-12 text-green-500 opacity-20" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Passengers Today</p>
                  <p className="text-3xl font-bold mt-2">{stats.passengersToday}</p>
                  <p className="text-xs text-muted-foreground mt-1">Bookings today</p>
                </div>
                <Users className="h-12 w-12 text-blue-500 opacity-20" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue Today</p>
                  <p className="text-3xl font-bold mt-2">P {stats.revenueToday.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Daily income</p>
                </div>
                <DollarSign className="h-12 w-12 text-green-500 opacity-20" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue This Month</p>
                  <p className="text-3xl font-bold mt-2">P {stats.revenueThisMonth.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Monthly income</p>
                </div>
                <TrendingUp className="h-12 w-12 text-green-500 opacity-20" />
              </div>
            </Card>
          </div>
        </div>

        {/* Financial Summary */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Financial Summary</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Expenses This Month</p>
                  <p className="text-3xl font-bold mt-2">P {stats.expensesThisMonth.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total costs</p>
                </div>
                <TrendingDown className="h-12 w-12 text-red-500 opacity-20" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Profit Margin</p>
                  <p className="text-3xl font-bold mt-2">{stats.profitMargin.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Current month</p>
                </div>
                <Percent className={`h-12 w-12 opacity-20 ${stats.profitMargin >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-3xl font-bold mt-2">P {stats.totalRevenue.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">All time</p>
                </div>
                <DollarSign className="h-12 w-12 text-green-500 opacity-20" />
              </div>
            </Card>
          </div>
        </div>

        {/* Live Operations Map */}
        <LiveOperationsMap />
      </div>
    </AdminLayout>
  );
}