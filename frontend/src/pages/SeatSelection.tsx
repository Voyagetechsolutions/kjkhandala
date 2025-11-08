import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
  const busCapacity = schedule.buses?.capacity || 40;
  
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
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Card className="p-6 mb-8">
            <div className="flex items-center gap-4">
              <BusIcon className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4" />
                  <span className="font-semibold">{schedule.routes.origin}</span>
                  <span>&rarr;</span>
                  <span className="font-semibold">{schedule.routes.destination}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(schedule.departure_date).toLocaleDateString()} at {schedule.departure_time}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{formatCurrency(priceInCurrency, currency)}</p>
                <p className="text-sm text-muted-foreground">per seat</p>
              </div>
            </div>
          </Card>
          
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Select {totalSeats} Seat(s)</h2>
            <SeatMap
              totalSeats={busCapacity}
              bookedSeats={bookedSeats}
              selectedSeats={selectedSeats}
              onSeatSelect={handleSeatSelect}
              maxSeats={totalSeats}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Selected Seats</h2>
              <div className="mb-4">
                {selectedSeats.length === 0 ? (
                  <div className="text-muted-foreground">No seats selected yet.</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedSeats.map((seat) => (
                      <span key={seat} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                        {seat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <Button
                onClick={handleContinue}
                disabled={selectedSeats.length !== totalSeats}
                className="w-full mt-4"
                size="lg"
              >
                Continue to Payment
              </Button>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
