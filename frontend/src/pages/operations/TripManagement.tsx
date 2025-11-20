import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import OperationsLayout from '@/components/operations/OperationsLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, RefreshCw, Bus, User, MapPin, Clock, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function TripManagement() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [showReplaceDriver, setShowReplaceDriver] = useState(false);
  const [showReplaceBus, setShowReplaceBus] = useState(false);

  const [newTrip, setNewTrip] = useState({
    routeId: '',
    busId: '',
    driverId: '',
    departureTime: '',
    arrivalTime: '',
    fare: '',
  });

  const queryClient = useQueryClient();

  // Date navigation functions
  const goToPreviousDay = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() - 1);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const goToNextDay = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + 1);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Fetch trips
  const { data: tripsData, isLoading } = useQuery({
    queryKey: ['operations-trips', selectedDate, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('trips')
        .select(`
          *,
          route:routes(*),
          bus:buses(*),
          driver:drivers(*)
        `)
        .order('scheduled_departure', { ascending: false });
      
      if (selectedDate) {
        query = query.gte('scheduled_departure', `${selectedDate}T00:00:00`)
                     .lte('scheduled_departure', `${selectedDate}T23:59:59`);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return { trips: data || [] };
    },
    refetchInterval: 30000,
  });

  // Fetch routes for trip creation
  const { data: routesData } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('is_active', true)
        .order('origin');
      if (error) throw error;
      return { routes: data || [] };
    },
  });

  // Fetch available buses
  const { data: busesData } = useQuery({
    queryKey: ['buses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buses')
        .select('*')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return { buses: data || [] };
    },
  });

  // Fetch available drivers
  const { data: driversData } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('status', 'active')
        .order('full_name');
      if (error) throw error;
      return { drivers: data || [] };
    },
  });

  // Create trip mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('trips')
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations-trips'] });
      toast.success('Trip created successfully');
      setShowCreateDialog(false);
      setNewTrip({
        routeId: '',
        busId: '',
        driverId: '',
        departureTime: '',
        arrivalTime: '',
        fare: '',
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create trip');
    },
  });

  // Update trip status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: any) => {
      const { error } = await supabase
        .from('trips')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations-trips'] });
      toast.success('Trip status updated');
    },
    onError: () => {
      toast.error('Failed to update trip status');
    },
  });

  // Replace driver mutation
  const replaceDriverMutation = useMutation({
    mutationFn: async ({ id, driverId }: any) => {
      const { error } = await supabase
        .from('trips')
        .update({ driver_id: driverId })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations-trips'] });
      toast.success('Driver replaced successfully');
      setShowReplaceDriver(false);
    },
    onError: () => {
      toast.error('Failed to replace driver');
    },
  });

  // Replace bus mutation
  const replaceBusMutation = useMutation({
    mutationFn: async ({ id, busId }: any) => {
      const { error } = await supabase
        .from('trips')
        .update({ bus_id: busId })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations-trips'] });
      toast.success('Bus replaced successfully');
      setShowReplaceBus(false);
    },
    onError: () => {
      toast.error('Failed to replace bus');
    },
  });

  const trips = tripsData?.trips || [];
  const routes = routesData?.routes || [];
  const buses = busesData?.buses || [];
  const drivers = driversData?.drivers || [];

  const handleCreateTrip = () => {
    createMutation.mutate(newTrip);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      SCHEDULED: { variant: 'secondary', label: 'Scheduled' },
      BOARDING: { variant: 'default', label: 'Boarding' },
      DEPARTED: { variant: 'default', label: 'Departed' },
      COMPLETED: { variant: 'outline', label: 'Completed' },
      CANCELLED: { variant: 'destructive', label: 'Cancelled' },
      DELAYED: { variant: 'secondary', label: 'Delayed' },
    };
    
    const config = statusConfig[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  return (
    <OperationsLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Trip Management</h1>
            <p className="text-muted-foreground">Schedule, monitor, and manage all trips</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Trip
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Date</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToPreviousDay}
                    title="Previous day"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToNextDay}
                    title="Next day"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={goToToday}
                    title="Go to today"
                  >
                    Today
                  </Button>
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="BOARDING">Boarding</SelectItem>
                    <SelectItem value="DEPARTED">Departed</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="DELAYED">Delayed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['operations-trips'] })}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trips List */}
        <Card>
          <CardHeader>
            <CardTitle>Trips for {selectedDate}</CardTitle>
            <CardDescription>
              {trips.length} trip(s) found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading trips...</div>
            ) : trips.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No trips found for selected filters
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route</TableHead>
                    <TableHead>Bus</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Departure</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead>Load</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trips.map((trip: any) => (
                    <TableRow key={trip.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{trip.route?.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {trip.route?.origin} → {trip.route?.destination}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Bus className="h-4 w-4" />
                          {trip.bus?.registrationNumber || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <div>
                            {trip.driver ? `${trip.driver.firstName} ${trip.driver.lastName}` : 'Unassigned'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {new Date(trip.departureTime).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(trip.status)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {trip.bookedSeats}/{trip.bus?.capacity || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{trip.loadFactor}%</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          P {trip.revenue?.toLocaleString() || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          onValueChange={(action) => {
                            if (action === 'driver') {
                              setSelectedTrip(trip);
                              setShowReplaceDriver(true);
                            } else if (action === 'bus') {
                              setSelectedTrip(trip);
                              setShowReplaceBus(true);
                            } else if (action.startsWith('status:')) {
                              const status = action.replace('status:', '');
                              updateStatusMutation.mutate({ id: trip.id, status });
                            }
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Actions" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="driver">Replace Driver</SelectItem>
                            <SelectItem value="bus">Replace Bus</SelectItem>
                            <SelectItem value="status:BOARDING">Start Boarding</SelectItem>
                            <SelectItem value="status:DEPARTED">Depart Trip</SelectItem>
                            <SelectItem value="status:COMPLETED">Complete Trip</SelectItem>
                            <SelectItem value="status:CANCELLED">Cancel Trip</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Trip Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Trip</DialogTitle>
              <DialogDescription>Schedule a new trip for your fleet</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Route</Label>
                <Select value={newTrip.routeId} onValueChange={(value) => setNewTrip({ ...newTrip, routeId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select route" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map((route: any) => (
                      <SelectItem key={route.id} value={route.id}>
                        {route.name} ({route.origin} → {route.destination})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Bus</Label>
                  <Select value={newTrip.busId} onValueChange={(value) => setNewTrip({ ...newTrip, busId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bus" />
                    </SelectTrigger>
                    <SelectContent>
                      {buses.map((bus: any) => (
                        <SelectItem key={bus.id} value={bus.id}>
                          {bus.registrationNumber} - {bus.model} (Cap: {bus.capacity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Driver</Label>
                  <Select value={newTrip.driverId} onValueChange={(value) => setNewTrip({ ...newTrip, driverId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map((driver: any) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.firstName} {driver.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Departure Time</Label>
                  <Input
                    type="datetime-local"
                    value={newTrip.departureTime}
                    onChange={(e) => setNewTrip({ ...newTrip, departureTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Arrival Time</Label>
                  <Input
                    type="datetime-local"
                    value={newTrip.arrivalTime}
                    onChange={(e) => setNewTrip({ ...newTrip, arrivalTime: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Fare (P)</Label>
                <Input
                  type="number"
                  placeholder="Enter fare amount"
                  value={newTrip.fare}
                  onChange={(e) => setNewTrip({ ...newTrip, fare: e.target.value })}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTrip} disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Trip'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Replace Driver Dialog */}
        <Dialog open={showReplaceDriver} onOpenChange={setShowReplaceDriver}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Replace Driver</DialogTitle>
              <DialogDescription>Select a new driver for this trip</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>New Driver</Label>
                <Select
                  onValueChange={(driverId) => {
                    replaceDriverMutation.mutate({ id: selectedTrip?.id, driverId });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((driver: any) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.firstName} {driver.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Replace Bus Dialog */}
        <Dialog open={showReplaceBus} onOpenChange={setShowReplaceBus}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Replace Bus</DialogTitle>
              <DialogDescription>Select a new bus for this trip</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>New Bus</Label>
                <Select
                  onValueChange={(busId) => {
                    replaceBusMutation.mutate({ id: selectedTrip?.id, busId });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bus" />
                  </SelectTrigger>
                  <SelectContent>
                    {buses.map((bus: any) => (
                      <SelectItem key={bus.id} value={bus.id}>
                        {bus.registrationNumber} - {bus.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </OperationsLayout>
  );
}
