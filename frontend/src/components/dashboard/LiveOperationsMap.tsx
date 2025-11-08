import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Maximize2 } from 'lucide-react';

/**
 * Live Operations Map Component
 * Displays real-time GPS locations of all buses
 * Color-coded by status: Active, Delayed, Breakdown, Idle
 * 
 * Integration: Google Maps API or Leaflet.js
 * Data Source: gps_tracking table + trip_tracking table
 */
export default function LiveOperationsMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedBus, setSelectedBus] = useState<any>(null);
  const [mapView, setMapView] = useState<'all' | 'active' | 'route'>('all');

  // Fetch live bus locations
  const { data: busLocations, isLoading } = useQuery({
    queryKey: ['bus-locations', mapView],
    queryFn: async () => {
      // Get latest GPS position for each bus (last 10 minutes)
      const { data: gpsData, error: gpsError } = await supabase
        .from('gps_tracking')
        .select(`
          *,
          buses (
            id,
            name,
            number_plate,
            status
          )
        `)
        .gte('timestamp', new Date(Date.now() - 10 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false });

      if (gpsError) throw gpsError;

      // Get trip status for each bus
      const { data: tripData, error: tripError } = await supabase
        .from('trip_tracking')
        .select(`
          *,
          schedules (
            id,
            departure_time,
            routes (
              origin,
              destination
            )
          ),
          drivers (
            full_name
          )
        `)
        .in('status', ['scheduled', 'in_transit']);

      if (tripError) throw tripError;

      // Merge GPS data with trip data
      const busMap = new Map();
      gpsData?.forEach(gps => {
        if (!busMap.has(gps.bus_id)) {
          const trip = tripData?.find(t => t.bus_id === gps.bus_id);
          busMap.set(gps.bus_id, {
            ...gps,
            trip: trip || null
          });
        }
      });

      return Array.from(busMap.values());
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Initialize map (placeholder for Google Maps/Leaflet integration)
  useEffect(() => {
    if (mapRef.current && busLocations) {
      // TODO: Initialize Google Maps or Leaflet.js here
      // For now, we'll show a placeholder
      console.log('Map would be initialized here with', busLocations.length, 'buses');
    }
  }, [busLocations]);

  const getBusStatusColor = (bus: any) => {
    if (!bus.trip) return 'bg-gray-400'; // Idle
    if (bus.trip.status === 'in_transit') {
      // Check if delayed (compare actual vs scheduled time)
      return 'bg-green-500'; // Active
    }
    return 'bg-orange-500'; // Delayed
  };

  const getBusStatusLabel = (bus: any) => {
    if (!bus.trip) return 'Idle';
    if (bus.trip.status === 'in_transit') return 'Active';
    return 'Delayed';
  };

  return (
    <div className="space-y-4">
      {/* Map Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={mapView === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMapView('all')}
          >
            All Buses
          </Button>
          <Button
            variant={mapView === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMapView('active')}
          >
            Active Only
          </Button>
          <Button
            variant={mapView === 'route' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMapView('route')}
          >
            By Route
          </Button>
        </div>
        <Button variant="outline" size="sm">
          <Maximize2 className="h-4 w-4 mr-2" />
          Fullscreen
        </Button>
      </div>

      {/* Map Container */}
      <div 
        ref={mapRef}
        className="relative w-full h-[500px] bg-gray-100 rounded-lg border overflow-hidden"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2 animate-pulse" />
              <p className="text-muted-foreground">Loading map...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Placeholder for actual map */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
              <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
                <MapPin className="h-16 w-16 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Google Maps Integration</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This component will display a live map with real-time bus locations.
                  Requires Google Maps API key configuration.
                </p>
                <div className="space-y-2 text-left">
                  <p className="text-xs font-medium">Current Data:</p>
                  <p className="text-xs text-muted-foreground">
                    • {busLocations?.length || 0} buses tracked
                  </p>
                  <p className="text-xs text-muted-foreground">
                    • Updates every 30 seconds
                  </p>
                  <p className="text-xs text-muted-foreground">
                    • Color-coded by status
                  </p>
                </div>
              </div>
            </div>

            {/* Bus markers would be rendered here */}
            {busLocations?.map((bus, index) => (
              <div
                key={bus.id}
                className="absolute"
                style={{
                  // Position would be calculated from lat/lng
                  left: `${20 + index * 10}%`,
                  top: `${30 + (index % 3) * 20}%`,
                }}
              >
                <div
                  className="relative cursor-pointer"
                  onClick={() => setSelectedBus(bus)}
                >
                  <div className={`w-4 h-4 rounded-full ${getBusStatusColor(bus)} border-2 border-white shadow-lg`} />
                  {selectedBus?.id === bus.id && (
                    <div className="absolute left-6 top-0 bg-white p-3 rounded-lg shadow-xl border min-w-[200px] z-10">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">{bus.buses?.name}</p>
                          <Badge className={getBusStatusColor(bus)}>
                            {getBusStatusLabel(bus)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                          {bus.buses?.number_plate}
                        </p>
                        {bus.trip && (
                          <>
                            <div className="text-xs">
                              <p className="font-medium">Route:</p>
                              <p className="text-muted-foreground">
                                {bus.trip.schedules?.routes?.origin} → {bus.trip.schedules?.routes?.destination}
                              </p>
                            </div>
                            <div className="text-xs">
                              <p className="font-medium">Driver:</p>
                              <p className="text-muted-foreground">
                                {bus.trip.drivers?.full_name || 'Not assigned'}
                              </p>
                            </div>
                          </>
                        )}
                        <div className="text-xs">
                          <p className="font-medium">Speed:</p>
                          <p className="text-muted-foreground">
                            {bus.speed ? `${bus.speed} km/h` : 'N/A'}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Last update: {new Date(bus.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Bus List */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {busLocations?.slice(0, 8).map((bus) => (
          <div
            key={bus.id}
            className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
            onClick={() => setSelectedBus(bus)}
          >
            <div className={`w-3 h-3 rounded-full ${getBusStatusColor(bus)}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{bus.buses?.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{bus.buses?.number_plate}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
