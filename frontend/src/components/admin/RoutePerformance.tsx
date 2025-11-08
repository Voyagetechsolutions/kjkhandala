import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, TrendingUp } from 'lucide-react';

interface RouteStats {
  id: string;
  origin: string;
  destination: string;
  totalBookings: number;
  totalRevenue: number;
  averageOccupancy: number;
}

interface RoutePerformanceProps {
  routes: RouteStats[];
  currency?: string;
}

export default function RoutePerformance({ routes, currency = 'P' }: RoutePerformanceProps) {
  const sortedRoutes = [...routes].sort((a, b) => b.totalRevenue - a.totalRevenue);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        Route Performance
      </h3>
      
      <div className="space-y-4">
        {sortedRoutes.map((route, index) => (
          <div 
            key={route.id} 
            className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                {index + 1}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">
                    {route.origin} → {route.destination}
                  </span>
                </div>
                
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{route.totalBookings} bookings</span>
                  <span>•</span>
                  <span>{route.averageOccupancy.toFixed(0)}% occupancy</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-lg font-bold text-primary">
                {currency}{route.totalRevenue.toLocaleString()}
              </div>
              <Badge variant={route.averageOccupancy >= 80 ? "default" : "secondary"}>
                {route.averageOccupancy >= 80 ? 'High Demand' : 'Moderate'}
              </Badge>
            </div>
          </div>
        ))}
        
        {sortedRoutes.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No route data available
          </div>
        )}
      </div>
    </Card>
  );
}
