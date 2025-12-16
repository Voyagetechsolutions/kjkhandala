import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import TicketingLayout from '@/components/ticketing/TicketingLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Building2, 
  Bus, 
  Users, 
  Clock, 
  Activity, 
  AlertCircle, 
  CheckCircle,
  Navigation,
  MapPin
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function TerminalScreen() {
  const { user } = useAuth();
  const [selectedTerminalId, setSelectedTerminalId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch terminals
  const { data: terminals = [] } = useQuery({
    queryKey: ['terminals-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('terminals')
        .select('*')
        .eq('status', 'active')
        .order('terminal_name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch user's ticketing office to auto-select terminal
  const { data: userOffice } = useQuery({
    queryKey: ['user-office', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('ticketing_offices')
        .select('*, terminals(*)')
        .eq('manager_id', user.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Auto-select terminal from user's office
  useEffect(() => {
    if (userOffice?.terminal_id && !selectedTerminalId) {
      setSelectedTerminalId(userOffice.terminal_id);
    }
  }, [userOffice, selectedTerminalId]);

  // Fetch terminal data with auto-refresh
  const { data: terminalData, isLoading } = useQuery({
    queryKey: ['terminal-operations', selectedTerminalId],
    queryFn: async () => {
      if (!selectedTerminalId) return null;

      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();
      const twoHoursLater = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

      // Fetch today's trips for this terminal
      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select(`
          *,
          routes(origin, destination),
          buses(registration_number, name),
          drivers(full_name),
          terminal_gates(gate_number, gate_name)
        `)
        .eq('terminal_id', selectedTerminalId)
        .gte('scheduled_departure', `${today}T00:00:00`)
        .lte('scheduled_departure', `${today}T23:59:59`)
        .order('scheduled_departure');

      if (tripsError) throw tripsError;

      // Fetch gates for this terminal
      const { data: gates, error: gatesError } = await supabase
        .from('terminal_gates')
        .select('*')
        .eq('terminal_id', selectedTerminalId)
        .order('gate_number');

      if (gatesError) throw gatesError;

      // Fetch recent activities
      const { data: activities, error: activitiesError } = await supabase
        .from('terminal_activities')
        .select('*, trips(trip_number), terminal_gates(gate_number)')
        .eq('terminal_id', selectedTerminalId)
        .gte('created_at', `${today}T00:00:00`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (activitiesError) throw activitiesError;

      // Calculate stats
      const upcomingTrips = (trips || []).filter((trip: any) => 
        trip.scheduled_departure >= now && trip.scheduled_departure <= twoHoursLater
      );

      const boardingTrips = (trips || []).filter((trip: any) => 
        trip.status === 'BOARDING'
      );

      const departedToday = (trips || []).filter((trip: any) => 
        trip.status === 'DEPARTED' || trip.status === 'COMPLETED'
      ).length;

      const availableGates = (gates || []).filter((gate: any) => 
        gate.status === 'available'
      ).length;

      return {
        trips: trips || [],
        gates: gates || [],
        activities: activities || [],
        stats: {
          totalTrips: trips?.length || 0,
          upcoming: upcomingTrips.length,
          boarding: boardingTrips.length,
          departed: departedToday,
          availableGates,
          totalGates: gates?.length || 0,
        },
      };
    },
    enabled: !!selectedTerminalId,
    refetchInterval: autoRefresh ? 10000 : false, // Auto-refresh every 10 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-500';
      case 'BOARDING': return 'bg-yellow-500';
      case 'DEPARTED': return 'bg-green-500';
      case 'COMPLETED': return 'bg-gray-500';
      case 'CANCELLED': return 'bg-red-500';
      case 'DELAYED': return 'bg-orange-500';
      default: return 'bg-gray-400';
    }
  };

  const getGateStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'occupied': return 'bg-blue-500';
      case 'maintenance': return 'bg-orange-500';
      case 'closed': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'boarding': return <Users className="h-4 w-4" />;
      case 'departure': return <Navigation className="h-4 w-4" />;
      case 'arrival': return <MapPin className="h-4 w-4" />;
      case 'delay': return <Clock className="h-4 w-4" />;
      case 'cancellation': return <AlertCircle className="h-4 w-4" />;
      case 'gate_change': return <Activity className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <TicketingLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Terminal Operations</h1>
            <p className="text-muted-foreground">
              Real-time terminal monitoring and management
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <Select value={selectedTerminalId || ''} onValueChange={setSelectedTerminalId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select Terminal" />
              </SelectTrigger>
              <SelectContent>
                {terminals.map((terminal: any) => (
                  <SelectItem key={terminal.id} value={terminal.id}>
                    {terminal.terminal_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={autoRefresh ? 'default' : 'outline'}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
              {autoRefresh ? 'Live' : 'Paused'}
            </Button>
          </div>
        </div>

        {!selectedTerminalId ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Select a Terminal</h3>
              <p className="text-muted-foreground">
                Choose a terminal from the dropdown above to view operations
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Bus className="h-4 w-4" />
                    Total Trips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{terminalData?.stats.totalTrips || 0}</p>
                  <p className="text-xs text-muted-foreground">Today</p>
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
                  <p className="text-2xl font-bold text-orange-600">{terminalData?.stats.upcoming || 0}</p>
                  <p className="text-xs text-muted-foreground">Next 2 hours</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Boarding
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-yellow-600">{terminalData?.stats.boarding || 0}</p>
                  <p className="text-xs text-muted-foreground">Active now</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Departed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">{terminalData?.stats.departed || 0}</p>
                  <p className="text-xs text-muted-foreground">Today</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Available Gates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-600">{terminalData?.stats.availableGates || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    of {terminalData?.stats.totalGates || 0}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-600">
                    {terminalData?.activities.filter((a: any) => 
                      ['delay', 'cancellation'].includes(a.activity_type)
                    ).length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Today</p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Today's Trips */}
              <Card>
                <CardHeader>
                  <CardTitle>Today's Trips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Route</TableHead>
                          <TableHead>Gate</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8">
                              Loading trips...
                            </TableCell>
                          </TableRow>
                        ) : terminalData?.trips.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              No trips scheduled for today
                            </TableCell>
                          </TableRow>
                        ) : (
                          terminalData?.trips.map((trip: any) => (
                            <TableRow key={trip.id}>
                              <TableCell className="font-medium">
                                {format(new Date(trip.scheduled_departure), 'HH:mm')}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium">
                                    {trip.routes?.origin} → {trip.routes?.destination}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {trip.buses?.registration_number}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {trip.terminal_gates?.gate_number || (
                                  <span className="text-muted-foreground text-sm">Not assigned</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge className={`${getStatusColor(trip.status)} text-white text-xs`}>
                                  {trip.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Gates Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Gate Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-3">
                      {terminalData?.gates.map((gate: any) => (
                        <div
                          key={gate.id}
                          className={`p-4 border rounded-lg ${
                            gate.status === 'occupied' ? 'bg-blue-50 border-blue-200' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">{gate.gate_number}</span>
                            <Badge className={`${getGateStatusColor(gate.status)} text-white text-xs`}>
                              {gate.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{gate.gate_name}</p>
                          {gate.current_trip_id && (
                            <p className="text-xs text-blue-600 mt-1">Trip in progress</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {terminalData?.activities.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No activities recorded today</p>
                  ) : (
                    terminalData?.activities.map((activity: any) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className={`p-2 rounded-full ${
                          ['delay', 'cancellation'].includes(activity.activity_type)
                            ? 'bg-red-100 text-red-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {getActivityIcon(activity.activity_type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium capitalize">
                              {activity.activity_type.replace('_', ' ')}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(activity.created_at), 'HH:mm')}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {activity.description || `Trip ${activity.trips?.trip_number || 'N/A'}`}
                            {activity.terminal_gates && ` - ${activity.terminal_gates.gate_number}`}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </TicketingLayout>
  );
}
