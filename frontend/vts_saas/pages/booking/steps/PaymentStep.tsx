import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ensureTripExists } from '@/lib/trip-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { MapPin, Clock, AlertCircle, CreditCard, Smartphone } from 'lucide-react';
import BotswanaPayment from '@/components/payment/BotswanaPayment';

interface PaymentStepProps {
  trip: any;
  seats: string[];
  passengers: any[];
  onPaymentComplete: (paymentData: any) => void;
  paymentData?: any;
}

export default function PaymentStep({ 
  trip, 
  seats = [], 
  passengers = [], 
  onPaymentComplete,
  paymentData 
}: PaymentStepProps) {
  const [paymentMethod, setPaymentMethod] = useState(paymentData?.method || 'pay_at_office');
  const [processing, setProcessing] = useState(false);
  const [showOnlinePayment, setShowOnlinePayment] = useState(false);

  const totalAmount = seats.length * (trip?.fare || trip?.base_fare || 0);

  const calculateReservationExpiry = () => {
    const departureTime = new Date(trip.scheduled_departure);
    const twoHoursBefore = new Date(departureTime.getTime() - (2 * 60 * 60 * 1000));
    return twoHoursBefore.toISOString();
  };

  const handlePayment = async () => {
    if (!trip || seats.length === 0 || passengers.length === 0) {
      toast.error('Missing booking information');
      return;
    }

    // If online payment selected, show payment component
    if (paymentMethod === 'online_payment') {
      setShowOnlinePayment(true);
      return;
    }

    setProcessing(true);

    try {
      // Ensure trip exists in database (handles projected trips)
      const actualTrip = await ensureTripExists(trip);
      
      // Check if seats are already booked
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('seat_number')
        .eq('trip_id', actualTrip.id)
        .in('seat_number', seats.map(s => s.toString()))
        .in('booking_status', ['confirmed', 'reserved']);

      if (existingBookings && existingBookings.length > 0) {
        const bookedSeats = existingBookings.map(b => b.seat_number).join(', ');
        throw new Error(`Seats ${bookedSeats} are already booked. Please select different seats.`);
      }
      
      const isOfficePayment = paymentMethod === 'pay_at_office';
      const reservationExpiry = isOfficePayment ? calculateReservationExpiry() : null;

      // Create bookings for each passenger
      const bookings = passengers.map((passenger, index) => ({
        trip_id: actualTrip.id,
        passenger_name: passenger.fullName,
        passenger_email: passenger.email,
        passenger_phone: passenger.mobile || passenger.phone,
        passenger_id_number: passenger.idNumber,
        seat_number: passenger.seatNumber,
        booking_status: isOfficePayment ? 'reserved' : 'confirmed',
        payment_status: isOfficePayment ? 'pending' : 'pending',
        payment_method: paymentMethod,
        is_reservation: isOfficePayment,
        reservation_expires_at: reservationExpiry,
        total_amount: trip.fare || trip.base_fare,
        booking_reference: `BK${Date.now()}${index}`,
        flow_step: 'payment',
        // Additional passenger details
        passenger_title: passenger.title,
        passenger_gender: passenger.gender,
        alternate_phone: passenger.alternateNumber,
        id_type: passenger.idType,
        emergency_contact_name: passenger.emergencyName,
        emergency_contact_phone: passenger.emergencyPhone,
        passenger_country: passenger.country,
        passenger_address: passenger.address,
      }));

      const { data: createdBookings, error: bookingError } = await supabase
        .from('bookings')
        .insert(bookings)
        .select();

      if (bookingError) throw bookingError;

      // Update trip available seats
      const { error: updateError } = await supabase
        .from('trips')
        .update({ 
          available_seats: actualTrip.available_seats - seats.length 
        })
        .eq('id', actualTrip.id);

      if (updateError) throw updateError;

      // Update booking flow
      if (!isOfficePayment) {
        await supabase
          .from('bookings')
          .update({ 
            flow_step: 'confirmation',
            payment_status: 'settled'
          })
          .in('id', createdBookings.map(b => b.id));
      }

      if (isOfficePayment) {
        toast.success('Reservation confirmed! Please pay at our office before departure.');
      } else {
        toast.success('Payment successful!');
      }
      
      onPaymentComplete({
        bookingId: createdBookings[0].id,
        bookings: createdBookings,
        payment: null,
        method: paymentMethod,
      });
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleOnlinePaymentSuccess = async (paymentData: any) => {
    // Create booking after successful online payment
    setProcessing(true);
    
    try {
      const actualTrip = await ensureTripExists(trip);
      
      // Create bookings for each passenger
      const bookings = passengers.map((passenger, index) => ({
        trip_id: actualTrip.id,
        passenger_name: passenger.fullName,
        passenger_email: passenger.email,
        passenger_phone: passenger.mobile || passenger.phone,
        passenger_id_number: passenger.idNumber,
        seat_number: passenger.seatNumber,
        booking_status: 'confirmed',
        payment_status: 'paid',
        payment_method: 'online_payment',
        payment_id: paymentData.id,
        total_amount: trip.fare || trip.base_fare,
        booking_reference: `BK${Date.now()}${index}`,
        flow_step: 'confirmation',
        passenger_title: passenger.title,
        passenger_gender: passenger.gender,
        alternate_phone: passenger.alternateNumber,
        id_type: passenger.idType,
        emergency_contact_name: passenger.emergencyName,
        emergency_contact_phone: passenger.emergencyPhone,
        passenger_country: passenger.country,
        passenger_address: passenger.address,
      }));

      const { data: createdBookings, error: bookingError } = await supabase
        .from('bookings')
        .insert(bookings)
        .select();

      if (bookingError) throw bookingError;

      // Update trip available seats
      const { error: updateError } = await supabase
        .from('trips')
        .update({ 
          available_seats: actualTrip.available_seats - seats.length 
        })
        .eq('id', actualTrip.id);

      if (updateError) throw updateError;

      toast.success('Payment successful! Your tickets are confirmed.');
      
      onPaymentComplete({
        bookingId: createdBookings[0].id,
        bookings: createdBookings,
        payment: paymentData,
        method: 'online_payment',
      });
    } catch (error: any) {
      console.error('Booking creation error:', error);
      toast.error(error.message || 'Failed to create booking after payment');
    } finally {
      setProcessing(false);
    }
  };

  if (!trip || seats.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Please complete previous steps first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Booking Summary */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4">Booking Summary</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Route</span>
              <span className="font-medium">
                {trip.routes?.origin} → {trip.routes?.destination}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Seats</span>
              <span className="font-medium">{seats.join(', ')}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Passengers</span>
              <span className="font-medium">{passengers.length}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price per seat</span>
              <span className="font-medium">P {(trip.fare || trip.base_fare || 0).toFixed(2)}</span>
            </div>
            
            <div className="border-t pt-3 flex justify-between text-lg font-bold">
              <span>Total Amount</span>
              <span className="text-green-600">P {totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4">Select Payment Method</h3>
          
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="space-y-3">
              {/* Pay at Office - Featured Option */}
              <div className="flex items-center space-x-3 border-2 border-primary rounded-lg p-4 cursor-pointer hover:bg-primary/5 bg-primary/5">
                <RadioGroupItem value="pay_at_office" id="pay_at_office" />
                <Label htmlFor="pay_at_office" className="flex items-center gap-2 cursor-pointer flex-1">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">Pay at Office</p>
                      <span className="text-xs bg-primary text-white px-2 py-0.5 rounded">Recommended</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Reserve now, pay at any of our offices</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="online_payment" id="online_payment" />
                <Label htmlFor="online_payment" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CreditCard className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Online Payment</p>
                    <p className="text-sm text-muted-foreground">Pay now with card or mobile money</p>
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Office Payment Information */}
      {paymentMethod === 'pay_at_office' && (
        <Alert className="border-primary/50 bg-primary/5">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertDescription>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 text-primary" />
                <div>
                  <p className="font-semibold text-sm">Reservation Valid Until:</p>
                  <p className="text-sm">
                    {new Date(calculateReservationExpiry()).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    (2 hours before departure)
                  </p>
                </div>
              </div>
              
              <div className="border-t pt-3">
                <p className="font-semibold text-sm mb-2">Office Locations:</p>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-medium">Gaborone Main Office</p>
                    <p className="text-muted-foreground">Plot 123, Main Mall | +267 123 4567</p>
                  </div>
                  <div>
                    <p className="font-medium">Francistown Branch</p>
                    <p className="text-muted-foreground">Blue Jacket Street | +267 234 5678</p>
                  </div>
                  <div>
                    <p className="font-medium">Maun Office</p>
                    <p className="text-muted-foreground">Tsheko Tsheko Road | +267 345 6789</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground">
                  ⚠️ <strong>Important:</strong> Your reservation will be automatically cancelled if payment is not received by the deadline.
                </p>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Online Payment Component */}
      {showOnlinePayment && (
        <BotswanaPayment
          bookingId={`temp-${Date.now()}`} // Temporary booking ID
          amount={totalAmount}
          currency="BWP"
          customerEmail={passengers[0]?.email || ''}
          customerFirstName={passengers[0]?.fullName?.split(' ')[0] || ''}
          customerLastName={passengers[0]?.fullName?.split(' ')[1] || ''}
          customerPhone={passengers[0]?.mobile || passengers[0]?.phone || ''}
          onSuccess={handleOnlinePaymentSuccess}
          onCancel={() => setShowOnlinePayment(false)}
        />
      )}

      {/* Pay/Reserve Button */}
      {!showOnlinePayment && (
        <Button 
          onClick={handlePayment} 
          disabled={processing}
          className="w-full h-12 text-lg"
          size="lg"
        >
          {processing ? (
            <>
              <Clock className="h-5 w-5 mr-2 animate-spin" />
              {paymentMethod === 'pay_at_office' ? 'Creating Reservation...' : 'Processing...'}
            </>
          ) : (
            <>
              {paymentMethod === 'pay_at_office' 
                ? `Reserve Tickets (P ${totalAmount.toFixed(2)})` 
                : `Continue to Payment (P ${totalAmount.toFixed(2)})`
              }
            </>
          )}
        </Button>
      )}

      <p className="text-xs text-center text-muted-foreground">
        By proceeding, you agree to our terms and conditions
      </p>
    </div>
  );
}
