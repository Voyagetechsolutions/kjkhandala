import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Bus,
  MapPin,
  Calendar as CalendarIcon,
  Users,
  Clock,
  ArrowRight,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  getTenantBySlug,
  validateApiKey,
  applyTenantBranding,
  setTenantContext,
  TenantData,
  TenantRoute,
} from "@/lib/api-integration";

interface Trip {
  id: string;
  route_id: string;
  departure_time: string;
  arrival_time: string;
  available_seats: number;
  price: number;
  bus_name: string;
  route_name: string;
}

export default function TenantBooking() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tenant, setTenant] = useState<TenantData | null>(null);

  // Search state
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [passengers, setPassengers] = useState(1);

  // Results state
  const [trips, setTrips] = useState<Trip[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (slug) {
      loadTenant();
    }
  }, [slug]);

  const loadTenant = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if API key is provided in URL
      const apiKey = searchParams.get("api_key");
      
      if (apiKey) {
        // Validate API key
        const validation = await validateApiKey(apiKey);
        if (!validation.verified) {
          setError(validation.error || "Invalid API key");
          setLoading(false);
          return;
        }
      }

      // Get tenant data by slug
      const tenantData = await getTenantBySlug(slug!);
      
      if (!tenantData) {
        setError("Company not found. Please check the URL.");
        setLoading(false);
        return;
      }

      setTenant(tenantData);
      setTenantContext(tenantData);
      
      // Apply branding
      if (tenantData.branding) {
        applyTenantBranding(tenantData.branding);
      }

      // Set document title
      document.title = `Book with ${tenantData.company.name}`;

    } catch (err: any) {
      console.error("Failed to load tenant:", err);
      setError("Failed to load booking page. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!origin || !destination || !date) {
      toast.error("Please select origin, destination, and date");
      return;
    }

    setSearchLoading(true);
    setHasSearched(true);

    try {
      // Find matching route
      const route = tenant?.routes.find(
        (r) => r.origin.toLowerCase() === origin.toLowerCase() &&
               r.destination.toLowerCase() === destination.toLowerCase()
      );

      if (!route) {
        setTrips([]);
        setSearchLoading(false);
        return;
      }

      // Fetch trips for this route and date
      const { data: tripsData, error } = await supabase
        .from("trips")
        .select(`
          id,
          route_id,
          departure_time,
          arrival_time,
          available_seats,
          price,
          buses(name),
          routes(name)
        `)
        .eq("route_id", route.id)
        .eq("status", "SCHEDULED")
        .gte("departure_time", format(date, "yyyy-MM-dd"))
        .lt("departure_time", format(new Date(date.getTime() + 86400000), "yyyy-MM-dd"))
        .order("departure_time", { ascending: true });

      if (error) throw error;

      const formattedTrips: Trip[] = (tripsData || []).map((t: any) => ({
        id: t.id,
        route_id: t.route_id,
        departure_time: t.departure_time,
        arrival_time: t.arrival_time,
        available_seats: t.available_seats,
        price: t.price,
        bus_name: t.buses?.name || "Standard Bus",
        route_name: t.routes?.name || `${origin} → ${destination}`,
      }));

      setTrips(formattedTrips);
    } catch (err) {
      console.error("Search error:", err);
      toast.error("Failed to search trips");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectTrip = (trip: Trip) => {
    // Navigate to booking details with trip info
    navigate(`/book/${slug}/checkout?trip=${trip.id}&passengers=${passengers}`);
  };

  // Get unique origins and destinations from routes
  const origins = [...new Set(tenant?.routes.map((r) => r.origin) || [])];
  const destinations = [...new Set(tenant?.routes.map((r) => r.destination) || [])];

  // Loading state
  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: tenant?.branding?.primary_color || "#003366" }}
      >
        <div className="text-center text-white">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p>Loading booking page...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Unable to Load</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tenant) return null;

  const primaryColor = tenant.branding.primary_color;
  const secondaryColor = tenant.branding.secondary_color;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header 
        className="py-4 px-6 shadow-sm"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant.company.logo_url ? (
              <img 
                src={tenant.company.logo_url} 
                alt={tenant.company.name}
                className="h-10 w-auto"
              />
            ) : (
              <Bus className="h-8 w-8 text-white" />
            )}
            <span className="text-xl font-bold text-white">
              {tenant.company.name}
            </span>
          </div>
          <div className="flex items-center gap-4 text-white/80 text-sm">
            {tenant.contact.support_phone && (
              <a href={`tel:${tenant.contact.support_phone}`} className="flex items-center gap-1 hover:text-white">
                <Phone className="h-4 w-4" />
                <span className="hidden md:inline">{tenant.contact.support_phone}</span>
              </a>
            )}
            {tenant.contact.support_email && (
              <a href={`mailto:${tenant.contact.support_email}`} className="flex items-center gap-1 hover:text-white">
                <Mail className="h-4 w-4" />
                <span className="hidden md:inline">{tenant.contact.support_email}</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero / Search Section */}
      <div 
        className="py-12 px-6"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` 
        }}
      >
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-2">
            Book Your Trip
          </h1>
          <p className="text-white/80 text-center mb-8">
            Safe, comfortable, and affordable travel
          </p>

          {/* Search Form */}
          <Card className="shadow-xl">
            <CardContent className="p-6">
              <div className="grid gap-4 md:grid-cols-5">
                {/* Origin */}
                <div className="space-y-2">
                  <Label>From</Label>
                  <Select value={origin} onValueChange={setOrigin}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select origin" />
                    </SelectTrigger>
                    <SelectContent>
                      {origins.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Destination */}
                <div className="space-y-2">
                  <Label>To</Label>
                  <Select value={destination} onValueChange={setDestination}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {destinations.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {date ? format(date, "MMM d, yyyy") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={(d) => d < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Passengers */}
                <div className="space-y-2">
                  <Label>Passengers</Label>
                  <Select value={passengers.toString()} onValueChange={(v) => setPassengers(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n} {n === 1 ? "Passenger" : "Passengers"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Search Button */}
                <div className="flex items-end">
                  <Button 
                    className="w-full"
                    style={{ backgroundColor: primaryColor }}
                    onClick={handleSearch}
                    disabled={searchLoading}
                  >
                    {searchLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Search"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {hasSearched && (
          <>
            {trips.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No trips found</h3>
                  <p className="text-muted-foreground">
                    No trips available for this route on the selected date.
                    Try a different date or route.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">
                  {trips.length} {trips.length === 1 ? "Trip" : "Trips"} Available
                </h2>
                
                {trips.map((trip) => (
                  <Card key={trip.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Trip Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <div className="text-center">
                              <p className="text-2xl font-bold">
                                {format(new Date(trip.departure_time), "HH:mm")}
                              </p>
                              <p className="text-sm text-muted-foreground">{origin}</p>
                            </div>
                            <div className="flex-1 flex items-center gap-2">
                              <div className="flex-1 border-t-2 border-dashed border-gray-300" />
                              <Bus className="h-5 w-5 text-muted-foreground" />
                              <div className="flex-1 border-t-2 border-dashed border-gray-300" />
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold">
                                {format(new Date(trip.arrival_time), "HH:mm")}
                              </p>
                              <p className="text-sm text-muted-foreground">{destination}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{trip.bus_name}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {trip.available_seats} seats left
                            </span>
                          </div>
                        </div>

                        {/* Price & Book */}
                        <div className="text-right">
                          <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                            R{trip.price.toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground mb-2">per person</p>
                          <Button 
                            style={{ backgroundColor: primaryColor }}
                            onClick={() => handleSelectTrip(trip)}
                            disabled={trip.available_seats < passengers}
                          >
                            {trip.available_seats < passengers ? "Not enough seats" : "Select"}
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Routes Info */}
        {!hasSearched && tenant.routes.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Our Routes</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {tenant.routes.map((route) => (
                <Card key={route.id} className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setOrigin(route.origin);
                    setDestination(route.destination);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${primaryColor}20` }}
                      >
                        <MapPin className="h-5 w-5" style={{ color: primaryColor }} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {route.origin} → {route.destination}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {route.duration_hours ? `${route.duration_hours}h` : ''} • {route.distance_km} km
                        </p>
                      </div>
                      <p className="font-bold" style={{ color: primaryColor }}>
                        From R{route.base_price}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t py-6 px-6 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {tenant.company.name}. All rights reserved.</p>
          <p>
            Powered by{" "}
            <a 
              href="https://voyagetechsolutions.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Voyage Tech Solutions
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
