import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/admin/AdminLayout";
import LiveOperationsMap from "@/components/admin/LiveOperationsMap";
import { Card } from "@/components/ui/card";
import { DollarSign, Users, Bus, Ticket } from "lucide-react";

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  
  // All hooks before conditional returns
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    totalBuses: 0,
    totalRoutes: 0,
  });

  const fetchStats = async () => {
    try {
      const [bookings, buses, routes] = await Promise.all([
        supabase.from("bookings").select("total_amount", { count: "exact" }),
        supabase.from("buses").select("*", { count: "exact" }),
        supabase.from("routes").select("*", { count: "exact" }),
      ]);

      const revenue = bookings.data?.reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;

      setStats({
        totalBookings: bookings.count || 0,
        totalRevenue: revenue,
        totalBuses: buses.count || 0,
        totalRoutes: routes.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/");
      return;
    }
    
    if (isAdmin) {
      fetchStats();
    }
  }, [user, isAdmin, loading]);

  // Conditional returns after all hooks
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAdmin) return null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your bus booking system</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
                <p className="text-3xl font-bold mt-2">{stats.totalBookings}</p>
              </div>
              <Ticket className="h-12 w-12 text-primary opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-bold mt-2">P{stats.totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-12 w-12 text-green-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Buses</p>
                <p className="text-3xl font-bold mt-2">{stats.totalBuses}</p>
              </div>
              <Bus className="h-12 w-12 text-secondary opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Routes</p>
                <p className="text-3xl font-bold mt-2">{stats.totalRoutes}</p>
              </div>
              <Users className="h-12 w-12 text-purple-500 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Live Operations Map */}
        <LiveOperationsMap />
      </div>
    </AdminLayout>
  );
}