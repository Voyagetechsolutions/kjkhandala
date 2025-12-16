import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useCities } from "@/hooks/useCities";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MapPin, Clock, Bus, Users, ArrowRight } from "lucide-react";

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

export default function TripSearch() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: cities, isLoading: citiesLoading, error: citiesError } = useCities();
  
  // Debug logging
  console.log('Cities data:', cities);
  console.log('Cities loading:', citiesLoading);
  console.log('Cities error:', citiesError);
  
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    date: "",
    seats: 1,
  });
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);

  // Handle search params from homepage
  useEffect(() => {
    const searchParams = location.state?.searchParams;
    if (searchParams) {
      setForm({
        origin: searchParams.from || "",
        destination: searchParams.to || "",
        date: searchParams.travelDate || "",
        seats: searchParams.passengers || 1,
      });
      // Auto-search if we have the required params
      if (searchParams.from && searchParams.to && searchParams.travelDate) {
        handleSearchWithParams({
          origin: searchParams.from,
          destination: searchParams.to,
          date: searchParams.travelDate,
          seats: searchParams.passengers || 1,
        });
      }
    }
  }, [location.state]);

  const handleSearchWithParams = async (params: typeof form) => {
    setLoading(true);
    try {
      // Search for trips
      const { data, error } = await supabase
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
        `)
        .gte('departure_time', `${params.date}T00:00:00`)
        .lte('departure_time', `${params.date}T23:59:59`)
        .in('status', ['SCHEDULED', 'BOARDING'])
        .order('departure_time');

      if (error) throw error;

      // Get seat counts for each trip
      const tripsWithSeats = await Promise.all(
        (data || []).map(async (trip: any) => {
          const { count: bookedCount } = await supabase
            .from('booking_seats')
            .select('*', { count: 'exact', head: true })
            .eq('trip_id', trip.id)
            .in('status', ['reserved', 'sold']);

          const booked = bookedCount || 0;
          const total = 60; // Fixed 60 seats
          const available = total - booked;

          return {
            id: trip.id,
            trip_number: trip.trip_number,
            departure_time: trip.departure_time,
            arrival_time: trip.arrival_time,
            base_fare: trip.base_fare,
            status: trip.status,
            total_seats: total,
            available_seats: available,
            routes: trip.routes,
            buses: trip.buses,
          };
        })
      );

      // Filter by origin, destination and available seats
      const filtered = tripsWithSeats.filter(
        (trip) =>
          trip.routes?.origin?.toLowerCase() === params.origin.toLowerCase() &&
          trip.routes?.destination?.toLowerCase() === params.destination.toLowerCase() &&
          trip.available_seats >= params.seats
      );

      setTrips(filtered);
      if (filtered.length === 0) {
        toast.info("No trips found matching your criteria");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to search trips");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.origin || !form.destination || !form.date) {
      toast.error("Please fill in all required fields");
      return;
    }
    await handleSearchWithParams(form);
  };

  const handleSelectTrip = (trip: Trip) => {
    // Store trip and passenger count in sessionStorage
    sessionStorage.setItem('selectedTrip', JSON.stringify(trip));
    sessionStorage.setItem('passengers', form.seats.toString());
    // Navigate to passenger details
    navigate("/book/passengers");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Search for Trips</h1>
          <Card className="p-6 mb-8">
            <form onSubmit={handleSearch} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="origin">From</Label>
          <Select value={form.origin} onValueChange={(value) => setForm(f => ({ ...f, origin: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select origin" />
            </SelectTrigger>
            <SelectContent>
              {citiesLoading ? (
                <SelectItem value="loading" disabled>Loading cities...</SelectItem>
              ) : (
                cities?.map(city => (
                  <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="destination">To</Label>
          <Select value={form.destination} onValueChange={(value) => setForm(f => ({ ...f, destination: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select destination" />
            </SelectTrigger>
            <SelectContent>
              {citiesLoading ? (
                <SelectItem value="loading" disabled>Loading cities...</SelectItem>
              ) : (
                cities?.map(city => (
                  <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="seats">Number of Seats</Label>
          <Input
            id="seats"
            type="number"
            min={1}
            max={10}
            value={form.seats}
            onChange={e => setForm(f => ({ ...f, seats: Number(e.target.value) }))}
            required
          />
        </div>
        
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Searching..." : "Search Trips"}
              </Button>
            </form>
          </Card>

          {/* Trip Results */}
          {trips.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Available Trips ({trips.length})</h2>
              <div className="space-y-4">
                {trips.map(trip => {
                  const departure = new Date(trip.departure_time);
                  const arrival = trip.arrival_time ? new Date(trip.arrival_time) : null;
                  const duration = arrival 
                    ? `${Math.floor((arrival.getTime() - departure.getTime()) / (1000 * 60 * 60))}h ${Math.floor(((arrival.getTime() - departure.getTime()) % (1000 * 60 * 60)) / (1000 * 60))}m`
                    : 'N/A';

                  return (
                    <Card key={trip.id} className="p-6 hover:shadow-lg transition-shadow">
                      <div className="grid md:grid-cols-5 gap-4 items-center">
                        {/* Route Info */}
                        <div className="md:col-span-2">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            <span className="font-semibold text-lg">{trip.routes?.origin}</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold text-lg">{trip.routes?.destination}</span>
                          </div>
                          <Badge variant="secondary">
                            {trip.buses?.bus_type || 'Standard'}
                          </Badge>
                        </div>

                        {/* Time & Date */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="font-medium">
                              {departure.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {departure.toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Trip #{trip.trip_number}
                          </div>
                        </div>

                        {/* Bus & Duration */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Bus className="h-4 w-4 text-primary" />
                            <span>{trip.buses?.name || 'TBA'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{duration} duration</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{trip.available_seats} seats left</span>
                          </div>
                        </div>

                        {/* Price & Action */}
                        <div className="text-right space-y-2">
                          <div className="text-3xl font-bold text-primary">
                            P{trip.base_fare?.toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground">per passenger</div>
                          <Button onClick={() => handleSelectTrip(trip)} className="w-full" size="lg">
                            Select Trip
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
