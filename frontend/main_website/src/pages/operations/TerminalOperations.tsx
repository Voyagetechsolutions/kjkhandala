import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import OperationsLayout from '@/components/operations/OperationsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Bus, Clock, Users, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

export default function TerminalOperations() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : OperationsLayout;

  // AUTO-FETCH TODAY'S TERMINAL DATA
  const { data: terminalData, isLoading } = useQuery({
    queryKey: ['automated-terminal'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();
      const twoHoursLater = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

      // Today's trips
      const { data: todaysTrips, error: tripsError } = await supabase
        .from('trips')
        .select(`
          id,
          scheduled_departure,
          scheduled_arrival,
          status,
          total_seats,
          available_seats,
          routes(origin, destination),
          buses(name, registration, capacity),
          drivers(first_name, last_name),
          bookings(id)
        `)
        .gte('scheduled_departure', `${today}T00:00:00`)
        .lte('scheduled_departure', `${today}T23:59:59`)
        .in('status', ['SCHEDULED', 'BOARDING', 'DEPARTED']);

      if (tripsError) throw tripsError;

      // Upcoming (next 2 hours)
      const upcomingTrips = (todaysTrips || []).filter((trip: any) => 
        trip.scheduled_departure >= now && trip.scheduled_departure <= twoHoursLater
      );

      // Boarding now
      const boardingTrips = (todaysTrips || []).filter((trip: any) => 
        trip.status === 'BOARDING'
      );

      // Pending departures (should have departed but haven't)
      const pendingDepartures = (todaysTrips || []).filter((trip: any) => 
        trip.scheduled_departure < now && 
        !['DEPARTED', 'COMPLETED', 'CANCELLED'].includes(trip.status)
      );

      // Today's bookings
      const { data: todaysBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .in('status', ['BOOKED', 'CHECKED_IN']);

      if (bookingsError) throw bookingsError;

      // Calculate load factor
      const totalCapacity = (todaysTrips || []).reduce((sum: number, trip: any) => 
        sum + (trip.buses?.capacity || 50), 0
      );
      const totalBooked = (todaysTrips || []).reduce((sum: number, trip: any) => 
        sum + (trip.total_seats - trip.available_seats), 0
      );
      const loadFactor = totalCapacity > 0 ? (totalBooked / totalCapacity * 100).toFixed(1) : '0';

      // Generate alerts
      const alerts = [];
      (todaysTrips || []).forEach((trip: any) => {
        if (!trip.buses) alerts.push({ type: 'Bus not assigned', tripId: trip.id });
        if (!trip.drivers) alerts.push({ type: 'Driver not assigned', tripId: trip.id });
        const booked = trip.total_seats - trip.available_seats;
        if (booked < 5) alerts.push({ type: 'Low load (<5 passengers)', tripId: trip.id });
      });

      return {
        todaysTrips: todaysTrips || [],
        upcomingTrips,
        boardingTrips,
        pendingDepartures,
        totalPassengers: todaysBookings?.length || 0,
        loadFactor,
        alerts
      };
    },
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });

  const stats = {
    tripsToday: terminalData?.todaysTrips.length || 0,
    upcoming: terminalData?.upcomingTrips.length || 0,
    boarding: terminalData?.boardingTrips.length || 0,
    passengers: terminalData?.totalPassengers || 0,
    loadFactor: terminalData?.loadFactor || '0',
    activeGates: terminalData?.boardingTrips.length || 0,
    pending: terminalData?.pendingDepartures.length || 0,
    alerts: terminalData?.alerts.length || 0,
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Terminal Operations</h1>
          <p className="text-muted-foreground">
            Live terminal dashboard • Auto-updating • Zero manual input
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trips Today</CardTitle>
              <Bus className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tripsToday}</div>
              <p className="text-xs text-muted-foreground">Scheduled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming (2h)</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcoming}</div>
              <p className="text-xs text-muted-foreground">Next 2 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Boarding Now</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.boarding}</div>
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Passengers</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.passengers}</div>
              <p className="text-xs text-muted-foreground">Booked today</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Load Factor</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.loadFactor}%</div>
              <p className="text-xs text-muted-foreground">Average today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Gates</CardTitle>
              <Bus className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeGates}</div>
              <p className="text-xs text-muted-foreground">Boarding</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Departures</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Late</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alerts</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.alerts}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Departures */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Departures (Next 2 Hours)</CardTitle>
            <p className="text-sm text-muted-foreground">
              {stats.upcoming} trip(s) departing soon
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Loading terminal data...</p>
              </div>
            ) : terminalData?.upcomingTrips.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No Upcoming Departures</p>
                <p className="text-sm mt-2">Next departure in more than 2 hours</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route</TableHead>
                    <TableHead>Bus</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Departure</TableHead>
                    <TableHead>Seats</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {terminalData?.upcomingTrips.map((trip: any) => (
                    <TableRow key={trip.id}>
                      <TableCell>
                        <div className="font-medium">
                          {trip.routes?.origin} → {trip.routes?.destination}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm">{trip.buses?.registration || 'N/A'}</code>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {trip.drivers ? `${trip.drivers.first_name} ${trip.drivers.last_name}` : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {new Date(trip.scheduled_departure).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {trip.total_seats - trip.available_seats}/{trip.total_seats}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={trip.status === 'BOARDING' ? 'default' : 'secondary'}
                        >
                          {trip.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Alerts */}
        {stats.alerts > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-900 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Terminal Alerts ({stats.alerts})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {terminalData?.alerts.slice(0, 5).map((alert: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-yellow-900">
                    <AlertCircle className="h-4 w-4" />
                    {alert.type}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
