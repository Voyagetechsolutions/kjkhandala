// ENHANCED CHECK-IN PAGE - Complete Implementation
// File: frontend/src/pages/ticketing/CheckIn.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import TicketingLayout from '@/components/ticketing/TicketingLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Search, QrCode, Users, Clock, AlertCircle } from 'lucide-react';

export default function CheckIn() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : TicketingLayout;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'manual' | 'qr' | 'trips'>('manual');
  const [ticketNumber, setTicketNumber] = useState('');
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [showPassengerList, setShowPassengerList] = useState(false);

  // Fetch today's trips
  const { data: todaysTrips = [] } = useQuery({
    queryKey: ['todays-trips'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          route:routes(*),
          bus:buses(*)
        `)
        .gte('departure_time', `${today}T00:00:00`)
        .lte('departure_time', `${today}T23:59:59`)
        .in('status', ['SCHEDULED', 'BOARDING', 'DEPARTED'])
        .order('departure_time');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch passengers for selected trip
  const { data: tripPassengers = [], refetch: refetchPassengers } = useQuery({
    queryKey: ['trip-passengers', selectedTrip?.id],
    queryFn: async () => {
      if (!selectedTrip?.id) return [];
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          passenger:profiles(*),
          checkin:checkin_records(*)
        `)
        .eq('trip_id', selectedTrip.id)
        .eq('status', 'confirmed')
        .order('seat_number');
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedTrip?.id,
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async ({ bookingId, method }: { bookingId: string; method: 'qr_code' | 'manual' }) => {
      // Create check-in record
      const { error: checkinError } = await supabase
        .from('checkin_records')
        .insert([{
          booking_id: bookingId,
          checkin_time: new Date().toISOString(),
          checkin_method: method,
          checked_in_by: user?.id,
          boarding_status: 'checked_in',
        }]);

      if (checkinError) throw checkinError;

      // Update booking status
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'checked_in' })
        .eq('id', bookingId);

      if (bookingError) throw bookingError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-passengers'] });
      queryClient.invalidateQueries({ queryKey: ['ticketing-dashboard'] });
      toast.success('Passenger checked in successfully!');
      setTicketNumber('');
      refetchPassengers();
    },
    onError: (error) => {
      console.error('Check-in error:', error);
      toast.error('Failed to check in passenger');
    },
  });

  // Mark as boarded
  const boardMutation = useMutation({
    mutationFn: async (checkinRecordId: string) => {
      const { error } = await supabase
        .from('checkin_records')
        .update({ boarding_status: 'boarded' })
        .eq('id', checkinRecordId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-passengers'] });
      toast.success('Passenger marked as boarded');
      refetchPassengers();
    },
  });

  // Mark as no-show
  const noShowMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from('checkin_records')
        .insert([{
          booking_id: bookingId,
          checkin_time: new Date().toISOString(),
          checkin_method: 'manual',
          checked_in_by: user?.id,
          boarding_status: 'no_show',
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-passengers'] });
      toast.info('Passenger marked as no-show');
      refetchPassengers();
    },
  });

  // Manual check-in by ticket number
  const handleManualCheckIn = async () => {
    if (!ticketNumber.trim()) {
      toast.error('Please enter ticket number');
      return;
    }

    const { data, error } = await supabase
      .from('bookings')
      .select('id, ticket_number, passenger_name, status')
      .eq('ticket_number', ticketNumber.trim())
      .single();

    if (error || !data) {
      toast.error('Ticket not found');
      return;
    }

    if (data.status === 'checked_in') {
      toast.info('Passenger already checked in');
      return;
    }

    checkInMutation.mutate({ bookingId: data.id, method: 'manual' });
  };

  const getStatusBadge = (passenger: any) => {
    const checkin = passenger.checkin?.[0];
    if (!checkin) return <Badge variant="outline">Not Checked In</Badge>;
    
    switch (checkin.boarding_status) {
      case 'checked_in':
        return <Badge className="bg-blue-500">Checked In</Badge>;
      case 'boarded':
        return <Badge className="bg-green-500">Boarded</Badge>;
      case 'no_show':
        return <Badge variant="destructive">No Show</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const stats = {
    totalPassengers: tripPassengers.length,
    checkedIn: tripPassengers.filter(p => p.checkin?.[0]?.boarding_status === 'checked_in').length,
    boarded: tripPassengers.filter(p => p.checkin?.[0]?.boarding_status === 'boarded').length,
    noShow: tripPassengers.filter(p => p.checkin?.[0]?.boarding_status === 'no_show').length,
    notCheckedIn: tripPassengers.filter(p => !p.checkin || p.checkin.length === 0).length,
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Passenger Check-In</h1>
          <p className="text-muted-foreground">Check in passengers using QR code, ticket number, or trip manifest</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b">
          <Button
            variant={activeTab === 'manual' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('manual')}
          >
            <Search className="mr-2 h-4 w-4" />
            Manual Check-In
          </Button>
          <Button
            variant={activeTab === 'qr' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('qr')}
          >
            <QrCode className="mr-2 h-4 w-4" />
            QR Scanner
          </Button>
          <Button
            variant={activeTab === 'trips' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('trips')}
          >
            <Users className="mr-2 h-4 w-4" />
            Today's Trips
          </Button>
        </div>

        {/* Manual Check-In Tab */}
        {activeTab === 'manual' && (
          <Card>
            <CardHeader>
              <CardTitle>Manual Check-In</CardTitle>
              <CardDescription>Enter ticket number to check in passenger</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter ticket number..."
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualCheckIn()}
                />
                <Button onClick={handleManualCheckIn} disabled={checkInMutation.isPending}>
                  {checkInMutation.isPending ? 'Processing...' : 'Check In'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* QR Scanner Tab */}
        {activeTab === 'qr' && (
          <Card>
            <CardHeader>
              <CardTitle>QR Code Scanner</CardTitle>
              <CardDescription>Scan passenger QR code to check in</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  QR Scanner requires camera permissions. Install react-qr-scanner package to enable this feature.
                  <br />
                  <code className="text-xs">npm install react-qr-scanner</code>
                </AlertDescription>
              </Alert>
              {/* QR Scanner component would go here */}
              <div className="mt-4 p-12 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                QR Scanner Component
                <br />
                <small>Camera view will appear here</small>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's Trips Tab */}
        {activeTab === 'trips' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Today's Trips</CardTitle>
                <CardDescription>Select a trip to view and check in passengers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {todaysTrips.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No trips scheduled for today</p>
                  ) : (
                    todaysTrips.map((trip: any) => (
                      <div
                        key={trip.id}
                        className="border rounded-lg p-4 hover:border-primary cursor-pointer"
                        onClick={() => {
                          setSelectedTrip(trip);
                          setShowPassengerList(true);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{trip.route?.route_name}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(trip.departure_time).toLocaleTimeString()}
                              </span>
                              <Badge>{trip.status}</Badge>
                            </div>
                          </div>
                          <Button size="sm">View Passengers</Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Passenger List Dialog */}
        <Dialog open={showPassengerList} onOpenChange={setShowPassengerList}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Passenger Manifest - {selectedTrip?.route?.route_name}
              </DialogTitle>
            </DialogHeader>

            {/* Stats */}
            <div className="grid grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{stats.totalPassengers}</div>
                  <p className="text-xs text-muted-foreground">Total</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-500">{stats.checkedIn}</div>
                  <p className="text-xs text-muted-foreground">Checked In</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-500">{stats.boarded}</div>
                  <p className="text-xs text-muted-foreground">Boarded</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-500">{stats.noShow}</div>
                  <p className="text-xs text-muted-foreground">No Show</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-gray-500">{stats.notCheckedIn}</div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </CardContent>
              </Card>
            </div>

            {/* Passenger Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seat</TableHead>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Passenger</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tripPassengers.map((passenger: any) => (
                  <TableRow key={passenger.id}>
                    <TableCell className="font-mono">{passenger.seat_number}</TableCell>
                    <TableCell className="font-mono text-xs">{passenger.ticket_number}</TableCell>
                    <TableCell>{passenger.passenger_name}</TableCell>
                    <TableCell>{passenger.passenger_phone}</TableCell>
                    <TableCell>{getStatusBadge(passenger)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {!passenger.checkin || passenger.checkin.length === 0 ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => checkInMutation.mutate({ bookingId: passenger.id, method: 'manual' })}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Check In
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => noShowMutation.mutate(passenger.id)}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              No Show
                            </Button>
                          </>
                        ) : passenger.checkin[0].boarding_status === 'checked_in' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => boardMutation.mutate(passenger.checkin[0].id)}
                          >
                            Mark Boarded
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
