import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Bus as BusIcon, MapPin } from "lucide-react";

export default function SeatSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const { schedule, form, passengers } = location.state || {};
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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

  const rows = schedule.buses?.layout_rows || 10;
  const cols = schedule.buses?.layout_columns || 4;
  const totalSeats = passengers.length;

  const generateSeats = () => {
    const seats = [];
    for (let row = 1; row <= rows; row++) {
      for (let col = 1; col <= cols; col++) {
        const seatNumber = `${row}${String.fromCharCode(65 + col)}`;
        seats.push(seatNumber);
      }
    }
    return seats;
  };

  const handleSeatClick = (seat: string) => {
    if (bookedSeats.includes(seat)) return;
    if (selectedSeats.includes(seat)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seat));
    } else if (selectedSeats.length < totalSeats) {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const handleContinue = () => {
    if (selectedSeats.length !== totalSeats) return;
    navigate("/book/payment", { state: { schedule, form, passengers, selectedSeats } });
  };

  const seats = generateSeats();

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
                <p className="text-2xl font-bold">P{schedule.routes.price}</p>
              </div>
            </div>
          </Card>
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Select {totalSeats} Seat(s)</h2>
              <div className="flex gap-6 mb-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-background border-2 border-border rounded"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary text-white border-2 border-primary rounded flex items-center justify-center">✓</div>
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-muted text-muted-foreground border-2 border-muted rounded flex items-center justify-center">✕</div>
                  <span>Booked</span>
                </div>
              </div>
              <div className="space-y-2">
                {Array.from({ length: rows }).map((_, rowIdx) => (
                  <div key={rowIdx} className="flex gap-2 justify-center">
                    {Array.from({ length: cols }).map((_, colIdx) => {
                      const seatNumber = `${rowIdx + 1}${String.fromCharCode(65 + colIdx)}`;
                      const isBooked = bookedSeats.includes(seatNumber);
                      const isSelected = selectedSeats.includes(seatNumber);
                      return (
                        <button
                          key={seatNumber}
                          onClick={() => handleSeatClick(seatNumber)}
                          disabled={isBooked}
                          className={`w-12 h-12 rounded border-2 text-sm font-medium transition-all
                            ${isBooked
                              ? "bg-muted text-muted-foreground border-muted cursor-not-allowed"
                              : isSelected
                              ? "bg-primary text-white border-primary"
                              : "bg-background border-border hover:border-primary hover:bg-primary/5"
                            }
                          `}
                        >
                          {seatNumber}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-6 flex flex-col justify-between">
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
