import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useWebSocket } from '@/hooks/useWebSocket';
import AdminLayout from '@/components/admin/AdminLayout';
import OperationsLayout from '@/components/operations/OperationsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Map, Navigation, AlertCircle, Clock, MapPin, Activity, Zap, Bus, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function LiveTracking({ Layout = AdminLayout }) {
  const location = useLocation();
  const isOperationsRoute = location.pathname.startsWith('/operations');
  const [selectedBus, setSelectedBus] = useState<string | null>(null);
  const [mapView, setMapView] = useState<'all' | 'active' | 'alerts'>('all');

  // Fetch all buses with their tracking data
  const { data: trackingData, isLoading } = useQuery({
    queryKey: ['live-tracking'],
    queryFn: async () => {
      // Fetch all buses in the system
      const { data: busesData, error: busesError } = await supabase
        .from('buses')
        .select(`
          *,
          gps_tracking:gps_tracking(latitude, longitude, speed, timestamp, fuel_level)
        `)
        .order('registration_number');
      
      if (busesError) throw busesError;
      
      // Fetch active trips for additional context
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select(`
          *,
          route:routes(*),
          bus:buses(*),
          driver:drivers(*)
        `)
        .in('status', ['SCHEDULED', 'BOARDING', 'DEPARTED', 'IN_PROGRESS'])
        .order('departure_date');
      
      if (tripsError) throw tripsError;
      
      // Merge bus data with trip data
      const buses = (busesData || []).map(bus => {
        const activeTrip = (tripsData || []).find(trip => trip.bus_id === bus.id);
        const latestTracking = bus.gps_tracking?.[0] || {};
        return {
          ...bus,
          latitude: latestTracking.latitude,
          longitude: latestTracking.longitude,
          speed: latestTracking.speed || 0,
          timestamp: latestTracking.timestamp,
          fuel_level: latestTracking.fuel_level,
          activeTrip
        };
      });
      
      return { trips: buses, activeTrips: tripsData || [] };
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // WebSocket for real-time updates
  const socketData = useWebSocket();
  const socket = socketData?.socket;
  
  useEffect(() => {
    if (!socket) return;
    
    socket.on('location:update', (data: any) => {
      // Real-time location updates
      console.log('Location update:', data);
    });

    return () => {
      socket.off('location:update');
    };
  }, [socket]);

  // Fetch active trips
  const { data: activeTrips } = useQuery({
    queryKey: ['active-trips-tracking'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .gte('departure_time', `${today}T00:00:00`)
        .lte('departure_time', `${today}T23:59:59`)
        .eq('status', 'DEPARTED');
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  // Calculate stats
  const trips = trackingData?.trips || [];
  const totalBuses = trips.length || 0;
  const activeBuses = trips.filter((t: any) => t.speed > 0).length || 0;
  const idleBuses = trips.filter((t: any) => t.speed === 0 || !t.speed).length || 0;
  const alertBuses = trips.filter((t: any) => 
    (t.speed && t.speed > 120) || (t.fuel_level && t.fuel_level < 20) // Speeding or low fuel
  ).length || 0;

  const getSpeedColor = (speed: number) => {
    if (speed === 0) return 'text-gray-500';
    if (speed > 100) return 'text-red-600';
    if (speed > 80) return 'text-orange-600';
    return 'text-green-600';
  };

  const getBusStatusIcon = (tracking: any) => {
    const speed = tracking.location?.speed || 0;
    if (speed === 0) return '⚪'; // Idle
    if (speed > 120) return '🔴'; // Speeding
    return '🟢'; // Normal
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Live Tracking</h1>
            <p className="text-muted-foreground">Real-time GPS monitoring and fleet tracking</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="gap-1">
              <Activity className="h-3 w-3" />
              Live
            </Badge>
            <Button variant="outline" size="sm">
              <Zap className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Map className="h-4 w-4" />
                Total Buses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalBuses}</p>
              <p className="text-xs text-muted-foreground">Being tracked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Navigation className="h-4 w-4" />
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{activeBuses}</p>
              <p className="text-xs text-muted-foreground">Moving now</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Idle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-600">{idleBuses}</p>
              <p className="text-xs text-muted-foreground">Stationary</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{alertBuses}</p>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="map" className="space-y-4">
          <TabsList>
            <TabsTrigger value="map">Live Map</TabsTrigger>
            <TabsTrigger value="list">Bus List</TabsTrigger>
            <TabsTrigger value="trips">Active Trips</TabsTrigger>
          </TabsList>

          {/* Map Tab */}
          <TabsContent value="map" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Map className="h-5 w-5" />
                    Live GPS Map
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      variant={mapView === 'all' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setMapView('all')}
                    >
                      All
                    </Button>
                    <Button 
                      variant={mapView === 'active' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setMapView('active')}
                    >
                      Active Only
                    </Button>
                    <Button 
                      variant={mapView === 'alerts' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setMapView('alerts')}
                    >
                      Alerts
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 rounded-lg p-8 min-h-[600px] flex flex-col items-center justify-center">
                  <Map className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Google Maps Integration</h3>
                  <p className="text-sm text-gray-500 text-center max-w-md mb-6">
                    Real-time GPS map showing all bus locations with live updates every 10 seconds.
                    Add your Google Maps API key to enable this feature.
                  </p>
                  
                  {/* Bus Markers Preview */}
                  <div className="w-full max-w-2xl space-y-2">
                    <p className="text-sm font-medium text-gray-600 mb-3">Live Bus Positions:</p>
                    {trips.slice(0, 5).map((tracking: any) => (
                      <div key={tracking.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                        <span className="text-2xl">{getBusStatusIcon(tracking)}</span>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{tracking.registration_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {tracking.latitude && tracking.longitude ? 
                              `Lat: ${tracking.latitude.toFixed(6)}, Lng: ${tracking.longitude.toFixed(6)}` :
                              'No GPS data'
                            }
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${getSpeedColor(tracking.speed || 0)}`}>
                            {tracking.speed || 0} km/h
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tracking.timestamp ? format(new Date(tracking.timestamp), 'HH:mm:ss') : 'N/A'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bus List Tab */}
          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Tracked Buses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading tracking data...
                    </div>
                  ) : trips.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No GPS tracking data available</p>
                    </div>
                  ) : (
                    trips.map((tracking: any) => {
                      const hasAlert = tracking.speed > 120 || (tracking.fuel_level && tracking.fuel_level < 20);
                      
                      return (
                        <div
                          key={tracking.id}
                          className={`p-4 border rounded-lg ${hasAlert ? 'bg-red-50 border-red-200' : 'bg-white'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{getBusStatusIcon(tracking)}</span>
                              <div>
                                <p className="font-semibold">{tracking.registration_number}</p>
                                <p className="text-sm text-muted-foreground">{tracking.model || 'N/A'}</p>
                                {tracking.activeTrip && (
                                  <p className="text-xs text-green-600 font-medium mt-1">
                                    On Trip: {tracking.activeTrip.routes?.origin} → {tracking.activeTrip.routes?.destination}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-bold ${getSpeedColor(tracking.speed || 0)}`}>
                                {tracking.speed || 0} km/h
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {tracking.timestamp ? format(new Date(tracking.timestamp), 'HH:mm:ss') : 'N/A'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Location</p>
                              <p className="font-mono text-xs">
                                {tracking.latitude && tracking.longitude ? 
                                  `${tracking.latitude.toFixed(4)}, ${tracking.longitude.toFixed(4)}` :
                                  'No GPS data'
                                }
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Fuel Level</p>
                              <p className={tracking.fuel_level && tracking.fuel_level < 20 ? 'text-red-600 font-bold' : ''}>
                                {tracking.fuel_level ? `${tracking.fuel_level}%` : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Status</p>
                              <Badge className={tracking.speed > 0 ? 'bg-green-500' : 'bg-gray-500'}>
                                {tracking.speed > 0 ? 'Moving' : 'Idle'}
                              </Badge>
                            </div>
                          </div>

                          {hasAlert && (
                            <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
                              <AlertCircle className="h-4 w-4" />
                              {tracking.speed > 120 && <span>Speeding detected!</span>}
                              {tracking.fuel_level < 20 && <span>Low fuel warning!</span>}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Trips Tab */}
          <TabsContent value="trips" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bus className="h-5 w-5" />
                    Active Trips Today
                  </CardTitle>
                  <Badge variant="outline" className="text-lg px-3">
                    {activeTrips?.length || 0} Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeTrips?.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Navigation className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">No active trips at the moment</p>
                      <p className="text-sm">All buses are currently idle or trips haven't started yet</p>
                    </div>
                  ) : (
                    activeTrips?.map((trip: any, index: number) => {
                      // Calculate progress (mock calculation - in real app, use GPS data)
                      const departureTime = new Date(`${trip.departure_date}T${trip.departure_time}`);
                      const now = new Date();
                      const minutesElapsed = Math.floor((now.getTime() - departureTime.getTime()) / 60000);
                      const estimatedDuration = 120; // Mock: 2 hours
                      const progress = Math.min(Math.max((minutesElapsed / estimatedDuration) * 100, 0), 100);
                      
                      return (
                        <div key={trip.id} className="p-5 border-2 border-green-200 rounded-lg bg-gradient-to-r from-green-50 to-white hover:shadow-md transition-shadow">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">🚌</span>
                                <div>
                                  <p className="text-lg font-bold text-green-700">
                                    {trip.routes?.origin} → {trip.routes?.destination}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Trip #{index + 1} • {trip.buses?.bus_number}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <Badge className="bg-green-500 text-white px-3 py-1">
                              <Activity className="h-3 w-3 mr-1 inline" />
                              En Route
                            </Badge>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>Progress</span>
                              <span>{progress.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          {/* Trip Details Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Departed
                              </p>
                              <p className="font-semibold text-sm">{trip.departure_time}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                ETA
                              </p>
                              <p className="font-semibold text-sm">{trip.arrival_time || 'Calculating...'}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                Driver
                              </p>
                              <p className="font-semibold text-sm truncate">
                                {trip.driver_assignments?.[0]?.drivers?.full_name || 'Not assigned'}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                GPS Status
                              </p>
                              <p className="font-semibold text-sm text-green-600">
                                {trip.buses?.gps_device_id ? '✓ Active' : '✗ No GPS'}
                              </p>
                            </div>
                          </div>

                          {/* Additional Info */}
                          <div className="flex items-center justify-between pt-3 border-t">
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span>Seats: {trip.available_seats} available</span>
                              {trip.buses?.gps_device_id && (
                                <span>GPS ID: {trip.buses.gps_device_id}</span>
                              )}
                            </div>
                            <Button variant="outline" size="sm">
                              <MapPin className="h-3 w-3 mr-1" />
                              Track
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
