import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import OperationsLayout from '@/components/operations/OperationsLayout';
import GenerateShiftsDialog from '@/components/operations/GenerateShiftsDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Bus, MapPin, Clock, Calendar, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function DriverShifts() {
  // Fetch driver shifts
  const { data: shifts = [], isLoading, error: shiftsError } = useQuery({
    queryKey: ['driver-shifts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_shifts')
        .select(`
          *,
          drivers:driver_id (full_name, phone, license_number),
          buses:bus_id (registration_number),
          routes:route_id (origin, destination)
        `)
        .order('start_time', { ascending: true });
      
      if (error) {
        console.error('Error fetching shifts:', error);
        // Return empty array instead of throwing to prevent crash
        return [];
      }
      return data || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: false, // Don't retry if table doesn't exist
  });

  // Filter shifts
  const today = new Date();
  const todayShifts = shifts.filter((shift: any) => {
    const shiftDate = new Date(shift.start_time);
    return shiftDate.toDateString() === today.toDateString();
  });

  const activeShifts = shifts.filter((shift: any) => 
    shift.status === 'on_duty' || shift.status === 'driving' || shift.status === 'ON_DUTY' || shift.status === 'DRIVING'
  );

  const upcomingShifts = shifts.filter((shift: any) => {
    const shiftDate = new Date(shift.start_time);
    return shiftDate > today && (shift.status === 'scheduled' || shift.status === 'SCHEDULED');
  });

  const completedShifts = shifts.filter((shift: any) => 
    shift.status === 'completed' || shift.status === 'COMPLETED'
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'secondary';
      case 'ON_DUTY': return 'default';
      case 'DRIVING': return 'default';
      case 'COMPLETED': return 'outline';
      case 'CANCELLED': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ON_DUTY': return 'On Duty';
      case 'DRIVING': return 'Driving';
      default: return status.charAt(0) + status.slice(1).toLowerCase();
    }
  };

  const ShiftRow = ({ shift }: { shift: any }) => (
    <TableRow key={shift.id}>
      <TableCell>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">{shift.drivers?.full_name}</p>
            <p className="text-xs text-muted-foreground">{shift.drivers?.license_number}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={getStatusColor(shift.status)}>
          {getStatusLabel(shift.status)}
        </Badge>
      </TableCell>
      <TableCell>
        <div>
          <p className="text-sm font-medium">
            {format(new Date(shift.start_time), 'HH:mm')} - {format(new Date(shift.end_time), 'HH:mm')}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(shift.start_time), 'dd MMM yyyy')}
          </p>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm">
              {shift.routes?.origin} → {shift.routes?.destination}
            </p>
            <p className="text-xs text-muted-foreground">
              {shift.shift_date && format(new Date(shift.shift_date), 'dd MMM')}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        {shift.buses ? (
          <div className="flex items-center gap-2">
            <Bus className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{shift.buses.registration_number}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Not assigned</span>
        )}
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <p>Start: {format(new Date(shift.start_time), 'HH:mm')}</p>
          <p className="text-xs text-muted-foreground">
            End: {format(new Date(shift.end_time), 'HH:mm')}
          </p>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <OperationsLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Driver Shifts</h1>
            <p className="text-muted-foreground">
              Auto-generated driver shifts with real-time status updates
            </p>
          </div>
          <GenerateShiftsDialog />
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Today's Shifts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{todayShifts.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Active Now
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{activeShifts.length}</p>
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
              <p className="text-2xl font-bold text-purple-600">{upcomingShifts.length}</p>
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
              <p className="text-2xl font-bold text-green-600">{completedShifts.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="today" className="space-y-4">
          <TabsList>
            <TabsTrigger value="today">Today's Shifts</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          {/* Today's Shifts */}
          <TabsContent value="today">
            <Card>
              <CardHeader>
                <CardTitle>Shifts Today - {format(today, 'dd MMMM yyyy')}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="text-center py-8">Loading shifts...</div>
                ) : todayShifts.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Driver</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Shift Time</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Bus</TableHead>
                        <TableHead>Trip Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {todayShifts.map((shift: any) => <ShiftRow key={shift.id} shift={shift} />)}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No shifts scheduled for today</p>
                    <p className="text-sm mb-4">Generate shifts automatically to assign drivers and buses</p>
                    <GenerateShiftsDialog />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Shifts */}
          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Active Shifts (On Duty / Driving)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {activeShifts.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Driver</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Shift Time</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Bus</TableHead>
                        <TableHead>Trip Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeShifts.map((shift: any) => <ShiftRow key={shift.id} shift={shift} />)}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active shifts at the moment</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upcoming Shifts */}
          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Shifts</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {upcomingShifts.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Driver</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Shift Time</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Bus</TableHead>
                        <TableHead>Trip Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingShifts.map((shift: any) => <ShiftRow key={shift.id} shift={shift} />)}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No upcoming shifts</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Completed Shifts */}
          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Completed Shifts</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {completedShifts.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Driver</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Shift Time</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Bus</TableHead>
                        <TableHead>Trip Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completedShifts.map((shift: any) => <ShiftRow key={shift.id} shift={shift} />)}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No completed shifts</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </OperationsLayout>
  );
}
