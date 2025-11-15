import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import TicketingLayout from '@/components/ticketing/TicketingLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ticket, DollarSign, Users, TrendingUp, Plus, Search, AlertCircle, Bus, CheckCircle2, Clock, User } from 'lucide-react';
import { useTicketingDashboardStats, useTripOccupancy, usePaymentSummary, useTicketAlerts } from '@/hooks/useTicketingDashboard';
import { useRealtimeTicketing } from '@/hooks/useRealtimeTicketing';
// TODO: Create SellTicketDialog and FindTicketDialog components
// import SellTicketDialog from '@/components/ticketing/SellTicketDialog';
// import FindTicketDialog from '@/components/ticketing/FindTicketDialog';

export default function TicketingDashboard() {
  const { user, userRoles, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : TicketingLayout;
  
  // All hooks must be called before any conditional returns
  const [sellTicketOpen, setSellTicketOpen] = useState(false);
  const [findTicketOpen, setFindTicketOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useTicketingDashboardStats();
  const { data: trips, isLoading: tripsLoading } = useTripOccupancy();
  const { data: payments } = usePaymentSummary();
  const { data: alerts } = useTicketAlerts();

  // Enable realtime updates
  useRealtimeTicketing();

  useEffect(() => {
    if (!loading && (!user || !(userRoles?.includes('TICKETING_AGENT') || userRoles?.includes('TICKETING_SUPERVISOR')))) {
      navigate('/');
      return;
    }
  }, [user, userRoles, loading, navigate]);

  const isLoading = statsLoading || tripsLoading;

  // Conditional returns AFTER all hooks
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!(userRoles?.includes('TICKETING_AGENT') || userRoles?.includes('TICKETING_SUPERVISOR'))) return null;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Ticketing Control Panel</h1>
          <p className="text-muted-foreground">Terminal agent dashboard for booking and ticket management</p>
        </div>

        {/* KPI Cards */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tickets Sold Today</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : stats?.tickets_sold_today || 0}</div>
              <p className="text-xs text-muted-foreground">Today's sales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {isLoading ? '...' : (stats?.revenue_today || 0).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Cash + Card + Mobile</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trips Available</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : stats?.trips_available_today || 0}</div>
              <p className="text-xs text-muted-foreground">Departing today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : (stats?.avg_occupancy_rate || 0).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Average today</p>
            </CardContent>
          </Card>
        </div>

        {/* Control Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Control Panel</CardTitle>
            <CardDescription>Ticketing operations and management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              {/* Sell Ticket */}
              <Button 
                className="h-32 flex flex-col gap-3"
                onClick={() => navigate('/ticketing/search-trips')}
              >
                <Ticket className="h-10 w-10" />
                <div className="text-center">
                  <div className="font-semibold">Sell Ticket</div>
                  <div className="text-xs opacity-80">New booking</div>
                </div>
              </Button>

              {/* Find/Modify Ticket */}
              <Button 
                className="h-32 flex flex-col gap-3"
                variant="outline"
                onClick={() => navigate('/ticketing/modify-booking')}
              >
                <Search className="h-10 w-10" />
                <div className="text-center">
                  <div className="font-semibold">Find/Modify Ticket</div>
                  <div className="text-xs opacity-80">Search & edit</div>
                </div>
              </Button>

              {/* Check-In */}
              <Button 
                className="h-32 flex flex-col gap-3"
                variant="outline"
                onClick={() => navigate('/ticketing/trip-management')}
              >
                <CheckCircle2 className="h-10 w-10" />
                <div className="text-center">
                  <div className="font-semibold">Check-In</div>
                  <div className="text-xs opacity-80">Passenger check-in</div>
                </div>
              </Button>

              {/* Payments & Cash Register */}
              <Button 
                className="h-32 flex flex-col gap-3"
                variant="outline"
                onClick={() => navigate('/ticketing/office-admin')}
              >
                <DollarSign className="h-10 w-10" />
                <div className="text-center">
                  <div className="font-semibold">Payments & Cash</div>
                  <div className="text-xs opacity-80">Cash register</div>
                </div>
              </Button>

              {/* Passenger Manifest */}
              <Button 
                className="h-32 flex flex-col gap-3"
                variant="outline"
                onClick={() => navigate('/ticketing/trip-management')}
              >
                <Users className="h-10 w-10" />
                <div className="text-center">
                  <div className="font-semibold">Passenger Manifest</div>
                  <div className="text-xs opacity-80">View manifest</div>
                </div>
              </Button>

              {/* Reports & Audit */}
              <Button 
                className="h-32 flex flex-col gap-3"
                variant="outline"
                onClick={() => navigate('/ticketing/reports')}
              >
                <TrendingUp className="h-10 w-10" />
                <div className="text-center">
                  <div className="font-semibold">Reports & Audit</div>
                  <div className="text-xs opacity-80">Analytics</div>
                </div>
              </Button>

              {/* Customer Lookup */}
              <Button 
                className="h-32 flex flex-col gap-3"
                variant="outline"
                onClick={() => navigate('/ticketing/customer-lookup')}
              >
                <User className="h-10 w-10" />
                <div className="text-center">
                  <div className="font-semibold">Customer Lookup</div>
                  <div className="text-xs opacity-80">Search customers</div>
                </div>
              </Button>

              {/* Settings */}
              <Button 
                className="h-32 flex flex-col gap-3"
                variant="outline"
                onClick={() => navigate('/ticketing/settings')}
              >
                <Clock className="h-10 w-10" />
                <div className="text-center">
                  <div className="font-semibold">Settings</div>
                  <div className="text-xs opacity-80">Configuration</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Trips Departing Soon */}
        <Card>
          <CardHeader>
            <CardTitle>Trips Departing Soon</CardTitle>
            <CardDescription>Next departures from this terminal</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">Loading...</div>
            ) : !trips || trips.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No upcoming trips</p>
              </div>
            ) : (
              <div className="space-y-3">
                {trips?.slice(0, 5).map((trip: any) => (
                  <div key={trip.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{trip.route_name}</p>
                      <p className="text-sm text-muted-foreground">
                        <Clock className="inline h-3 w-3 mr-1" />
                        {new Date(trip.scheduled_departure).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{trip.available_seats}/{trip.total_seats} seats</p>
                      <Badge variant={trip.status === 'BOARDING' ? 'default' : 'secondary'}>
                        {trip.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Seat Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Low Seat Alerts</CardTitle>
            <CardDescription>Routes about to sell out</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">Loading...</div>
            ) : alerts && alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert: any) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 border border-orange-200 bg-orange-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm text-muted-foreground">
                        {alert.severity === 'HIGH' ? '🔴' : '🟡'} {alert.alert_type}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={alert.severity === 'HIGH' ? 'destructive' : 'secondary'}>
                        {alert.severity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No alerts</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sync Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Connection and sync information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Connection Status</span>
                <span className="text-sm font-medium text-green-600">● Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Last Sync</span>
                <span className="text-sm text-muted-foreground">Just now</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Terminal ID</span>
                <span className="text-sm text-muted-foreground">TERM-001</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
