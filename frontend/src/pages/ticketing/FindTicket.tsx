import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import TicketingLayout from '@/components/ticketing/TicketingLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Search, Printer, Edit, User, Calendar, MapPin, Phone, Mail, XCircle, AlertCircle } from 'lucide-react';

export default function FindTicket() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : TicketingLayout;
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('ticket_number');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    passengerName: '',
    passengerPhone: '',
    passengerEmail: '',
    seatNumber: '',
  });
  const [cancelReason, setCancelReason] = useState('');

  // Search bookings
  const { data: bookings = [], isLoading, refetch } = useQuery({
    queryKey: ['find-ticket', searchTerm, searchType],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 3) return [];

      let query = supabase
        .from('bookings')
        .select(`
          *,
          trip:trips(*,
            route:routes(*),
            bus:buses(*)
          ),
          passenger:profiles(*)
        `);

      // Apply search filter based on type
      if (searchType === 'ticket_number') {
        query = query.ilike('ticket_number', `%${searchTerm}%`);
      } else if (searchType === 'passenger_name') {
        query = query.ilike('passenger_name', `%${searchTerm}%`);
      } else if (searchType === 'phone') {
        query = query.ilike('passenger_phone', `%${searchTerm}%`);
      } else if (searchType === 'email') {
        query = query.ilike('passenger_email', `%${searchTerm}%`);
      }

      const { data, error } = await query
        .order('booking_date', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: searchTerm.length >= 3,
  });

  // Fetch available seats for trip (for seat change)
  const { data: availableSeats = [] } = useQuery({
    queryKey: ['available-seats', selectedBooking?.trip_id],
    queryFn: async () => {
      if (!selectedBooking?.trip_id) return [];
      
      // Get all seats for the bus
      const { data: trip } = await supabase
        .from('trips')
        .select('*, bus:buses(seating_capacity)')
        .eq('id', selectedBooking.trip_id)
        .single();
      
      const totalSeats = (trip?.bus as any)?.seating_capacity || 40;
      
      // Get booked seats
      const { data: bookedSeats } = await supabase
        .from('bookings')
        .select('seat_number')
        .eq('trip_id', selectedBooking.trip_id)
        .in('status', ['confirmed', 'checked_in'])
        .neq('id', selectedBooking.id); // Exclude current booking
      
      const booked = bookedSeats?.map(b => b.seat_number) || [];
      const allSeats = Array.from({ length: totalSeats }, (_, i) => `${i + 1}`);
      
      return allSeats.filter(seat => !booked.includes(seat));
    },
    enabled: !!selectedBooking?.trip_id && showEditDialog,
  });

  // Update booking mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBooking) return;

      const { error } = await supabase
        .from('bookings')
        .update({
          passenger_name: editForm.passengerName,
          passenger_phone: editForm.passengerPhone,
          passenger_email: editForm.passengerEmail,
          seat_number: editForm.seatNumber,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedBooking.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['find-ticket'] });
      toast.success('Booking updated successfully');
      setShowEditDialog(false);
      setSelectedBooking(null);
      refetch();
    },
    onError: () => {
      toast.error('Failed to update booking');
    },
  });

  // Cancel booking mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBooking) return;

      // Update booking status
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedBooking.id);

      if (bookingError) throw bookingError;

      // Create refund request
      const { error: refundError } = await supabase
        .from('refund_requests')
        .insert([{
          booking_id: selectedBooking.id,
          passenger_id: selectedBooking.passenger_id,
          reason: cancelReason,
          status: 'pending',
        }]);

      if (refundError) throw refundError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['find-ticket'] });
      toast.success('Booking cancelled and refund request created');
      setShowCancelDialog(false);
      setSelectedBooking(null);
      setCancelReason('');
      refetch();
    },
    onError: () => {
      toast.error('Failed to cancel booking');
    },
  });

  const handleEdit = (booking: any) => {
    setSelectedBooking(booking);
    setEditForm({
      passengerName: booking.passenger_name || '',
      passengerPhone: booking.passenger_phone || '',
      passengerEmail: booking.passenger_email || '',
      seatNumber: booking.seat_number || '',
    });
    setShowEditDialog(true);
  };

  const handleCancel = (booking: any) => {
    setSelectedBooking(booking);
    setShowCancelDialog(true);
  };

  const handlePrint = (booking: any) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Ticket - ${booking.ticket_number}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .ticket { border: 2px solid #000; padding: 20px; max-width: 600px; margin: 0 auto; }
              .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
              .row { display: flex; justify-content: space-between; margin: 10px 0; }
              .label { font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="ticket">
              <div class="header">
                <h1>KJ Khandala Bus Services</h1>
                <h2>Ticket</h2>
              </div>
              <div class="row"><span class="label">Ticket Number:</span><span>${booking.ticket_number}</span></div>
              <div class="row"><span class="label">Passenger:</span><span>${booking.passenger_name}</span></div>
              <div class="row"><span class="label">Phone:</span><span>${booking.passenger_phone}</span></div>
              <div class="row"><span class="label">Route:</span><span>${booking.trip?.route?.route_name || 'N/A'}</span></div>
              <div class="row"><span class="label">From:</span><span>${booking.trip?.route?.origin_city}</span></div>
              <div class="row"><span class="label">To:</span><span>${booking.trip?.route?.destination_city}</span></div>
              <div class="row"><span class="label">Departure:</span><span>${new Date(booking.trip?.departure_time).toLocaleString()}</span></div>
              <div class="row"><span class="label">Seat Number:</span><span>${booking.seat_number}</span></div>
              <div class="row"><span class="label">Amount:</span><span>P ${parseFloat(booking.total_amount).toFixed(2)}</span></div>
              <div class="row"><span class="label">Status:</span><span>${booking.status}</span></div>
            </div>
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Find Ticket</h1>
          <p className="text-muted-foreground">Search by ticket number, name, ID, or phone number</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search Tickets</CardTitle>
            <CardDescription>Search by ticket number, passenger name, phone, or email</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ticket_number">Ticket Number</SelectItem>
                  <SelectItem value="passenger_name">Passenger Name</SelectItem>
                  <SelectItem value="phone">Phone Number</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder={`Search by ${searchType.replace('_', ' ')}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button disabled={searchTerm.length < 3}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
            {searchTerm.length > 0 && searchTerm.length < 3 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Enter at least 3 characters to search</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {isLoading && (
          <Card>
            <CardContent className="py-12 text-center">
              <p>Searching...</p>
            </CardContent>
          </Card>
        )}

        {!isLoading && searchTerm.length >= 3 && bookings.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tickets found</p>
              <p className="text-sm">Try a different search term</p>
            </CardContent>
          </Card>
        )}

        {bookings.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Found {bookings.length} ticket(s)</p>
            {bookings.map((booking: any) => (
              <Card key={booking.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-2xl font-bold font-mono">{booking.ticket_number}</p>
                      <Badge variant={booking.status === 'confirmed' ? 'default' : booking.status === 'cancelled' ? 'destructive' : 'secondary'} className="mt-1">
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handlePrint(booking)}>
                        <Printer className="h-4 w-4 mr-1" />
                        Print
                      </Button>
                      {booking.status !== 'cancelled' && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(booking)}>
                            <Edit className="h-4 w-4 mr-1" />
                            Modify
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleCancel(booking)}>
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Passenger</p>
                          <p className="font-medium">{booking.passenger_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium">{booking.passenger_phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{booking.passenger_email || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Route</p>
                          <p className="font-medium">
                            {booking.trip?.route?.origin_city} → {booking.trip?.route?.destination_city}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Departure</p>
                          <p className="font-medium">
                            {new Date(booking.trip?.departure_time).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Seat</p>
                        <p className="font-medium text-lg">{booking.seat_number}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Booking Date</p>
                      <p className="font-medium">{new Date(booking.booking_date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-lg font-bold">P {parseFloat(booking.total_amount).toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modify Booking</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Passenger Name</Label>
                <Input
                  value={editForm.passengerName}
                  onChange={(e) => setEditForm({ ...editForm, passengerName: e.target.value })}
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  value={editForm.passengerPhone}
                  onChange={(e) => setEditForm({ ...editForm, passengerPhone: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editForm.passengerEmail}
                  onChange={(e) => setEditForm({ ...editForm, passengerEmail: e.target.value })}
                />
              </div>
              <div>
                <Label>Seat Number</Label>
                <Select value={editForm.seatNumber} onValueChange={(v) => setEditForm({ ...editForm, seatNumber: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={editForm.seatNumber}>{editForm.seatNumber} (Current)</SelectItem>
                    {availableSeats.slice(0, 20).map((seat) => (
                      <SelectItem key={seat} value={seat}>
                        {seat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Booking</DialogTitle>
            </DialogHeader>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This will cancel the booking and create a refund request. This action cannot be undone.
              </AlertDescription>
            </Alert>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Reason for Cancellation *</Label>
                <Input
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Enter reason for cancellation"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                Keep Booking
              </Button>
              <Button
                variant="destructive"
                onClick={() => cancelMutation.mutate()}
                disabled={!cancelReason || cancelMutation.isPending}
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Booking'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
