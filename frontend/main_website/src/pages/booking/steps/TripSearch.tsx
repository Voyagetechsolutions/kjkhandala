import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { MapPin, Clock, Bus, Users, ArrowRight, Search } from 'lucide-react';
import { format } from 'date-fns';

interface Trip {
  id: string;
  trip_number: string;
  departure_time: string;
  arrival_time: string;
  base_fare: number;
  status: string;
  total_seats: number;
  available_seats: number;
  routes: {
    origin: string;
    destination: string;
  };
  buses: {
    name: string;
    bus_type: string;
  };
}

interface TripSearchProps {
  onTripSelect: (trip: Trip, isReturnTrip?: boolean) => void;
  selectedTrip?: Trip;
  selectedReturnTrip?: Trip;
}

export default function TripSearch({ onTripSelect, selectedTrip, selectedReturnTrip }: TripSearchProps) {
  const [form, setForm] = useState({
    origin: '',
    destination: '',
    date: '',
    returnDate: '',
    passengers: 1,
    tripType: 'one-way',
  });
  const [trips, setTrips] = useState<Trip[]>([]);
  const [returnTrips, setReturnTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingReturn, setLoadingReturn] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [showReturnTrips, setShowReturnTrips] = useState(false);

  // Fetch cities from cities table
  useEffect(() => {
    const fetchCities = async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('name')
        .order('name');
      
      if (error) {
        console.error('Error fetching cities:', error);
        toast.error('Failed to load cities');
        return;
      }
      
      if (data) {
        setCities(data.map((city: any) => city.name));
      }
    };
    fetchCities();
  }, []);

  const handleSearch = async () => {
    if (!form.origin || !form.destination || !form.date) {
      toast.error('Please fill in all fields');
      return;
    }

    if (form.tripType === 'return' && !form.returnDate) {
      toast.error('Please select a return date');
      return;
    }

    setLoading(true);
    try {
      // Search outbound trips
      const { data, error } = await supabase
        .from('trips')
        .select(`
          id,
          trip_number,
          departure_time,
          arrival_time,
          base_fare,
          status,
          total_seats,
          available_seats,
          routes!inner (origin, destination),
          buses (name, bus_type)
        `)
        .eq('routes.origin', form.origin)
        .eq('routes.destination', form.destination)
        .gte('departure_time', `${form.date}T00:00:00`)
        .lte('departure_time', `${form.date}T23:59:59`)
        .in('status', ['scheduled', 'boarding'])
        .gte('available_seats', form.passengers)
        .order('departure_time');

      if (error) throw error;

      // Transform data to match Trip interface
      const transformedTrips = (data || []).map((trip: any) => ({
        ...trip,
        routes: Array.isArray(trip.routes) ? trip.routes[0] : trip.routes,
        buses: Array.isArray(trip.buses) ? trip.buses[0] : trip.buses,
      }));
      setTrips(transformedTrips);
      
      if (!data || data.length === 0) {
        toast.info('No outbound trips found for the selected criteria');
      }

      // Search return trips if return trip is selected
      if (form.tripType === 'return' && form.returnDate) {
        await searchReturnTrips();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to search trips');
    } finally {
      setLoading(false);
    }
  };

  const searchReturnTrips = async () => {
    setLoadingReturn(true);
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          id,
          trip_number,
          departure_time,
          arrival_time,
          base_fare,
          status,
          total_seats,
          available_seats,
          routes!inner (origin, destination),
          buses (name, bus_type)
        `)
        .eq('routes.origin', form.destination)
        .eq('routes.destination', form.origin)
        .gte('departure_time', `${form.returnDate}T00:00:00`)
        .lte('departure_time', `${form.returnDate}T23:59:59`)
        .in('status', ['scheduled', 'boarding'])
        .gte('available_seats', form.passengers)
        .order('departure_time');

      if (error) throw error;

      const transformedTrips = (data || []).map((trip: any) => ({
        ...trip,
        routes: Array.isArray(trip.routes) ? trip.routes[0] : trip.routes,
        buses: Array.isArray(trip.buses) ? trip.buses[0] : trip.buses,
      }));
      setReturnTrips(transformedTrips);
      
      if (!data || data.length === 0) {
        toast.info('No return trips found for the selected criteria');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to search return trips');
    } finally {
      setLoadingReturn(false);
    }
  };

  const handleSelectTrip = (trip: Trip, isReturnTrip: boolean = false) => {
    onTripSelect(trip, isReturnTrip);
    if (!isReturnTrip && form.tripType === 'return') {
      setShowReturnTrips(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origin">From</Label>
              <Select value={form.origin} onValueChange={(value) => setForm({ ...form, origin: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select origin" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">To</Label>
              <Select value={form.destination} onValueChange={(value) => setForm({ ...form, destination: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {cities.filter(city => city !== form.origin).map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Travel Date</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passengers">Passengers</Label>
              <Input
                id="passengers"
                type="number"
                min="1"
                max="10"
                value={form.passengers}
                onChange={(e) => setForm({ ...form, passengers: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tripType">Trip Type</Label>
              <Select value={form.tripType} onValueChange={(value) => setForm({ ...form, tripType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select trip type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-way">One-Way</SelectItem>
                  <SelectItem value="return">Return Trip</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.tripType === 'return' && (
              <div className="space-y-2">
                <Label htmlFor="returnDate">Return Date</Label>
                <Input
                  id="returnDate"
                  type="date"
                  value={form.returnDate}
                  onChange={(e) => setForm({ ...form, returnDate: e.target.value })}
                  min={form.date || new Date().toISOString().split('T')[0]}
                />
              </div>
            )}
          </div>

          <Button onClick={handleSearch} disabled={loading} className="w-full mt-4">
            {loading ? (
              <>Searching...</>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search Trips
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {trips.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            {form.tripType === 'return' && !showReturnTrips ? 'Select Outbound Trip' : 'Available Trips'} ({trips.length})
          </h3>
          
          {trips.map((trip) => (
            <Card 
              key={trip.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedTrip?.id === trip.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handleSelectTrip(trip)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">From</p>
                          <p className="font-semibold text-lg">{trip.routes.origin}</p>
                        </div>
                      </div>
                      
                      <ArrowRight className="h-6 w-6 text-gray-400" />
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">To</p>
                          <p className="font-semibold text-lg">{trip.routes.destination}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {format(new Date(trip.departure_time), 'HH:mm')} - {format(new Date(trip.arrival_time), 'HH:mm')}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Bus className="h-4 w-4 text-muted-foreground" />
                        <span>{trip.buses?.name || 'Standard Bus'}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{trip.available_seats} seats available</span>
                      </div>

                      <Badge variant={trip.status === 'scheduled' ? 'default' : 'secondary'}>
                        {trip.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Price per seat</p>
                    <p className="text-3xl font-bold text-blue-600">
                      P {trip.base_fare.toFixed(2)}
                    </p>
                    {selectedTrip?.id === trip.id && (
                      <Badge className="mt-2 bg-green-500">Selected</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Return Trips Section */}
      {form.tripType === 'return' && showReturnTrips && returnTrips.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Select Return Trip ({returnTrips.length})</h3>
          
          {returnTrips.map((trip) => (
            <Card 
              key={trip.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedReturnTrip?.id === trip.id ? 'ring-2 ring-green-500' : ''
              }`}
              onClick={() => handleSelectTrip(trip, true)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">From</p>
                          <p className="font-semibold text-lg">{trip.routes.origin}</p>
                        </div>
                      </div>
                      
                      <ArrowRight className="h-6 w-6 text-gray-400" />
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">To</p>
                          <p className="font-semibold text-lg">{trip.routes.destination}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {format(new Date(trip.departure_time), 'HH:mm')} - {format(new Date(trip.arrival_time), 'HH:mm')}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Bus className="h-4 w-4 text-muted-foreground" />
                        <span>{trip.buses?.name || 'Standard Bus'}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{trip.available_seats} seats available</span>
                      </div>

                      <Badge variant={trip.status === 'scheduled' ? 'default' : 'secondary'}>
                        {trip.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Price per seat</p>
                    <p className="text-3xl font-bold text-green-600">
                      P {trip.base_fare.toFixed(2)}
                    </p>
                    {selectedReturnTrip?.id === trip.id && (
                      <Badge className="mt-2 bg-green-500">Selected</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {trips.length === 0 && !loading && form.date && (
        <Card>
          <CardContent className="p-12 text-center">
            <Bus className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">No trips found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or selecting a different date
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
