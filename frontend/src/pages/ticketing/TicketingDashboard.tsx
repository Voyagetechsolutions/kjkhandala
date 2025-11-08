import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import TicketingLayout from '@/components/ticketing/TicketingLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ticket, DollarSign, Users, TrendingUp, Plus, Search, XCircle, FileText, Clock, CheckCircle2 } from 'lucide-react';

export default function TicketingDashboard() {
  const { user, userRoles, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !(userRoles?.includes('TICKETING_AGENT') || userRoles?.includes('TICKETING_SUPERVISOR')))) {
      navigate('/');
      return;
    }
  }, [user, userRoles, loading, navigate]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!(userRoles?.includes('TICKETING_AGENT') || userRoles?.includes('TICKETING_SUPERVISOR'))) return null;

  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['ticketing-dashboard'],
    queryFn: async () => {
      const response = await api.get('/ticketing/dashboard');
      return response.data;
    },
    refetchInterval: 30000,
  });

  const stats = dashboard?.stats || { totalCollected: 0, ticketsSold: 0, upcomingTrips: 0 };
  const trips = dashboard?.trips || [];
  const occupancyRate = trips.length > 0
    ? Math.round((trips.reduce((sum, t) => sum + t.booked, 0) / trips.reduce((sum, t) => sum + t.capacity, 0)) * 100)
    : 0;

  return (
    <TicketingLayout>
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
              <div className="text-2xl font-bold">{dashboardLoading ? '...' : stats.ticketsSold}</div>
              <p className="text-xs text-muted-foreground">Today's sales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {dashboardLoading ? '...' : stats.totalCollected.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Cash + Card + Mobile</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trips Available</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardLoading ? '...' : stats.upcomingTrips}</div>
              <p className="text-xs text-muted-foreground">Departing today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardLoading ? '...' : occupancyRate}%</div>
              <p className="text-xs text-muted-foreground">Average today</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common ticketing operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <Button 
                className="h-24 flex flex-col gap-2"
                onClick={() => navigate('/ticketing/sell')}
              >
                <Plus className="h-8 w-8" />
                <span>Sell Ticket</span>
              </Button>
              <Button 
                className="h-24 flex flex-col gap-2"
                variant="outline"
                onClick={() => navigate('/ticketing/check-in')}
              >
                <CheckCircle2 className="h-8 w-8" />
                <span>Check-In</span>
              </Button>
              <Button 
                className="h-24 flex flex-col gap-2"
                variant="outline"
                onClick={() => navigate('/ticketing/find')}
              >
                <Search className="h-8 w-8" />
                <span>Find Ticket</span>
              </Button>
              <Button 
                className="h-24 flex flex-col gap-2"
                variant="outline"
                onClick={() => navigate('/ticketing/payments')}
              >
                <DollarSign className="h-8 w-8" />
                <span>Payments</span>
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
            {dashboardLoading ? (
              <div className="text-center py-12">Loading...</div>
            ) : trips.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No upcoming trips</p>
              </div>
            ) : (
              <div className="space-y-3">
                {trips.slice(0, 5).map((trip: any) => (
                  <div key={trip.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{trip.route}</p>
                      <p className="text-sm text-muted-foreground">
                        <Clock className="inline h-3 w-3 mr-1" />
                        {new Date(trip.departureTime).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{trip.available}/{trip.capacity} seats</p>
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
            {dashboardLoading ? (
              <div className="text-center py-12">Loading...</div>
            ) : (
              <div className="space-y-3">
                {trips.filter((t: any) => t.available < 5 && t.available > 0).length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No alerts</p>
                  </div>
                ) : (
                  trips.filter((t: any) => t.available < 5 && t.available > 0).map((trip: any) => (
                    <div key={trip.id} className="flex items-center justify-between p-3 border border-orange-200 bg-orange-50 rounded-lg">
                      <div>
                        <p className="font-medium">{trip.route}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(trip.departureTime).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-orange-600">Only {trip.available} seats left!</p>
                      </div>
                    </div>
                  ))
                )}
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
    </TicketingLayout>
  );
}
