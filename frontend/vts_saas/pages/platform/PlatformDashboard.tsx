import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Building2,
  Users,
  Activity,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Server,
  Zap,
  Globe,
  ArrowUpRight,
  MoreHorizontal,
  RefreshCw,
  Eye,
} from "lucide-react";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { supabase } from "@/lib/supabase";

interface SystemStats {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  totalUsers: number;
  totalTrips: number;
  totalBookings: number;
  totalRevenue: number;
  apiCalls24h: number;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
  subscription_tier: string;
  api_calls_this_month: number;
  api_rate_limit: number;
  created_at: string;
}

interface RecentActivity {
  id: string;
  type: "tenant_created" | "booking" | "payment" | "trip";
  message: string;
  tenant_name?: string;
  timestamp: string;
}

export default function PlatformDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<SystemStats>({
    totalTenants: 0,
    activeTenants: 0,
    suspendedTenants: 0,
    totalUsers: 0,
    totalTrips: 0,
    totalBookings: 0,
    totalRevenue: 0,
    apiCalls24h: 0,
  });
  const [topTenants, setTopTenants] = useState<Tenant[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState({
    api: "healthy",
    database: "healthy",
    storage: "healthy",
    payments: "healthy",
  });

  useEffect(() => {
    // Check if platform admin is logged in
    const token = localStorage.getItem("platform_admin_token");
    if (!token) {
      navigate("/platform/login");
      return;
    }
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all companies (tenants)
      const { data: companies, error: companiesError } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });

      if (companiesError) throw companiesError;

      const tenantCount = companies?.length || 0;
      const activeTenantCount = companies?.filter(c => c.is_active).length || 0;
      const suspendedCount = companies?.filter(c => !c.is_active).length || 0;

      // Fetch user count
      const { count: userCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch bookings count and sum
      const { data: bookingsData, count: bookingCount } = await supabase
        .from("bookings")
        .select("total_amount", { count: "exact" });

      const totalRevenue = bookingsData?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

      // Fetch trips count
      const { count: tripCount } = await supabase
        .from("trips")
        .select("*", { count: "exact", head: true });

      // Calculate total API calls from companies
      const totalApiCalls = companies?.reduce((sum, c) => sum + (c.api_calls_this_month || 0), 0) || 0;

      setStats({
        totalTenants: tenantCount,
        activeTenants: activeTenantCount,
        suspendedTenants: suspendedCount,
        totalUsers: userCount || 0,
        totalTrips: tripCount || 0,
        totalBookings: bookingCount || 0,
        totalRevenue: totalRevenue,
        apiCalls24h: totalApiCalls,
      });

      // Set top tenants (sorted by API usage)
      const sortedTenants = [...(companies || [])].sort(
        (a, b) => (b.api_calls_this_month || 0) - (a.api_calls_this_month || 0)
      ).slice(0, 5);
      setTopTenants(sortedTenants);

      // Fetch recent bookings for activity
      const { data: recentBookings } = await supabase
        .from("bookings")
        .select("id, booking_reference, created_at, companies(name)")
        .order("created_at", { ascending: false })
        .limit(5);

      // Build recent activity from real data
      const activities: RecentActivity[] = [];

      // Add recent tenants
      const recentTenants = companies?.slice(0, 2) || [];
      recentTenants.forEach(tenant => {
        activities.push({
          id: `tenant-${tenant.id}`,
          type: "tenant_created",
          message: `Tenant "${tenant.name}" registered`,
          tenant_name: tenant.name,
          timestamp: tenant.created_at,
        });
      });

      // Add recent bookings
      recentBookings?.forEach(booking => {
        activities.push({
          id: `booking-${booking.id}`,
          type: "booking",
          message: `Booking ${booking.booking_reference} created`,
          tenant_name: (booking.companies as any)?.name,
          timestamp: booking.created_at,
        });
      });

      // Sort by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activities.slice(0, 6));

      // Check system health by testing database connection
      const { error: healthError } = await supabase.from("companies").select("id").limit(1);
      if (healthError) {
        setSystemHealth(prev => ({ ...prev, database: "degraded" }));
      }

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: RecentActivity["type"]) => {
    switch (type) {
      case "tenant_created":
        return <Building2 className="h-4 w-4 text-blue-500" />;
      case "booking":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "payment":
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case "trip":
        return <Globe className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-500";
      case "degraded":
        return "text-yellow-500";
      case "down":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getPlanBadge = (tier: string) => {
    switch (tier) {
      case "enterprise":
        return <Badge className="bg-purple-500 text-xs">Enterprise</Badge>;
      case "pro":
        return <Badge className="bg-blue-500 text-xs">Pro</Badge>;
      case "starter":
        return <Badge variant="outline" className="text-xs">Starter</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{tier || "Free"}</Badge>;
    }
  };

  return (
    <PlatformLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
            <p className="text-muted-foreground">
              Monitor your SaaS platform health and tenant activity
            </p>
          </div>
          <Button onClick={fetchDashboardData} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* System Health */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(systemHealth).map(([service, status]) => (
                <div key={service} className="flex items-center gap-2">
                  <CheckCircle2 className={`h-4 w-4 ${getHealthColor(status)}`} />
                  <span className="capitalize text-sm">{service}</span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTenants}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500">{stats.activeTenants} active</span>
                {" · "}
                {stats.totalTenants - stats.activeTenants} inactive
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Registered across all tenants
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                From all bookings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Calls</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.apiCalls24h.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                This month across tenants
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTrips.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Across all tenants</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Platform-wide</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspended Tenants</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.suspendedTenants}</div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent Activity
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.message}</p>
                      {activity.tenant_name && (
                        <p className="text-xs text-muted-foreground">{activity.tenant_name}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common platform management tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <Link to="/platform/tenants/new">
                  <Button variant="outline" className="w-full justify-start">
                    <Building2 className="h-4 w-4 mr-2" />
                    Create New Tenant
                  </Button>
                </Link>
                <Link to="/platform/billing">
                  <Button variant="outline" className="w-full justify-start">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Manage Subscriptions
                  </Button>
                </Link>
                <Link to="/platform/logs">
                  <Button variant="outline" className="w-full justify-start">
                    <Server className="h-4 w-4 mr-2" />
                    View Error Logs
                  </Button>
                </Link>
                <Link to="/platform/announcements">
                  <Button variant="outline" className="w-full justify-start">
                    <Globe className="h-4 w-4 mr-2" />
                    Send Announcement
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Tenants by API Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Top Tenants by API Usage</CardTitle>
            <CardDescription>Highest API consumption this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topTenants.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tenants found
                </p>
              ) : (
                topTenants.map((tenant, idx) => {
                  const usagePercent = tenant.api_rate_limit 
                    ? Math.min(100, ((tenant.api_calls_this_month || 0) / tenant.api_rate_limit) * 100)
                    : 0;
                  return (
                    <div key={tenant.id} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                        {idx + 1}
                      </div>
                      <Avatar className="h-8 w-8">
                        {tenant.logo_url && <AvatarImage src={tenant.logo_url} />}
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                          {tenant.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{tenant.name}</p>
                          {getPlanBadge(tenant.subscription_tier)}
                          {!tenant.is_active && (
                            <Badge variant="destructive" className="text-xs">Suspended</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span>{(tenant.api_calls_this_month || 0).toLocaleString()} API calls</span>
                          <span>Limit: {(tenant.api_rate_limit || 1000).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="w-24">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>Usage</span>
                          <span>{usagePercent.toFixed(0)}%</span>
                        </div>
                        <Progress value={usagePercent} className="h-2" />
                      </div>
                      <Link to={`/platform/tenants/${tenant.id}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PlatformLayout>
  );
}
