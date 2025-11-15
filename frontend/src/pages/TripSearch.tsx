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

interface Schedule {
  id: string;
  departure_date: string;
  departure_time: string;
  available_seats: number;
  routes: {
    origin: string;
    destination: string;
    price: number;
    duration_hours: number;
    route_type: 'local' | 'cross_border';
  };
  buses: {
    name: string;
    number_plate: string;
  };
}

export default function TripSearch() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: cities, isLoading: citiesLoading } = useCities();
  
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    date: "",
    seats: 1,
  });
  const [schedules, setSchedules] = useState<Schedule[]>([]);
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
      let query = supabase
        .from("schedules")
        .select(`*, routes (origin, destination, price, duration_hours, route_type), buses (name, number_plate)`)
        .eq("routes.origin", params.origin)
        .eq("routes.destination", params.destination)
        .gte("available_seats", params.seats);
      if (params.date) {
        query = query.eq("departure_date", params.date);
      }
      const { data, error } = await query;
      if (error) throw error;
      setSchedules(data || []);
      if (!data || data.length === 0) {
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
    setLoading(true);
    try {
      let query = supabase
        .from("schedules")
        .select(`*, routes (origin, destination, price, duration_hours, route_type), buses (name, number_plate)`)
        .eq("routes.origin", form.origin)
        .eq("routes.destination", form.destination)
        .gte("available_seats", form.seats);
      if (form.date) {
        query = query.eq("departure_date", form.date);
      }
      const { data, error } = await query;
      if (error) throw error;
      setSchedules(data || []);
      if (!data || data.length === 0) {
        toast.info("No trips found matching your criteria");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to search trips");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTrip = (schedule: Schedule) => {
    // Pass selected trip and form data to next step (passenger details)
    navigate("/book/passengers", { state: { schedule, form } });
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
          {schedules.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Available Trips</h2>
              <div className="space-y-4">
                {schedules.map(schedule => (
                  <Card key={schedule.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="grid md:grid-cols-5 gap-4 items-center">
                      {/* Route Info */}
                      <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-5 w-5 text-primary" />
                          <span className="font-semibold text-lg">{schedule.routes.origin}</span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-lg">{schedule.routes.destination}</span>
                        </div>
                        <Badge variant={schedule.routes.route_type === 'local' ? 'secondary' : 'default'}>
                          {schedule.routes.route_type === 'local' ? 'STANDARD' : 'PREMIUM'}
                        </Badge>
                      </div>

                      {/* Time & Date */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="font-medium">{schedule.departure_time}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(schedule.departure_date).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Bus & Duration */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Bus className="h-4 w-4 text-primary" />
                          <span>{schedule.buses.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{schedule.routes.duration_hours}h duration</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{schedule.available_seats} seats left</span>
                        </div>
                      </div>

                      {/* Price & Action */}
                      <div className="text-right space-y-2">
                        <div className="text-3xl font-bold text-primary">
                          P{schedule.routes.price}
                        </div>
                        <div className="text-sm text-muted-foreground">per passenger</div>
                        <Button onClick={() => handleSelectTrip(schedule)} className="w-full" size="lg">
                          Select Trip
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
