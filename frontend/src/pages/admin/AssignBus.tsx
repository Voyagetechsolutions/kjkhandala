import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bus, TrendingUp, Calendar, AlertCircle, MapPin, Clock, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface BusData {
  id: string;
  registration_number: string;
  total_mileage: number;
  status: string;
  seating_capacity?: number;
  model?: string;
}

interface Trip {
  id: string;
  route_id: string;
  bus_id: string | null;
  driver_id: string | null;
  departure_date: string;
  departure_time: string;
  arrival_time: string | null;
  fare: number;
  status: string;
  routes?: { origin: string; destination: string };
  buses?: { registration_number: string };
  drivers?: { full_name: string };
}

export default function AssignBus() {
  const navigate = useNavigate();

  const [buses, setBuses] = useState<BusData[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchBuses();
    fetchTrips();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = trips.filter(trip => 
        trip.routes?.origin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.routes?.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.buses?.registration_number?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTrips(filtered);
    } else {
      setFilteredTrips(trips);
    }
  }, [searchQuery, trips]);

  // Fetch all unassigned or upcoming trips
  const fetchTrips = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("trips")
      .select(`
        *,
        routes:route_id (origin, destination),
        buses:bus_id (registration_number),
        drivers:driver_id (full_name)
      `)
      .gte('departure_date', format(new Date(), 'yyyy-MM-dd'))
      .in('status', ['SCHEDULED', 'BOARDING'])
      .order('departure_date', { ascending: true })
      .order('departure_time', { ascending: true })
      .limit(100);

    if (error) {
      console.error("Error fetching trips:", error);
      toast.error("Failed to load trips");
    } else {
      setTrips(data || []);
      setFilteredTrips(data || []);
    }
    setLoading(false);
  };

  // Fetch available buses
  const fetchBuses = async () => {
    const { data, error } = await supabase
      .from("buses")
      .select("id, registration_number, total_mileage, status, seating_capacity, model")
      .eq('status', 'ACTIVE')
      .order("registration_number", { ascending: true });

    if (error) {
      console.error("Error fetching buses:", error);
      toast.error("Failed to load buses");
    } else {
      setBuses(data || []);
    }
  };

  // Get recommended bus using smart logic
  const getRecommendedBus = async (tripId: string) => {
    // Call the assign_bus function to get least-used bus
    const { data, error } = await supabase.rpc("assign_bus");
    
    if (error || !data || data.length === 0) {
      // Fallback: return first available bus
      return buses[0]?.id || null;
    }
    
    return data[0].bus_id;
  };

  // Assign bus to trip
  const assignBusToTrip = async (trip: Trip, busId: string) => {
    setAssigning(true);

    const { error } = await supabase
      .from("trips")
      .update({ bus_id: busId })
      .eq("id", trip.id);

    setAssigning(false);

    if (!error) {
      toast.success(`Bus assigned successfully!`);
      setSelectedTrip(null);
      fetchTrips(); // Refresh trips
    } else {
      console.error("Error assigning bus:", error);
      toast.error("Failed to assign bus. Please try again.");
    }
  };

  // Auto-assign recommended bus
  const autoAssignBus = async (trip: Trip) => {
    const recommendedBusId = await getRecommendedBus(trip.id);
    if (recommendedBusId) {
      await assignBusToTrip(trip, recommendedBusId);
    } else {
      toast.error("No available buses found");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin w-10 h-10 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Smart Bus Assignment</h2>
          <p className="text-muted-foreground mt-1">
            Automated bus assignment for upcoming trips
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search trips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{trips.length}</p>
            <p className="text-xs text-muted-foreground">Upcoming scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unassigned</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {trips.filter(t => !t.bus_id).length}
            </p>
            <p className="text-xs text-muted-foreground">Need bus assignment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Buses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{buses.length}</p>
            <p className="text-xs text-muted-foreground">Ready for assignment</p>
          </CardContent>
        </Card>
      </div>

      {/* Trips Table */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Trips</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Current Bus</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No trips found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTrips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {trip.routes?.origin} → {trip.routes?.destination}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {format(new Date(trip.departure_date), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {trip.departure_time}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {trip.buses ? (
                        <div className="flex items-center gap-2">
                          <Bus className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{trip.buses.registration_number}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={trip.bus_id ? "default" : "secondary"}>
                        {trip.bus_id ? "Assigned" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedTrip(trip)}
                          disabled={assigning}
                        >
                          {trip.bus_id ? "Change" : "Assign"}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => autoAssignBus(trip)}
                          disabled={assigning || buses.length === 0}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {assigning ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <TrendingUp className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bus Selection Dialog */}
      {selectedTrip && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Select Bus for Trip</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTrip(null)}>
                Cancel
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedTrip.routes?.origin} → {selectedTrip.routes?.destination} on{' '}
              {format(new Date(selectedTrip.departure_date), 'MMM dd, yyyy')}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {buses.map((bus) => (
                <div
                  key={bus.id}
                  className="p-4 border rounded-lg hover:border-primary cursor-pointer transition-colors"
                  onClick={() => assignBusToTrip(selectedTrip, bus.id)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Bus className="h-5 w-5 text-primary" />
                    <p className="font-bold">{bus.registration_number}</p>
                  </div>
                  {bus.model && (
                    <p className="text-sm text-muted-foreground">Model: {bus.model}</p>
                  )}
                  {bus.seating_capacity && (
                    <p className="text-sm text-muted-foreground">
                      Capacity: {bus.seating_capacity} seats
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
