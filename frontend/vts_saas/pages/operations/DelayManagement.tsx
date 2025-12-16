import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import OperationsLayout from '@/components/operations/OperationsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, AlertCircle, Users, AlertTriangle } from 'lucide-react';

export default function DelayManagement() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : OperationsLayout;

  // AUTO-DETECT DELAYS: now > departure AND not departed
  const { data: delaysData, isLoading } = useQuery({
    queryKey: ['automated-delays'],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('trips')
        .select(`
          id,
          scheduled_departure,
          scheduled_arrival,
          status,
          routes(origin, destination),
          buses(name, registration),
          drivers(first_name, last_name),
          bookings(id)
        `)
        .lt('scheduled_departure', now)
        .gt('scheduled_arrival', now)
        .not('status', 'in', '("DEPARTED","COMPLETED","CANCELLED")')
        .order('scheduled_departure', { ascending: true });
      
      if (error) throw error;
      
      // Calculate delay minutes for each trip
      return (data || []).map((trip: any) => {
        const departureTime = new Date(trip.scheduled_departure);
        const currentTime = new Date();
        const delayMinutes = Math.floor((currentTime.getTime() - departureTime.getTime()) / (1000 * 60));
        
        return {
          ...trip,
          delayMinutes,
          affectedPassengers: trip.bookings?.length || 0,
          severity: delayMinutes >= 60 ? 'CRITICAL' : delayMinutes >= 30 ? 'MODERATE' : 'MINOR'
        };
      });
    },
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });

  const delays = delaysData || [];

  // AUTO-CALCULATE STATS
  const stats = {
    total: delays.length,
    critical: delays.filter((d: any) => d.severity === 'CRITICAL').length,
    moderate: delays.filter((d: any) => d.severity === 'MODERATE').length,
    minor: delays.filter((d: any) => d.severity === 'MINOR').length,
    totalPassengers: delays.reduce((sum: number, d: any) => sum + d.affectedPassengers, 0),
  };

  const getDelayBadge = (severity: string, minutes: number) => {
    if (severity === 'CRITICAL') {
      return <Badge variant="destructive">CRITICAL ({minutes}min)</Badge>;
    } else if (severity === 'MODERATE') {
      return <Badge className="bg-orange-500 text-white">MODERATE ({minutes}min)</Badge>;
    } else {
      return <Badge className="bg-yellow-500 text-white">MINOR ({minutes}min)</Badge>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Automated Delay Management</h1>
          <p className="text-muted-foreground">
            Real-time delay detection • Zero manual input • Auto-classified
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Delays</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Auto-detected</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
              <p className="text-xs text-muted-foreground">≥60 minutes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Moderate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.moderate}</div>
              <p className="text-xs text-muted-foreground">30-59 minutes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Minor</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.minor}</div>
              <p className="text-xs text-muted-foreground">1-29 minutes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Affected Passengers</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.totalPassengers}</div>
              <p className="text-xs text-muted-foreground">Total impacted</p>
            </CardContent>
          </Card>
        </div>

        {/* Delayed Trips Table */}
        <Card>
          <CardHeader>
            <CardTitle>Delayed Trips ({delays.length})</CardTitle>
            <p className="text-sm text-muted-foreground">
              Automatically detected based on scheduled departure time
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Loading delay data...</p>
              </div>
            ) : delays.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No Delays!</p>
                <p className="text-sm mt-2">All trips are running on schedule</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route</TableHead>
                    <TableHead>Bus</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Scheduled Departure</TableHead>
                    <TableHead>Delay</TableHead>
                    <TableHead>Passengers</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {delays.map((trip: any) => (
                    <TableRow key={trip.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {trip.routes?.origin} → {trip.routes?.destination}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm">{trip.buses?.registration || 'N/A'}</code>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {trip.drivers ? `${trip.drivers.first_name} ${trip.drivers.last_name}` : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {new Date(trip.scheduled_departure).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getDelayBadge(trip.severity, trip.delayMinutes)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <Badge variant="outline">{trip.affectedPassengers}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{trip.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Analytics */}
        {delays.length > 0 && (
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Average Delay</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(
                    delays.reduce((sum: number, d: any) => sum + d.delayMinutes, 0) / delays.length
                  )} min
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Longest Delay</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.max(...delays.map((d: any) => d.delayMinutes))} min
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Affected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPassengers} passengers</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
