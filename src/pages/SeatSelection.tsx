import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bus as BusIcon, MapPin } from "lucide-react";
import { z } from "zod";

const bookingSchema = z.object({
  passengerName: z.string().min(2).max(100),
  passengerPhone: z.string().min(8).max(20),
  passengerEmail: z.string().email().optional().or(z.literal("")),
  passengerIdNumber: z.string().max(50).optional(),
});

interface ScheduleDetails {
  id: string;
  departure_date: string;
  departure_time: string;
  routes: {
    origin: string;
    destination: string;
    price: number;
  };
  buses: {
    name: string;
    layout_rows: number;
    layout_columns: number;
  };
}

export default function SeatSelection() {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [schedule, setSchedule] = useState<ScheduleDetails | null>(null);
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [formData, setFormData] = useState({
    passengerName: "",
    passengerPhone: "",
    passengerEmail: "",
    passengerIdNumber: "",
  });

  useEffect(() => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to book tickets.",
      });
      navigate("/auth");
      return;
    }

    fetchScheduleDetails();
  }, [scheduleId, user]);

  const fetchScheduleDetails = async () => {
    try {
      const { data: scheduleData, error: scheduleError } = await supabase
        .from("schedules")
        .select(`
          *,
          routes (origin, destination, price),
          buses (name, layout_rows, layout_columns)
        `)
        .eq("id", scheduleId)
        .single();

      if (scheduleError) throw scheduleError;
      setSchedule(scheduleData);

      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("seat_number")
        .eq("schedule_id", scheduleId)
        .neq("status", "cancelled");

      if (bookingsError) throw bookingsError;
      setBookedSeats(bookingsData.map((b) => b.seat_number));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      navigate("/routes");
    } finally {
      setLoading(false);
    }
  };

  const generateSeats = () => {
    if (!schedule) return [];
    // Enforce minimum 60 seats, allow admin to set higher
    const seatingCapacity = Math.max(60, Number(schedule.buses?.seating_capacity || 60));
    let rows = schedule.buses?.layout_rows || Math.ceil(seatingCapacity / 4);
    let cols = schedule.buses?.layout_columns || Math.ceil(seatingCapacity / rows);
    if (rows * cols < seatingCapacity) {
      cols = Math.ceil(Math.sqrt(seatingCapacity));
      rows = Math.ceil(seatingCapacity / cols);
    }
    const seats = [];
    for (let row = 1; row <= rows; row++) {
      for (let col = 1; col <= cols; col++) {
        const seatNumber = `${row}${String.fromCharCode(64 + col)}`;
        seats.push(seatNumber);
        if (seats.length >= seatingCapacity) break;
      }
      if (seats.length >= seatingCapacity) break;
    }
    return seats;
  };

  const handleBooking = async () => {
    if (!selectedSeat || !user || !schedule) return;

    try {
      const validated = bookingSchema.parse(formData);

      setBooking(true);

      // Generate booking reference
      const bookingRef = `VB${Date.now().toString().slice(-8)}`;

      const { data, error } = await supabase
        .from("bookings")
        .insert({
          schedule_id: scheduleId,
          user_id: user.id,
          passenger_name: validated.passengerName,
          passenger_phone: validated.passengerPhone,
          passenger_email: validated.passengerEmail || null,
          passenger_id_number: validated.passengerIdNumber || null,
          seat_number: selectedSeat,
          total_amount: schedule.routes.price,
          status: "confirmed",
          booking_reference: bookingRef,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Booking Successful!",
        description: `Your booking reference is ${bookingRef}`,
      });

      navigate(`/booking-confirmation/${data.id}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Booking failed",
        description: error.message || "Please try again",
      });
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!schedule) return null;

  const seats = generateSeats();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Trip Info */}
          <Card className="p-6 mb-8">
            <div className="flex items-center gap-4">
              <BusIcon className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4" />
                  <span className="font-semibold">{schedule.routes.origin}</span>
                  <span>→</span>
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
            {/* Seat Map */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Select Your Seat</h2>

              {/* Legend */}
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

              {/* Seats Grid */}
              <div className="space-y-2">
                {Array.from({ length: schedule.buses.layout_rows }).map((_, rowIdx) => (
                  <div key={rowIdx} className="flex gap-2 justify-center">
                    {Array.from({ length: schedule.buses.layout_columns }).map((_, colIdx) => {
                      const seatNumber = `${rowIdx + 1}${String.fromCharCode(65 + colIdx)}`;
                      const isBooked = bookedSeats.includes(seatNumber);
                      const isSelected = selectedSeat === seatNumber;

                      return (
                        <button
                          key={seatNumber}
                          onClick={() => !isBooked && setSelectedSeat(seatNumber)}
                          disabled={isBooked}
                          className={`
                            w-12 h-12 rounded border-2 text-sm font-medium transition-all
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

            {/* Passenger Details */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Passenger Details</h2>

              <div className="space-y-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.passengerName}
                    onChange={(e) => setFormData({ ...formData, passengerName: e.target.value })}
                    maxLength={100}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.passengerPhone}
                    onChange={(e) => setFormData({ ...formData, passengerPhone: e.target.value })}
                    maxLength={20}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.passengerEmail}
                    onChange={(e) => setFormData({ ...formData, passengerEmail: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idNumber">ID/Passport Number (Optional)</Label>
                  <Input
                    id="idNumber"
                    value={formData.passengerIdNumber}
                    onChange={(e) => setFormData({ ...formData, passengerIdNumber: e.target.value })}
                    maxLength={50}
                  />
                </div>
              </div>

              {selectedSeat && (
                <div className="bg-muted p-4 rounded-lg mb-6">
                  <p className="text-sm font-medium mb-2">Booking Summary</p>
                  <div className="space-y-1 text-sm">
                    <p>Seat: <span className="font-semibold">{selectedSeat}</span></p>
                    <p>Price: <span className="font-semibold">P{schedule.routes.price}</span></p>
                  </div>
                </div>
              )}

              <Button
                onClick={handleBooking}
                disabled={!selectedSeat || !formData.passengerName || !formData.passengerPhone || booking}
                className="w-full"
                size="lg"
              >
                {booking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Booking
              </Button>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
