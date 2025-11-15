import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import OperationsLayout from '@/components/operations/OperationsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Bus, MapPin, Activity, AlertTriangle, RefreshCw, Route, Play, Pause, SkipBack } from 'lucide-react';
import { toast } from 'sonner';
import { GoogleMap, Marker, InfoWindow, Polyline, Circle, TrafficLayer } from '@react-google-maps/api';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { useGoogleMaps } from '@/lib/googleMapsLoader';

interface BusLocation {
  id: string;
  bus_id: string;
  latitude: number;
  longitude: number;
  speed: number;
  status: 'idle' | 'moving';
  updated_at: string;
  buses?: {
    id: string;
    registration_number: string;
    make: string;
    model: string;
    status: string;
  };
}

interface ActiveTrip {
  id: string;
  bus_id: string;
  trip_number: string;
  status: string;
  departure_time: string;
  routes?: {
    origin: string;
    destination: string;
  };
  buses?: {
    registration_number: string;
    make: string;
    model: string;
  };
}

const mapContainerStyle = {
  width: '100%',
  height: '500px',
};

const center = {
  lat: -24.6282, // Gaborone, Botswana
  lng: 25.9231,
};

export default function LiveTracking() {
  const [buses, setBuses] = useState<any[]>([]);
  const [locations, setLocations] = useState<BusLocation[]>([]);
  const [trips, setTrips] = useState<ActiveTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedBus, setSelectedBus] = useState<BusLocation | null>(null);
  
  // Advanced features state
  const [showTraffic, setShowTraffic] = useState(false);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showGeofences, setShowGeofences] = useState(false);
  const [useClustering, setUseClustering] = useState(false);
  const [isPlayingHistory, setIsPlayingHistory] = useState(false);
  const [historyProgress, setHistoryProgress] = useState(0);
  const [historicalData, setHistoricalData] = useState<BusLocation[]>([]);
  const [geofences, setGeofences] = useState<any[]>([]);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [clusterer, setClusterer] = useState<MarkerClusterer | null>(null);

  // Load Google Maps
  const { isLoaded, loadError } = useGoogleMaps();

  // Fetch all buses
  const fetchBuses = async () => {
    const { data, error } = await supabase
      .from('buses')
      .select('*')
      .order('registration_number');
    
    if (error) {
      console.error('Error fetching buses:', error);
      return;
    }
    
    setBuses(data || []);
  };

  // Fetch live locations
  const fetchLocations = async () => {
    const { data, error } = await supabase
      .from('bus_locations')
      .select(`
        *,
        buses (
          id,
          registration_number,
          make,
          model,
          status
        )
      `)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching locations:', error);
      return;
    }
    
    setLocations(data || []);
    setLastUpdate(new Date());
  };

  // Fetch active trips
  const fetchTrips = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        routes (
          origin,
          destination
        ),
        buses (
          registration_number,
          make,
          model
        )
      `)
      .in('status', ['SCHEDULED', 'BOARDING', 'DEPARTED', 'IN_PROGRESS'])
      .gte('departure_time', today)
      .order('departure_time', { ascending: true });
    
    if (error) {
      console.error('Error fetching trips:', error);
      return;
    }
    
    setTrips(data || []);
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchBuses(),
        fetchLocations(),
        fetchTrips()
      ]);
      setLoading(false);
    };
    
    loadData();

    // Poll every 10 seconds for live updates
    const interval = setInterval(() => {
      fetchLocations();
      fetchTrips();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Manual refresh
  const handleRefresh = async () => {
    toast.info('Refreshing data...');
    await Promise.all([
      fetchBuses(),
      fetchLocations(),
      fetchTrips()
    ]);
    toast.success('Data refreshed!');
  };

  // Calculate stats
  const totalBuses = buses.length;
  const movingBuses = locations.filter(l => l.status === 'moving').length;
  const idleBuses = locations.filter(l => l.status === 'idle').length;
  const speedingAlerts = locations.filter(l => l.speed > 120).length;
  const activeTrips = trips.length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'moving':
        return 'bg-green-500';
      case 'idle':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTripStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-500';
      case 'BOARDING':
        return 'bg-orange-500';
      case 'DEPARTED':
      case 'IN_PROGRESS':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <OperationsLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p>Loading live tracking data...</p>
          </div>
        </div>
      </OperationsLayout>
    );
  }

  return (
    <OperationsLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Live Bus Tracking</h1>
            <p className="text-muted-foreground">
              Real-time monitoring of fleet location and status
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
          <Button onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Bus className="h-4 w-4" />
                Total Buses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalBuses}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                Moving
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{movingBuses}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-yellow-500" />
                Idle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">{idleBuses}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{speedingAlerts}</p>
              <p className="text-xs text-muted-foreground">Speeding</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Bus className="h-4 w-4 text-blue-500" />
                Active Trips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{activeTrips}</p>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Bus List */}
          <Card>
            <CardHeader>
              <CardTitle>Bus List & Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bus</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Speed</TableHead>
                    <TableHead>Last Update</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No buses found
                      </TableCell>
                    </TableRow>
                  ) : (
                    buses.map(bus => {
                      const location = locations.find(l => l.bus_id === bus.id);
                      return (
                        <TableRow key={bus.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{bus.registration_number}</p>
                              <p className="text-xs text-muted-foreground">
                                {bus.make} {bus.model}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {location ? (
                              <Badge className={getStatusColor(location.status)}>
                                {location.status}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">No GPS</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {location ? (
                              <span className={location.speed > 120 ? 'text-red-600 font-bold' : ''}>
                                {location.speed} km/h
                              </span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {location ? (
                              <span className="text-xs">
                                {new Date(location.updated_at).toLocaleTimeString()}
                              </span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Active Trips */}
          <Card>
            <CardHeader>
              <CardTitle>Active Trips Today</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trip</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Departure</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trips.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No active trips today
                      </TableCell>
                    </TableRow>
                  ) : (
                    trips.map(trip => (
                      <TableRow key={trip.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{trip.trip_number}</p>
                            <p className="text-xs text-muted-foreground">
                              {trip.buses?.registration_number}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{trip.routes?.origin}</p>
                            <p className="text-muted-foreground">→ {trip.routes?.destination}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTripStatusColor(trip.status)}>
                            {trip.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs">
                            {new Date(trip.departure_time).toLocaleTimeString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Live GPS Map */}
        <Card>
          <CardHeader>
            <CardTitle>Live GPS Map</CardTitle>
          </CardHeader>
          <CardContent>
            {loadError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-8 min-h-[400px] flex flex-col items-center justify-center">
                <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-red-700 mb-2">Map Loading Error</h3>
                <p className="text-sm text-red-600 text-center max-w-md">
                  Failed to load Google Maps. Please check your API key.
                </p>
              </div>
            ) : !isLoaded ? (
              <div className="bg-gray-100 rounded-lg p-8 min-h-[400px] flex flex-col items-center justify-center">
                <RefreshCw className="h-16 w-16 text-gray-400 mb-4 animate-spin" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading Map...</h3>
              </div>
            ) : !import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 min-h-[400px] flex flex-col items-center justify-center">
                <MapPin className="h-16 w-16 text-yellow-500 mb-4" />
                <h3 className="text-lg font-semibold text-yellow-700 mb-2">Google Maps API Key Required</h3>
                <p className="text-sm text-yellow-600 text-center max-w-md mb-4">
                  Add your Google Maps API key to .env file:
                </p>
                <code className="bg-yellow-100 px-4 py-2 rounded text-sm">
                  VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
                </code>
                <p className="text-xs text-yellow-500 mt-4">
                  {locations.length} GPS coordinates available
                </p>
              </div>
            ) : locations.length === 0 ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 min-h-[400px] flex flex-col items-center justify-center">
                <MapPin className="h-16 w-16 text-blue-500 mb-4" />
                <h3 className="text-lg font-semibold text-blue-700 mb-2">No GPS Data Available</h3>
                <p className="text-sm text-blue-600 text-center max-w-md">
                  Waiting for bus location data. GPS coordinates will appear here once available.
                </p>
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={12}
                options={{
                  zoomControl: true,
                  streetViewControl: false,
                  mapTypeControl: true,
                  fullscreenControl: true,
                }}
              >
                {locations.map((location) => (
                  <Marker
                    key={location.id}
                    position={{
                      lat: Number(location.latitude),
                      lng: Number(location.longitude),
                    }}
                    icon={{
                      path: window.google.maps.SymbolPath.CIRCLE,
                      scale: 10,
                      fillColor: location.status === 'moving' ? '#22c55e' : location.status === 'idle' ? '#eab308' : '#6b7280',
                      fillOpacity: 1,
                      strokeColor: '#ffffff',
                      strokeWeight: 2,
                    }}
                    onClick={() => setSelectedBus(location)}
                  />
                ))}

                {selectedBus && (
                  <InfoWindow
                    position={{
                      lat: Number(selectedBus.latitude),
                      lng: Number(selectedBus.longitude),
                    }}
                    onCloseClick={() => setSelectedBus(null)}
                  >
                    <div className="p-2">
                      <h3 className="font-bold text-lg mb-2">
                        {selectedBus.buses?.registration_number}
                      </h3>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-semibold">Make:</span> {selectedBus.buses?.make} {selectedBus.buses?.model}
                        </p>
                        <p>
                          <span className="font-semibold">Status:</span>{' '}
                          <Badge className={getStatusColor(selectedBus.status)}>
                            {selectedBus.status}
                          </Badge>
                        </p>
                        <p>
                          <span className="font-semibold">Speed:</span>{' '}
                          <span className={selectedBus.speed > 120 ? 'text-red-600 font-bold' : ''}>
                            {selectedBus.speed} km/h
                          </span>
                        </p>
                        <p className="text-xs text-gray-500">
                          Last update: {new Date(selectedBus.updated_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            )}
          </CardContent>
        </Card>
      </div>
    </OperationsLayout>
  );
}
