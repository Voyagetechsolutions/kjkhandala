import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Armchair, Check } from 'lucide-react';

interface SeatSelectionProps {
  trip: any;
  returnTrip?: any;
  onSeatsSelect: (seats: string[], isReturnTrip?: boolean) => void;
  selectedSeats?: string[];
  selectedReturnSeats?: string[];
  passengerCount?: number;
}

export default function SeatSelection({ trip, returnTrip, onSeatsSelect, selectedSeats = [], selectedReturnSeats = [], passengerCount = 1 }: SeatSelectionProps) {
  const [seatStatusMap, setSeatStatusMap] = useState<{ [key: string]: 'booked' | 'reserved' }>({});
  const [returnSeatStatusMap, setReturnSeatStatusMap] = useState<{ [key: string]: 'booked' | 'reserved' }>({});
  const [currentSelection, setCurrentSelection] = useState<string[]>(selectedSeats);
  const [currentReturnSelection, setCurrentReturnSelection] = useState<string[]>(selectedReturnSeats);
  const [loading, setLoading] = useState(true);
  const [showingReturnSeats, setShowingReturnSeats] = useState(false);

  const totalSeats = trip?.total_seats || 60;
  const seatsPerRow = 4; // 2x2 configuration
  const rows = Math.ceil(totalSeats / seatsPerRow);

  useEffect(() => {
    if (!trip) return;

    const fetchSeatStatus = async () => {
      // Fetch outbound trip seats
      const { data, error } = await supabase
        .from('bookings')
        .select('seat_number, booking_status, payment_status')
        .eq('trip_id', trip.id);

      if (!error && data) {
        const statusMap: { [key: string]: 'booked' | 'reserved' } = {};
        data.forEach((b: any) => {
          const paymentStatus = b.payment_status?.toLowerCase();
          const bookingStatus = b.booking_status?.toLowerCase();
          
          if (paymentStatus === 'reserved' || (paymentStatus === 'pending' && bookingStatus === 'confirmed')) {
            statusMap[b.seat_number] = 'reserved';
          } else if (['paid', 'completed', 'settled'].includes(paymentStatus) && ['confirmed', 'checked_in', 'boarded'].includes(bookingStatus)) {
            statusMap[b.seat_number] = 'booked';
          } else if (['confirmed', 'checked_in', 'boarded'].includes(bookingStatus)) {
            statusMap[b.seat_number] = 'booked';
          }
        });
        setSeatStatusMap(statusMap);
      }

      // Fetch return trip seats if return trip exists
      if (returnTrip) {
        const { data: returnData, error: returnError } = await supabase
          .from('bookings')
          .select('seat_number, booking_status, payment_status')
          .eq('trip_id', returnTrip.id);

        if (!returnError && returnData) {
          const returnStatusMap: { [key: string]: 'booked' | 'reserved' } = {};
          returnData.forEach((b: any) => {
            const paymentStatus = b.payment_status?.toLowerCase();
            const bookingStatus = b.booking_status?.toLowerCase();
            
            if (paymentStatus === 'reserved' || (paymentStatus === 'pending' && bookingStatus === 'confirmed')) {
              returnStatusMap[b.seat_number] = 'reserved';
            } else if (['paid', 'completed', 'settled'].includes(paymentStatus) && ['confirmed', 'checked_in', 'boarded'].includes(bookingStatus)) {
              returnStatusMap[b.seat_number] = 'booked';
            } else if (['confirmed', 'checked_in', 'boarded'].includes(bookingStatus)) {
              returnStatusMap[b.seat_number] = 'booked';
            }
          });
          setReturnSeatStatusMap(returnStatusMap);
        }
      }

      setLoading(false);
    };

    fetchSeatStatus();
  }, [trip, returnTrip]);

  const handleSeatClick = (seatNumber: string, isReturnTrip: boolean = false) => {
    const statusMap = isReturnTrip ? returnSeatStatusMap : seatStatusMap;
    const selection = isReturnTrip ? currentReturnSelection : currentSelection;
    const setSelection = isReturnTrip ? setCurrentReturnSelection : setCurrentSelection;
    
    const status = statusMap[seatNumber];
    
    if (status === 'booked') {
      toast.error('This seat is already booked');
      return;
    }
    
    if (status === 'reserved') {
      toast.error('This seat is reserved and cannot be booked');
      return;
    }

    let newSelection: string[];
    if (selection.includes(seatNumber)) {
      newSelection = selection.filter(s => s !== seatNumber);
    } else {
      if (selection.length >= passengerCount) {
        toast.error(`You can only select ${passengerCount} seat(s)`);
        return;
      }
      newSelection = [...selection, seatNumber];
    }

    setSelection(newSelection);
    onSeatsSelect(newSelection, isReturnTrip);
  };

  const getSeatStatus = (seatNumber: string, isReturnTrip: boolean = false) => {
    const statusMap = isReturnTrip ? returnSeatStatusMap : seatStatusMap;
    const selection = isReturnTrip ? currentReturnSelection : currentSelection;
    
    if (statusMap[seatNumber] === 'booked') return 'booked';
    if (statusMap[seatNumber] === 'reserved') return 'reserved';
    if (selection.includes(seatNumber)) return 'selected';
    return 'available';
  };

  const getSeatColor = (status: string) => {
    switch (status) {
      case 'booked':
        return 'bg-gray-300 cursor-not-allowed';
      case 'reserved':
        return 'bg-blue-300 cursor-not-allowed';
      case 'selected':
        return 'bg-red-500 text-white cursor-pointer hover:bg-red-600';
      default:
        return 'bg-white border-2 border-gray-300 cursor-pointer hover:border-red-500 hover:bg-red-50';
    }
  };

  const renderSeat = (seatNumber: number) => {
    const seatStr = seatNumber.toString();
    const status = getSeatStatus(seatStr, showingReturnSeats);
    
    return (
      <button
        key={seatNumber}
        onClick={() => handleSeatClick(seatStr, showingReturnSeats)}
        disabled={status === 'booked'}
        className={`
          relative w-12 h-12 rounded-lg flex items-center justify-center
          transition-all duration-200 ${getSeatColor(status)}
        `}
      >
        {status === 'selected' ? (
          <Check className="h-5 w-5" />
        ) : (
          <Armchair className="h-5 w-5" />
        )}
        <span className="absolute bottom-0 text-[10px] font-semibold">
          {seatNumber}
        </span>
      </button>
    );
  };

  if (!trip) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Please select a trip first</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p>Loading seats...</p>
      </div>
    );
  }

  const currentTrip = showingReturnSeats ? returnTrip : trip;
  const currentSelectionDisplay = showingReturnSeats ? currentReturnSelection : currentSelection;

  return (
    <div className="space-y-6">
      {/* Trip Type Toggle */}
      {returnTrip && (
        <div className="flex gap-2">
          <Button
            variant={!showingReturnSeats ? 'default' : 'outline'}
            onClick={() => setShowingReturnSeats(false)}
            className="flex-1"
          >
            Outbound Trip
            {currentSelection.length > 0 && (
              <Badge className="ml-2" variant="secondary">{currentSelection.length} selected</Badge>
            )}
          </Button>
          <Button
            variant={showingReturnSeats ? 'default' : 'outline'}
            onClick={() => setShowingReturnSeats(true)}
            className="flex-1"
          >
            Return Trip
            {currentReturnSelection.length > 0 && (
              <Badge className="ml-2" variant="secondary">{currentReturnSelection.length} selected</Badge>
            )}
          </Button>
        </div>
      )}

      {/* Trip Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-lg">
                {currentTrip.route?.origin || currentTrip.routes?.origin} → {currentTrip.route?.destination || currentTrip.routes?.destination}
              </p>
              <p className="text-sm text-muted-foreground">
                {currentTrip.bus?.name || currentTrip.buses?.name || 'TBA'} • {currentTrip.trip_number}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">
                P {(currentTrip.fare || currentTrip.base_fare || 0).toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">per seat</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selection Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Selected Seats</p>
              <p className="font-semibold text-lg">
                {currentSelectionDisplay.length > 0 ? currentSelectionDisplay.join(', ') : 'None'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold text-green-600">
                P {(currentSelectionDisplay.length * (currentTrip.fare || currentTrip.base_fare || 0)).toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white border-2 border-gray-300 rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-300 rounded"></div>
          <span>Booked</span>
        </div>
      </div>

      {/* Seat Map */}
      <Card>
        <CardContent className="p-8">
          <div className="max-w-md mx-auto">
            {/* Driver Section */}
            <div className="mb-8 text-center">
              <div className="inline-block px-4 py-2 bg-gray-200 rounded-lg">
                <p className="text-sm font-semibold">Driver</p>
              </div>
            </div>

            {/* Seats */}
            <div className="space-y-4">
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex items-center justify-center gap-4">
                  {/* Left side seats */}
                  <div className="flex gap-2">
                    {Array.from({ length: 2 }).map((_, seatIndex) => {
                      const seatNumber = rowIndex * seatsPerRow + seatIndex + 1;
                      if (seatNumber > totalSeats) return null;
                      return renderSeat(seatNumber);
                    })}
                  </div>

                  {/* Aisle */}
                  <div className="w-8"></div>

                  {/* Right side seats */}
                  <div className="flex gap-2">
                    {Array.from({ length: 2 }).map((_, seatIndex) => {
                      const seatNumber = rowIndex * seatsPerRow + seatIndex + 3;
                      if (seatNumber > totalSeats) return null;
                      return renderSeat(seatNumber);
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Message */}
      <div className="text-center">
        {currentSelectionDisplay.length === 0 ? (
          <p className="text-muted-foreground">Please select {passengerCount} seat(s) to continue</p>
        ) : currentSelectionDisplay.length < passengerCount ? (
          <p className="text-orange-600">Selected {currentSelectionDisplay.length} of {passengerCount} seat(s)</p>
        ) : (
          <p className="text-green-600">✓ All {passengerCount} seat(s) selected</p>
        )}
      </div>

      {/* Overall Summary for Return Trips */}
      {returnTrip && (
        <Card className="bg-blue-50">
          <CardContent className="p-4">
            <h4 className="font-semibold mb-2">Booking Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Outbound: {currentSelection.length} seat(s)</span>
                <span className="font-semibold">P {(currentSelection.length * (trip.fare || trip.base_fare || 0)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Return: {currentReturnSelection.length} seat(s)</span>
                <span className="font-semibold">P {(currentReturnSelection.length * (returnTrip.fare || returnTrip.base_fare || 0)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-blue-200 font-bold">
                <span>Total:</span>
                <span>P {((currentSelection.length * (trip.fare || trip.base_fare || 0)) + (currentReturnSelection.length * (returnTrip.fare || returnTrip.base_fare || 0))).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
