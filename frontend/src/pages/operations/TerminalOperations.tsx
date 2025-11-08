import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import OperationsLayout from '@/components/operations/OperationsLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Building2, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Activity,
  TrendingUp,
  Ticket
} from 'lucide-react';

export default function TerminalOperations() {
  // Fetch today's trips for terminal monitoring
  const { data: tripsData, isLoading } = useQuery({
    queryKey: ['operations-trips-today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get(`/operations/trips?date=${today}`);
      return response.data;
    },
    refetchInterval: 30000,
  });

  const trips = tripsData?.trips || [];

  // Calculate terminal metrics
  const upcomingTrips = trips.filter((t: any) => {
    const departureTime = new Date(t.departureTime);
    const now = new Date();
    const hoursUntil = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntil > 0 && hoursUntil <= 2 && t.status !== 'CANCELLED';
  });

  const boardingTrips = trips.filter((t: any) => {
    const departureTime = new Date(t.departureTime);
    const now = new Date();
    const minutesUntil = (departureTime.getTime() - now.getTime()) / (1000 * 60);
    return minutesUntil > -15 && minutesUntil <= 30 && t.status !== 'CANCELLED';
  });

  const stats = {
    totalTrips: trips.length,
    upcomingTrips: upcomingTrips.length,
    boardingNow: boardingTrips.length,
    totalPassengers: trips.reduce((sum: number, t: any) => sum + (t.bookedSeats || 0), 0),
    averageLoadFactor: trips.length > 0
      ? (trips.reduce((sum: number, t: any) => sum + parseFloat(t.loadFactor || 0), 0) / trips.length).toFixed(1)
      : 0,
  };

  const getBoardingStatus = (trip: any) => {
    const departureTime = new Date(trip.departureTime);
    const now = new Date();
    const minutesUntil = (departureTime.getTime() - now.getTime()) / (1000 * 60);

    if (minutesUntil <= 0 && minutesUntil > -15) {
      return { status: 'BOARDING', color: 'bg-green-600', label: 'Boarding Now' };
    } else if (minutesUntil > 0 && minutesUntil <= 30) {
      return { status: 'PREPARING', color: 'bg-blue-600', label: 'Preparing' };
    } else if (minutesUntil > 30 && minutesUntil <= 60) {
      return { status: 'UPCOMING', color: 'bg-gray-600', label: 'Upcoming' };
    } else if (minutesUntil > 60) {
      return { status: 'SCHEDULED', color: 'bg-gray-400', label: 'Scheduled' };
    } else {
      return { status: 'DEPARTED', color: 'bg-purple-600', label: 'Departed' };
    }
  };

  const getLoadFactorBadge = (loadFactor: number) => {
    if (loadFactor >= 90) {
      return <Badge variant="destructive">Full ({loadFactor}%)</Badge>;
    } else if (loadFactor >= 70) {
      return <Badge variant="default" className="bg-green-600">Good ({loadFactor}%)</Badge>;
    } else if (loadFactor >= 50) {
      return <Badge variant="secondary" className="bg-yellow-600">Moderate ({loadFactor}%)</Badge>;
    } else {
      return <Badge variant="outline">Low ({loadFactor}%)</Badge>;
    }
  };

  return (
    <OperationsLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Terminal Operations</h1>
          <p className="text-muted-foreground">Monitor check-in and boarding operations</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Trips</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTrips}</div>
              <p className="text-xs text-muted-foreground">Scheduled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming (2h)</CardTitle>
              <Clock className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingTrips}</div>
              <p className="text-xs text-muted-foreground">Within 2 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Boarding Now</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.boardingNow}</div>
              <p className="text-xs text-muted-foreground">Active boarding</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Passengers</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPassengers}</div>
              <p className="text-xs text-muted-foreground">Booked today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Load Factor</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageLoadFactor}%</div>
              <p className="text-xs text-muted-foreground">Capacity used</p>
            </CardContent>
          </Card>
        </div>

        {/* Boarding Status */}
        {boardingTrips.length > 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Active Boarding
              </CardTitle>
              <CardDescription className="text-green-700">
                {boardingTrips.length} trip(s) currently boarding or preparing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {boardingTrips.map((trip: any) => {
                  const boardingInfo = getBoardingStatus(trip);
                  return (
                    <div
                      key={trip.id}
                      className="flex items-center justify-between p-4 bg-white rounded-lg border"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`px-3 py-1 rounded-full ${boardingInfo.color} text-white text-sm font-medium`}>
                          {boardingInfo.label}
                        </div>
                        <div>
                          <div className="font-semibold">{trip.route?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Bus: {trip.bus?.registrationNumber} • Driver: {trip.driver?.firstName} {trip.driver?.lastName}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {new Date(trip.departureTime).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {trip.bookedSeats}/{trip.bus?.capacity || 0} passengers
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Departures */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Departures (Next 2 Hours)</CardTitle>
            <CardDescription>
              {upcomingTrips.length} trip(s) departing soon
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Loading terminal operations...</p>
              </div>
            ) : upcomingTrips.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No upcoming departures in the next 2 hours</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Departure Time</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Bus</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Passengers</TableHead>
                    <TableHead>Load Factor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Countdown</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingTrips.map((trip: any) => {
                    const boardingInfo = getBoardingStatus(trip);
                    const departureTime = new Date(trip.departureTime);
                    const minutesUntil = Math.max(0, Math.round((departureTime.getTime() - new Date().getTime()) / (1000 * 60)));

                    return (
                      <TableRow key={trip.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <div className="font-medium">
                              {departureTime.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{trip.route?.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {trip.route?.origin} → {trip.route?.destination}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm">{trip.bus?.registrationNumber}</code>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {trip.driver ? `${trip.driver.firstName} ${trip.driver.lastName}` : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <Badge variant="outline">
                              {trip.bookedSeats}/{trip.bus?.capacity || 0}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getLoadFactorBadge(parseFloat(trip.loadFactor || 0))}
                        </TableCell>
                        <TableCell>
                          <Badge className={boardingInfo.color}>
                            {boardingInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className={`font-semibold ${minutesUntil <= 30 ? 'text-orange-600' : ''}`}>
                            {minutesUntil < 60
                              ? `${minutesUntil} min`
                              : `${Math.floor(minutesUntil / 60)}h ${minutesUntil % 60}m`
                            }
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Terminal Insights */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Check-in Performance
              </CardTitle>
              <CardDescription>Today's metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Bookings</span>
                  <div className="text-xl font-bold">{stats.totalPassengers}</div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Average Load</span>
                  <div className="text-xl font-bold">{stats.averageLoadFactor}%</div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Trips Departing</span>
                  <div className="text-xl font-bold">{stats.upcomingTrips}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Terminal Status
              </CardTitle>
              <CardDescription>Operational overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Active Boarding Gates</span>
                  </div>
                  <div className="font-semibold">{stats.boardingNow}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span>Pending Departures</span>
                  </div>
                  <div className="font-semibold">{stats.upcomingTrips}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span>Alerts</span>
                  </div>
                  <div className="font-semibold">0</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </OperationsLayout>
  );
}
