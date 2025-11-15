import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import TicketingLayout from '@/components/ticketing/TicketingLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, Edit, Calendar, Users, MapPin, Printer, XCircle, CheckCircle2, ArrowLeft 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ModifyBooking() {
  const { user, userRoles, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : TicketingLayout;

  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'reference' | 'phone' | 'id'>('reference');
  const [searching, setSearching] = useState(false);
  const [booking, setBooking] = useState<any>(null);

  const searchBooking = async () => {
    if (!searchTerm) {
      toast({
        variant: 'destructive',
        title: 'Enter search term',
        description: 'Please enter a booking reference, phone, or ID number',
      });
      return;
    }

    try {
      setSearching(true);

      let query = supabase
        .from('bookings')
        .select(`
          *,
          trips (
            trip_number,
            departure_time,
            routes (origin, destination),
            buses (name)
          ),
          passengers (full_name, phone, id_number)
        `);

      if (searchType === 'reference') {
        query = query.eq('booking_reference', searchTerm);
      } else if (searchType === 'phone') {
        const { data: passenger } = await supabase
          .from('passengers')
          .select('id')
          .eq('phone', searchTerm)
          .single();

        if (!passenger) {
          toast({
            title: 'Not found',
            description: 'No booking found with this phone number',
          });
          return;
        }

        query = query.eq('passenger_id', passenger.id);
      } else if (searchType === 'id') {
        const { data: passenger } = await supabase
          .from('passengers')
          .select('id')
          .eq('id_number', searchTerm)
          .single();

        if (!passenger) {
          toast({
            title: 'Not found',
            description: 'No booking found with this ID number',
          });
          return;
        }

        query = query.eq('passenger_id', passenger.id);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            title: 'Not found',
            description: 'No booking found matching your search',
          });
        } else {
          throw error;
        }
        return;
      }

      // Fetch booking seats
      const { data: seats } = await supabase
        .from('booking_seats')
        .select('*')
        .eq('booking_id', data.id);

      setBooking({ ...data, seats });

      toast({
        title: 'Booking found',
        description: `Booking ${data.booking_reference} loaded`,
      });

    } catch (error: any) {
      console.error('Error searching booking:', error);
      toast({
        variant: 'destructive',
        title: 'Search failed',
        description: error.message,
      });
    } finally {
      setSearching(false);
    }
  };

  const reprintTicket = () => {
    sessionStorage.setItem('bookingReference', booking.booking_reference);
    navigate('/ticketing/issue-ticket');
  };

  const cancelBooking = () => {
    sessionStorage.setItem('bookingReference', booking.booking_reference);
    navigate('/ticketing/cancel-refund');
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">✏️ Modify Booking</h1>
            <p className="text-muted-foreground">Search and modify existing bookings</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate(isAdminRoute ? '/admin/ticketing' : '/ticketing')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Search Booking</CardTitle>
            <CardDescription>Find booking by reference, phone, or ID number</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Search By</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as any)}
                >
                  <option value="reference">Booking Reference</option>
                  <option value="phone">Phone Number</option>
                  <option value="id">ID Number</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>
                  {searchType === 'reference' && 'Booking Reference'}
                  {searchType === 'phone' && 'Phone Number'}
                  {searchType === 'id' && 'ID Number'}
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={
                      searchType === 'reference' ? 'e.g., BK-20241115-A3F9' :
                      searchType === 'phone' ? 'e.g., +267 71234567' :
                      'e.g., 123456789'
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchBooking()}
                  />
                  <Button onClick={searchBooking} disabled={searching}>
                    <Search className="h-4 w-4 mr-2" />
                    {searching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Details */}
        {booking && (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Booking Details</CardTitle>
                    <CardDescription>Reference: {booking.booking_reference}</CardDescription>
                  </div>
                  <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                    {booking.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Trip Info */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Trip Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Route:</span>
                      <p className="font-medium">
                        {booking.trips?.routes?.origin} → {booking.trips?.routes?.destination}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Departure:</span>
                      <p className="font-medium">
                        {new Date(booking.trips?.departure_time).toLocaleString()}
                      </p>
                    </div>
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

                <Separator />

                {/* Passengers */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Passengers ({booking.seats?.length})
                  </h3>
                  <div className="space-y-2">
                    {booking.seats?.map((seat: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{seat.passenger_name}</p>
                          <p className="text-sm text-muted-foreground">{seat.passenger_phone}</p>
                        </div>
                        <Badge variant="secondary">Seat {seat.seat_number}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Payment Info */}
                <div>
                  <h3 className="font-semibold mb-3">Payment Information</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-medium">P {booking.total_amount?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paid:</span>
                      <span className="font-medium text-green-600">P {booking.amount_paid?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Balance:</span>
                      <span className={`font-medium ${booking.balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        P {booking.balance?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-medium capitalize">{booking.payment_status}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>Modify or manage this booking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-3">
                  <Button onClick={reprintTicket} variant="outline">
                    <Printer className="h-4 w-4 mr-2" />
                    Reprint Ticket
                  </Button>
                  <Button variant="outline" disabled>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Details
                  </Button>
                  <Button variant="outline" disabled>
                    <Calendar className="h-4 w-4 mr-2" />
                    Change Date
                  </Button>
                  <Button variant="outline" disabled>
                    <Users className="h-4 w-4 mr-2" />
                    Change Seat
                  </Button>
                  <Button onClick={cancelBooking} variant="destructive">
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Booking
                  </Button>
                  <Button variant="outline" disabled>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Check-In
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Note: Some actions may require supervisor approval
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {/* No Results */}
        {!booking && searchTerm && !searching && (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No booking found</h3>
              <p className="text-muted-foreground">
                Try searching with a different reference, phone, or ID number
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
