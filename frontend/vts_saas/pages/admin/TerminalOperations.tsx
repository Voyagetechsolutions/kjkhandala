import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Monitor, Bus, Clock, Users, TrendingUp, AlertCircle, CheckCircle, 
  ArrowUp, ArrowDown, Activity, MapPin, Calendar, RefreshCw, Eye,
  Settings, Bell, Download, Filter, Search
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface TerminalStats {
  totalTrips: number;
  activeTrips: number;
  completedTrips: number;
  totalPassengers: number;
  onTimePerformance: number;
  averageDelay: number;
}

interface TerminalTrip {
  id: string;
  route_id: string;
  bus_id: string;
  driver_id: string;
  scheduled_departure: string;
  scheduled_arrival: string;
  actual_departure?: string;
  actual_arrival?: string;
  status: 'SCHEDULED' | 'BOARDING' | 'DEPARTED' | 'ARRIVED' | 'DELAYED' | 'CANCELLED';
  total_seats: number;
  available_seats: number;
  routes?: {
    origin: string;
    destination: string;
  };
  buses?: {
    registration_number: string;
    capacity: number;
  };
  drivers?: {
    full_name: string;
  };
  _count?: {
    bookings: number;
  };
}

export default function TerminalOperations() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const queryClient = useQueryClient();

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['terminal-operations'] });
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, queryClient]);

  // Fetch terminal operations data
  const { data: terminalData, isLoading, error } = useQuery({
    queryKey: ['terminal-operations', selectedDate],
    queryFn: async () => {
      const startOfDay = new Date(selectedDate);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Fetch trips for the selected date
      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select(`
          *,
          routes:route_id (origin, destination),
          buses:bus_id (registration_number, capacity),
          drivers:driver_id (full_name),
          bookings!inner (id)
        `)
        .gte('departure_date', selectedDate)
        .lte('departure_date', selectedDate)
        .order('departure_time', { ascending: true });

      if (tripsError) throw tripsError;

      // Calculate stats
      const stats: TerminalStats = {
        totalTrips: trips?.length || 0,
        activeTrips: trips?.filter(t => ['SCHEDULED', 'BOARDING', 'DEPARTED'].includes(t.status)).length || 0,
        completedTrips: trips?.filter(t => t.status === 'ARRIVED').length || 0,
        totalPassengers: trips?.reduce((sum, trip) => sum + (trip.total_seats - trip.available_seats), 0) || 0,
        onTimePerformance: 0, // Calculate based on actual vs scheduled times
        averageDelay: 0, // Calculate average delay in minutes
      };

      return { trips: trips || [], stats };
    },
  });

  // Update trip status mutation
  const updateTripStatusMutation = useMutation({
    mutationFn: async ({ tripId, status }: { tripId: string; status: string }) => {
      const { data, error } = await supabase
        .from('trips')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', tripId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Trip status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['terminal-operations'] });
    },
    onError: (error) => {
      toast.error('Failed to update trip status: ' + error.message);
    },
  });

  const filteredTrips = terminalData?.trips?.filter(trip => {
    const matchesStatus = selectedStatus === 'all' || trip.status === selectedStatus;
    const matchesSearch = !searchQuery || 
      trip.routes?.origin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.routes?.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.buses?.registration_number?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  }) || [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: string; icon: React.ReactNode }> = {
      SCHEDULED: { variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
      BOARDING: { variant: 'default', icon: <Users className="h-3 w-3" /> },
      DEPARTED: { variant: 'default', icon: <Bus className="h-3 w-3" /> },
      ARRIVED: { variant: 'outline', icon: <CheckCircle className="h-3 w-3" /> },
      DELAYED: { variant: 'destructive', icon: <AlertCircle className="h-3 w-3" /> },
      CANCELLED: { variant: 'destructive', icon: <AlertCircle className="h-3 w-3" /> },
    };
    
    const config = variants[status] || variants.SCHEDULED;
    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        {config.icon}
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return 'text-green-600';
    if (performance >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (error) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium">Error loading terminal data</h3>
            <p className="text-red-600 text-sm mt-1">{error.message}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Monitor className="h-6 w-6" />
              Terminal Operations
            </h1>
            <p className="text-muted-foreground">Real-time terminal monitoring and management</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['terminal-operations'] })}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
            >
              <Activity className="h-4 w-4 mr-2" />
              Auto-Refresh: {autoRefresh ? 'On' : 'Off'}
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{terminalData?.stats.totalTrips || 0}</div>
              <p className="text-xs text-muted-foreground">Total Trips</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{terminalData?.stats.activeTrips || 0}</div>
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{terminalData?.stats.completedTrips || 0}</div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{terminalData?.stats.totalPassengers || 0}</div>
              <p className="text-xs text-muted-foreground">Passengers</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${getPerformanceColor(terminalData?.stats.onTimePerformance || 0)}`}>
                {terminalData?.stats.onTimePerformance || 0}%
              </div>
              <p className="text-xs text-muted-foreground">On-Time</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">
                {terminalData?.stats.averageDelay || 0}m
              </div>
              <p className="text-xs text-muted-foreground">Avg Delay</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="date">Date:</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="status">Status:</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="BOARDING">Boarding</SelectItem>
                    <SelectItem value="DEPARTED">Departed</SelectItem>
                    <SelectItem value="ARRIVED">Arrived</SelectItem>
                    <SelectItem value="DELAYED">Delayed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 max-w-sm">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search trips..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trips Table */}
        <Card>
          <CardHeader>
            <CardTitle>Terminal Trips</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading terminal data...</div>
            ) : filteredTrips.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No trips found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trip Details</TableHead>
                    <TableHead>Bus & Driver</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Passengers</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrips.map((trip) => (
                    <TableRow key={trip.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {trip.routes?.origin} → {trip.routes?.destination}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Trip #{trip.id.slice(-8)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Bus className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{trip.buses?.registration_number}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{trip.drivers?.full_name}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(trip.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{format(new Date(`${trip.departure_date}T${trip.departure_time}`), 'HH:mm')}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(trip.departure_date), 'MMM dd')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{trip.total_seats - trip.available_seats}/{trip.total_seats}</div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full" 
                              style={{ width: `${((trip.total_seats - trip.available_seats) / trip.total_seats) * 100}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Trip Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Route</Label>
                                  <p>{trip.routes?.origin} → {trip.routes?.destination}</p>
                                </div>
                                <div>
                                  <Label>Bus</Label>
                                  <p>{trip.buses?.registration_number} (Capacity: {trip.buses?.capacity})</p>
                                </div>
                                <div>
                                  <Label>Driver</Label>
                                  <p>{trip.drivers?.full_name}</p>
                                </div>
                                <div>
                                  <Label>Departure</Label>
                                  <p>{format(new Date(`${trip.departure_date}T${trip.departure_time}`), 'PPP p')}</p>
                                </div>
                                <div>
                                  <Label>Passengers</Label>
                                  <p>{trip.total_seats - trip.available_seats} of {trip.total_seats} seats occupied</p>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Select
                            value={trip.status}
                            onValueChange={(value) => updateTripStatusMutation.mutate({ tripId: trip.id, status: value })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                              <SelectItem value="BOARDING">Boarding</SelectItem>
                              <SelectItem value="DEPARTED">Departed</SelectItem>
                              <SelectItem value="ARRIVED">Arrived</SelectItem>
                              <SelectItem value="DELAYED">Delayed</SelectItem>
                              <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
