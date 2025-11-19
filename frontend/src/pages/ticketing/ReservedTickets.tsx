import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import TicketingLayout from '@/components/ticketing/TicketingLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Search, Clock, User, Phone, CreditCard, CheckCircle, XCircle } from 'lucide-react';

export default function ReservedTickets() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'reference' | 'id' | 'phone'>('reference');
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          trips:trip_id (
            trip_number,
            scheduled_departure,
            scheduled_arrival,
            routes:route_id (
              origin,
              destination
            ),
            buses:bus_id (
              name,
              registration_number
            )
          )
        `)
        .eq('is_reservation', true)
        .in('booking_status', ['reserved', 'confirmed']);

      // Apply search filter based on type
      if (searchType === 'reference') {
        query = query.ilike('booking_reference', `%${searchQuery}%`);
      } else if (searchType === 'id') {
        query = query.ilike('passenger_id_number', `%${searchQuery}%`);
      } else if (searchType === 'phone') {
        query = query.or(`passenger_phone.ilike.%${searchQuery}%,alternate_phone.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.info('No reservations found');
        setReservations([]);
      } else {
        setReservations(data);
        toast.success(`Found ${data.length} reservation(s)`);
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error(error.message || 'Failed to search reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async (bookingId: string, totalAmount: number) => {
    setProcessing(bookingId);
    try {
      // Update booking status
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          booking_status: 'confirmed',
          payment_status: 'settled',
          is_reservation: false,
          reservation_expires_at: null,
        })
        .eq('id', bookingId);

      if (bookingError) throw bookingError;

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          booking_id: bookingId,
          amount: totalAmount,
          payment_method: 'cash',
          payment_status: 'settled',
          paid_at: new Date().toISOString(),
        });

      if (paymentError) throw paymentError;

      toast.success('Payment confirmed! Ticket is now active.');
      
      // Refresh search results
      handleSearch();
    } catch (error: any) {
      console.error('Payment confirmation error:', error);
      toast.error(error.message || 'Failed to confirm payment');
    } finally {
      setProcessing(null);
    }
  };

  const handleCancelReservation = async (bookingId: string, tripId: string) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;

    setProcessing(bookingId);
    try {
      // Update booking status
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          booking_status: 'cancelled',
          payment_status: 'cancelled',
        })
        .eq('id', bookingId);

      if (bookingError) throw bookingError;

      // Release seat back to trip
      const { error: tripError } = await supabase.rpc('increment_available_seats', {
        trip_id: tripId,
        increment_by: 1
      });

      if (tripError) {
        // Fallback: manually update
        const { data: trip } = await supabase
          .from('trips')
          .select('available_seats')
          .eq('id', tripId)
          .single();

        if (trip) {
          await supabase
            .from('trips')
            .update({ available_seats: trip.available_seats + 1 })
            .eq('id', tripId);
        }
      }

      toast.success('Reservation cancelled');
      handleSearch();
    } catch (error: any) {
      console.error('Cancellation error:', error);
      toast.error(error.message || 'Failed to cancel reservation');
    } finally {
      setProcessing(null);
    }
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  return (
    <TicketingLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reserved Tickets</h1>
          <p className="text-muted-foreground">Search and manage ticket reservations</p>
        </div>

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Reservations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search Type Selection */}
              <div className="flex gap-4">
                <Button
                  variant={searchType === 'reference' ? 'default' : 'outline'}
                  onClick={() => setSearchType('reference')}
                  size="sm"
                >
                  Booking Reference
                </Button>
                <Button
                  variant={searchType === 'id' ? 'default' : 'outline'}
                  onClick={() => setSearchType('id')}
                  size="sm"
                >
                  ID/Passport Number
                </Button>
                <Button
                  variant={searchType === 'phone' ? 'default' : 'outline'}
                  onClick={() => setSearchType('phone')}
                  size="sm"
                >
                  Phone Number
                </Button>
              </div>

              {/* Search Input */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder={
                      searchType === 'reference' ? 'Enter booking reference (e.g., BK123456)' :
                      searchType === 'id' ? 'Enter ID or Passport number' :
                      'Enter phone number'
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {reservations.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Search Results ({reservations.length})</h2>
            
            {reservations.map((reservation) => {
              const trip = reservation.trips;
              const expired = reservation.reservation_expires_at && isExpired(reservation.reservation_expires_at);
              const isPaid = reservation.payment_status === 'settled';

              return (
                <Card key={reservation.id} className={expired ? 'border-red-300' : ''}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold">{reservation.booking_reference}</h3>
                            <Badge variant={isPaid ? 'default' : expired ? 'destructive' : 'secondary'}>
                              {isPaid ? 'Paid' : expired ? 'Expired' : 'Reserved'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {trip?.routes?.origin} → {trip?.routes?.destination}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            P {reservation.total_amount?.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Trip Details */}
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Departure</p>
                          <p className="font-medium">
                            {new Date(trip?.scheduled_departure).toLocaleString('en-US', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Bus</p>
                          <p className="font-medium">{trip?.buses?.name || 'TBA'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Seat Number</p>
                          <p className="font-medium text-lg">{reservation.seat_number}</p>
                        </div>
                      </div>

                      {/* Passenger Details */}
                      <div className="border-t pt-4">
                        <h4 className="font-semibold mb-2">Passenger Information</h4>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">Name</p>
                              <p className="font-medium">
                                {reservation.passenger_title} {reservation.passenger_name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">Phone</p>
                              <p className="font-medium">{reservation.passenger_phone}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">ID Number</p>
                              <p className="font-medium">{reservation.passenger_id_number}</p>
                            </div>
                          </div>
                          {reservation.passenger_email && (
                            <div>
                              <p className="text-muted-foreground">Email</p>
                              <p className="font-medium">{reservation.passenger_email}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expiry Warning */}
                      {!isPaid && reservation.reservation_expires_at && (
                        <div className={`flex items-center gap-2 p-3 rounded-lg ${
                          expired ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'
                        }`}>
                          <Clock className="h-4 w-4" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {expired ? 'Reservation Expired' : 'Reservation Expires'}
                            </p>
                            <p className="text-xs">
                              {new Date(reservation.reservation_expires_at).toLocaleString('en-US', {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                              })}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {!isPaid && !expired && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={() => handleConfirmPayment(reservation.id, reservation.total_amount)}
                            disabled={processing === reservation.id}
                            className="flex-1"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {processing === reservation.id ? 'Processing...' : 'Confirm Payment'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleCancelReservation(reservation.id, reservation.trip_id)}
                            disabled={processing === reservation.id}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      )}

                      {isPaid && (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">Payment Confirmed - Ticket Active</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && reservations.length === 0 && searchQuery && (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Reservations Found</h3>
              <p className="text-muted-foreground">
                Try searching with a different booking reference, ID number, or phone number
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </TicketingLayout>
  );
}
