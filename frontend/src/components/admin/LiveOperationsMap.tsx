import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Maximize2, RefreshCw } from 'lucide-react';

interface BusLocation {
  id: string;
  bus_number: string;
  latitude: number;
  longitude: number;
  status: 'active' | 'delayed' | 'breakdown' | 'idle';
  speed: number;
  route?: string;
}

export default function LiveOperationsMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'route'>('all');
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Fetch active trips with GPS data
  const { data: busLocations, refetch } = useQuery({
    queryKey: ['bus-locations'],
    queryFn: async () => {
      const { data: trips, error } = await supabase
        .from('trips')
        .select(`
          id,
          status,
          latitude,
          longitude,
          speed,
          bus:buses(bus_number, gps_device_id),
          route:routes(origin, destination)
        `)
        .in('status', ['DEPARTED', 'IN_PROGRESS', 'DELAYED'])
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) throw error;

      return trips?.map(trip => {
        const bus = Array.isArray(trip.bus) ? trip.bus[0] : trip.bus;
        const route = Array.isArray(trip.route) ? trip.route[0] : trip.route;
        
        return {
          id: trip.id,
          bus_number: bus?.bus_number || 'Unknown',
          latitude: trip.latitude,
          longitude: trip.longitude,
          status: trip.status === 'DELAYED' ? 'delayed' : 'active',
          speed: trip.speed || 0,
          route: route ? `${route.origin} → ${route.destination}` : undefined,
        };
      }) as BusLocation[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Load Google Maps script
  useEffect(() => {
    if (!apiKey) return;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      initializeMap();
    };

    return () => {
      document.head.removeChild(script);
    };
  }, [apiKey]);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: { lat: -24.6282, lng: 25.9231 }, // Gaborone, Botswana
      zoom: 12,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    setMap(mapInstance);
  };

  // Update markers when data changes
  useEffect(() => {
    if (!map || !busLocations) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));

    // Filter locations based on selected filter
    const filteredLocations = busLocations.filter(location => {
      if (filter === 'active') return location.status === 'active';
      if (filter === 'route' && selectedRoute) return location.route === selectedRoute;
      return true;
    });

    // Create new markers
    const newMarkers = filteredLocations.map(location => {
      const marker = new google.maps.Marker({
        position: { lat: location.latitude, lng: location.longitude },
        map: map,
        title: location.bus_number,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: getStatusColor(location.status),
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      // Add info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="font-weight: bold; margin-bottom: 4px;">${location.bus_number}</h3>
            <p style="margin: 2px 0;">Status: ${location.status}</p>
            <p style="margin: 2px 0;">Speed: ${location.speed} km/h</p>
            ${location.route ? `<p style="margin: 2px 0;">Route: ${location.route}</p>` : ''}
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      return marker;
    });

    setMarkers(newMarkers);

    // Fit bounds to show all markers
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      filteredLocations.forEach(location => {
        bounds.extend({ lat: location.latitude, lng: location.longitude });
      });
      map.fitBounds(bounds);
    }
  }, [map, busLocations, filter, selectedRoute]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#22c55e'; // green
      case 'delayed':
        return '#eab308'; // yellow
      case 'breakdown':
        return '#ef4444'; // red
      case 'idle':
        return '#6b7280'; // gray
      default:
        return '#3b82f6'; // blue
    }
  };

  const handleFullscreen = () => {
    if (mapRef.current) {
      mapRef.current.requestFullscreen();
    }
  };

  if (!apiKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Live Operations Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 rounded-lg p-12 text-center">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Google Maps Integration</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
              This component will display a live map with real-time bus locations. 
              Requires Google Maps API key configuration.
            </p>
            <div className="bg-white border rounded-lg p-4 max-w-md mx-auto text-left">
              <p className="text-sm font-medium mb-2">Current Data:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• {busLocations?.length || 0} buses tracked</li>
                <li>• Updates every 30 seconds</li>
                <li>• Color-coded by status</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Live Operations Map
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Live
            </Badge>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleFullscreen}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
              <TabsList>
                <TabsTrigger value="all">All Buses</TabsTrigger>
                <TabsTrigger value="active">Active Only</TabsTrigger>
                <TabsTrigger value="route">By Route</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Status Legend */}
            <div className="flex items-center gap-4 ml-auto">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <span className="text-sm">Delayed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm">Breakdown</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gray-500" />
                <span className="text-sm">Idle</span>
              </div>
            </div>
          </div>

          {/* Map Container */}
          <div
            ref={mapRef}
            className="w-full h-[600px] rounded-lg border bg-gray-100"
          />

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{busLocations?.length || 0} buses being tracked</span>
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
