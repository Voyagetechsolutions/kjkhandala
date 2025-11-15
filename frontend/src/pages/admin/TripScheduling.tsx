import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import OperationsLayout from '@/components/operations/OperationsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Calendar, Clock, MapPin, Bus, User, Play, Pause, CheckCircle, UserCog, Navigation, AlertCircle, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import TripForm from '@/components/trips/TripForm';
import TripCalendar from '@/components/trips/TripCalendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export default function TripScheduling() {
  const location = useLocation();
  const isOperationsRoute = location.pathname.startsWith('/operations');
  const Layout = isOperationsRoute ? OperationsLayout : AdminLayout;

  const [showForm, setShowForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [assignmentData, setAssignmentData] = useState({
    bus_id: '',
    driver_id: '',
    days: [] as string[],
  });
  const queryClient = useQueryClient();

  // Fetch all trips/schedules
  const { data: tripsData, isLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('scheduled_departure', { ascending: false });
      if (error) throw error;
      return { trips: data || [] };
    },
  });

  // Fetch buses for assignment
  const { data: buses } = useQuery({
    queryKey: ['buses-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buses')
        .select('id, bus_number, name, status')
        .eq('status', 'active')
        .order('bus_number');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch drivers for assignment
  const { data: drivers } = useQuery({
    queryKey: ['drivers-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('id, full_name, license_number, status')
        .eq('status', 'active')
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch live trips (currently active) with full details
  const { data: liveTrips, isLoading: liveTripsLoading } = useQuery({
    queryKey: ['live-trips'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Query with joins for complete trip information
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          routes (id, origin, destination, distance),
          buses (id, bus_number, name, gps_device_id),
          driver_assignments (
            id,
            drivers (id, full_name, phone, license_number)
          )
        `)
        .gte('scheduled_departure', today)
        .in('status', ['DEPARTED', 'IN_PROGRESS', 'BOARDING'])
        .order('scheduled_departure', { ascending: true });
      
      if (error) {
        console.error('Error fetching live trips:', error);
        // Return empty array instead of throwing to prevent UI crash
        return [];
      }
      return data || [];
    },
    refetchInterval: 15000, // Refresh every 15 seconds for live updates
  });

  // Trip Actions
  const startTripMutation = useMutation({
    mutationFn: async (tripId: string) => {
      const { error } = await supabase
        .from('trips')
        .update({ status: 'DEPARTED', actual_departure: new Date().toISOString() })
        .eq('id', tripId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Trip started successfully');
      queryClient.invalidateQueries({ queryKey: ['trips-scheduling'] });
    },
  });

  const completeTripMutation = useMutation({
    mutationFn: async (tripId: string) => {
      const { error } = await supabase
        .from('trips')
        .update({ status: 'COMPLETED', actual_arrival: new Date().toISOString() })
        .eq('id', tripId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Trip completed successfully');
      queryClient.invalidateQueries({ queryKey: ['trips-scheduling'] });
    },
  });

  const cancelTripMutation = useMutation({
    mutationFn: async ({ tripId, reason }: { tripId: string; reason: string }) => {
      const { error } = await supabase
        .from('trips')
        .update({ status: 'CANCELLED', cancellation_reason: reason })
        .eq('id', tripId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Trip cancelled');
      queryClient.invalidateQueries({ queryKey: ['trips-scheduling'] });
    },
  });

  // Assign bus and driver mutation
  const assignBusDriverMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTrip || !assignmentData.bus_id || !assignmentData.driver_id) {
        throw new Error('Missing required fields');
      }

      // Update trip with bus and driver
      const { error: tripError } = await supabase
        .from('trips')
        .update({
          bus_id: assignmentData.bus_id,
          operating_days: assignmentData.days.length > 0 ? assignmentData.days : null,
        })
        .eq('id', selectedTrip.id);

      if (tripError) throw tripError;

      // Create driver assignment
      const { error: assignError } = await supabase
        .from('driver_assignments')
        .insert({
          trip_id: selectedTrip.id,
          driver_id: assignmentData.driver_id,
          assignment_date: new Date().toISOString(),
          status: 'active',
        });

      if (assignError) throw assignError;
    },
    onSuccess: () => {
      toast.success('Bus and driver assigned successfully');
      setShowAssignDialog(false);
      setSelectedTrip(null);
      setAssignmentData({ bus_id: '', driver_id: '', days: [] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign bus and driver');
    },
  });

  // Summary stats
  const trips = tripsData?.trips || [];
  const todayTrips = trips.filter((t: any) => 
    t.scheduled_departure?.startsWith(new Date().toISOString().split('T')[0])
  ).length;

  const activeTrips = trips.filter((t: any) => t.status === 'DEPARTED' || t.status === 'IN_TRANSIT').length;
  const completedTrips = trips.filter((t: any) => t.status === 'COMPLETED').length;
  const upcomingTrips = trips.filter((t: any) => 
    new Date(t.departureDate) > new Date() && t.status === 'SCHEDULED'
  ).length || 0;

  const handleEdit = (trip: any) => {
    setEditingTrip(trip);
    setShowForm(true);
  };

  const handleAssign = (trip: any) => {
    setSelectedTrip(trip);
    setAssignmentData({
      bus_id: trip.bus_id || '',
      driver_id: '',
      days: trip.operating_days || [],
    });
    setShowAssignDialog(true);
  };

  const toggleDay = (day: string) => {
    setAssignmentData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day],
    }));
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
    <Layout>
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
                              {trip.scheduled_departure ? (
                                <>
                                  <p>{format(new Date(trip.scheduled_departure), 'MMM dd, yyyy')}</p>
                                  <p className="text-xs text-muted-foreground">{format(new Date(trip.scheduled_departure), 'HH:mm')}</p>
                                </>
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {trip.scheduled_arrival ? (
                                <>
                                  <p>{format(new Date(trip.scheduled_arrival), 'MMM dd, yyyy')}</p>
                                  <p className="text-xs text-muted-foreground">{format(new Date(trip.scheduled_arrival), 'HH:mm')}</p>
                                </>
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(trip.status)} gap-1`}>
                              {getStatusIcon(trip.status)}
                              {trip.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" size="sm" onClick={() => handleAssign(trip)}>
                                <UserCog className="h-3 w-3 mr-1" />
                                Assign
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleEdit(trip)}>
                                View
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
          </TabsContent>

          {/* Calendar View Tab */}
          <TabsContent value="calendar">
            <TripCalendar trips={trips || []} selectedDate={selectedDate} onDateSelect={setSelectedDate} />
          </TabsContent>

          {/* Live Status Tab */}
          <TabsContent value="live" className="space-y-4">
            {/* Live Stats Summary */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Now</p>
                      <p className="text-2xl font-bold text-green-600">{liveTrips?.length || 0}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <Play className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Boarding</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {liveTrips?.filter((t: any) => t.status === 'BOARDING').length || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">In Transit</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {liveTrips?.filter((t: any) => t.status === 'DEPARTED' || t.status === 'IN_PROGRESS').length || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-full">
                      <Navigation className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Live Trips List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-green-500" />
                    Live Trips - Currently Active
                  </CardTitle>
                  <Badge variant="outline" className="animate-pulse">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                    Live
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {liveTripsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                    <p>Loading live trips...</p>
                  </div>
                ) : liveTrips?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Pause className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-semibold mb-2">No active trips at the moment</p>
                    <p className="text-sm">Trips will appear here when they start boarding or depart</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {liveTrips?.map((trip: any) => {
                      const statusConfig = {
                        BOARDING: { color: 'bg-blue-500', icon: Clock, label: 'Boarding' },
                        DEPARTED: { color: 'bg-green-500', icon: Play, label: 'Departed' },
                        IN_PROGRESS: { color: 'bg-orange-500', icon: Navigation, label: 'In Transit' },
                      };
                      const config = statusConfig[trip.status as keyof typeof statusConfig] || statusConfig.DEPARTED;
                      const StatusIcon = config.icon;

                      return (
                        <div key={trip.id} className="p-5 border-2 rounded-lg hover:shadow-md transition-all bg-gradient-to-r from-white to-gray-50">
                          {/* Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-3 ${config.color} rounded-lg shadow-lg`}>
                                <Bus className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <p className="font-bold text-lg">
                                  {trip.routes?.origin} → {trip.routes?.destination}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Trip #{trip.trip_number || trip.id.slice(0, 8)}
                                </p>
                              </div>
                            </div>
                            <Badge className={`${config.color} text-white`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {config.label}
                            </Badge>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Bus className="h-3 w-3" />
                                Bus
                              </p>
                              <p className="font-semibold text-sm">{trip.buses?.bus_number || 'N/A'}</p>
                              <p className="text-xs text-muted-foreground">{trip.buses?.name || ''}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Driver
                              </p>
                              <p className="font-semibold text-sm">
                                {trip.driver_assignments?.[0]?.drivers?.full_name || 'Unassigned'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {trip.driver_assignments?.[0]?.drivers?.phone || ''}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Departure
                              </p>
                              <p className="font-semibold text-sm">
                                {trip.scheduled_departure ? format(new Date(trip.scheduled_departure), 'HH:mm') : 'N/A'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {trip.actual_departure ? `Left at ${format(new Date(trip.actual_departure), 'HH:mm')}` : 'Not departed'}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                ETA
                              </p>
                              <p className="font-semibold text-sm">
                                {trip.scheduled_arrival ? format(new Date(trip.scheduled_arrival), 'HH:mm') : 'N/A'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {trip.routes?.distance ? `${trip.routes.distance} km` : ''}
                              </p>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          {trip.status !== 'BOARDING' && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Progress</span>
                                <span>Estimated</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full animate-pulse" style={{ width: '45%' }} />
                              </div>
                            </div>
                          )}

                          {/* GPS Tracking */}
                          {trip.buses?.gps_device_id && (
                            <div className="mt-3 pt-3 border-t flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm">
                                <Navigation className="h-4 w-4 text-green-500" />
                                <span className="text-muted-foreground">GPS Tracking:</span>
                                <span className="font-mono font-semibold">{trip.buses.gps_device_id}</span>
                              </div>
                              <Button variant="outline" size="sm">
                                <Navigation className="h-3 w-3 mr-1" />
                                Track Live
                              </Button>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="mt-4 pt-4 border-t flex gap-2">
                            {trip.status === 'BOARDING' && (
                              <Button size="sm" onClick={() => startTripMutation.mutate(trip.id)}>
                                <Play className="h-3 w-3 mr-1" />
                                Start Trip
                              </Button>
                            )}
                            {(trip.status === 'DEPARTED' || trip.status === 'IN_PROGRESS') && (
                              <Button size="sm" variant="outline" onClick={() => completeTripMutation.mutate(trip.id)}>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Mark Complete
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </div>
                        </div>
                      );
                    })}
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

        {/* Bus/Driver Assignment Dialog */}
        <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Assign Bus & Driver</DialogTitle>
              <DialogDescription>
                Assign a bus and driver to this trip and select operating days
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Trip Info */}
              {selectedTrip && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-semibold mb-1">
                    {selectedTrip.routes?.origin} → {selectedTrip.routes?.destination}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Departure: {selectedTrip.scheduled_departure ? format(new Date(selectedTrip.scheduled_departure), 'MMM dd, yyyy HH:mm') : 'N/A'}
                  </p>
                </div>
              )}

              {/* Bus Selection */}
              <div className="space-y-2">
                <Label>Select Bus</Label>
                <Select
                  value={assignmentData.bus_id}
                  onValueChange={(value) => setAssignmentData(prev => ({ ...prev, bus_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a bus" />
                  </SelectTrigger>
                  <SelectContent>
                    {buses?.map((bus: any) => (
                      <SelectItem key={bus.id} value={bus.id}>
                        {bus.bus_number} - {bus.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Driver Selection */}
              <div className="space-y-2">
                <Label>Select Driver</Label>
                <Select
                  value={assignmentData.driver_id}
                  onValueChange={(value) => setAssignmentData(prev => ({ ...prev, driver_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers?.map((driver: any) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.full_name} - {driver.license_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Operating Days */}
              <div className="space-y-3">
                <Label>Operating Days (Optional)</Label>
                <p className="text-sm text-muted-foreground">
                  Select which days this trip operates. Leave empty for one-time trips.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {daysOfWeek.map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={day}
                        checked={assignmentData.days.includes(day)}
                        onCheckedChange={() => toggleDay(day)}
                      />
                      <label
                        htmlFor={day}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {day}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAssignDialog(false);
                    setSelectedTrip(null);
                    setAssignmentData({ bus_id: '', driver_id: '', days: [] });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => assignBusDriverMutation.mutate()}
                  disabled={!assignmentData.bus_id || !assignmentData.driver_id || assignBusDriverMutation.isPending}
                >
                  {assignBusDriverMutation.isPending ? 'Assigning...' : 'Assign'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
