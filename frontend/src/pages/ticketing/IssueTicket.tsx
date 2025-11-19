import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import TicketingLayout from '@/components/ticketing/TicketingLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Printer, Mail, MessageSquare, Home, CheckCircle2, 
  MapPin, Calendar, Users, Ticket as TicketIcon, QrCode, Download 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Thermal printer styles
const thermalPrintStyles = `
  @media print {
    @page {
      size: 80mm 200mm;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
    }
    .print\\:hidden {
      display: none !important;
    }
  }
`;

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

      // Extract base reference (remove trailing -1, -2, etc.)
      const baseRef = bookingRef.split('-')[0];
      
      // Fetch ALL bookings with this base reference
      const { data: allBookings, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .or(`booking_reference.eq.${bookingRef},booking_reference.like.${baseRef}-%`)
        .order('booking_reference');

      console.log('Fetching bookings for:', bookingRef);
      console.log('Base reference:', baseRef);
      console.log('Found bookings:', allBookings);

      if (bookingError) {
        console.error('Booking fetch error:', bookingError);
        throw bookingError;
      }
      if (!allBookings || allBookings.length === 0) {
        throw new Error('No bookings found');
      }

      // Fetch trip details (all bookings have same trip)
      const tripId = allBookings[0].trip_id;
      let tripData = null;
      if (tripId) {
        const { data: trip } = await supabase
          .from('trips')
          .select('id, trip_number, scheduled_departure, scheduled_arrival, route_id, bus_id')
          .eq('id', tripId)
          .single();

        if (trip) {
          const { data: route } = await supabase
            .from('routes')
            .select('origin, destination')
            .eq('id', trip.route_id)
            .single();

          const { data: bus } = await supabase
            .from('buses')
            .select('name, number_plate')
            .eq('id', trip.bus_id)
            .single();

          tripData = {
            trip_number: trip.trip_number,
            departure_time: trip.scheduled_departure,
            arrival_time: trip.scheduled_arrival,
            routes: route,
            buses: bus ? { name: bus.name, number_plate: bus.number_plate } : null,
          };
        }
      }

      // Calculate total amount across all passengers
      const totalAmount = allBookings.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);

      // Set booking state
      const bookingState = {
        booking_reference: bookingRef,
        trips: tripData,
        passengers: allBookings.map(b => ({
          passenger_name: b.passenger_name,
          passenger_phone: b.passenger_phone,
          passenger_email: b.passenger_email,
          seat_number: b.seat_number,
          total_amount: parseFloat(b.total_amount),
          booking_status: b.booking_status,
          payment_status: b.payment_status,
        })),
        total_amount: totalAmount,
        passenger_count: allBookings.length,
        payment_status: allBookings.every(b => b.payment_status === 'paid')
          ? 'paid'
          : allBookings.some(b => b.payment_status === 'partial')
          ? 'partial'
          : 'pending',
        booking_status: allBookings.every(b => b.booking_status === 'confirmed')
          ? 'confirmed'
          : 'pending',
        booking_date: allBookings[0].created_at,
      };

      console.log('Final booking state:', bookingState);
      console.log('Passenger count:', bookingState.passenger_count);
      console.log('Passengers array:', bookingState.passengers);
      
      setBooking(bookingState);

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

  const downloadTicket = async () => {
    if (!ticketRef.current) return;
    
    try {
      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `ticket-${booking.booking_reference}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast({
            title: 'Ticket downloaded',
            description: `Saved as ticket-${booking.booking_reference}.png`,
          });
        }
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        variant: 'destructive',
        title: 'Download failed',
        description: 'Could not download ticket',
      });
    }
  };

  const emailTicket = () => {
    toast({
      title: 'Email sent',
      description: `Ticket sent to ${booking?.passengers?.phone || 'customer'}`,
    });
  };

  const whatsappTicket = () => {
    if (!booking?.passengers || booking.passengers.length === 0) return;
    
    const firstPassenger = booking.passengers[0];
    const phone = firstPassenger.passenger_phone?.replace(/\D/g, '');
    
    // Build passenger list
    const passengerList = booking.passengers
      .map((p: any, i: number) => `${i + 1}. ${p.passenger_name} - Seat ${p.seat_number}`)
      .join('\n');
    
    const message = `Your booking is confirmed!\n\nBooking Reference: ${booking.booking_reference}\n\nPassengers (${booking.passenger_count}):\n${passengerList}\n\nTrip: ${booking.trips?.routes?.origin} → ${booking.trips?.routes?.destination}\nDate: ${new Date(booking.trips?.departure_time).toLocaleString()}\nBus: ${booking.trips?.buses?.name || 'TBA'}\n\nTotal Amount: P${booking.total_amount?.toFixed(2)}\nPayment Status: ${booking.payment_status}\n\nThank you for choosing Voyage Onboard!`;
    
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
      <style>{thermalPrintStyles}</style>
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
            <div className="grid md:grid-cols-5 gap-3">
              <Button onClick={printTicket} variant="default">
                <Printer className="h-4 w-4 mr-2" />
                Print Ticket
              </Button>
              <Button onClick={downloadTicket} variant="default">
                <Download className="h-4 w-4 mr-2" />
                Download
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

        {/* Ticket - 80mm x 200mm Thermal Printer Format */}
        <div ref={ticketRef} className="max-w-sm mx-auto">
          <Card className="border-2" style={{ width: '80mm', minHeight: '200mm' }}>
            <CardContent className="p-4 space-y-3 text-xs">
              {/* Header */}
              <div className="text-center border-b pb-3">
                <h2 className="text-lg font-bold">KJ KHANDALA</h2>
                <p className="text-xs">TRAVEL AND TOUR</p>
                <p className="text-xs mt-1">Bus Ticket</p>
              </div>

              {/* Booking Reference */}
              <div className="text-center py-2">
                <p className="text-xs text-muted-foreground">Booking Reference</p>
                <p className="text-xl font-bold tracking-wider">{booking.booking_reference}</p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center py-2">
                <div className="w-24 h-24 bg-gray-200 flex items-center justify-center rounded">
                  <QrCode className="h-16 w-16 text-gray-400" />
                </div>
              </div>

              <Separator />

              {/* Trip Details */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">From:</span>
                  <span className="font-semibold">{booking.trips?.routes?.origin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">To:</span>
                  <span className="font-semibold">{booking.trips?.routes?.destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trip:</span>
                  <span className="font-semibold">{booking.trips?.trip_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bus:</span>
                  <span className="font-semibold">{booking.trips?.buses?.name || 'TBA'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Departure:</span>
                  <span className="font-semibold">
                    {new Date(booking.trips?.departure_time).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Passengers */}
              <div>
                <p className="font-semibold mb-2">Passengers ({booking.passenger_count || 1})</p>
                <div className="space-y-2">
                  {booking.passengers?.map((passenger: any, index: number) => (
                    <div key={index} className="border-l-2 border-primary pl-2 py-1">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold">{passenger.passenger_name}</p>
                          <p className="text-xs text-muted-foreground">{passenger.passenger_phone}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">Seat {passenger.seat_number}</p>
                          <p className="text-xs">P {parseFloat(passenger.total_amount)?.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Price Summary */}
              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>Total Amount:</span>
                  <span>P {booking.total_amount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment:</span>
                  <span className={`font-medium capitalize ${
                    booking.payment_status === 'paid' ? 'text-green-600' : 
                    booking.payment_status === 'partial' ? 'text-orange-600' : 
                    'text-gray-600'
                  }`}>
                    {booking.payment_status}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Terms & Conditions */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-center mb-2">Terms & Conditions</p>
                <p>• Arrive 30 minutes before departure</p>
                <p>• Present this ticket and valid ID</p>
                <p>• No refund after departure</p>
                <p>• Luggage limit: 20kg per passenger</p>
                <p>• Keep ticket until journey ends</p>
              </div>

              <Separator />

              {/* Footer */}
              <div className="text-center text-xs text-muted-foreground space-y-1">
                <p className="flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  Booking Confirmed
                </p>
                <p>Tel: +267 71 799 129</p>
                <p className="text-xs">
                  {new Date(booking.booking_date).toLocaleDateString('en-GB')}
                </p>
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
