import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Download, Mail, Printer, MapPin, Clock, User, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

interface BookingConfirmationProps {
  bookingId: string | null;
  trip: any;
  seats: string[];
  passengers: any[];
  payment: any;
}

export default function BookingConfirmation({ 
  bookingId, 
  trip, 
  seats = [], 
  passengers = [], 
  payment 
}: BookingConfirmationProps) {
  
  const handleDownloadTicket = () => {
    // TODO: Implement PDF generation
    console.log('Download ticket');
  };

  const handleEmailTicket = () => {
    // TODO: Implement email sending
    console.log('Email ticket');
  };

  const handlePrintTicket = () => {
    window.print();
  };

  if (!bookingId || !trip) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading confirmation...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <Card className="border-green-500 bg-green-50">
        <CardContent className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 text-white rounded-full mb-4">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">
            Booking Confirmed!
          </h2>
          <p className="text-green-800 mb-4">
            Your booking has been successfully confirmed
          </p>
          <div className="inline-block bg-white px-6 py-3 rounded-lg">
            <p className="text-sm text-muted-foreground">Booking Reference</p>
            <p className="text-2xl font-bold text-green-600">{bookingId}</p>
          </div>
        </CardContent>
      </Card>

      {/* Trip Details */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Trip Details
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Route</span>
              <span className="font-medium">
                {trip.routes?.origin} → {trip.routes?.destination}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trip Number</span>
              <span className="font-medium">{trip.trip_number}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Departure</span>
              <span className="font-medium">
                {format(new Date(trip.departure_time), 'MMM dd, yyyy HH:mm')}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bus</span>
              <span className="font-medium">{trip.buses?.name || 'Standard Bus'}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Seats</span>
              <span className="font-medium">{seats.join(', ')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Passenger Details */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            Passenger Information
          </h3>
          
          <div className="space-y-4">
            {passengers.map((passenger, index) => (
              <div key={index} className="border-b pb-3 last:border-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">Seat {passenger.seatNumber}</Badge>
                  <span className="font-medium">{passenger.fullName}</span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Email: {passenger.email}</p>
                  <p>Phone: {passenger.phone}</p>
                  <p>ID: {passenger.idNumber}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Details */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Information
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Method</span>
              <span className="font-medium capitalize">{payment?.method?.replace('_', ' ')}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount Paid</span>
              <span className="font-medium">P {payment?.payment?.amount?.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge className="bg-green-500">Paid</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid md:grid-cols-3 gap-4">
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

      {/* Important Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Important Information
          </h3>
          
          <ul className="space-y-2 text-sm text-blue-900">
            <li>• Please arrive at the terminal at least 30 minutes before departure</li>
            <li>• Bring a valid ID document for verification</li>
            <li>• Your booking reference is required for check-in</li>
            <li>• Tickets are non-transferable</li>
            <li>• Cancellations must be made at least 24 hours before departure</li>
          </ul>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Need help? Contact us at support@voyagebus.com or call +267 1234 5678</p>
      </div>
    </div>
  );
}
