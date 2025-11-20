import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import TicketingLayout from '@/components/ticketing/TicketingLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Search, MapPin, Calendar, Users, Clock, Bus, ArrowRight, DollarSign, ArrowLeft 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface City {
  id: string;
  name: string;
}

interface Route {
  id: string;
  origin: string;
  destination: string;
}

interface Trip {
  trip_id: string;
  trip_number: string;
  departure_time: string;
  arrival_time: string;
  origin: string;
  destination: string;
  bus_name: string;
  total_seats: number;
  booked_seats: number;
  available_seats: number;
  base_fare: number;
  status: string;
  duration: string;
  bus_type: string;
}

export default function SearchTrips() {
  const { user, userRoles, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : TicketingLayout;

  // State
  const [cities, setCities] = useState<City[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchParams, setSearchParams] = useState({
    origin: '',
    destination: '',
    travel_date: new Date().toISOString().split('T')[0],
    return_date: '',
    passengers: '1',
    trip_type: 'one-way',
  });

  useEffect(() => {
    if (!loading && user) {
      fetchCities();
      fetchRoutes();
    }
  }, [user, loading]);

  const fetchCities = async () => {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCities(data || []);
    } catch (error: any) {
      console.error('Error fetching cities:', error);
    }
  };

  const fetchRoutes = async () => {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('id, origin, destination')
        .eq('is_active', true)
        .order('origin');

      if (error) throw error;
      setRoutes(data || []);
    } catch (error: any) {
      console.error('Error fetching routes:', error);
    }
  };

  const generateProjectedTrips = (schedules: any[], targetDate: string, origin: string, destination: string) => {
    const projected: any[] = [];
    const date = new Date(targetDate);
    const dayOfWeek = date.getDay();

    schedules.forEach((schedule: any) => {
      let shouldGenerate = false;

      if (schedule.frequency_type === 'DAILY') {
        shouldGenerate = true;
      } else if (schedule.frequency_type === 'SPECIFIC_DAYS') {
        shouldGenerate = schedule.days_of_week?.includes(dayOfWeek);
      } else if (schedule.frequency_type === 'WEEKLY') {
        shouldGenerate = schedule.days_of_week?.includes(dayOfWeek);
      }

      if (shouldGenerate && schedule.routes?.origin === origin && schedule.routes?.destination === destination) {
        const [hours, minutes] = schedule.departure_time.split(':');
        const departureDate = new Date(date);
        departureDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        const arrivalDate = new Date(departureDate);
        arrivalDate.setHours(arrivalDate.getHours() + (schedule.duration_hours || schedule.routes?.duration_hours || 0));

        projected.push({
          id: `projected-${schedule.id}-${targetDate}`,
          trip_number: `AUTO-${schedule.id.slice(0, 8)}`,
          scheduled_departure: departureDate.toISOString(),
          scheduled_arrival: arrivalDate.toISOString(),
          fare: schedule.fare_per_seat,
          status: 'SCHEDULED',
          total_seats: schedule.buses?.seating_capacity || 60,
          available_seats: schedule.buses?.seating_capacity || 60,
          routes: {
            origin: schedule.routes?.origin,
            destination: schedule.routes?.destination,
          },
          buses: {
            name: schedule.buses?.registration_number || schedule.buses?.name || 'TBA',
            bus_type: schedule.buses?.bus_type || 'Standard',
          },
          is_projected: true,
        });
      }
    });

    return projected;
  };

  const searchTrips = async () => {
    if (!searchParams.origin || !searchParams.destination || !searchParams.travel_date) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please select origin, destination, and travel date',
      });
      return;
    }

    try {
      setSearching(true);

      // Search for existing trips
      const { data, error } = await supabase
        .from('trips')
        .select(`
          id,
          trip_number,
          scheduled_departure,
          scheduled_arrival,
          fare,
          status,
          total_seats,
          available_seats,
          is_generated_from_schedule,
          routes!inner (origin, destination),
          buses (name, bus_type, registration_number)
        `)
        .eq('routes.origin', searchParams.origin)
        .eq('routes.destination', searchParams.destination)
        .gte('scheduled_departure', `${searchParams.travel_date}T00:00:00`)
        .lte('scheduled_departure', `${searchParams.travel_date}T23:59:59`)
        .in('status', ['SCHEDULED', 'BOARDING'])
        .eq('is_generated_from_schedule', true)
        .gte('available_seats', parseInt(searchParams.passengers))
        .order('scheduled_departure');

      if (error) throw error;

      // Fetch active schedules for projection
      const { data: schedules, error: schedError } = await supabase
        .from('route_frequencies')
        .select(`
          *,
          routes:route_id (id, origin, destination, duration_hours),
          buses:bus_id (id, registration_number, name, bus_type, seating_capacity)
        `)
        .eq('active', true);

      if (schedError) throw schedError;

      // Generate projected trips from schedules
      const projectedTrips = generateProjectedTrips(
        schedules || [], 
        searchParams.travel_date, 
        searchParams.origin, 
        searchParams.destination
      );

      // Combine existing and projected trips
      const allTripsData = [...(data || []), ...projectedTrips];

      // Transform trips data
      const transformedTrips = allTripsData.map((trip: any) => {
        // Calculate duration
        const departure = new Date(trip.scheduled_departure);
        const arrival = trip.scheduled_arrival ? new Date(trip.scheduled_arrival) : null;
        const duration = arrival 
          ? `${Math.floor((arrival.getTime() - departure.getTime()) / (1000 * 60 * 60))}h ${Math.floor(((arrival.getTime() - departure.getTime()) % (1000 * 60 * 60)) / (1000 * 60))}m`
          : 'N/A';

        // Handle routes - Supabase returns array when using !inner
        const routes = Array.isArray(trip.routes) ? trip.routes[0] : trip.routes;
        const buses = Array.isArray(trip.buses) ? trip.buses[0] : trip.buses;

        return {
          trip_id: trip.id,
          trip_number: trip.trip_number,
          departure_time: trip.scheduled_departure,
          arrival_time: trip.scheduled_arrival,
          origin: routes?.origin || 'N/A',
          destination: routes?.destination || 'N/A',
          bus_name: buses?.registration_number || buses?.name || 'TBA',
          bus_type: buses?.bus_type || 'Standard',
          total_seats: trip.total_seats || 60,
          booked_seats: (trip.total_seats || 60) - (trip.available_seats || 0),
          available_seats: trip.available_seats || 0,
          base_fare: trip.fare,
          status: trip.status,
          duration,
          is_projected: trip.is_projected || false,
        };
      }).sort((a, b) => new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime());

      setTrips(transformedTrips);

      if (transformedTrips.length === 0) {
        toast({
          title: 'No trips found',
          description: 'No available trips match your search criteria',
        });
      } else {
        toast({
          title: 'Search complete',
          description: `Found ${transformedTrips.length} available trip${transformedTrips.length > 1 ? 's' : ''}`,
        });
      }
    } catch (error: any) {
      console.error('Error searching trips:', error);
      toast({
        variant: 'destructive',
        title: 'Search failed',
        description: error.message,
      });
    } finally {
      setSearching(false);
    }
  };

  const selectTrip = (trip: Trip) => {
    // Store trip selection in sessionStorage
    sessionStorage.setItem('selectedTrip', JSON.stringify(trip));
    sessionStorage.setItem('passengers', searchParams.passengers);
    
    // Navigate to passenger details first
    const basePath = isAdminRoute ? '/admin/ticketing' : '/ticketing';
    navigate(`${basePath}/passenger-details`);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">🔍 Search Trips</h1>
            <p className="text-muted-foreground">Find available buses for your passengers</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate(isAdminRoute ? '/admin/ticketing' : '/ticketing')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Search Form */}
        <Card>
          <CardHeader>
            <CardTitle>Trip Search</CardTitle>
            <CardDescription>Enter travel details to find available trips</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Origin */}
              <div className="space-y-2">
                <Label htmlFor="origin">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Origin
                </Label>
                <Select
                  value={searchParams.origin}
                  onValueChange={(value) => setSearchParams({ ...searchParams, origin: value })}
                >
                  <SelectTrigger id="origin">
                    <SelectValue placeholder="Select origin city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Destination */}
              <div className="space-y-2">
                <Label htmlFor="destination">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Destination
                </Label>
                <Select
                  value={searchParams.destination}
                  onValueChange={(value) => setSearchParams({ ...searchParams, destination: value })}
                >
                  <SelectTrigger id="destination">
                    <SelectValue placeholder="Select destination city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Travel Date */}
              <div className="space-y-2">
                <Label htmlFor="travel_date">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Travel Date
                </Label>
                <Input
                  id="travel_date"
                  type="date"
                  value={searchParams.travel_date}
                  onChange={(e) => setSearchParams({ ...searchParams, travel_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Number of Passengers */}
              <div className="space-y-2">
                <Label htmlFor="passengers">
                  <Users className="inline h-4 w-4 mr-1" />
                  Passengers
                </Label>
                <Input
                  id="passengers"
                  type="number"
                  min="1"
                  max="60"
                  value={searchParams.passengers}
                  onChange={(e) => setSearchParams({ ...searchParams, passengers: e.target.value })}
                />
              </div>

              {/* Trip Type */}
              <div className="space-y-2">
                <Label htmlFor="trip_type">Trip Type</Label>
                <Select
                  value={searchParams.trip_type}
                  onValueChange={(value) => setSearchParams({ ...searchParams, trip_type: value })}
                >
                  <SelectTrigger id="trip_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-way">One-Way</SelectItem>
                    <SelectItem value="return">Return</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Return Date (if return trip) */}
              {searchParams.trip_type === 'return' && (
                <div className="space-y-2">
                  <Label htmlFor="return_date">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Return Date
                  </Label>
                  <Input
                    id="return_date"
                    type="date"
                    value={searchParams.return_date}
                    onChange={(e) => setSearchParams({ ...searchParams, return_date: e.target.value })}
                    min={searchParams.travel_date}
                  />
                </div>
              )}
            </div>

            <Button 
              onClick={searchTrips} 
              className="mt-6 w-full md:w-auto"
              disabled={searching}
            >
              <Search className="h-4 w-4 mr-2" />
              {searching ? 'Searching...' : 'Search Trips'}
            </Button>
          </CardContent>
        </Card>

        {/* Search Results */}
        {trips.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Available Trips ({trips.length})</CardTitle>
              <CardDescription>Select a trip to continue booking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trips.map((trip) => (
                  <div
                    key={trip.trip_id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      {/* Trip Details */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="text-lg font-bold">
                            {new Date(trip.departure_time).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <div className="text-lg font-bold">
                            {trip.arrival_time
                              ? new Date(trip.arrival_time).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'TBA'}
                          </div>
                          <Badge variant="secondary">{trip.duration}</Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {trip.origin} → {trip.destination}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Bus className="h-3 w-3" />
                            <span>{trip.bus_name}</span>
                          </div>
                          <Badge variant="outline">{trip.bus_type}</Badge>
                          <Badge variant="outline">{trip.trip_number}</Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>
                              {trip.available_seats}/{trip.total_seats} seats available
                            </span>
                          </div>
                          <Badge
                            variant={
                              trip.available_seats < 10
                                ? 'destructive'
                                : trip.available_seats < 20
                                ? 'secondary'
                                : 'secondary'
                            }
                          >
                            {trip.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Price and Action */}
                      <div className="text-right space-y-3">
                        <div>
                          <div className="text-2xl font-bold">P {trip.base_fare.toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">per seat</div>
                        </div>
                        <Button onClick={() => selectTrip(trip)} size="sm">
                          Select Trip
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Results */}
        {!searching && trips.length === 0 && searchParams.origin && searchParams.destination && (
          <Card>
            <CardContent className="text-center py-12">
              <Bus className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No trips found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or selecting a different date
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
