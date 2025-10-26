import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Clock, DollarSign, Calendar, Bus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Schedule {
  id: string;
  departure_date: string;
  departure_time: string;
  available_seats: number;
  routes: {
    origin: string;
    destination: string;
    price: number;
    duration_hours: number;
    route_type: 'local' | 'cross_border';
  };
  buses: {
    name: string;
    number_plate: string;
  };
}

export default function Routes() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [activeTab, setActiveTab] = useState("local");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchSchedules();
  }, [selectedDate]);

  const fetchSchedules = async () => {
    try {
      let query = supabase
        .from("schedules")
        .select(`
          *,
          routes (origin, destination, price, duration_hours, route_type),
          buses (name, number_plate)
        `)
        .gte('available_seats', 1)
        .order('departure_date', { ascending: true })
        .order('departure_time', { ascending: true });

      if (selectedDate) {
        query = query.eq('departure_date', selectedDate);
      } else {
        const today = new Date().toISOString().split('T')[0];
        query = query.gte('departure_date', today);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSchedules(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading routes",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSchedules = schedules.filter(
    (schedule) => schedule.routes.route_type === activeTab
  );

  const handleBookNow = (scheduleId: string) => {
    navigate(`/seat-selection/${scheduleId}`);
  };

  const renderSchedulesList = (schedulesList: Schedule[]) => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading available routes...</p>
        </div>
      );
    }

    if (schedulesList.length === 0) {
      return (
        <Card className="p-12 text-center">
          <Bus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No routes available</h3>
          <p className="text-muted-foreground">
            {selectedDate
              ? "No trips available for the selected date. Try another date."
              : `No ${activeTab === 'local' ? 'local' : 'cross-border'} trips available at the moment.`}
          </p>
        </Card>
      );
    }

    return (
      <div className="grid gap-4">
        {schedulesList.map((schedule) => (
          <Card key={schedule.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="grid md:grid-cols-5 gap-4 items-center">
              {/* Route Info */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{schedule.routes.origin}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-semibold">{schedule.routes.destination}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bus className="h-4 w-4" />
                  <span>{schedule.buses.name}</span>
                </div>
              </div>

              {/* Schedule Info */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>{new Date(schedule.departure_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{schedule.departure_time}</span>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{schedule.routes.duration_hours}h duration</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {schedule.available_seats} seats available
                </div>
              </div>

              {/* Price & Action */}
              <div className="text-right space-y-2">
                <div className="flex items-center justify-end gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-2xl font-bold">P{schedule.routes.price}</span>
                </div>
                <Button onClick={() => handleBookNow(schedule.id)} className="w-full">
                  Book Now
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Available Routes</h1>
          <p className="text-muted-foreground">Select your journey and book your seat</p>
        </div>

        {/* Date Filter */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-4">
            <Calendar className="h-5 w-5 text-primary" />
            <Label className="text-sm font-medium">Filter by date:</Label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="px-4 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring"
            />
            {selectedDate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate("")}
              >
                Clear
              </Button>
            )}
          </div>
        </Card>

        {/* Route Type Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="local">Local Routes</TabsTrigger>
            <TabsTrigger value="cross_border">Cross-Border Routes</TabsTrigger>
          </TabsList>

          <TabsContent value="local" className="mt-6">
            {renderSchedulesList(filteredSchedules)}
          </TabsContent>

          <TabsContent value="cross_border" className="mt-6">
            {renderSchedulesList(filteredSchedules)}
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}