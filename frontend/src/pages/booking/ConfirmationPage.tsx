import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Download, Mail, Printer, Home } from 'lucide-react';
import { toast } from 'sonner';

export default function ConfirmationPage() {
  const navigate = useNavigate();
  const [trip, setTrip] = useState<any>(null);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [seats, setSeats] = useState<string[]>([]);
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    // Load all data from sessionStorage
    const storedTrip = sessionStorage.getItem('selectedTrip');
    const storedPassengers = sessionStorage.getItem('passengerDetails');
    const storedSeats = sessionStorage.getItem('selectedSeats');
    const storedPayment = sessionStorage.getItem('paymentData');
    
    if (!storedTrip || !storedPassengers || !storedSeats || !storedPayment) {
      toast.error('Missing booking information.');
      navigate('/');
      return;
    }

    setTrip(JSON.parse(storedTrip));
    setPassengers(JSON.parse(storedPassengers));
    setSeats(JSON.parse(storedSeats));
    setPaymentData(JSON.parse(storedPayment));
  }, [navigate]);

  const handleDownloadTicket = () => {
    toast.info('Ticket download will be implemented in Phase 2');
  };

  const handleEmailTicket = () => {
    toast.info('Email ticket will be implemented in Phase 2');
  };

  const handlePrintTicket = () => {
    toast.info('Print ticket will be implemented in Phase 2');
  };

  const handleGoHome = () => {
    // Clear session storage
    sessionStorage.removeItem('selectedTrip');
    sessionStorage.removeItem('passengerCount');
    sessionStorage.removeItem('passengerDetails');
    sessionStorage.removeItem('selectedSeats');
    sessionStorage.removeItem('paymentData');
    
    navigate('/');
  };

  if (!trip || !paymentData) {
    return null;
  }

  const isReservation = paymentData.method === 'pay_at_office';
  const totalAmount = seats.length * (trip.fare || 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {isReservation ? 'Reservation Confirmed!' : 'Booking Confirmed!'}
            </h1>
            <p className="text-muted-foreground">
              {isReservation 
                ? 'Your seats have been reserved. Please pay at our office before departure.'
                : 'Your payment was successful and your tickets are ready!'
              }
            </p>
          </div>

          {/* Booking Reference */}
          <Card className="mb-6">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Booking Reference</p>
              <p className="text-3xl font-bold text-primary">
                {paymentData.bookings?.[0]?.booking_reference || 'N/A'}
              </p>
            </CardContent>
          </Card>

          {/* Booking Details */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Booking Details</h2>
              
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Route</p>
                    <p className="font-medium">{trip.route?.origin} → {trip.route?.destination}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Departure</p>
                    <p className="font-medium">
                      {new Date(trip.scheduled_departure).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bus</p>
                    <p className="font-medium">{trip.bus?.name || 'TBA'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Seats</p>
                    <p className="font-medium">{seats.join(', ')}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Passengers</h3>
                  <div className="space-y-2">
                    {passengers.map((passenger, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{passenger.title} {passenger.fullName}</span>
                        <span className="text-muted-foreground">Seat {passenger.seatNumber}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount</span>
                    <span className="text-green-600">P {totalAmount.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Payment Method: {paymentData.method === 'pay_at_office' ? 'Pay at Office' : 
                                    paymentData.method === 'mobile_money' ? 'Mobile Money' :
                                    paymentData.method === 'card' ? 'Credit/Debit Card' : 'Bank Transfer'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reservation Warning */}
          {isReservation && paymentData.bookings?.[0]?.reservation_expires_at && (
            <Card className="mb-6 border-orange-200 bg-orange-50">
              <CardContent className="p-6">
                <h3 className="font-semibold text-orange-800 mb-2">⚠️ Important - Reservation Expires</h3>
                <p className="text-sm text-orange-700 mb-3">
                  Please pay at any of our offices before:{' '}
                  <strong>
                    {new Date(paymentData.bookings[0].reservation_expires_at).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </strong>
                </p>
                <p className="text-xs text-orange-600">
                  Your reservation will be automatically cancelled if payment is not received by this time.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Button variant="outline" onClick={handleDownloadTicket} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Ticket
            </Button>
            <Button variant="outline" onClick={handleEmailTicket} className="w-full">
              <Mail className="h-4 w-4 mr-2" />
              Email Ticket
            </Button>
            <Button variant="outline" onClick={handlePrintTicket} className="w-full">
              <Printer className="h-4 w-4 mr-2" />
              Print Ticket
            </Button>
          </div>

          {/* Next Steps */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3">Next Steps</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>A confirmation email has been sent to {passengers[0]?.email}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Please arrive at the terminal at least 30 minutes before departure</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Bring your ID and booking reference for check-in</span>
                </li>
                {isReservation && (
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500">•</span>
                    <span className="text-orange-700 font-medium">
                      Remember to pay at our office before the reservation expires
                    </span>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>

          {/* Home Button */}
          <div className="text-center">
            <Button onClick={handleGoHome} size="lg">
              <Home className="h-4 w-4 mr-2" />
              Back to Homepage
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
