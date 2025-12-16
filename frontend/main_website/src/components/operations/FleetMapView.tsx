import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Maximize2, RefreshCw } from 'lucide-react';

interface FleetMapViewProps {
  buses: any[];
  gpsData: any[];
}

export default function FleetMapView({ buses, gpsData }: FleetMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Load Google Maps script
  useEffect(() => {
    if (!apiKey || !mapRef.current) return;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
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

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [apiKey]);

  // Update markers when data changes
  useEffect(() => {
    if (!map || !buses.length) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));

    // Get buses with GPS data
    const busesWithLocation = buses
      .map(bus => {
        const gps = gpsData.find(g => g.bus_id === bus.id);
        return gps ? { ...bus, gps } : null;
      })
      .filter(Boolean);

    // Create new markers
    const newMarkers = busesWithLocation.map((busData: any) => {
      const { bus, gps } = busData;
      
      const marker = new google.maps.Marker({
        position: { lat: gps.latitude, lng: gps.longitude },
        map: map,
        title: bus.bus_number,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: getStatusColor(bus.status),
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
      });

      // Add info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; min-width: 200px;">
            <h3 style="font-weight: bold; margin-bottom: 8px; font-size: 16px;">${bus.bus_number}</h3>
            <div style="font-size: 14px; color: #666;">
              <p style="margin: 4px 0;"><strong>Model:</strong> ${bus.model || 'N/A'}</p>
              <p style="margin: 4px 0;"><strong>Status:</strong> ${bus.status}</p>
              <p style="margin: 4px 0;"><strong>Speed:</strong> ${gps.speed || 0} km/h</p>
              <p style="margin: 4px 0;"><strong>Last Update:</strong> ${new Date(gps.timestamp).toLocaleTimeString()}</p>
            </div>
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
      busesWithLocation.forEach((busData: any) => {
        bounds.extend({ lat: busData.gps.latitude, lng: busData.gps.longitude });
      });
      map.fitBounds(bounds);
    }
  }, [map, buses, gpsData]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#22c55e'; // green
      case 'maintenance':
        return '#f97316'; // orange
      case 'inactive':
      case 'parked':
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

  const busesWithGPS = buses.filter(bus => 
    gpsData.some(gps => gps.bus_id === bus.id)
  );

  if (!apiKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Live Fleet Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 rounded-lg p-12 text-center">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Google Maps API Key Required</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
              Configure your Google Maps API key in the .env file to enable real-time fleet tracking.
            </p>
            <div className="bg-white border rounded-lg p-4 max-w-md mx-auto text-left">
              <p className="text-sm font-medium mb-2">Current Fleet Status:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• {buses.length} total buses</li>
                <li>• {busesWithGPS.length} buses with GPS data</li>
                <li>• Updates every 30 seconds</li>
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
            Live Fleet Map
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              {busesWithGPS.length} Buses Tracked
            </Badge>
            <Button variant="outline" size="sm" onClick={handleFullscreen}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status Legend */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span>Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-orange-500" />
              <span>Maintenance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gray-500" />
              <span>Parked</span>
            </div>
          </div>

          {/* Map Container */}
          <div
            ref={mapRef}
            className="w-full h-[600px] rounded-lg border bg-gray-100"
          />

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Showing {busesWithGPS.length} of {buses.length} buses with GPS data</span>
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
