import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { User, FileText, Activity, TrendingUp, Phone, Mail, MapPin, Calendar, Award } from 'lucide-react';
import { format } from 'date-fns';

interface DriverProfileModalProps {
  driver: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function DriverProfileModal({ driver, isOpen, onClose }: DriverProfileModalProps) {
  const { data: tripHistory } = useQuery({
    queryKey: ['driver-trip-history', driver.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          route:routes(origin, destination),
          bus:buses(bus_number)
        `)
        .eq('driver_id', driver.id)
        .order('scheduled_departure', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: isOpen,
  });

  const { data: performanceData } = useQuery({
    queryKey: ['driver-performance', driver.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('id, status, scheduled_departure, actual_departure, scheduled_arrival, actual_arrival')
        .eq('driver_id', driver.id)
        .eq('status', 'COMPLETED');

      if (error) throw error;

      const completedTrips = data?.length || 0;
      const onTimeTrips = data?.filter((trip: any) => {
        if (!trip.actual_departure || !trip.scheduled_departure) return false;
        const scheduledTime = new Date(trip.scheduled_departure).getTime();
        const actualTime = new Date(trip.actual_departure).getTime();
        const delayMinutes = (actualTime - scheduledTime) / (1000 * 60);
        return delayMinutes <= 15;
      }).length || 0;

      const onTimePercentage = completedTrips > 0 ? (onTimeTrips / completedTrips) * 100 : 0;

      return {
        completedTrips,
        onTimeTrips,
        onTimePercentage: onTimePercentage.toFixed(1),
      };
    },
    enabled: isOpen,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Driver Profile: {driver.full_name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="license">License Info</TabsTrigger>
            <TabsTrigger value="history">Trip History</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-semibold">{driver.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Driver ID</p>
                  <p className="font-semibold">{driver.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-semibold">
                    {driver.date_of_birth ? format(new Date(driver.date_of_birth), 'PP') : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={driver.status === 'active' ? 'default' : 'secondary'}>
                    {driver.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {driver.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{driver.phone}</span>
                  </div>
                )}
                {driver.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{driver.email}</span>
                  </div>
                )}
                {driver.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{driver.address}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                {driver.current_assignment ? (
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Bus</p>
                      <p className="font-semibold">{driver.current_assignment.bus?.bus_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Route</p>
                      <p className="font-semibold">
                        {driver.current_assignment.route?.origin} → {driver.current_assignment.route?.destination}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge>{driver.current_assignment.status}</Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No current assignment</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="license" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  License Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">License Number</p>
                  <p className="font-semibold">{driver.license_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">License Type</p>
                  <p className="font-semibold">{driver.license_type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Issue Date</p>
                  <p className="font-semibold">
                    {driver.license_issue_date ? format(new Date(driver.license_issue_date), 'PP') : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expiry Date</p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">
                      {driver.license_expiry_date ? format(new Date(driver.license_expiry_date), 'PP') : 'N/A'}
                    </p>
                    {driver.license_expiry_date && new Date(driver.license_expiry_date) < new Date() && (
                      <Badge variant="destructive">Expired</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Issuing Authority</p>
                  <p className="font-semibold">{driver.license_issuing_authority || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hire Date</p>
                  <p className="font-semibold">
                    {driver.hire_date ? format(new Date(driver.hire_date), 'PP') : 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Contact Name</p>
                  <p className="font-semibold">{driver.emergency_contact_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact Phone</p>
                  <p className="font-semibold">{driver.emergency_contact_phone || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Recent Trips
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tripHistory && tripHistory.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Bus</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tripHistory.map((trip: any) => (
                        <TableRow key={trip.id}>
                          <TableCell>
                            {format(new Date(trip.scheduled_departure), 'PP')}
                          </TableCell>
                          <TableCell>
                            {trip.route?.origin} → {trip.route?.destination}
                          </TableCell>
                          <TableCell>{trip.bus?.bus_number}</TableCell>
                          <TableCell>
                            <Badge variant={trip.status === 'COMPLETED' ? 'default' : 'secondary'}>
                              {trip.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No trip history found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Completed Trips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{performanceData?.completedTrips || 0}</p>
                  <p className="text-xs text-muted-foreground">Total trips completed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    On-Time Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">
                    {performanceData?.onTimePercentage || 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {performanceData?.onTimeTrips || 0} on-time trips
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    This Month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">N/A</p>
                  <p className="text-xs text-muted-foreground">Trips this month</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>On-Time Departures</span>
                      <span className="font-medium">{performanceData?.onTimePercentage || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${performanceData?.onTimePercentage || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button>
            Edit Driver Info
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
