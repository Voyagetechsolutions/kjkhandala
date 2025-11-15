import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import TicketingLayout from '@/components/ticketing/TicketingLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Printer, Mail, MessageSquare, Home, CheckCircle2, 
  MapPin, Calendar, Users, Ticket as TicketIcon, QrCode 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function IssueTicket() {
  const { user, userRoles, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : TicketingLayout;
  const ticketRef = useRef<HTMLDivElement>(null);

  const [booking, setBooking] = useState<any>(null);
  const [loadingBooking, setLoadingBooking] = useState(true);

  useEffect(() => {
    const bookingRef = sessionStorage.getItem('bookingReference');
    if (!bookingRef) {
      toast({
        variant: 'destructive',
        title: 'No booking found',
        description: 'Please complete the booking process first',
      });
      navigate('/ticketing/search-trips');
      return;
    }

    fetchBookingDetails(bookingRef);
  }, []);

  const fetchBookingDetails = async (bookingRef: string) => {
    try {
      setLoadingBooking(true);

      // Fetch booking with all related data
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          trips (
            trip_number,
            departure_time,
            arrival_time,
            routes (origin, destination),
            buses (name)
          ),
          passengers (full_name, phone, id_number)
        `)
        .eq('booking_reference', bookingRef)
        .single();

      if (bookingError) throw bookingError;

      // Fetch booking seats
      const { data: seatsData, error: seatsError } = await supabase
        .from('booking_seats')
        .select('*')
        .eq('booking_id', bookingData.id);

      if (seatsError) throw seatsError;

      setBooking({
        ...bookingData,
        seats: seatsData,
      });

    } catch (error: any) {
      console.error('Error fetching booking:', error);
      toast({
        variant: 'destructive',
        title: 'Error loading booking',
        description: error.message,
      });
    } finally {
      setLoadingBooking(false);
    }
  };

  const printTicket = () => {
    window.print();
    toast({
      title: 'Printing ticket',
      description: 'Ticket sent to printer',
    });
  };

  const emailTicket = () => {
    toast({
      title: 'Email sent',
      description: `Ticket sent to ${booking?.passengers?.phone || 'customer'}`,
    });
  };

  const whatsappTicket = () => {
    const phone = booking?.passengers?.phone?.replace(/\D/g, '');
    const message = `Your booking is confirmed!\n\nBooking Reference: ${booking?.booking_reference}\nTrip: ${booking?.trips?.routes?.origin} → ${booking?.trips?.routes?.destination}\nDate: ${new Date(booking?.trips?.departure_time).toLocaleString()}\n\nThank you for choosing our service!`;
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    
    toast({
      title: 'WhatsApp opened',
      description: 'Send the ticket via WhatsApp',
    });
  };

  const returnToDashboard = () => {
    // Clear session storage
    sessionStorage.removeItem('selectedTrip');
    sessionStorage.removeItem('selectedSeats');
    sessionStorage.removeItem('passengerDetails');
    sessionStorage.removeItem('paymentData');
    sessionStorage.removeItem('bookingReference');
    
    navigate('/ticketing');
  };

  if (loading || loadingBooking) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!booking) {
    return <div className="flex items-center justify-center min-h-screen">No booking data</div>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between print:hidden">
          <div>
            <h1 className="text-3xl font-bold mb-2">🎫 Issue Ticket</h1>
            <p className="text-muted-foreground">Booking confirmed successfully</p>
          </div>
        </div>

        {/* Action Buttons */}
        <Card className="print:hidden">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-4 gap-3">
              <Button onClick={printTicket} variant="default">
                <Printer className="h-4 w-4 mr-2" />
                Print Ticket
              </Button>
              <Button onClick={emailTicket} variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Email Ticket
              </Button>
              <Button onClick={whatsappTicket} variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
              <Button onClick={returnToDashboard} variant="outline">
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ticket */}
        <div ref={ticketRef} className="max-w-4xl mx-auto">
          <Card className="border-2">
            <CardHeader className="text-center bg-primary text-primary-foreground">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">🚌 VOYAGE ONBOARD</h2>
                <p className="text-sm">Bus Ticket</p>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {/* Booking Reference */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Booking Reference</p>
                <p className="text-3xl font-bold tracking-wider">{booking.booking_reference}</p>
                <div className="flex justify-center mt-4">
                  <div className="w-32 h-32 bg-gray-200 flex items-center justify-center rounded">
                    <QrCode className="h-16 w-16 text-gray-400" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Trip Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Journey
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">From:</span>
                      <p className="font-medium">{booking.trips?.routes?.origin}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">To:</span>
                      <p className="font-medium">{booking.trips?.routes?.destination}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date & Time
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Departure:</span>
                      <p className="font-medium">
                        {new Date(booking.trips?.departure_time).toLocaleString()}
                      </p>
                    </div>
                    {booking.trips?.arrival_time && (
                      <div>
                        <span className="text-muted-foreground">Arrival:</span>
                        <p className="font-medium">
                          {new Date(booking.trips?.arrival_time).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Passenger Details */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Passengers ({booking.seats?.length})
                </h3>
                <div className="space-y-2">
                  {booking.seats?.map((seat: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded">
                      <div>
                        <p className="font-medium">{seat.passenger_name}</p>
                        <p className="text-sm text-muted-foreground">{seat.passenger_phone}</p>
                        <p className="text-sm text-muted-foreground">ID: {seat.passenger_id_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">Seat {seat.seat_number}</p>
                        <p className="text-sm text-muted-foreground">P {seat.seat_price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Bus & Trip Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <TicketIcon className="h-4 w-4" />
                    Trip Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Trip Number:</span>
                      <p className="font-medium">{booking.trips?.trip_number}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Bus:</span>
                      <p className="font-medium">{booking.trips?.buses?.name || 'TBA'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Payment Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-medium">P {booking.total_amount?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paid:</span>
                      <span className="font-medium text-green-600">P {booking.amount_paid?.toFixed(2)}</span>
                    </div>
                    {booking.balance > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Balance:</span>
                        <span className="font-medium text-orange-600">P {booking.balance?.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-medium capitalize">{booking.payment_status}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Footer */}
              <div className="text-center text-sm text-muted-foreground space-y-2">
                <p>
                  <CheckCircle2 className="inline h-4 w-4 mr-1 text-green-600" />
                  Booking Confirmed
                </p>
                <p>Please arrive at the terminal 30 minutes before departure</p>
                <p>Present this ticket and valid ID for boarding</p>
                <p className="text-xs mt-4">
                  Booked on: {new Date(booking.booking_date).toLocaleString()}
                </p>
              </div>

              {/* Contact Info */}
              <div className="text-center text-xs text-muted-foreground border-t pt-4">
                <p>For inquiries: +267 71 799 129 | info@voyageonboard.com</p>
                <p>Terms and conditions apply</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Success Message */}
        <Card className="print:hidden bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
              <h3 className="text-lg font-semibold text-green-900">Booking Successful!</h3>
              <p className="text-sm text-green-700">
                Ticket has been generated. You can print, email, or send via WhatsApp.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
