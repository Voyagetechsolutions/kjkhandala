import AdminLayout from '@/components/admin/AdminLayout';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
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

export default function CommandCenter() {
  const { user, userRoles, loading } = useAuth();
  const navigate = useNavigate();

  // Call useQuery hook unconditionally (before any returns)
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['operations-dashboard'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Fetch dashboard stats
      const { data, error } = await supabase
        .rpc('get_operations_dashboard_stats', {
          p_date: today.toISOString()
        });

      if (error) {
        console.error('Dashboard stats error:', error);
        throw error;
      }

      return data;
    },
    enabled: !!user && !loading,
  });

  // Check authentication and authorization
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    if (!loading && user && userRoles) {
      const hasAccess = userRoles.some(role => 
        ['super_admin', 'admin', 'operations_manager', 'operations_staff'].includes(role)
      );
      
      if (!hasAccess) {
        navigate('/');
      }
    }
  }, [user, userRoles, loading, navigate]);

  if (loading || isLoading) {
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

  if (!user || !userRoles) {
    return null;
  }

  const stats = dashboard?.[0] || {
    total_trips_today: 0,
    active_trips: 0,
    completed_trips: 0,
    cancelled_trips: 0,
    total_passengers_today: 0,
    total_revenue_today: 0,
    active_buses: 0,
    maintenance_due: 0,
    active_drivers: 0,
    incidents_today: 0
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Operations Command Center</h1>
          <p className="text-muted-foreground">Real-time operations overview and management</p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Trips</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_trips}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total_trips_today} total today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Passengers Today</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_passengers_today}</div>
              <p className="text-xs text-muted-foreground">
                Across all trips
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R{stats.total_revenue_today?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                From {stats.completed_trips} completed trips
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Buses</CardTitle>
              <Bus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_buses}</div>
              <p className="text-xs text-muted-foreground">
                {stats.maintenance_due} need maintenance
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Status Overview */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Trip Status</CardTitle>
              <CardDescription>Today's trip breakdown</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Completed</span>
                </div>
                <Badge variant="secondary">{stats.completed_trips}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span>Active</span>
                </div>
                <Badge variant="secondary">{stats.active_trips}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span>Cancelled</span>
                </div>
                <Badge variant="secondary">{stats.cancelled_trips}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alerts & Notifications</CardTitle>
              <CardDescription>Items requiring attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span>Incidents Today</span>
                </div>
                <Badge variant={stats.incidents_today > 0 ? "destructive" : "secondary"}>
                  {stats.incidents_today}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-orange-600" />
                  <span>Maintenance Due</span>
                </div>
                <Badge variant={stats.maintenance_due > 0 ? "destructive" : "secondary"}>
                  {stats.maintenance_due}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>Active Drivers</span>
                </div>
                <Badge variant="secondary">{stats.active_drivers}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common operations tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <button
                onClick={() => navigate('/admin/operations/trips')}
                className="p-4 border rounded-lg hover:bg-accent transition-colors text-left"
              >
                <Activity className="h-6 w-6 mb-2 text-primary" />
                <div className="font-medium">Manage Trips</div>
                <div className="text-sm text-muted-foreground">Schedule and monitor trips</div>
              </button>
              
              <button
                onClick={() => navigate('/admin/operations/live-tracking')}
                className="p-4 border rounded-lg hover:bg-accent transition-colors text-left"
              >
                <Bus className="h-6 w-6 mb-2 text-primary" />
                <div className="font-medium">Live Tracking</div>
                <div className="text-sm text-muted-foreground">Track buses in real-time</div>
              </button>
              
              <button
                onClick={() => navigate('/admin/operations/incidents')}
                className="p-4 border rounded-lg hover:bg-accent transition-colors text-left"
              >
                <AlertCircle className="h-6 w-6 mb-2 text-red-600" />
                <div className="font-medium">Incidents</div>
                <div className="text-sm text-muted-foreground">Handle incidents</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
