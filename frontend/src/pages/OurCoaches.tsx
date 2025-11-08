import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bus, Users, Wifi, Wind, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BusType {
  id: string;
  name: string;
  number_plate: string;
  seating_capacity: number;
  layout_rows: number;
  layout_columns: number;
}

export default function OurCoaches() {
  const [buses, setBuses] = useState<BusType[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    try {
      const { data, error } = await supabase
        .from("buses")
        .select("*")
        .order("name");

      if (error) throw error;
      setBuses(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading coaches",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeatingType = (columns: number) => {
    return columns === 4 ? "2x2" : "2x3";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Our Premium Coaches</h1>
          <p className="text-muted-foreground">
            Experience luxury and comfort with our 5-star specification coaches
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading our fleet...</p>
          </div>
        ) : buses.length === 0 ? (
          <Card className="p-12 text-center">
            <Bus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No coaches available</h3>
            <p className="text-muted-foreground">Check back soon for our fleet information.</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buses.map((bus) => (
              <Card key={bus.id} className="p-6 hover:shadow-lg transition-shadow">
                {/* Bus Icon */}
                <div className="h-40 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <Bus className="h-20 w-20 text-primary" />
                </div>

                {/* Bus Details */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xl font-bold">{bus.name}</h3>
                    <p className="text-sm text-muted-foreground">{bus.number_plate}</p>
                  </div>

                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      {getSeatingType(bus.layout_columns)} Seating
                    </Badge>
                    <Badge variant="outline">
                      <Users className="h-3 w-3 mr-1" />
                      {bus.seating_capacity} Seats
                    </Badge>
                  </div>

                  {/* Features */}
                  <div className="pt-3 border-t space-y-2">
                    <p className="text-sm font-medium">Features:</p>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Wifi className="h-4 w-4" />
                        <span>WiFi</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Wind className="h-4 w-4" />
                        <span>Air Con</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Zap className="h-4 w-4" />
                        <span>USB Ports</span>
                      </div>
                    </div>
                  </div>
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
