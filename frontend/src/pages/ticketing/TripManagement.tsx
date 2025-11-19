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
  Calendar, MapPin, Bus, Users, Clock, FileText, CheckCircle2, 
  XCircle, AlertCircle, RefreshCw, ArrowLeft 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TripManagement() {
  const { user, userRoles, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : TicketingLayout;

  const [trips, setTrips] = useState<any[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (user) {
      fetchTrips();
    }
  }, [user, filterDate, filterStatus]);

  const fetchTrips = async () => {
    try {
      setLoadingTrips(true);

      let query = supabase
        .from('trips')
        .select(`
          *,
          route:routes(id, origin, destination),
          bus:buses(id, name, number_plate, seating_capacity),
          driver:drivers(id, full_name, phone)
        `)
        .gte('scheduled_departure', `${filterDate}T00:00:00`)
        .lte('scheduled_departure', `${filterDate}T23:59:59`)
        .order('scheduled_departure');

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus.toUpperCase());
      }

      const { data: trips, error } = await query;

      if (error) throw error;

      // Fetch bookings for all trips
      const tripIds = trips?.map(t => t.id) || [];
      const { data: bookings } = await supabase
        .from('bookings')
        .select('trip_id, seat_number')
        .in('trip_id', tripIds)
        .neq('booking_status', 'cancelled');

      // Calculate seats for each trip
      const tripsWithSeats = trips?.map(trip => {
        const tripBookings = bookings?.filter(b => b.trip_id === trip.id) || [];
        const bookedSeats = tripBookings.length;
        const bus = Array.isArray(trip.bus) ? trip.bus[0] : trip.bus;
        const totalSeats = bus?.seating_capacity || trip.total_seats || 60;
        const availableSeats = totalSeats - bookedSeats;
        const occupancyRate = (bookedSeats / totalSeats) * 100;

        // Determine zone
        let zone = 'red';
        let zoneLabel = '🟥 RED';
        if (bookedSeats >= 36) {
          zone = 'green';
          zoneLabel = '🟩 GREEN';
        } else if (bookedSeats >= 21) {
          zone = 'yellow';
          zoneLabel = '🟨 YELLOW';
        }

        return {
          ...trip,
          bus,
          route: Array.isArray(trip.route) ? trip.route[0] : trip.route,
          driver: Array.isArray(trip.driver) ? trip.driver[0] : trip.driver,
          total_seats: totalSeats,
          booked_seats: bookedSeats,
          available_seats: availableSeats,
          occupancy_rate: occupancyRate,
          zone,
          zone_label: zoneLabel,
        };
      }) || [];

      setTrips(tripsWithSeats);

    } catch (error: any) {
      console.error('Error fetching trips:', error);
      toast({
        variant: 'destructive',
        title: 'Error loading trips',
        description: error.message,
      });
    } finally {
      setLoadingTrips(false);
    }
  };

  const viewManifest = (tripId: string) => {
    // Navigate to manifest view
    navigate(`/ticketing/manifest/${tripId}`);
  };

  const checkInPassengers = (tripId: string) => {
    // Navigate to check-in
    navigate(`/ticketing/check-in?trip=${tripId}`);
  };

  const updateTripStatus = async (tripId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('trips')
        .update({ status: newStatus.toUpperCase() })
        .eq('id', tripId);

      if (error) throw error;

      toast({
        title: 'Status updated',
        description: `Trip status changed to ${newStatus}`,
      });

      fetchTrips();

    } catch (error: any) {
      console.error('Error updating trip:', error);
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: error.message,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'SCHEDULED':
        return 'secondary';
      case 'BOARDING':
        return 'default';
      case 'DEPARTED':
        return 'outline';
      case 'IN_PROGRESS':
        return 'default';
      case 'COMPLETED':
        return 'outline';
      case 'CANCELLED':
        return 'destructive';
      case 'DELAYED':
        return 'secondary';
      default:
        return 'secondary';
    }
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
            <h1 className="text-3xl font-bold mb-2">🚌 Trip Management</h1>
            <p className="text-muted-foreground">Manage today's trips and passenger manifest</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchTrips} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(isAdminRoute ? '/admin/ticketing' : '/ticketing')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter trips by date and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filter_date">Date</Label>
                <Input
                  id="filter_date"
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter_status">Status</Label>
                <select
                  id="filter_status"
                  className="w-full p-2 border rounded"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="boarding">Boarding</option>
                  <option value="departed">Departed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="delayed">Delayed</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button onClick={fetchTrips} className="w-full">
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trips List */}
        <Card>
          <CardHeader>
            <CardTitle>Trips ({trips.length})</CardTitle>
            <CardDescription>
              {new Date(filterDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTrips ? (
              <div className="text-center py-12">Loading trips...</div>
            ) : trips.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No trips found for this date</p>
              </div>
            ) : (
              <div className="space-y-4">
                {trips.map((trip) => (
                  <Card key={trip.id} className="border-2">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold">{trip.trip_number}</h3>
                            <Badge variant={getStatusColor(trip.status)}>
                              {trip.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {trip.routes?.origin} → {trip.routes?.destination}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              Departure: {new Date(trip.departure_time).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {trip.booked_seats}/{trip.total_seats}
                          </div>
                          <div className="text-xs text-muted-foreground">seats booked</div>
                          <div className="mt-2">
                            <Badge 
                              variant={
                                trip.available_seats < 10 ? 'destructive' :
                                trip.available_seats < 20 ? 'secondary' :
                                'outline'
                              }
                            >
                              {trip.available_seats} available
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Bus:</span>
                          <p className="font-medium">
                            {trip.buses?.name || 'Not assigned'} 
                            {trip.buses?.number_plate && ` (${trip.buses.number_plate})`}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Driver:</span>
                          <p className="font-medium">{trip.drivers?.full_name || 'Not assigned'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Base Fare:</span>
                          <p className="font-medium">P {trip.base_fare?.toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Revenue:</span>
                          <p className="font-medium">
                            P {(trip.booked_seats * (trip.base_fare || 0)).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button 
                          onClick={() => viewManifest(trip.id)} 
                          variant="outline" 
                          size="sm"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          View Manifest
                        </Button>
                        <Button 
                          onClick={() => checkInPassengers(trip.id)} 
                          variant="outline" 
                          size="sm"
                          disabled={trip.status === 'COMPLETED' || trip.status === 'CANCELLED'}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Check-In
                        </Button>
                        {trip.status === 'SCHEDULED' && (
                          <Button 
                            onClick={() => updateTripStatus(trip.id, 'BOARDING')} 
                            variant="outline" 
                            size="sm"
                          >
                            <Users className="h-4 w-4 mr-1" />
                            Start Boarding
                          </Button>
                        )}
                        {trip.status === 'BOARDING' && (
                          <Button 
                            onClick={() => updateTripStatus(trip.id, 'DEPARTED')} 
                            variant="outline" 
                            size="sm"
                          >
                            <Bus className="h-4 w-4 mr-1" />
                            Mark Departed
                          </Button>
                        )}
                        {trip.status === 'DEPARTED' && (
                          <Button 
                            onClick={() => updateTripStatus(trip.id, 'COMPLETED')} 
                            variant="outline" 
                            size="sm"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Mark Completed
                          </Button>
                        )}
                        {(trip.status === 'SCHEDULED' || trip.status === 'BOARDING') && (
                          <>
                            <Button 
                              onClick={() => updateTripStatus(trip.id, 'DELAYED')} 
                              variant="outline" 
                              size="sm"
                            >
                              <AlertCircle className="h-4 w-4 mr-1" />
                              Mark Delayed
                            </Button>
                            <Button 
                              onClick={() => updateTripStatus(trip.id, 'CANCELLED')} 
                              variant="destructive" 
                              size="sm"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancel Trip
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
