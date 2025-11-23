import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Users, MapPin, ArrowRight, Clock, Bus, Loader2 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import DateInput from './DateInput';

interface Trip {
  id: string;
  trip_number: string;
  scheduled_departure: string;
  scheduled_arrival: string;
  fare: number;
  status: string;
  total_seats: number;
  available_seats: number;
  route: {
    origin: string;
    destination: string;
  };
  bus: {
    name: string;
    bus_type: string;
  };
}

export default function BookingWidget() {
  const navigate = useNavigate();
  const [cities, setCities] = useState<string[]>([]);
  const [form, setForm] = useState({
    from: '',
    to: '',
    travelDate: '',
    returnDate: '',
    passengers: 1,
    tripType: 'one-way',
  });
  const [trips, setTrips] = useState<Trip[]>([]);
  const [returnTrips, setReturnTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedReturnTrip, setSelectedReturnTrip] = useState<Trip | null>(null);
  const [searching, setSearching] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showingReturnTrips, setShowingReturnTrips] = useState(false);

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('name')
        .order('name');
      
      if (error) throw error;
      setCities(data?.map(city => city.name) || []);
    } catch (error) {
      console.error('Failed to fetch cities:', error);
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
          route: {
            origin: schedule.routes?.origin,
            destination: schedule.routes?.destination,
          },
          bus: {
            name: schedule.buses?.registration_number || schedule.buses?.name || 'TBA',
            bus_type: schedule.buses?.bus_type || 'Standard',
          },
          is_projected: true,
        });
      }
    });

    return projected;
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.from || !form.to || !form.travelDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (form.tripType === 'return' && !form.returnDate) {
      toast.error('Please select a return date');
      return;
    }

    try {
      setSearching(true);
      setExpanded(true);
      setSelectedTrip(null);
      setSelectedReturnTrip(null);
      setShowingReturnTrips(false);

      // Fetch existing trips
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
        .eq('routes.origin', form.from)
        .eq('routes.destination', form.to)
        .gte('scheduled_departure', `${form.travelDate}T00:00:00`)
        .lte('scheduled_departure', `${form.travelDate}T23:59:59`)
        .in('status', ['SCHEDULED', 'BOARDING'])
        .eq('is_generated_from_schedule', true)
        .gte('available_seats', form.passengers)
        .order('scheduled_departure');

      if (error) throw error;

      // Fetch active schedules for projection (manual join to avoid ambiguous FK error)
      const { data: schedData, error: schedError } = await supabase
        .from('route_frequencies')
        .select('*')
        .eq('active', true);

      if (schedError) throw schedError;

      // Fetch related data
      const routeIds = [...new Set(schedData?.map(s => s.route_id).filter(Boolean))];
      const busIds = [...new Set(schedData?.map(s => s.bus_id).filter(Boolean))];

      const [routesRes, busesRes] = await Promise.all([
        routeIds.length > 0 
          ? supabase.from('routes').select('id, origin, destination, duration_hours').in('id', routeIds)
          : { data: [] },
        busIds.length > 0
          ? supabase.from('buses').select('id, registration_number, name, bus_type, seating_capacity').in('id', busIds)
          : { data: [] }
      ]);

      const routesMap = new Map(routesRes.data?.map((r: any) => [r.id, r] as const) || []);
      const busesMap = new Map(busesRes.data?.map((b: any) => [b.id, b] as const) || []);

      const schedules = schedData?.map(sched => ({
        ...sched,
        routes: routesMap.get(sched.route_id) || null,
        buses: busesMap.get(sched.bus_id) || null,
      }));

      // Transform existing trips
      const transformedTrips = (data || []).map((trip: any) => ({
        id: trip.id,
        trip_number: trip.trip_number,
        scheduled_departure: trip.scheduled_departure,
        scheduled_arrival: trip.scheduled_arrival,
        fare: trip.fare,
        status: trip.status,
        total_seats: trip.total_seats,
        available_seats: trip.available_seats,
        route: {
          origin: Array.isArray(trip.routes) ? trip.routes[0]?.origin : trip.routes?.origin,
          destination: Array.isArray(trip.routes) ? trip.routes[0]?.destination : trip.routes?.destination,
        },
        bus: {
          name: Array.isArray(trip.buses) ? trip.buses[0]?.registration_number || trip.buses[0]?.name : trip.buses?.registration_number || trip.buses?.name || 'TBA',
          bus_type: Array.isArray(trip.buses) ? trip.buses[0]?.bus_type : trip.buses?.bus_type || 'Standard',
        },
        is_projected: false,
      }));

      // Generate projected trips from schedules
      const projectedTrips = generateProjectedTrips(schedules || [], form.travelDate, form.from, form.to);

      // Combine and deduplicate (prefer existing trips over projected)
      const existingTripTimes = new Set(transformedTrips.map((t: any) => 
        new Date(t.scheduled_departure).toISOString().slice(0, 16)
      ));
      const uniqueProjected = projectedTrips.filter((pt: any) => 
        !existingTripTimes.has(new Date(pt.scheduled_departure).toISOString().slice(0, 16))
      );

      const allTrips = [...transformedTrips, ...uniqueProjected].sort((a, b) => 
        new Date(a.scheduled_departure).getTime() - new Date(b.scheduled_departure).getTime()
      );

      setTrips(allTrips);

      // Search return trips if return journey
      if (form.tripType === 'return' && form.returnDate) {
        const { data: returnData, error: returnError } = await supabase
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
          .eq('routes.origin', form.to)
          .eq('routes.destination', form.from)
          .gte('scheduled_departure', `${form.returnDate}T00:00:00`)
          .lte('scheduled_departure', `${form.returnDate}T23:59:59`)
          .in('status', ['SCHEDULED', 'BOARDING'])
          .eq('is_generated_from_schedule', true)
          .gte('available_seats', form.passengers)
          .order('scheduled_departure');

        if (returnError) throw returnError;

        const transformedReturnTrips = (returnData || []).map((trip: any) => ({
          id: trip.id,
          trip_number: trip.trip_number,
          scheduled_departure: trip.scheduled_departure,
          scheduled_arrival: trip.scheduled_arrival,
          fare: trip.fare,
          status: trip.status,
          total_seats: trip.total_seats,
          available_seats: trip.available_seats,
          route: {
            origin: Array.isArray(trip.routes) ? trip.routes[0]?.origin : trip.routes?.origin,
            destination: Array.isArray(trip.routes) ? trip.routes[0]?.destination : trip.routes?.destination,
          },
          bus: {
            name: Array.isArray(trip.buses) ? trip.buses[0]?.registration_number || trip.buses[0]?.name : trip.buses?.registration_number || trip.buses?.name || 'TBA',
            bus_type: Array.isArray(trip.buses) ? trip.buses[0]?.bus_type : trip.buses?.bus_type || 'Standard',
          },
          is_projected: false,
        }));

        // Generate projected return trips
        const projectedReturnTrips = generateProjectedTrips(schedules || [], form.returnDate, form.to, form.from);

        // Combine and deduplicate
        const existingReturnTimes = new Set(transformedReturnTrips.map((t: any) => 
          new Date(t.scheduled_departure).toISOString().slice(0, 16)
        ));
        const uniqueProjectedReturn = projectedReturnTrips.filter((pt: any) => 
          !existingReturnTimes.has(new Date(pt.scheduled_departure).toISOString().slice(0, 16))
        );

        const allReturnTrips = [...transformedReturnTrips, ...uniqueProjectedReturn].sort((a, b) => 
          new Date(a.scheduled_departure).getTime() - new Date(b.scheduled_departure).getTime()
        );

        setReturnTrips(allReturnTrips);
      }

      if (allTrips.length === 0) {
        toast.info('No trips found for your search criteria');
      } else {
        toast.success(`Found ${allTrips.length} available trip${allTrips.length > 1 ? 's' : ''}`);
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error('Failed to search trips');
    } finally {
      setSearching(false);
    }
  };

  const selectTrip = (trip: Trip, isReturnTrip: boolean = false) => {
    if (isReturnTrip) {
      setSelectedReturnTrip(trip);
      // If both trips selected, proceed to booking
      if (selectedTrip) {
        sessionStorage.setItem('selectedTrip', JSON.stringify(selectedTrip));
        sessionStorage.setItem('selectedReturnTrip', JSON.stringify(trip));
        sessionStorage.setItem('passengerCount', form.passengers.toString());
        navigate('/booking');
      }
    } else {
      setSelectedTrip(trip);
      // If one-way, proceed immediately
      if (form.tripType === 'one-way') {
        sessionStorage.setItem('selectedTrip', JSON.stringify(trip));
        sessionStorage.setItem('passengerCount', form.passengers.toString());
        navigate('/booking');
      } else if (selectedReturnTrip) {
        // If return trip already selected
        sessionStorage.setItem('selectedTrip', JSON.stringify(trip));
        sessionStorage.setItem('selectedReturnTrip', JSON.stringify(selectedReturnTrip));
        sessionStorage.setItem('passengerCount', form.passengers.toString());
        navigate('/booking');
      } else {
        // Show return trips
        setShowingReturnTrips(true);
      }
    }
  };

  const calculateDuration = (departure: string, arrival: string) => {
    const dep = new Date(departure);
    const arr = new Date(arrival);
    const diff = arr.getTime() - dep.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <Card className={`max-w-5xl mx-auto bg-white/95 backdrop-blur-sm shadow-2xl transition-all duration-500 ${
      expanded ? 'max-w-6xl' : ''
    }`}>
      <CardContent className="p-6">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Trip Type */}
          <div className="flex gap-3 mb-4">
            <button
              type="button"
              onClick={() => setForm({ ...form, tripType: 'one-way' })}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                form.tripType === 'one-way'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              One-Way
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, tripType: 'return' })}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                form.tripType === 'return'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Return Trip
            </button>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {/* From */}
            <div>
              <Label htmlFor="from" className="text-sm font-medium mb-2 block">
                From
              </Label>
              <select
                id="from"
                value={form.from}
                onChange={(e) => setForm({ ...form, from: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:ring-2 focus:ring-ring"
                required
              >
                <option value="">Select city</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* To */}
            <div>
              <Label htmlFor="to" className="text-sm font-medium mb-2 block">
                To
              </Label>
              <select
                id="to"
                value={form.to}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:ring-2 focus:ring-ring"
                required
              >
                <option value="">Select city</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Travel Date */}
            <div>
              <Label htmlFor="travelDate" className="text-sm font-medium mb-2 block">
                {form.tripType === 'return' ? 'Departure Date' : 'Travel Date'}
              </Label>
              <DateInput
                id="travelDate"
                value={form.travelDate}
                onChange={(value) => setForm({ ...form, travelDate: value })}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            {/* Return Date */}
            {form.tripType === 'return' && (
              <div>
                <Label htmlFor="returnDate" className="text-sm font-medium mb-2 block">
                  Return Date
                </Label>
                <DateInput
                  id="returnDate"
                  value={form.returnDate}
                  onChange={(value) => setForm({ ...form, returnDate: value })}
                  min={form.travelDate || new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            )}

            {/* Passengers */}
            <div>
              <Label htmlFor="passengers" className="text-sm font-medium mb-2 block">
                Passengers
              </Label>
              <div className="relative">
                <Input
                  id="passengers"
                  type="number"
                  min="1"
                  max="60"
                  value={form.passengers}
                  onChange={(e) => setForm({ ...form, passengers: parseInt(e.target.value) || 1 })}
                  className="w-full"
                  required
                />
                <Users className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full md:w-auto px-12" disabled={searching}>
            {searching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              'Search Trips'
            )}
          </Button>
        </form>

        {/* Trip Results - Extended Section */}
        {expanded && (trips.length > 0 || returnTrips.length > 0) && (
          <div className="mt-8 space-y-4 animate-in slide-in-from-top duration-500">
            <div className="border-t pt-6">
              {/* Toggle for Return Trips */}
              {form.tripType === 'return' && returnTrips.length > 0 && (
                <div className="flex gap-2 mb-4">
                  <Button
                    type="button"
                    variant={!showingReturnTrips ? 'default' : 'outline'}
                    onClick={() => setShowingReturnTrips(false)}
                    className="flex-1"
                  >
                    Outbound Trip
                    {selectedTrip && ' ✓'}
                  </Button>
                  <Button
                    type="button"
                    variant={showingReturnTrips ? 'default' : 'outline'}
                    onClick={() => setShowingReturnTrips(true)}
                    className="flex-1"
                  >
                    Return Trip
                    {selectedReturnTrip && ' ✓'}
                  </Button>
                </div>
              )}

              <h3 className="text-xl font-semibold mb-4">
                {form.tripType === 'return' && showingReturnTrips
                  ? `Return Trips (${returnTrips.length})`
                  : `Available Trips (${trips.length})`}
              </h3>
              
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {(showingReturnTrips ? returnTrips : trips).map((trip) => {
                  const isSelected = showingReturnTrips
                    ? selectedReturnTrip?.id === trip.id
                    : selectedTrip?.id === trip.id;

                  return (
                    <div
                      key={trip.id}
                      className={`border rounded-lg p-4 hover:bg-muted/50 transition-all hover:shadow-md ${
                        isSelected ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                    <div className="flex items-start justify-between gap-4">
                      {/* Trip Details */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="text-lg font-bold">
                            {new Date(trip.scheduled_departure).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <div className="text-lg font-bold">
                            {trip.scheduled_arrival
                              ? new Date(trip.scheduled_arrival).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'TBA'}
                          </div>
                          {trip.scheduled_arrival && (
                            <Badge variant="secondary">
                              <Clock className="h-3 w-3 mr-1" />
                              {calculateDuration(trip.scheduled_departure, trip.scheduled_arrival)}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {trip.route.origin} → {trip.route.destination}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm flex-wrap">
                          <div className="flex items-center gap-1">
                            <Bus className="h-3 w-3" />
                            <span>{trip.bus.name}</span>
                          </div>
                          <Badge variant="outline">{trip.bus.bus_type}</Badge>
                          <Badge variant="outline">{trip.trip_number}</Badge>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{trip.available_seats} seats available</span>
                          </div>
                        </div>
                      </div>

                      {/* Price and Action */}
                      <div className="text-right space-y-3 flex-shrink-0">
                        <div>
                          <div className="text-2xl font-bold flex items-center gap-1">
                            <span className="font-bold">P</span>
                            {trip.fare.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">per seat</div>
                        </div>
                        <Button
                          onClick={() => selectTrip(trip, showingReturnTrips)}
                          size="sm"
                          className="w-full"
                          variant={isSelected ? 'default' : 'outline'}
                        >
                          {isSelected ? '✓ Selected' : 'Select Trip'}
                        </Button>
                      </div>
                    </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* No Results Message */}
        {expanded && trips.length === 0 && !searching && (
          <div className="mt-8 text-center py-8 border-t">
            <Bus className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No trips found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or selecting a different date
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
