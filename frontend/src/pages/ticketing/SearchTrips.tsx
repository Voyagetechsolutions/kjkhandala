import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
      fetchRoutes();
    }
  }, [user, loading]);

  const fetchRoutes = async () => {
    try {
      const query = supabase
        .from('routes')
        .select('id, origin, destination');
      
      const { data, error } = await query
        .eq('is_active', true)
        .order('origin');

      if (error) throw error;
      setRoutes(data || []);
    } catch (error: any) {
      console.error('Error fetching routes:', error);
    }
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

      // Search for trips
      const query = supabase
        .from('trips')
        .select(`
          id,
          trip_number,
          departure_time,
          arrival_time,
          base_fare,
          status,
          routes (origin, destination),
          buses (name, bus_type)
        `);
      
      const { data, error } = await query
        .gte('departure_time', `${searchParams.travel_date}T00:00:00`)
        .lte('departure_time', `${searchParams.travel_date}T23:59:59`)
        .in('status', ['SCHEDULED', 'BOARDING'])
        .order('departure_time');

      if (error) throw error;

      // Get seat counts for each trip
      const tripsWithSeats = await Promise.all(
        (data || []).map(async (trip: any) => {
          const seatQuery = supabase
            .from('booking_seats')
            .select('*', { count: 'exact', head: true });
          
          const { count: bookedCount } = await seatQuery
            .eq('trip_id', trip.id)
            .in('status', ['reserved', 'sold']);

          const booked = bookedCount || 0;
          const total = 60; // Fixed 60 seats
          const available = total - booked;

          // Calculate duration
          const departure = new Date(trip.departure_time);
          const arrival = trip.arrival_time ? new Date(trip.arrival_time) : null;
          const duration = arrival 
            ? `${Math.floor((arrival.getTime() - departure.getTime()) / (1000 * 60 * 60))}h ${Math.floor(((arrival.getTime() - departure.getTime()) % (1000 * 60 * 60)) / (1000 * 60))}m`
            : 'N/A';

          return {
            trip_id: trip.id,
            trip_number: trip.trip_number,
            departure_time: trip.departure_time,
            arrival_time: trip.arrival_time,
            origin: trip.routes?.origin || 'N/A',
            destination: trip.routes?.destination || 'N/A',
            bus_name: trip.buses?.name || 'TBA',
            bus_type: trip.buses?.bus_type || 'Standard',
            total_seats: total,
            booked_seats: booked,
            available_seats: available,
            base_fare: trip.base_fare,
            status: trip.status,
            duration,
          };
        })
      );

      // Filter by origin and destination
      const filtered = tripsWithSeats.filter(
        (trip) =>
          trip.origin.toLowerCase().includes(searchParams.origin.toLowerCase()) &&
          trip.destination.toLowerCase().includes(searchParams.destination.toLowerCase()) &&
          trip.available_seats >= parseInt(searchParams.passengers)
      );

      setTrips(filtered);

      if (filtered.length === 0) {
        toast({
          title: 'No trips found',
          description: 'No available trips match your search criteria',
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
    
    // Navigate to seat selection
    navigate('/ticketing/seat-selection');
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
                <Input
                  id="origin"
                  placeholder="e.g., Gaborone"
                  value={searchParams.origin}
                  onChange={(e) => setSearchParams({ ...searchParams, origin: e.target.value })}
                />
              </div>

              {/* Destination */}
              <div className="space-y-2">
                <Label htmlFor="destination">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Destination
                </Label>
                <Input
                  id="destination"
                  placeholder="e.g., Francistown"
                  value={searchParams.destination}
                  onChange={(e) => setSearchParams({ ...searchParams, destination: e.target.value })}
                />
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
