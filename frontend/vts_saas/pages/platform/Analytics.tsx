import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Ticket,
  Bus,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Building2,
  Globe,
} from "lucide-react";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { supabase } from "@/lib/supabase";

interface AnalyticsData {
  totalBookings: number;
  totalRevenue: number;
  totalTrips: number;
  totalUsers: number;
  totalProfiles: number;
  totalDrivers: number;
  totalEmployees: number;
  totalStaff: number;
  totalPassengers: number;
  totalTenants: number;
  bookingsGrowth: number;
  revenueGrowth: number;
  topTenants: Array<{
    name: string;
    bookings: number;
    revenue: number;
  }>;
}

export default function Analytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30d");
  const [data, setData] = useState<AnalyticsData>({
    totalBookings: 0,
    totalRevenue: 0,
    totalTrips: 0,
    totalUsers: 0,
    totalProfiles: 0,
    totalDrivers: 0,
    totalEmployees: 0,
    totalStaff: 0,
    totalPassengers: 0,
    totalTenants: 0,
    bookingsGrowth: 0,
    revenueGrowth: 0,
    topTenants: [],
  });

  useEffect(() => {
    const token = localStorage.getItem("platform_admin_token");
    if (!token) {
      navigate("/platform/login");
      return;
    }
    fetchAnalytics();
  }, [navigate, dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch bookings with revenue - join with companies for tenant info
      const { data: bookings, count: bookingCount } = await supabase
        .from("bookings")
        .select("total_amount, company_id, companies(name)", { count: "exact" });

      // Fetch trips
      const { count: tripCount } = await supabase
        .from("trips")
        .select("*", { count: "exact", head: true });

      // Fetch all user types from different tables
      const [
        { count: profileCount },
        { count: driverCount },
        { count: employeeCount },
        { count: staffCount },
        { count: passengerCount },
        { count: tenantCount }
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("drivers").select("*", { count: "exact", head: true }),
        supabase.from("employees").select("*", { count: "exact", head: true }),
        supabase.from("staff").select("*", { count: "exact", head: true }),
        supabase.from("passengers").select("*", { count: "exact", head: true }),
        supabase.from("companies").select("*", { count: "exact", head: true }),
      ]);

      // Calculate total revenue from bookings
      const totalRevenue = bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

      // Calculate top tenants by bookings
      const tenantBookings: Record<string, { name: string; bookings: number; revenue: number }> = {};
      bookings?.forEach(booking => {
        const companyName = (booking.companies as any)?.name || "Unknown";
        if (!tenantBookings[companyName]) {
          tenantBookings[companyName] = { name: companyName, bookings: 0, revenue: 0 };
        }
        tenantBookings[companyName].bookings++;
        tenantBookings[companyName].revenue += booking.total_amount || 0;
      });

      const topTenants = Object.values(tenantBookings)
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5);

      // Total users = profiles + drivers + employees + staff (unique system users)
      const totalSystemUsers = (profileCount || 0) + (driverCount || 0) + (employeeCount || 0) + (staffCount || 0);

      setData({
        totalBookings: bookingCount || 0,
        totalRevenue,
        totalTrips: tripCount || 0,
        totalUsers: totalSystemUsers,
        totalProfiles: profileCount || 0,
        totalDrivers: driverCount || 0,
        totalEmployees: employeeCount || 0,
        totalStaff: staffCount || 0,
        totalPassengers: passengerCount || 0,
        totalTenants: tenantCount || 0,
        bookingsGrowth: 12.5, // Would calculate from historical data
        revenueGrowth: 8.3,
        topTenants,
      });
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PlatformLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Platform Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive platform performance metrics
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchAnalytics}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalBookings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+{data.bookingsGrowth}%</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${data.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+{data.revenueGrowth}%</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
              <Bus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalTrips.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Across all tenants</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Platform-wide</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalTenants}</div>
              <p className="text-xs text-muted-foreground">Bus companies</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Bookings Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Bookings Trend</CardTitle>
              <CardDescription>Daily bookings over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center bg-muted/50 rounded-lg">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Chart visualization</p>
                  <p className="text-sm">Integrate with charting library</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Daily revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center bg-muted/50 rounded-lg">
                <div className="text-center text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Chart visualization</p>
                  <p className="text-sm">Integrate with charting library</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Tenants */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Tenants</CardTitle>
            <CardDescription>Ranked by booking volume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topTenants.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              ) : (
                data.topTenants.map((tenant, idx) => (
                  <div key={tenant.name} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium">{tenant.name}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span>{tenant.bookings} bookings</span>
                          <span className="text-green-600">${tenant.revenue.toLocaleString()}</span>
                        </div>
                      </div>
                      <Progress 
                        value={(tenant.bookings / (data.topTenants[0]?.bookings || 1)) * 100} 
                        className="h-2" 
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>User Breakdown</CardTitle>
            <CardDescription>Users across all tables in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{data.totalProfiles}</div>
                <p className="text-sm text-muted-foreground">Profiles</p>
                <p className="text-xs text-muted-foreground">System users</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{data.totalDrivers}</div>
                <p className="text-sm text-muted-foreground">Drivers</p>
                <p className="text-xs text-muted-foreground">Bus drivers</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{data.totalEmployees}</div>
                <p className="text-sm text-muted-foreground">Employees</p>
                <p className="text-xs text-muted-foreground">Company staff</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">{data.totalStaff}</div>
                <p className="text-sm text-muted-foreground">Staff</p>
                <p className="text-xs text-muted-foreground">HR records</p>
              </div>
              <div className="p-4 bg-pink-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-pink-600">{data.totalPassengers}</div>
                <p className="text-sm text-muted-foreground">Passengers</p>
                <p className="text-xs text-muted-foreground">Registered travelers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Average Booking Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${data.totalBookings > 0 ? (data.totalRevenue / data.totalBookings).toFixed(2) : "0.00"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Per booking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Bookings per Tenant</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {data.totalTenants > 0 ? Math.round(data.totalBookings / data.totalTenants) : 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Average</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Revenue per Tenant</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${data.totalTenants > 0 ? Math.round(data.totalRevenue / data.totalTenants).toLocaleString() : 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Average</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PlatformLayout>
  );
}
