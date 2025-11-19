import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { CreditCard, Smartphone, Building2, Loader2, MapPin, Clock, AlertCircle } from 'lucide-react';

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
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    mobileNumber: '',
    bankAccount: '',
  });

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

    setProcessing(true);

    try {
      const isOfficePayment = paymentMethod === 'pay_at_office';
      const reservationExpiry = isOfficePayment ? calculateReservationExpiry() : null;

      // Create bookings for each passenger
      const bookings = passengers.map((passenger, index) => ({
        trip_id: trip.id,
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

      // Create payment record (only for online payments)
      let payment = null;
      if (!isOfficePayment) {
        const { data: paymentData, error: paymentError } = await supabase
          .from('payments')
          .insert({
            booking_id: createdBookings[0].id,
            amount: totalAmount,
            payment_method: paymentMethod,
            payment_status: 'settled',
            paid_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (paymentError) throw paymentError;
        payment = paymentData;
      }

      // Update trip available seats
      const { error: updateError } = await supabase
        .from('trips')
        .update({ 
          available_seats: trip.available_seats - seats.length 
        })
        .eq('id', trip.id);

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
        payment: payment,
        method: paymentMethod,
      });
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
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
                <RadioGroupItem value="mobile_money" id="mobile_money" />
                <Label htmlFor="mobile_money" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Smartphone className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Mobile Money</p>
                    <p className="text-sm text-muted-foreground">Orange Money, Mascom MyZaka</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CreditCard className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Credit/Debit Card</p>
                    <p className="text-sm text-muted-foreground">Visa, Mastercard</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                <Label htmlFor="bank_transfer" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Building2 className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Bank Transfer</p>
                    <p className="text-sm text-muted-foreground">Direct bank transfer</p>
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

      {/* Payment Details */}
      {paymentMethod !== 'pay_at_office' && (
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4">Payment Details</h3>
          
          {paymentMethod === 'mobile_money' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number</Label>
                <Input
                  id="mobileNumber"
                  type="tel"
                  placeholder="+267 7X XXX XXX"
                  value={paymentDetails.mobileNumber}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, mobileNumber: e.target.value })}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                You will receive a payment prompt on your mobile device
              </p>
            </div>
          )}

          {paymentMethod === 'card' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={paymentDetails.cardNumber}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, cardNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardName">Cardholder Name</Label>
                <Input
                  id="cardName"
                  placeholder="John Doe"
                  value={paymentDetails.cardName}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, cardName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    placeholder="MM/YY"
                    value={paymentDetails.expiryDate}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, expiryDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    maxLength={3}
                    value={paymentDetails.cvv}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, cvv: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'bank_transfer' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="font-medium mb-2">Bank Details:</p>
                <p className="text-sm">Bank: First National Bank</p>
                <p className="text-sm">Account: 1234567890</p>
                <p className="text-sm">Branch: Gaborone Main</p>
                <p className="text-sm mt-2 text-muted-foreground">
                  Reference: {trip.trip_number}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Please complete the transfer and upload proof of payment
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Pay/Reserve Button */}
      <Button 
        onClick={handlePayment} 
        disabled={processing}
        className="w-full h-12 text-lg"
        size="lg"
      >
        {processing ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            {paymentMethod === 'pay_at_office' ? 'Creating Reservation...' : 'Processing Payment...'}
          </>
        ) : (
          <>
            {paymentMethod === 'pay_at_office' 
              ? `Reserve Tickets (P ${totalAmount.toFixed(2)})` 
              : `Pay P ${totalAmount.toFixed(2)}`
            }
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        By proceeding, you agree to our terms and conditions
      </p>
    </div>
  );
}
