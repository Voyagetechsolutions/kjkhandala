import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Map, MapPin } from 'lucide-react';

interface RouteMapViewProps {
  routes: any[];
}

export default function RouteMapView({ routes }: RouteMapViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="h-5 w-5" />
          Route Map View
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-100 rounded-lg p-8 min-h-[500px] flex flex-col items-center justify-center">
          <Map className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Interactive Map Coming Soon</h3>
          <p className="text-sm text-gray-500 text-center max-w-md mb-6">
            This section will display an interactive map showing all routes with waypoints.
            You'll be able to draw new routes directly on the map.
          </p>
          
          {/* Route List Preview */}
          <div className="w-full max-w-2xl space-y-2">
            <p className="text-sm font-medium text-gray-600 mb-3">Available Routes:</p>
            {routes.slice(0, 5).map((route: any) => (
              <div key={route.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <MapPin className="h-4 w-4 text-primary" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{route.origin} → {route.destination}</p>
                  <p className="text-xs text-muted-foreground">
                    {route.distance_km ? `${route.distance_km} km` : 'Distance N/A'} • {route.duration_hours}h
                  </p>
                </div>
                <span className="text-sm font-bold text-primary">P{parseFloat(route.price).toFixed(2)}</span>
              </div>
            ))}
            {routes.length > 5 && (
              <p className="text-xs text-center text-muted-foreground pt-2">
                + {routes.length - 5} more routes
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
