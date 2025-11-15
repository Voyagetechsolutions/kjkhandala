import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import TicketingLayout from '@/components/ticketing/TicketingLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, DollarSign, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SeatStatus {
  seat_number: number;
  status: 'available' | 'reserved' | 'sold' | 'blocked';
  price: number;
  seat_type: string;
}

export default function TicketingSeatSelection() {
  const { user, userRoles, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : TicketingLayout;

  const [trip, setTrip] = useState<any>(null);
  const [passengers, setPassengers] = useState(1);
  const [seats, setSeats] = useState<SeatStatus[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [loadingSeats, setLoadingSeats] = useState(true);

  useEffect(() => {
    // Get trip from sessionStorage
    const tripData = sessionStorage.getItem('selectedTrip');
    const passengersData = sessionStorage.getItem('passengers');

    if (!tripData) {
      toast({
        variant: 'destructive',
        title: 'No trip selected',
        description: 'Please search and select a trip first',
      });
      navigate('/ticketing/search-trips');
      return;
    }

    setTrip(JSON.parse(tripData));
    setPassengers(parseInt(passengersData || '1'));
    
    fetchSeatStatus(JSON.parse(tripData).trip_id);
  }, []);

  const fetchSeatStatus = async (tripId: string) => {
    try {
      setLoadingSeats(true);

      // Fetch booked seats
      const { data: bookedSeats, error } = await supabase
        .from('booking_seats')
        .select('seat_number, status, seat_price, seat_type')
        .eq('trip_id', tripId)
        .in('status', ['reserved', 'sold', 'blocked']);

      if (error) throw error;

      // Create seat map (60 seats, 2x2 configuration)
      const seatMap: SeatStatus[] = [];
      for (let i = 1; i <= 60; i++) {
        const booked = bookedSeats?.find((s) => s.seat_number === i);
        
        if (booked) {
          seatMap.push({
            seat_number: i,
            status: booked.status as any,
            price: booked.seat_price,
            seat_type: booked.seat_type,
          });
        } else {
          // Determine seat type and price
          let seatType = 'standard';
          let extraPrice = 0;

          // Front row (seats 1-4)
          if (i <= 4) {
            seatType = 'front';
            extraPrice = 10;
          }
          // Window seats (1, 4, 5, 8, 9, 12, etc.)
          else if (i % 4 === 1 || i % 4 === 0) {
            seatType = 'window';
            extraPrice = 5;
          }

          seatMap.push({
            seat_number: i,
            status: 'available',
            price: (trip?.base_fare || 0) + extraPrice,
            seat_type: seatType,
          });
        }
      }

      setSeats(seatMap);
    } catch (error: any) {
      console.error('Error fetching seat status:', error);
      toast({
        variant: 'destructive',
        title: 'Error loading seats',
        description: error.message,
      });
    } finally {
      setLoadingSeats(false);
    }
  };

  const toggleSeat = (seatNumber: number) => {
    const seat = seats.find((s) => s.seat_number === seatNumber);
    if (!seat || seat.status !== 'available') return;

    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatNumber));
    } else {
      if (selectedSeats.length >= passengers) {
        toast({
          title: 'Maximum seats selected',
          description: `You can only select ${passengers} seat(s)`,
        });
        return;
      }
      setSelectedSeats([...selectedSeats, seatNumber]);
    }
  };

  const autoAssignSeats = () => {
    const availableSeats = seats
      .filter((s) => s.status === 'available')
      .map((s) => s.seat_number)
      .slice(0, passengers);

    setSelectedSeats(availableSeats);
    toast({
      title: 'Seats auto-assigned',
      description: `${availableSeats.length} best available seats selected`,
    });
  };

  const proceedToPassengerDetails = () => {
    if (selectedSeats.length !== passengers) {
      toast({
        variant: 'destructive',
        title: 'Incomplete selection',
        description: `Please select ${passengers} seat(s)`,
      });
      return;
    }

    // Store selected seats
    sessionStorage.setItem('selectedSeats', JSON.stringify(selectedSeats));
    
    // Navigate to passenger details
    navigate('/ticketing/passenger-details');
  };

  const getSeatColor = (seat: SeatStatus, isSelected: boolean) => {
    if (isSelected) return 'bg-blue-500 text-white hover:bg-blue-600';
    
    switch (seat.status) {
      case 'available':
        return 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800 cursor-not-allowed';
      case 'sold':
        return 'bg-red-100 text-red-800 cursor-not-allowed';
      case 'blocked':
        return 'bg-gray-200 text-gray-500 cursor-not-allowed';
      default:
        return 'bg-gray-100';
    }
  };

  const totalPrice = selectedSeats.reduce((sum, seatNum) => {
    const seat = seats.find((s) => s.seat_number === seatNum);
    return sum + (seat?.price || 0);
  }, 0);

  if (loading || loadingSeats) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">🪑 Select Seats</h1>
            <p className="text-muted-foreground">
              Choose {passengers} seat(s) for your journey
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/ticketing/search-trips')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Button>
        </div>

        {/* Trip Info */}
        {trip && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Selected Trip</p>
                  <p className="text-lg font-bold">
                    {trip.origin} → {trip.destination}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(trip.departure_time).toLocaleString()} • {trip.trip_number}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Base Fare</p>
                  <p className="text-2xl font-bold">P {trip.base_fare}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Seat Map */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Seat Layout (2x2 Configuration)</CardTitle>
                  <CardDescription>Click on available seats to select</CardDescription>
                </div>
                <Button onClick={autoAssignSeats} variant="outline" size="sm">
                  Auto-Assign Best Seats
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Legend */}
              <div className="flex items-center gap-4 mb-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-100 border rounded"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-yellow-100 border rounded"></div>
                  <span>Reserved</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-100 border rounded"></div>
                  <span>Sold</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 border rounded"></div>
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-200 border rounded"></div>
                  <span>Blocked</span>
                </div>
              </div>

              {/* Driver */}
              <div className="text-center mb-4 text-sm text-muted-foreground">
                🚗 Driver
              </div>

              {/* Seat Grid */}
              <div className="space-y-2">
                {Array.from({ length: 15 }, (_, rowIndex) => (
                  <div key={rowIndex} className="flex items-center justify-center gap-2">
                    {/* Row number */}
                    <div className="w-8 text-center text-sm text-muted-foreground">
                      {rowIndex + 1}
                    </div>

                    {/* Left seats */}
                    {[1, 2].map((seatInRow) => {
                      const seatNumber = rowIndex * 4 + seatInRow;
                      const seat = seats.find((s) => s.seat_number === seatNumber);
                      const isSelected = selectedSeats.includes(seatNumber);

                      return (
                        <button
                          key={seatNumber}
                          onClick={() => toggleSeat(seatNumber)}
                          disabled={seat?.status !== 'available' && !isSelected}
                          className={`w-12 h-12 rounded border-2 text-xs font-semibold transition-colors ${getSeatColor(
                            seat!,
                            isSelected
                          )}`}
                        >
                          {seatNumber}
                        </button>
                      );
                    })}

                    {/* Aisle */}
                    <div className="w-8"></div>

                    {/* Right seats */}
                    {[3, 4].map((seatInRow) => {
                      const seatNumber = rowIndex * 4 + seatInRow;
                      const seat = seats.find((s) => s.seat_number === seatNumber);
                      const isSelected = selectedSeats.includes(seatNumber);

                      return (
                        <button
                          key={seatNumber}
                          onClick={() => toggleSeat(seatNumber)}
                          disabled={seat?.status !== 'available' && !isSelected}
                          className={`w-12 h-12 rounded border-2 text-xs font-semibold transition-colors ${getSeatColor(
                            seat!,
                            isSelected
                          )}`}
                        >
                          {seatNumber}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Selection Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Selection Summary</CardTitle>
              <CardDescription>Your selected seats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Selected Seats</p>
                {selectedSeats.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No seats selected</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedSeats.map((seatNum) => {
                      const seat = seats.find((s) => s.seat_number === seatNum);
                      return (
                        <Badge key={seatNum} variant="default">
                          Seat {seatNum}
                          {seat?.seat_type !== 'standard' && (
                            <span className="ml-1">({seat?.seat_type})</span>
                          )}
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">
                    <Users className="inline h-3 w-3 mr-1" />
                    Passengers
                  </span>
                  <span className="font-semibold">{passengers}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Seats Selected</span>
                  <span className="font-semibold">{selectedSeats.length}</span>
                </div>
                <div className="flex items-center justify-between text-lg font-bold border-t pt-2 mt-2">
                  <span>
                    <DollarSign className="inline h-4 w-4" />
                    Total
                  </span>
                  <span>P {totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <Button
                onClick={proceedToPassengerDetails}
                className="w-full"
                disabled={selectedSeats.length !== passengers}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Continue to Passenger Details
              </Button>

              {selectedSeats.length !== passengers && (
                <p className="text-xs text-center text-muted-foreground">
                  Please select {passengers - selectedSeats.length} more seat(s)
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
