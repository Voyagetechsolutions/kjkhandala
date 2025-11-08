import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, MapPin, Calendar, Clock, User } from "lucide-react";

interface BookingDetails {
  id: string;
  booking_reference: string;
  passenger_name: string;
  passenger_phone: string;
  seat_number: string;
  total_amount: number;
  schedules: {
    departure_date: string;
    departure_time: string;
    routes: {
      origin: string;
      destination: string;
    };
    buses: {
      name: string;
    };
  };
}

export default function BookingConfirmation() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          schedules (
            departure_date,
            departure_time,
            routes (origin, destination),
            buses (name)
          )
        `)
        .eq("id", bookingId)
        .single();

      if (error) throw error;
      setBooking(data);
    } catch (error) {
      console.error("Error fetching booking:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p>Booking not found</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Message */}
          <div className="text-center mb-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
            <p className="text-muted-foreground">
              Your e-ticket has been generated. Save this for your journey.
            </p>
          </div>

          {/* E-Ticket */}
          <Card className="p-8 mb-6">
            <div className="text-center mb-6 pb-6 border-b">
              <p className="text-sm text-muted-foreground mb-1">Booking Reference</p>
              <p className="text-3xl font-bold text-primary">{booking.booking_reference}</p>
            </div>

            <div className="space-y-6">
              {/* Route */}
              <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-medium">Route</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold">{booking.schedules.routes.origin}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-lg font-semibold">{booking.schedules.routes.destination}</span>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-medium">Date</span>
                  </div>
                  <p className="text-lg">
                    {new Date(booking.schedules.departure_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">Departure Time</span>
                  </div>
                  <p className="text-lg">{booking.schedules.departure_time}</p>
                </div>
              </div>

              {/* Passenger & Seat */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">Passenger</span>
                  </div>
                  <p className="text-lg">{booking.passenger_name}</p>
                  <p className="text-sm text-muted-foreground">{booking.passenger_phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Seat Number</p>
                  <p className="text-3xl font-bold text-primary">{booking.seat_number}</p>
                </div>
              </div>

              {/* Bus & Amount */}
              <div className="pt-6 border-t">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Bus</p>
                    <p className="font-semibold">{booking.schedules.buses.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-2xl font-bold">P{booking.total_amount}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button className="flex-1" variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Ticket
            </Button>
            <Link to="/my-bookings" className="flex-1">
              <Button className="w-full">View My Bookings</Button>
            </Link>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}