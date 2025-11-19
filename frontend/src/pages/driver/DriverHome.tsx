import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import DriverLayout from '@/components/driver/DriverLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Clock, 
  Bus, 
  Users, 
  Play,
  ClipboardList,
  AlertTriangle,
  Navigation,
  Bell,
  Phone
} from 'lucide-react';

export default function DriverHome() {
  const navigate = useNavigate();

  const { data: driverData, isLoading } = useQuery({
    queryKey: ['driver-home'],
    queryFn: async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get driver profile
      const { data: driver } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!driver) {
        return { hasTrip: false, trip: null };
      }

      // Get today's assigned trip for this driver
      const today = new Date();
      const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select('id, trip_number, status, scheduled_departure, scheduled_arrival, bus_id, route_id')
        .eq('driver_id', driver.id)
        .gte('scheduled_departure', todayStart)
        .lte('scheduled_departure', todayEnd)
        .order('scheduled_departure')
        .limit(1);

      if (tripsError) throw tripsError;

      if (!trips || trips.length === 0) {
        return { hasTrip: false, trip: null };
      }

      const trip = trips[0];

      // Fetch bus details
      const { data: bus } = await supabase
        .from('buses')
        .select('bus_number, model, seating_capacity')
        .eq('id', trip.bus_id)
        .single();

      // Fetch route details
      const { data: route } = await supabase
        .from('routes')
        .select('origin, destination, distance, estimated_duration')
        .eq('id', trip.route_id)
        .single();

      // Fetch bookings count
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, payment_status')
        .eq('trip_id', trip.id);

      const totalPassengers = bookings?.filter(b => b.payment_status === 'paid').length || 0;
      const checkedInPassengers = 0; // Would need check-in tracking

      return {
        hasTrip: true,
        trip: {
          ...trip,
          route: `${route?.origin} → ${route?.destination}`,
          destination: route?.destination,
          distance: route?.distance || 0,
          estimatedDuration: route?.estimated_duration || 0,
          busNumber: bus?.bus_number || 'N/A',
          busModel: bus?.model || 'N/A',
          totalPassengers,
          checkedInPassengers,
          departureTime: trip.scheduled_departure,
        }
      };
    },
    refetchInterval: 30000
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-500';
      case 'BOARDING': return 'bg-orange-500';
      case 'DEPARTED': return 'bg-green-500';
      case 'COMPLETED': return 'bg-gray-500';
      case 'CANCELLED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'Awaiting Boarding';
      case 'BOARDING': return 'Boarding Passengers';
      case 'DEPARTED': return 'Trip in Progress';
      case 'COMPLETED': return 'Trip Completed';
      case 'CANCELLED': return 'Trip Cancelled';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <DriverLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-2xl font-bold mb-2">Loading...</div>
            <p className="text-muted-foreground">Fetching your trip information</p>
          </div>
        </div>
      </DriverLayout>
    );
  }

  if (!driverData?.hasTrip) {
    return (
      <DriverLayout>
        <div className="max-w-4xl mx-auto">
          <Card className="border-2">
            <CardContent className="py-16 text-center">
              <Bus className="h-24 w-24 mx-auto mb-6 text-muted-foreground opacity-50" />
              <h2 className="text-3xl font-bold mb-4">No Trip Assigned</h2>
              <p className="text-xl text-muted-foreground mb-8">
                You don't have any trips assigned for today
              </p>
              <p className="text-lg text-muted-foreground">
                Check back later or contact operations
              </p>
            </CardContent>
          </Card>
        </div>
      </DriverLayout>
    );
  }

  const trip = driverData?.trip;

  if (!trip) {
    return (
      <DriverLayout>
        <div className="max-w-4xl mx-auto">
          <Card className="border-2">
            <CardContent className="py-16 text-center">
              <Bus className="h-24 w-24 mx-auto mb-6 text-muted-foreground opacity-50" />
              <h2 className="text-3xl font-bold mb-4">No Trip Data</h2>
              <p className="text-xl text-muted-foreground mb-8">
                Unable to load trip information
              </p>
            </CardContent>
          </Card>
        </div>
      </DriverLayout>
    );
  }

  return (
    <DriverLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">Today's Trip</h1>
          <Badge className={`${getStatusColor(trip.status)} text-white text-lg px-6 py-2`}>
            {getStatusLabel(trip.status)}
          </Badge>
        </div>

        {/* Trip Summary Card */}
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Trip Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Route */}
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <MapPin className="h-12 w-12 text-primary" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Route</p>
                <p className="text-3xl font-bold">{trip.route}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Departure Time */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-6 w-6 text-primary" />
                  <p className="text-sm text-muted-foreground">Departure</p>
                </div>
                <p className="text-2xl font-bold">
                  {new Date(trip.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* Bus */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Bus className="h-6 w-6 text-primary" />
                  <p className="text-sm text-muted-foreground">Bus</p>
                </div>
                <p className="text-2xl font-bold">{trip.busNumber}</p>
                <p className="text-sm text-muted-foreground">{trip.busModel}</p>
              </div>

              {/* Passengers */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-6 w-6 text-primary" />
                  <p className="text-sm text-muted-foreground">Passengers</p>
                </div>
                <p className="text-2xl font-bold">{trip.totalPassengers}</p>
                <p className="text-sm text-muted-foreground">
                  {trip.checkedInPassengers} checked in
                </p>
              </div>
            </div>

            {/* Distance & Duration */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Distance</p>
                <p className="text-xl font-bold">{trip.distance} km</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Est. Duration</p>
                <p className="text-xl font-bold">{trip.estimatedDuration} hours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Start Trip Button */}
              {trip.status === 'SCHEDULED' && (
                <Button
                  onClick={() => navigate('/driver/start-trip')}
                  className="h-24 text-xl font-bold bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Play className="h-8 w-8 mr-3" />
                  Start Trip
                </Button>
              )}

              {/* Live Trip */}
              {trip.status === 'DEPARTED' && (
                <Button
                  onClick={() => navigate('/driver/live')}
                  className="h-24 text-xl font-bold bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  <Navigation className="h-8 w-8 mr-3" />
                  Live Trip
                </Button>
              )}

              {/* View Manifest */}
              <Button
                onClick={() => navigate('/driver/manifest')}
                className="h-24 text-xl font-bold"
                variant="outline"
                size="lg"
              >
                <Users className="h-8 w-8 mr-3" />
                View Manifest
              </Button>

              {/* Report Issue */}
              <Button
                onClick={() => navigate('/driver/report')}
                className="h-24 text-xl font-bold bg-orange-600 hover:bg-orange-700"
                size="lg"
              >
                <AlertTriangle className="h-8 w-8 mr-3" />
                Report Issue
              </Button>

              {/* Contact Operations */}
              <Button
                onClick={() => window.location.href = 'tel:+267-OPERATIONS'}
                className="h-24 text-xl font-bold"
                variant="outline"
                size="lg"
              >
                <Phone className="h-8 w-8 mr-3" />
                Contact Operations
              </Button>

              {/* Navigation (Maps) */}
              <Button
                onClick={() => {
                  const destination = encodeURIComponent(trip.destination);
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
                }}
                className="h-24 text-xl font-bold"
                variant="outline"
                size="lg"
              >
                <Navigation className="h-8 w-8 mr-3" />
                Open Maps
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Bell className="h-6 w-6" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                <p className="font-semibold">Trip ready for boarding</p>
                <p className="text-sm text-muted-foreground">All pre-checks completed</p>
              </div>
              {trip.totalPassengers !== trip.checkedInPassengers && (
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                  <p className="font-semibold">Passengers pending check-in</p>
                  <p className="text-sm text-muted-foreground">
                    {trip.totalPassengers - trip.checkedInPassengers} passenger(s) not yet checked in
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DriverLayout>
  );
}
