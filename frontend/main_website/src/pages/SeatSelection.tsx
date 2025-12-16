import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from '@/lib/supabase';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TripSummary from "@/components/TripSummary";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Bus as BusIcon, MapPin } from "lucide-react";
import SeatMap from "@/components/SeatMap";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency, convertCurrency } from "@/lib/currency";

export default function SeatSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const { schedule, form, passengers } = location.state || {};
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { currency } = useCurrency();

  useEffect(() => {
    if (!schedule || !form || !passengers) {
      navigate("/book");
      return;
    }
    // Fetch booked seats for this schedule
    const fetchBookedSeats = async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("seat_number")
        .eq("schedule_id", schedule.id)
        .neq("status", "cancelled");
      if (!error && data) {
        setBookedSeats(data.map((b: { seat_number: string }) => b.seat_number));
      }
      setLoading(false);
    };
    fetchBookedSeats();
  }, [schedule, form, passengers, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!schedule || !form || !passengers) return null;

  const totalSeats = passengers.length;
  const busCapacity = 60; // Fixed 60 seats, 2x2 configuration
  
  // Convert price to selected currency
  const priceInCurrency = convertCurrency(schedule.routes.price, 'BWP', currency);

  const handleSeatSelect = (seatNumber: string) => {
    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatNumber));
    } else {
      setSelectedSeats([...selectedSeats, seatNumber]);
    }
  };

  const handleContinue = () => {
    if (selectedSeats.length !== totalSeats) return;
    const total = priceInCurrency * selectedSeats.length;
    navigate("/book/payment", { 
      state: { schedule, form, passengers, selectedSeats, total, currency } 
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Select Your Seats</h1>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Seat Map */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Select {totalSeats} Seat{totalSeats > 1 ? 's' : ''}
                </h2>
                <SeatMap
                  totalSeats={busCapacity}
                  bookedSeats={bookedSeats}
                  selectedSeats={selectedSeats}
                  onSeatSelect={handleSeatSelect}
                  maxSeats={totalSeats}
                />
                
                {/* Legend */}
                <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 border-2 border-gray-300 rounded"></div>
                    <span className="text-sm">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded"></div>
                    <span className="text-sm">Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-400 rounded"></div>
                    <span className="text-sm">Booked</span>
                  </div>
                </div>
              </Card>

              {/* Selected Seats Summary */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Selected Seats</h2>
                <div className="mb-6">
                  {selectedSeats.length === 0 ? (
                    <div className="text-muted-foreground text-center py-8">
                      No seats selected yet. Please select {totalSeats} seat{totalSeats > 1 ? 's' : ''} to continue.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedSeats.map((seat) => (
                        <span key={seat} className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium">
                          Seat {seat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleContinue}
                  disabled={selectedSeats.length !== totalSeats}
                  className="w-full"
                  size="lg"
                >
                  {selectedSeats.length === totalSeats 
                    ? "Continue to Payment" 
                    : `Select ${totalSeats - selectedSeats.length} more seat${totalSeats - selectedSeats.length > 1 ? 's' : ''}`
                  }
                </Button>
              </Card>
            </div>

            {/* Trip Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <TripSummary 
                  schedule={schedule} 
                  passengers={totalSeats}
                  totalPrice={priceInCurrency * selectedSeats.length}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
