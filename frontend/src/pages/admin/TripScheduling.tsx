import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Calendar, Clock, MapPin, Bus, User, Play, Pause, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import TripForm from '@/components/trips/TripForm';
import TripCalendar from '@/components/trips/TripCalendar';

export default function TripScheduling() {
  const [showForm, setShowForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const queryClient = useQueryClient();

  // Fetch all trips/schedules
  const { data: trips, isLoading } = useQuery({
    queryKey: ['trips-scheduling'],
    queryFn: async () => {
      const response = await api.get('/trips');
      return response.data.data || [];
    },
  });

  // Fetch live trips (currently active)
  const { data: liveTrips } = useQuery({
    queryKey: ['live-trips'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get(`/trips?date=${today}&status=DEPARTED`);
      return response.data.data || [];
    },
    refetchInterval: 30000,
  });

  // Trip Actions
  const startTripMutation = useMutation({
    mutationFn: async (tripId: string) => {
      await api.post(`/trips/${tripId}/start`);
    },
    onSuccess: () => {
      toast.success('Trip started successfully');
      queryClient.invalidateQueries({ queryKey: ['trips-scheduling'] });
    },
  });

  const completeTripMutation = useMutation({
    mutationFn: async (tripId: string) => {
      await api.post(`/trips/${tripId}/complete`);
    },
    onSuccess: () => {
      toast.success('Trip completed successfully');
      queryClient.invalidateQueries({ queryKey: ['trips-scheduling'] });
    },
  });

  const cancelTripMutation = useMutation({
    mutationFn: async ({ tripId, reason }: { tripId: string; reason: string }) => {
      await api.post(`/trips/${tripId}/cancel`, { reason });
    },
    onSuccess: () => {
      toast.success('Trip cancelled');
      queryClient.invalidateQueries({ queryKey: ['trips-scheduling'] });
    },
  });

  // Summary stats
  const todayTrips = trips?.filter((t: any) => 
    t.departureDate?.startsWith(new Date().toISOString().split('T')[0])
  ).length || 0;

  const activeTrips = trips?.filter((t: any) => t.status === 'DEPARTED' || t.status === 'IN_TRANSIT').length || 0;
  const completedTrips = trips?.filter((t: any) => t.status === 'COMPLETED').length || 0;
  const upcomingTrips = trips?.filter((t: any) => 
    new Date(t.departureDate) > new Date() && t.status === 'SCHEDULED'
  ).length || 0;

  const handleEdit = (trip: any) => {
    setEditingTrip(trip);
    setShowForm(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-3 w-3" />;
      case 'active': return <Play className="h-3 w-3" />;
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      case 'cancelled': return <Pause className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Trip Scheduling</h1>
            <p className="text-muted-foreground">Manage trip schedules and monitor live operations</p>
          </div>
          <Button onClick={() => { setEditingTrip(null); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Trip
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Trips Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{todayTrips}</p>
              <p className="text-xs text-muted-foreground">{activeTrips} currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Play className="h-4 w-4" />
                Active Trips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{activeTrips}</p>
              <p className="text-xs text-muted-foreground">On the road now</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{completedTrips}</p>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{upcomingTrips}</p>
              <p className="text-xs text-muted-foreground">Scheduled ahead</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="table" className="space-y-4">
          <TabsList>
            <TabsTrigger value="table">Trip Table</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="live">Live Status</TabsTrigger>
          </TabsList>

          {/* Trip Table Tab */}
          <TabsContent value="table" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trip ID</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Bus</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Departure</TableHead>
                      <TableHead>Arrival</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          Loading trips...
                        </TableCell>
                      </TableRow>
                    ) : trips?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No trips scheduled
                        </TableCell>
                      </TableRow>
                    ) : (
                      trips?.slice(0, 50).map((trip: any) => (
                        <TableRow key={trip.id}>
                          <TableCell className="font-mono text-xs">{trip.id.slice(0, 8)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">
                                {trip.routes?.origin} → {trip.routes?.destination}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Bus className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{trip.buses?.bus_number || 'N/A'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">
                                {trip.driver_assignments?.[0]?.drivers?.full_name || 'Unassigned'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{format(new Date(trip.departure_date), 'MMM dd, yyyy')}</p>
                              <p className="text-xs text-muted-foreground">{trip.departure_time}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{format(new Date(trip.arrival_date), 'MMM dd, yyyy')}</p>
                              <p className="text-xs text-muted-foreground">{trip.arrival_time}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(trip.status)} gap-1`}>
                              {getStatusIcon(trip.status)}
                              {trip.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(trip)}>
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar View Tab */}
          <TabsContent value="calendar">
            <TripCalendar trips={trips || []} selectedDate={selectedDate} onDateSelect={setSelectedDate} />
          </TabsContent>

          {/* Live Status Tab */}
          <TabsContent value="live" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-green-500" />
                  Live Trips - Currently Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                {liveTrips?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Pause className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active trips at the moment</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {liveTrips?.map((trip: any) => (
                      <div key={trip.id} className="p-4 border rounded-lg bg-green-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500 rounded-lg">
                              <Bus className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold">
                                {trip.routes?.origin} → {trip.routes?.destination}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Bus: {trip.buses?.bus_number} • Driver: {trip.driver_assignments?.[0]?.drivers?.full_name}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-green-500">
                            <Play className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Departed:</span> {trip.departure_time}
                          </div>
                          <div>
                            <span className="text-muted-foreground">ETA:</span> {trip.arrival_time}
                          </div>
                          {trip.buses?.gps_device_id && (
                            <div>
                              <span className="text-muted-foreground">GPS:</span> {trip.buses.gps_device_id}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Trip Form Dialog */}
        {showForm && (
          <TripForm
            trip={editingTrip}
            onClose={() => { setShowForm(false); setEditingTrip(null); }}
            onSuccess={() => {
              setShowForm(false);
              setEditingTrip(null);
              queryClient.invalidateQueries({ queryKey: ['trips-scheduling'] });
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}
