import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import OperationsLayout from '@/components/operations/OperationsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Bus, User, Calendar, DollarSign, Users, Eye, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function AutomatedTripManagement() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Fetch auto-generated trips
  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['automated-trips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          routes!route_id (origin, destination, duration_hours),
          buses!bus_id (registration_number, model, seating_capacity),
          drivers!driver_id (full_name, phone)
        `)
        .eq('is_generated_from_schedule', true)
        .order('scheduled_departure', { ascending: true });
      
      if (error) {
        console.error('Error fetching trips:', error);
        return [];
      }
      
      console.log('Fetched automated trips:', data?.length || 0);
      console.log('Sample trip with driver:', data?.[0]);
      return data || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds for auto-status updates
  });

  // Filter trips by date and status
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Today's trips - all trips scheduled for today
  const tripsToday = trips.filter((trip: any) => {
    if (!trip.scheduled_departure) return false;
    const tripDate = new Date(trip.scheduled_departure);
    return tripDate >= today && tripDate < tomorrow;
  });

  // Active trips - BOARDING, or between departure and arrival time
  const activeTrips = trips.filter((trip: any) => {
    if (!trip.scheduled_departure || !trip.scheduled_arrival) return false;
    const departure = new Date(trip.scheduled_departure);
    const arrival = new Date(trip.scheduled_arrival);
    
    // BOARDING status
    if (trip.status === 'BOARDING') {
      const boardingStart = new Date(departure.getTime() - 30 * 60 * 1000);
      return now >= boardingStart && now <= departure;
    }
    
    // DEPARTED - between departure and arrival
    if (trip.status === 'DEPARTED') {
      return now >= departure && now <= arrival;
    }
    
    return false;
  });

  // Upcoming trips - next 6 hours
  const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  const upcomingTrips = trips.filter((trip: any) => {
    if (!trip.scheduled_departure) return false;
    const tripDate = new Date(trip.scheduled_departure);
    return tripDate > now && tripDate <= sixHoursFromNow && trip.status === 'SCHEDULED';
  });

  const completedTrips = trips.filter((trip: any) => 
    trip.status === 'COMPLETED'
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'secondary';
      case 'BOARDING': return 'default';
      case 'DEPARTED': return 'default';
      case 'DELAYED': return 'destructive';
      case 'COMPLETED': return 'outline';
      case 'CANCELLED': return 'destructive';
      default: return 'secondary';
    }
  };

  const calculateRevenue = (trip: any) => {
    const bookedSeats = trip.total_seats - trip.available_seats;
    return (bookedSeats * trip.fare).toFixed(2);
  };

  const TripRow = ({ trip }: { trip: any }) => (
    <TableRow key={trip.id}>
      <TableCell>
        <div>
          <p className="font-medium">{trip.trip_number}</p>
          <Badge variant={getStatusColor(trip.status)} className="mt-1">
            {trip.status}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">{trip.routes?.origin} → {trip.routes?.destination}</p>
            <p className="text-xs text-muted-foreground">{trip.routes?.duration_hours}h duration</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <p className="text-sm font-medium">
            {format(new Date(trip.scheduled_departure), 'dd MMM yyyy, HH:mm')}
          </p>
          <p className="text-xs text-muted-foreground">
            Arrival: {format(new Date(trip.scheduled_arrival), 'HH:mm')}
          </p>
        </div>
      </TableCell>
      <TableCell>
        {trip.buses ? (
          <div className="flex items-center gap-2">
            <Bus className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{trip.buses.registration_number}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Not assigned</span>
        )}
      </TableCell>
      <TableCell>
        {trip.drivers && trip.drivers.full_name ? (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{trip.drivers.full_name}</p>
              {trip.drivers.phone && (
                <p className="text-xs text-muted-foreground">{trip.drivers.phone}</p>
              )}
            </div>
          </div>
        ) : trip.driver_id ? (
          <span className="text-muted-foreground text-sm">Driver ID: {trip.driver_id.slice(0, 8)}...</span>
        ) : (
          <span className="text-muted-foreground text-sm">Not assigned</span>
        )}
      </TableCell>
      <TableCell>
        <div>
          <p className="text-sm font-medium">
            {trip.total_seats - trip.available_seats} / {trip.total_seats}
          </p>
          <p className="text-xs text-muted-foreground">
            {trip.available_seats} available
          </p>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">P {calculateRevenue(trip)}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/operations/manifest/${trip.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/operations/check-in/${trip.id}`)}
          >
            <CheckCircle className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <OperationsLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Automated Trip Management</h1>
          <p className="text-muted-foreground">
            All trips auto-generated from schedules with real-time status updates
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Trips Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{tripsToday.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Bus className="h-4 w-4" />
                Active Trips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{activeTrips.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{completedTrips.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-600">{upcomingTrips.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="today" className="space-y-4">
          <TabsList>
            <TabsTrigger value="today">Today's Trips</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          {/* Today's Trips */}
          <TabsContent value="today">
            <Card>
              <CardHeader>
                <CardTitle>Trips Today - {format(today, 'dd MMMM yyyy')}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="text-center py-8">Loading trips...</div>
                ) : tripsToday.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Trip #</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Departure</TableHead>
                        <TableHead>Bus</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead>Seats</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tripsToday.map((trip: any) => <TripRow key={trip.id} trip={trip} />)}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No trips scheduled for today</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Trips */}
          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Active Trips (Boarding + In Transit)</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Trips currently boarding or between departure and arrival time
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {activeTrips.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Trip #</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Departure</TableHead>
                        <TableHead>Bus</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead>Seats</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeTrips.map((trip: any) => <TripRow key={trip.id} trip={trip} />)}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active trips at the moment</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upcoming Trips */}
          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Trips (Next 6 Hours)</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Scheduled trips departing within the next 6 hours
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {upcomingTrips.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Trip #</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Departure</TableHead>
                        <TableHead>Bus</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead>Seats</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingTrips.map((trip: any) => <TripRow key={trip.id} trip={trip} />)}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No upcoming trips</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Completed Trips */}
          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Completed Trips</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {completedTrips.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Trip #</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Departure</TableHead>
                        <TableHead>Bus</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead>Seats</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completedTrips.map((trip: any) => <TripRow key={trip.id} trip={trip} />)}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No completed trips</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </OperationsLayout>
  );
}
