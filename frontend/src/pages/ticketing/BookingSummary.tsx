import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import TicketingLayout from '@/components/ticketing/TicketingLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, CheckCircle2, Edit, MapPin, Calendar, Users, 
  CreditCard, DollarSign, Ticket, Loader2 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function BookingSummary() {
  const { user, userRoles, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : TicketingLayout;

  const [trip, setTrip] = useState<any>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);
  const [bookingReference, setBookingReference] = useState('');

  useEffect(() => {
    // Get all data from sessionStorage
    const tripData = sessionStorage.getItem('selectedTrip');
    const seatsData = sessionStorage.getItem('selectedSeats');
    const passengersData = sessionStorage.getItem('passengerDetails');
    const paymentDataStr = sessionStorage.getItem('paymentData');

    if (!tripData || !seatsData || !passengersData || !paymentDataStr) {
      toast({
        variant: 'destructive',
        title: 'Missing data',
        description: 'Please complete all previous steps',
      });
      navigate('/ticketing/search-trips');
      return;
    }

    setTrip(JSON.parse(tripData));
    setSelectedSeats(JSON.parse(seatsData));
    setPassengers(JSON.parse(passengersData));
    setPaymentData(JSON.parse(paymentDataStr));
  }, []);

  const confirmBooking = async () => {
    try {
      setConfirming(true);

      // 1. Get or create agent record
      const { data: agentData } = await supabase
        .from('ticketing_agents')
        .select('id')
        .eq('profile_id', user?.id)
        .single();

      const agentId = agentData?.id;

      // 2. Create/update passenger records
      const passengerIds = await Promise.all(
        passengers.map(async (p) => {
          // Check if passenger exists
          const { data: existing } = await supabase
            .from('passengers')
            .select('id')
            .eq('phone', p.phone)
            .single();

          if (existing) {
            // Update existing passenger
            await supabase
              .from('passengers')
              .update({
                full_name: p.full_name,
                email: p.email,
                id_number: p.id_number,
                passport_number: p.passport_number,
                gender: p.gender,
                nationality: p.nationality,
                date_of_birth: p.date_of_birth,
                next_of_kin_name: p.next_of_kin_name,
                next_of_kin_phone: p.next_of_kin_phone,
                special_notes: p.special_notes,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existing.id);

            return existing.id;
          } else {
            // Create new passenger
            const { data: newPassenger, error } = await supabase
              .from('passengers')
              .insert({
                full_name: p.full_name,
                phone: p.phone,
                email: p.email,
                id_number: p.id_number,
                passport_number: p.passport_number,
                gender: p.gender,
                nationality: p.nationality,
                date_of_birth: p.date_of_birth,
                next_of_kin_name: p.next_of_kin_name,
                next_of_kin_phone: p.next_of_kin_phone,
                special_notes: p.special_notes,
              })
              .select('id')
              .single();

            if (error) throw error;
            return newPassenger.id;
          }
        })
      );

      // 3. Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          trip_id: trip.trip_id,
          passenger_id: passengerIds[0], // Primary passenger
          booked_by: agentId,
          number_of_passengers: passengers.length,
          total_amount: paymentData.totalAmount,
          amount_paid: paymentData.details.amount,
          balance: paymentData.finalAmount - paymentData.details.amount,
          base_fare: trip.base_fare,
          discount: paymentData.discount.amount,
          discount_reason: paymentData.discount.reason,
          travel_date: new Date(trip.departure_time).toISOString().split('T')[0],
          status: 'confirmed',
          payment_status: paymentData.details.amount >= paymentData.finalAmount ? 'paid' : paymentData.details.amount > 0 ? 'partial' : 'unpaid',
        })
        .select('id, booking_reference')
        .single();

      if (bookingError) throw bookingError;

      setBookingReference(booking.booking_reference);

      // 4. Create booking seats
      const seatInserts = passengers.map((p, index) => ({
        booking_id: booking.id,
        trip_id: trip.trip_id,
        seat_number: p.seat_number,
        passenger_name: p.full_name,
        passenger_phone: p.phone,
        passenger_id_number: p.id_number,
        seat_price: trip.base_fare,
        seat_type: 'standard',
        status: 'sold',
      }));

      const { error: seatsError } = await supabase
        .from('booking_seats')
        .insert(seatInserts);

      if (seatsError) throw seatsError;

      // 5. Create payment record
      const { error: paymentError } = await supabase
        .from('booking_payments')
        .insert({
          booking_id: booking.id,
          amount: paymentData.details.amount,
          payment_method: paymentData.method,
          transaction_id: paymentData.details.transaction_id,
          card_last_four: paymentData.details.card_last_four,
          mobile_number: paymentData.details.mobile_number,
          voucher_code: paymentData.details.voucher_code,
          company_name: paymentData.details.company_name,
          invoice_number: paymentData.details.invoice_number,
          notes: paymentData.details.notes,
          processed_by: agentId,
          status: 'completed',
        });

      if (paymentError) throw paymentError;

      toast({
        title: 'Booking confirmed!',
        description: `Booking reference: ${booking.booking_reference}`,
      });

      // Store booking reference and navigate to ticket
      sessionStorage.setItem('bookingReference', booking.booking_reference);
      navigate('/ticketing/issue-ticket');

    } catch (error: any) {
      console.error('Error confirming booking:', error);
      toast({
        variant: 'destructive',
        title: 'Booking failed',
        description: error.message,
      });
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!trip || !passengers.length || !paymentData) {
    return <div className="flex items-center justify-center min-h-screen">Loading data...</div>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">📋 Booking Summary</h1>
            <p className="text-muted-foreground">Review all details before confirming</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/ticketing/payment')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payment
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trip Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Trip Details</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/ticketing/search-trips')}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {trip.origin} → {trip.destination}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(trip.departure_time).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                  <span>{trip.trip_number}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{trip.bus_name}</span>
                </div>
              </CardContent>
            </Card>

            {/* Passengers & Seats */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Passengers & Seats</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/ticketing/passenger-details')}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {passengers.map((p, index) => (
                    <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{p.full_name}</p>
                        <p className="text-sm text-muted-foreground">{p.phone}</p>
                        <p className="text-sm text-muted-foreground">
                          ID: {p.id_number || p.passport_number}
                        </p>
                        {p.special_notes && (
                          <p className="text-sm text-orange-600 mt-1">⚠️ {p.special_notes}</p>
                        )}
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        Seat {p.seat_number}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Payment Details</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/ticketing/payment')}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium capitalize">
                    {paymentData.method.replace('_', ' ')}
                  </span>
                </div>
                {paymentData.details.transaction_id && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Transaction ID: </span>
                    <span className="font-mono">{paymentData.details.transaction_id}</span>
                  </div>
                )}
                {paymentData.details.card_last_four && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Card: </span>
                    <span>****{paymentData.details.card_last_four}</span>
                  </div>
                )}
                {paymentData.details.mobile_number && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Mobile: </span>
                    <span>{paymentData.details.mobile_number}</span>
                  </div>
                )}
                {paymentData.details.company_name && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Company: </span>
                    <span>{paymentData.details.company_name}</span>
                  </div>
                )}
                {paymentData.details.notes && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Notes: </span>
                    <span>{paymentData.details.notes}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Price Summary */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Price Summary</CardTitle>
              <CardDescription>Final booking cost</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Base Fare ({passengers.length}x)</span>
                <span>P {paymentData.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Taxes & Levies</span>
                <span>P 0.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Insurance</span>
                <span>P 0.00</span>
              </div>
              {paymentData.discount.amount > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>- P {paymentData.discount.amount.toFixed(2)}</span>
                  </div>
                  {paymentData.discount.reason && (
                    <p className="text-xs text-muted-foreground italic">
                      {paymentData.discount.reason}
                    </p>
                  )}
                </>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>P {paymentData.finalAmount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span>Amount Paid</span>
                <span className="text-green-600">P {paymentData.details.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Balance</span>
                <span className={paymentData.finalAmount - paymentData.details.amount > 0 ? 'text-orange-600' : 'text-green-600'}>
                  P {(paymentData.finalAmount - paymentData.details.amount).toFixed(2)}
                </span>
              </div>

              <Separator className="my-4" />

              <Button
                onClick={confirmBooking}
                className="w-full"
                size="lg"
                disabled={confirming}
              >
                {confirming ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Confirm Booking
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-2">
                By confirming, you agree to issue this ticket
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
