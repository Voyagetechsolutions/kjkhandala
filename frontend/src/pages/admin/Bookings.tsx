import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Clock, User } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Booking {
  id: string;
  booking_reference: string;
  passenger_name: string;
  passenger_phone: string;
  seat_number: string;
  total_amount: number;
  status: string;
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

export default function AdminBookings() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const response = await api.get('/bookings');
      return response.data.data || [];
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      await api.post(`/bookings/${bookingId}/checkin`);
    },
    onSuccess: () => {
      toast.success('Passenger checked in successfully');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to check in');
    },
  });

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

  if (loading) return <div>Loading...</div>;
  if (!isAdmin) return null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Bookings Management</h1>
          <p className="text-muted-foreground">View and manage all bookings</p>
        </div>

        <div className="grid gap-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="p-6">
              <div className="grid md:grid-cols-6 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Reference</p>
                  <p className="font-bold text-primary">{booking.booking_reference}</p>
                  <Badge className={`${getStatusColor(booking.status)} text-white mt-2`}>
                    {booking.status}
                  </Badge>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <User className="h-3 w-3" />
                    <span className="text-sm">Passenger</span>
                  </div>
                  <p className="font-semibold text-sm">{booking.passenger_name}</p>
                  <p className="text-xs text-muted-foreground">{booking.passenger_phone}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <MapPin className="h-3 w-3" />
                    <span className="text-sm">Route</span>
                  </div>
                  <p className="font-semibold text-sm">{booking.schedules.routes.origin}</p>
                  <p className="text-xs text-muted-foreground">to {booking.schedules.routes.destination}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="h-3 w-3" />
                    <span className="text-sm">Date</span>
                  </div>
                  <p className="font-semibold text-sm">
                    {new Date(booking.schedules.departure_date).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">{booking.schedules.departure_time}</p>
                </div>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Seat</p>
                  <p className="text-2xl font-bold text-primary">{booking.seat_number}</p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">Amount</p>
                  <p className="text-xl font-bold">P{booking.total_amount}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(booking.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}