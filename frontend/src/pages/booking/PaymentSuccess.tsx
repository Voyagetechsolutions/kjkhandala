import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, Download, Home } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [payment, setPayment] = useState<any>(null);
  const [booking, setBooking] = useState<any>(null);

  const companyRef = searchParams.get('ref');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    if (companyRef) {
      verifyPayment();
    }
  }, [companyRef]);

  const verifyPayment = async () => {
    try {
      const response = await axios.get(`${API_URL}/payments/verify/${companyRef}`);
      
      if (response.data.success) {
        setPayment(response.data.payment);
        
        // Fetch booking details
        const bookingResponse = await axios.get(
          `${API_URL}/bookings/${response.data.payment.booking_id}`
        );
        setBooking(bookingResponse.data);
        
        toast.success('Payment verified successfully!');
      } else {
        toast.error('Payment verification failed');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error('Failed to verify payment');
    } finally {
      setVerifying(false);
    }
  };

  const downloadTicket = () => {
    // Navigate to ticket download page
    if (booking) {
      navigate(`/booking-confirmation/${booking.id}`);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div>
                  <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
                  <p className="text-muted-foreground">
                    Please wait while we confirm your payment...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Success Header */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-green-900 mb-2">
                    Payment Successful!
                  </h1>
                  <p className="text-green-700">
                    Your booking has been confirmed and your ticket is ready.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          {payment && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction Reference</span>
                  <span className="font-mono font-medium">{payment.dpo_trans_ref}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="font-medium">
                    {payment.currency} {payment.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-medium capitalize">
                    {payment.card_type || payment.payment_method || 'Card'}
                  </span>
                </div>
                {payment.card_last4 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Card</span>
                    <span className="font-medium">**** **** **** {payment.card_last4}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {new Date(payment.payment_date).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Booking Details */}
          {booking && (
            <Card>
              <CardHeader>
                <CardTitle>Booking Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Booking Reference</span>
                  <span className="font-mono font-medium">{booking.booking_reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Passenger Name</span>
                  <span className="font-medium">{booking.passenger_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seat Number</span>
                  <span className="font-medium">{booking.seat_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                    Confirmed
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={downloadTicket} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Download Ticket
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="flex-1">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>

          {/* Important Notice */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-blue-900 mb-2">Important Information</h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• A confirmation email has been sent to your registered email address</li>
                <li>• Please arrive at the terminal at least 30 minutes before departure</li>
                <li>• Bring a valid ID for verification</li>
                <li>• Keep your booking reference for check-in</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
