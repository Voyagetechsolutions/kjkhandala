import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import TicketingLayout from '@/components/ticketing/TicketingLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Clock, Users, DollarSign, CheckCircle, Printer } from 'lucide-react';

export default function SellTicket() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : TicketingLayout;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);

  // Step 1: Route Selection
  const [searchParams, setSearchParams] = useState({
    origin: '',
    destination: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Step 2: Selected Trip & Seat
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [selectedSeat, setSelectedSeat] = useState('');

  // Step 3: Passenger Details
  const [passengerData, setPassengerData] = useState({
    firstName: '',
    lastName: '',
    idNumber: '',
    phone: '',
    email: '',
    gender: 'MALE',
    nationality: 'Botswana',
    luggage: 0,
  });

  // Step 4: Payment
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Fetch cities for dropdowns
  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch routes based on selected cities
  const { data: routes = [] } = useQuery({
    queryKey: ['routes', searchParams.origin, searchParams.destination],
    queryFn: async () => {
      if (!searchParams.origin || !searchParams.destination) return [];
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('origin_city', searchParams.origin)
        .eq('destination_city', searchParams.destination)
        .eq('status', 'active');
      if (error) throw error;
      return data || [];
    },
    enabled: !!searchParams.origin && !!searchParams.destination,
  });

  // Step 5: Confirmation
  const [bookingResult, setBookingResult] = useState<any>(null);

  // Fetch available trips
  const { data: tripsData, isLoading: tripsLoading } = useQuery({
    queryKey: ['available-trips', searchParams],
    queryFn: async () => {
      if (!searchParams.origin || !searchParams.destination) return [];
      
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          route:routes!inner(*),
          bus:buses(*),
          driver:drivers(*)
        `)
        .eq('route.origin_city', searchParams.origin)
        .eq('route.destination_city', searchParams.destination)
        .gte('departure_time', `${searchParams.date}T00:00:00`)
        .lte('departure_time', `${searchParams.date}T23:59:59`)
        .in('status', ['SCHEDULED', 'BOARDING'])
        .order('departure_time');
      
      if (error) throw error;
      return data || [];
    },
    enabled: step === 2 && !!searchParams.origin && !!searchParams.destination,
  });

  // Fetch booked seats for selected trip
  const { data: bookedSeats = [] } = useQuery({
    queryKey: ['booked-seats', selectedTrip?.id],
    queryFn: async () => {
      if (!selectedTrip?.id) return [];
      const { data, error } = await supabase
        .from('bookings')
        .select('seat_number')
        .eq('trip_id', selectedTrip.id)
        .in('status', ['confirmed', 'checked_in']);
      if (error) throw error;
      return data?.map(b => b.seat_number) || [];
    },
    enabled: !!selectedTrip?.id && step === 3,
  });

  // Book ticket mutation
  const bookMutation = useMutation({
    mutationFn: async () => {
      // Create or get passenger profile
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', passengerData.phone)
        .single();

      let passengerId = existingProfile?.id;

      if (!passengerId) {
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert([{
            full_name: `${passengerData.firstName} ${passengerData.lastName}`,
            phone: passengerData.phone,
            email: passengerData.email,
            id_number: passengerData.idNumber,
            role: 'PASSENGER',
          }])
          .select()
          .single();

        if (profileError) throw profileError;
        passengerId = newProfile.id;
      }

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert([{
          trip_id: selectedTrip.id,
          passenger_id: passengerId,
          passenger_name: `${passengerData.firstName} ${passengerData.lastName}`,
          passenger_phone: passengerData.phone,
          passenger_email: passengerData.email,
          seat_number: selectedSeat,
          total_amount: selectedTrip.route.base_fare,
          status: 'confirmed',
          booking_date: new Date().toISOString(),
        }])
        .select(`
          *,
          trip:trips(*,
            route:routes(*),
            bus:buses(*)
          )
        `)
        .single();
      
      if (bookingError) throw bookingError;

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert([{
          booking_id: booking.id,
          amount: selectedTrip.route.base_fare,
          payment_method: paymentMethod,
          payment_status: 'completed',
          payment_date: new Date().toISOString(),
        }]);

      if (paymentError) throw paymentError;

      return booking;
    },
    onSuccess: (data) => {
      setBookingResult(data);
      setStep(5);
      queryClient.invalidateQueries({ queryKey: ['ticketing-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['available-trips'] });
      toast.success('Ticket booked successfully!');
    },
    onError: (error) => {
      console.error('Booking error:', error);
      toast.error('Failed to book ticket');
    },
  });

  const handleSearch = () => {
    if (!searchParams.origin || !searchParams.destination) {
      toast.error('Please select origin and destination');
      return;
    }
    setStep(2);
  };

  const handleSelectTrip = (trip: any) => {
    setSelectedTrip(trip);
    setStep(3);
  };

  const handleBookTicket = () => {
    if (!selectedSeat) {
      toast.error('Please select a seat');
      return;
    }
    if (!passengerData.firstName || !passengerData.lastName || !passengerData.phone) {
      toast.error('Please fill in all required passenger details');
      return;
    }
    bookMutation.mutate();
  };

  const handlePrintTicket = () => {
    window.print();
    navigate('/ticketing');
  };

  // Generate seat numbers (simple grid)
  const generateSeats = (capacity: number) => {
    const seats = [];
    const rows = Math.ceil(capacity / 4);
    for (let i = 0; i < rows; i++) {
      const row = String.fromCharCode(65 + i); // A, B, C...
      for (let j = 1; j <= 4 && seats.length < capacity; j++) {
        seats.push(`${row}${j}`);
      }
    }
    return seats;
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {s}
              </div>
              {s < 5 && <div className={`w-12 h-0.5 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Search Routes */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Select Route</CardTitle>
              <CardDescription>Choose origin, destination, and travel date</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>From</Label>
                  <Select value={searchParams.origin} onValueChange={(v) => setSearchParams({ ...searchParams, origin: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select origin" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city: any) => (
                        <SelectItem key={city.id} value={city.name}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>To</Label>
                  <Select value={searchParams.destination} onValueChange={(v) => setSearchParams({ ...searchParams, destination: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city: any) => (
                        <SelectItem key={city.id} value={city.name}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={searchParams.date}
                    onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              <Button onClick={handleSearch} className="w-full">
                Search Trips <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Trip & Seat */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Select Trip</CardTitle>
              <CardDescription>Available trips for {searchParams.origin} → {searchParams.destination}</CardDescription>
            </CardHeader>
            <CardContent>
              {tripsLoading ? (
                <div className="text-center py-8">Loading trips...</div>
              ) : !tripsData || tripsData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No trips available for this route</p>
                  <Button variant="outline" onClick={() => setStep(1)} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Change Search
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {tripsData.map((trip: any) => (
                    <div key={trip.id} className="border rounded-lg p-4 hover:border-primary cursor-pointer" onClick={() => handleSelectTrip(trip)}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{trip.route.origin} → {trip.route.destination}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(trip.departureTime).toLocaleTimeString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {trip.available}/{trip.capacity} seats
                            </span>
                            <Badge>{trip.busType}</Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">P {trip.fare}</p>
                          <Button size="sm">Select</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Passenger Details & Seat */}
        {step === 3 && selectedTrip && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Passenger Details</CardTitle>
              <CardDescription>Enter passenger information and select seat</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Seat Selection */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Select Seat</Label>
                <div className="grid grid-cols-4 gap-2 max-w-md">
                  {generateSeats(selectedTrip.capacity).slice(0, 20).map((seat) => (
                    <Button
                      key={seat}
                      variant={selectedSeat === seat ? 'default' : 'outline'}
                      className="h-12"
                      onClick={() => setSelectedSeat(seat)}
                    >
                      {seat}
                    </Button>
                  ))}
                </div>
                {selectedSeat && (
                  <p className="mt-2 text-sm text-muted-foreground">Selected: <span className="font-medium">{selectedSeat}</span></p>
                )}
              </div>

              {/* Passenger Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>First Name *</Label>
                  <Input value={passengerData.firstName} onChange={(e) => setPassengerData({ ...passengerData, firstName: e.target.value })} />
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input value={passengerData.lastName} onChange={(e) => setPassengerData({ ...passengerData, lastName: e.target.value })} />
                </div>
                <div>
                  <Label>ID/Passport Number *</Label>
                  <Input value={passengerData.idNumber} onChange={(e) => setPassengerData({ ...passengerData, idNumber: e.target.value })} />
                </div>
                <div>
                  <Label>Phone Number *</Label>
                  <Input value={passengerData.phone} onChange={(e) => setPassengerData({ ...passengerData, phone: e.target.value })} />
                </div>
                <div>
                  <Label>Email (Optional)</Label>
                  <Input type="email" value={passengerData.email} onChange={(e) => setPassengerData({ ...passengerData, email: e.target.value })} />
                </div>
                <div>
                  <Label>Gender</Label>
                  <Select value={passengerData.gender} onValueChange={(v) => setPassengerData({ ...passengerData, gender: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Luggage Count</Label>
                  <Input type="number" min="0" value={passengerData.luggage} onChange={(e) => setPassengerData({ ...passengerData, luggage: parseInt(e.target.value) || 0 })} />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={() => setStep(4)} disabled={!selectedSeat || !passengerData.firstName || !passengerData.lastName || !passengerData.idNumber || !passengerData.phone} className="flex-1">
                  Continue to Payment <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Payment */}
        {step === 4 && selectedTrip && (
          <Card>
            <CardHeader>
              <CardTitle>Step 4: Payment</CardTitle>
              <CardDescription>Select payment method and confirm booking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Booking Summary */}
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h3 className="font-semibold">Booking Summary</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span>Route:</span>
                  <span className="font-medium">{selectedTrip.route.origin} → {selectedTrip.route.destination}</span>
                  <span>Date:</span>
                  <span className="font-medium">{new Date(selectedTrip.departureTime).toLocaleDateString()}</span>
                  <span>Time:</span>
                  <span className="font-medium">{new Date(selectedTrip.departureTime).toLocaleTimeString()}</span>
                  <span>Passenger:</span>
                  <span className="font-medium">{passengerData.firstName} {passengerData.lastName}</span>
                  <span>Seat:</span>
                  <span className="font-medium">{selectedSeat}</span>
                  <span>Luggage:</span>
                  <span className="font-medium">{passengerData.luggage} bags</span>
                  <span className="text-lg font-bold">Total:</span>
                  <span className="text-lg font-bold">P {selectedTrip.fare}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Payment Method</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Button variant={paymentMethod === 'CASH' ? 'default' : 'outline'} className="h-20 flex-col" onClick={() => setPaymentMethod('CASH')}>
                    <DollarSign className="h-8 w-8 mb-1" />
                    Cash
                  </Button>
                  <Button variant={paymentMethod === 'CARD' ? 'default' : 'outline'} className="h-20 flex-col" onClick={() => setPaymentMethod('CARD')}>
                    <DollarSign className="h-8 w-8 mb-1" />
                    Card
                  </Button>
                  <Button variant={paymentMethod === 'MOBILE_MONEY' ? 'default' : 'outline'} className="h-20 flex-col" onClick={() => setPaymentMethod('MOBILE_MONEY')}>
                    <DollarSign className="h-8 w-8 mb-1" />
                    Mobile Money
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleBookTicket} disabled={bookMutation.isPending} className="flex-1">
                  {bookMutation.isPending ? 'Processing...' : 'Confirm & Pay'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Confirmation */}
        {step === 5 && bookingResult && (
          <Card>
            <CardHeader>
              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <CardTitle className="text-2xl">Ticket Booked Successfully!</CardTitle>
                <CardDescription>Ticket details and receipt</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Ticket Details */}
              <div className="border-2 border-dashed p-6 rounded-lg space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Ticket Number</p>
                  <p className="text-3xl font-bold">{bookingResult.booking.ticketNumber}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Passenger</p>
                    <p className="font-medium">{bookingResult.passenger.firstName} {bookingResult.passenger.lastName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Seat Number</p>
                    <p className="font-medium">{bookingResult.booking.seatNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date & Time</p>
                    <p className="font-medium">{new Date(bookingResult.trip.departureTime).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Amount Paid</p>
                    <p className="font-medium">P {bookingResult.booking.totalPrice}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment Method</p>
                    <p className="font-medium">{bookingResult.booking.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge className="bg-green-500">{bookingResult.booking.bookingStatus}</Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePrintTicket} className="flex-1">
                  <Printer className="mr-2 h-4 w-4" /> Print Ticket
                </Button>
                <Button onClick={() => navigate('/ticketing')} className="flex-1">
                  Done
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
