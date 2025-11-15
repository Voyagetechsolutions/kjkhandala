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
  Search, User, Phone, CreditCard, Star, Calendar, MapPin, 
  DollarSign, Ticket, Edit, Plus, ArrowLeft 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CustomerLookup() {
  const { user, userRoles, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : TicketingLayout;

  const [searchType, setSearchType] = useState<'phone' | 'id' | 'reference' | 'name'>('phone');
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);

  const searchCustomer = async () => {
    if (!searchTerm) {
      toast({
        variant: 'destructive',
        title: 'Enter search term',
        description: 'Please enter a search value',
      });
      return;
    }

    try {
      setSearching(true);
      setCustomer(null);
      setBookings([]);

      let passengerData = null;

      // Search for passenger
      if (searchType === 'phone') {
        const { data } = await supabase
          .from('passengers')
          .select('*')
          .eq('phone', searchTerm)
          .single();
        passengerData = data;
      } else if (searchType === 'id') {
        const { data } = await supabase
          .from('passengers')
          .select('*')
          .eq('id_number', searchTerm)
          .single();
        passengerData = data;
      } else if (searchType === 'name') {
        const { data } = await supabase
          .from('passengers')
          .select('*')
          .ilike('full_name', `%${searchTerm}%`)
          .limit(1)
          .single();
        passengerData = data;
      } else if (searchType === 'reference') {
        // Search by booking reference
        const { data: bookingData } = await supabase
          .from('bookings')
          .select('passenger_id')
          .eq('booking_reference', searchTerm)
          .single();

        if (bookingData?.passenger_id) {
          const { data } = await supabase
            .from('passengers')
            .select('*')
            .eq('id', bookingData.passenger_id)
            .single();
          passengerData = data;
        }
      }

      if (!passengerData) {
        toast({
          title: 'Customer not found',
          description: 'No customer found matching your search',
        });
        return;
      }

      setCustomer(passengerData);

      // Fetch customer bookings
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          *,
          trips (
            trip_number,
            departure_time,
            routes (origin, destination)
          )
        `)
        .eq('passenger_id', passengerData.id)
        .order('booking_date', { ascending: false })
        .limit(10);

      setBookings(bookingsData || []);

      toast({
        title: 'Customer found',
        description: `${passengerData.full_name} - ${passengerData.total_trips || 0} trips`,
      });

    } catch (error: any) {
      console.error('Error searching customer:', error);
      toast({
        variant: 'destructive',
        title: 'Search failed',
        description: error.message,
      });
    } finally {
      setSearching(false);
    }
  };

  const bookNewTicket = () => {
    // Pre-fill customer data in session
    sessionStorage.setItem('customerData', JSON.stringify(customer));
    navigate('/ticketing/search-trips');
  };

  const viewBooking = (bookingRef: string) => {
    sessionStorage.setItem('bookingReference', bookingRef);
    navigate('/ticketing/modify-booking');
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
            <h1 className="text-3xl font-bold mb-2">👤 Customer Lookup</h1>
            <p className="text-muted-foreground">Search customer profiles and booking history</p>
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
            <CardTitle>Search Customer</CardTitle>
            <CardDescription>Find customer by phone, ID, booking reference, or name</CardDescription>
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
                  <option value="phone">Phone Number</option>
                  <option value="id">ID Number</option>
                  <option value="reference">Booking Reference</option>
                  <option value="name">Name</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>
                  {searchType === 'phone' && 'Phone Number'}
                  {searchType === 'id' && 'ID Number'}
                  {searchType === 'reference' && 'Booking Reference'}
                  {searchType === 'name' && 'Customer Name'}
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={
                      searchType === 'phone' ? 'e.g., +267 71234567' :
                      searchType === 'id' ? 'e.g., 123456789' :
                      searchType === 'reference' ? 'e.g., BK-20241115-A3F9' :
                      'e.g., John Doe'
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchCustomer()}
                  />
                  <Button onClick={searchCustomer} disabled={searching}>
                    <Search className="h-4 w-4 mr-2" />
                    {searching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Profile */}
        {customer && (
          <>
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Customer Info */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {customer.full_name}
                        {customer.is_frequent && (
                          <Badge variant="default" className="ml-2">
                            <Star className="h-3 w-3 mr-1" />
                            Frequent Traveler
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>Customer Profile</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Phone className="h-3 w-3" />
                        <span>Phone</span>
                      </div>
                      <p className="font-medium">{customer.phone}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <CreditCard className="h-3 w-3" />
                        <span>ID Number</span>
                      </div>
                      <p className="font-medium">{customer.id_number || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email</span>
                      <p className="font-medium">{customer.email || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Nationality</span>
                      <p className="font-medium">{customer.nationality || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Gender</span>
                      <p className="font-medium">{customer.gender || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date of Birth</span>
                      <p className="font-medium">
                        {customer.date_of_birth ? new Date(customer.date_of_birth).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {customer.next_of_kin_name && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-2">Next of Kin</h4>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Name</span>
                            <p className="font-medium">{customer.next_of_kin_name}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Phone</span>
                            <p className="font-medium">{customer.next_of_kin_phone || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {customer.special_notes && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-2">Special Notes</h4>
                        <p className="text-sm text-muted-foreground">{customer.special_notes}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Total Trips</span>
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-2xl font-bold">{customer.total_trips || 0}</p>
                    </div>
                    <Separator />
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Wallet Balance</span>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-2xl font-bold">P {(customer.wallet_balance || 0).toFixed(2)}</p>
                    </div>
                    <Separator />
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Loyalty Points</span>
                        <Star className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-2xl font-bold">{customer.loyalty_points || 0}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button onClick={bookNewTicket} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Book New Ticket
                    </Button>
                    <Button variant="outline" className="w-full" disabled>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Add to Wallet
                    </Button>
                    <Button variant="outline" className="w-full" disabled>
                      <Edit className="h-4 w-4 mr-2" />
                      Update Details
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Booking History */}
            <Card>
              <CardHeader>
                <CardTitle>Booking History</CardTitle>
                <CardDescription>Recent bookings ({bookings.length})</CardDescription>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No bookings found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{booking.booking_reference}</p>
                            <Badge variant={
                              booking.status === 'confirmed' ? 'default' :
                              booking.status === 'cancelled' ? 'destructive' :
                              'secondary'
                            }>
                              {booking.status}
                            </Badge>
                            <Badge variant={
                              booking.payment_status === 'paid' ? 'default' :
                              booking.payment_status === 'partial' ? 'secondary' :
                              'outline'
                            }>
                              {booking.payment_status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>
                                {booking.trips?.routes?.origin} → {booking.trips?.routes?.destination}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(booking.trips?.departure_time).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">P {booking.total_amount?.toFixed(2)}</p>
                          {booking.balance > 0 && (
                            <p className="text-xs text-orange-600">Balance: P {booking.balance.toFixed(2)}</p>
                          )}
                          <Button
                            onClick={() => viewBooking(booking.booking_reference)}
                            variant="outline"
                            size="sm"
                            className="mt-2"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* No Results */}
        {!customer && searchTerm && !searching && (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No customer found</h3>
              <p className="text-muted-foreground">
                Try searching with a different phone number, ID, or booking reference
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
