import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from '@/lib/supabase';
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Clock, Ticket } from "lucide-react";

interface Booking {
  id: string;
  booking_reference: string;
  seat_number: string;
  status: string;
  total_amount: number;
  created_at: string;
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

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;

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
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
          <p className="text-muted-foreground">View and manage your bus tickets</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading your bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <Card className="p-12 text-center">
            <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
            <p className="text-muted-foreground mb-4">
              Start your journey by booking a ticket
            </p>
            <Button onClick={() => navigate("/routes")}>
              Browse Routes
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Booking Reference</p>
                    <p className="text-xl font-bold text-primary">{booking.booking_reference}</p>
                  </div>
                  <Badge className={`${getStatusColor(booking.status)} text-white`}>
                    {booking.status}
                  </Badge>
                </div>

                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">Route</span>
                    </div>
                    <p className="font-semibold">{booking.schedules.routes.origin}</p>
                    <p className="text-sm text-muted-foreground">to {booking.schedules.routes.destination}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">Date</span>
                    </div>
                    <p className="font-semibold">
                      {new Date(booking.schedules.departure_date).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Time</span>
                    </div>
                    <p className="font-semibold">{booking.schedules.departure_time}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">Seat {booking.seat_number}</p>
                    <p className="text-2xl font-bold">P{booking.total_amount}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Booked on {new Date(booking.created_at).toLocaleDateString()}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/booking-confirmation/${booking.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}