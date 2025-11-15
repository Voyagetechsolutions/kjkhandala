import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

interface Route {
  id: string;
  origin: string;
  destination: string;
  route_type: string;
  route_code?: string;
}

export default function PopularRoutesSection() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const { data, error } = await supabase
          .from('routes')
          .select('*')
          .eq('is_active', true)
          .order('origin')
          .limit(6);
        
        if (error) throw error;
        setRoutes(data || []);
      } catch (error) {
        console.error('Failed to fetch routes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  return (
    <div className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Popular Routes</h2>
          <p className="text-lg text-muted-foreground">
            Your favourite destinations at the best comfort.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading routes...</p>
          </div>
        ) : routes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No routes available at the moment.</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {routes.map((route) => (
                <Card key={route.id} className="p-6 hover:shadow-lg transition-shadow group cursor-pointer" onClick={() => navigate("/routes")}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <MapPin className="h-5 w-5 text-primary" />
                      <span>{route.origin}</span>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <span>{route.destination}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant={route.route_type === 'local' ? 'secondary' : 'default'}>
                      {route.route_type === 'local' ? 'STANDARD' : 'PREMIUM'}
                    </Badge>
                    {route.route_code && (
                      <span className="text-sm text-muted-foreground">
                        Route Code: {route.route_code}
                      </span>
                    )}
                  </div>
                  
                  <Button className="w-full mt-4" onClick={() => navigate("/routes")}>
                    Book Tickets
                  </Button>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button size="lg" variant="outline" onClick={() => navigate("/routes")}>
                See All Routes
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
