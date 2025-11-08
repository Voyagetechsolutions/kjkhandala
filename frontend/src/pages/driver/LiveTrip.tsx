import { useState } from 'react';
import DriverLayout from '@/components/driver/DriverLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Navigation, 
  MapPin, 
  Clock, 
  Play, 
  Pause, 
  Square, 
  AlertTriangle,
  Car,
  Fuel,
  Users,
  TrendingUp
} from 'lucide-react';

export default function LiveTrip() {
  const [tripStatus, setTripStatus] = useState<'active' | 'paused' | 'ended'>('active');
  const [reportType, setReportType] = useState('');
  const [reportDetails, setReportDetails] = useState('');

  // Mock data
  const tripData = {
    route: 'Gaborone - Francistown',
    currentLocation: 'Near Palapye',
    progress: 65,
    distanceCovered: '273 km',
    distanceRemaining: '147 km',
    estimatedArrival: '11:45',
    scheduledArrival: '12:00',
    currentSpeed: '95 km/h',
    passengers: 35,
  };

  const handlePauseTrip = () => {
    setTripStatus('paused');
    console.log('Trip paused');
  };

  const handleResumeTrip = () => {
    setTripStatus('active');
    console.log('Trip resumed');
  };

  const handleEndTrip = () => {
    setTripStatus('ended');
    console.log('Trip ended');
  };

  const handleQuickReport = (type: string) => {
    setReportType(type);
    console.log('Quick report:', type);
  };

  const handleSubmitReport = () => {
    console.log('Submit report:', reportType, reportDetails);
    setReportType('');
    setReportDetails('');
  };

  return (
    <DriverLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Live Trip</h1>
            <p className="text-muted-foreground">Real-time navigation and trip monitoring</p>
          </div>
          <Badge className={tripStatus === 'active' ? 'bg-green-500' : 'bg-yellow-500'}>
            {tripStatus === 'active' ? '● Active' : '⏸ Paused'}
          </Badge>
        </div>

        {/* Trip Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Trip Controls</CardTitle>
            <CardDescription>{tripData.route}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {tripStatus === 'active' && (
                <Button onClick={handlePauseTrip}>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause Trip (Break)
                </Button>
              )}
              {tripStatus === 'paused' && (
                <Button onClick={handleResumeTrip}>
                  <Play className="mr-2 h-4 w-4" />
                  Resume Trip
                </Button>
              )}
              <Button onClick={handleEndTrip}>
                <Square className="mr-2 h-4 w-4" />
                End Trip
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Map Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Live GPS Navigation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">Interactive Map</p>
                <p className="text-sm text-muted-foreground">GPS navigation will be displayed here</p>
                <p className="text-xs text-muted-foreground mt-2">Integrate with Google Maps or Mapbox</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trip Progress */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Location</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{tripData.currentLocation}</div>
              <p className="text-xs text-muted-foreground">{tripData.progress}% complete</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ETA</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{tripData.estimatedArrival}</div>
              <p className="text-xs text-muted-foreground">Scheduled: {tripData.scheduledArrival}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Distance</CardTitle>
              <Navigation className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{tripData.distanceCovered}</div>
              <p className="text-xs text-muted-foreground">Remaining: {tripData.distanceRemaining}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Speed</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{tripData.currentSpeed}</div>
              <p className="text-xs text-muted-foreground">Passengers: {tripData.passengers}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Reports</CardTitle>
            <CardDescription>Report issues during the trip</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-5 gap-3 mb-4">
              <Button 
                onClick={() => handleQuickReport('accident')}
                className="bg-red-500 hover:bg-red-600"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Accident
              </Button>
              <Button 
                onClick={() => handleQuickReport('breakdown')}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Car className="mr-2 h-4 w-4" />
                Breakdown
              </Button>
              <Button 
                onClick={() => handleQuickReport('delay')}
                className="bg-yellow-500 hover:bg-yellow-600"
              >
                <Clock className="mr-2 h-4 w-4" />
                Delay
              </Button>
              <Button 
                onClick={() => handleQuickReport('traffic')}
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Car className="mr-2 h-4 w-4" />
                Traffic
              </Button>
              <Button 
                onClick={() => handleQuickReport('emergency')}
                className="bg-red-600 hover:bg-red-700"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Emergency
              </Button>
            </div>

            {reportType && (
              <div className="space-y-3 border-t pt-4">
                <div>
                  <h4 className="font-medium mb-2">Report: {reportType.toUpperCase()}</h4>
                  <Textarea
                    placeholder="Provide details about the incident..."
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSubmitReport}>Submit Report</Button>
                  <Button onClick={() => setReportType('')}>Cancel</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fuel Log Quick Entry */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fuel className="h-5 w-5" />
              Quick Fuel Log
            </CardTitle>
            <CardDescription>Log refueling during the trip</CardDescription>
          </CardHeader>
          <CardContent>
            <Button>
              <Fuel className="mr-2 h-4 w-4" />
              Log Fuel Stop
            </Button>
          </CardContent>
        </Card>
      </div>
    </DriverLayout>
  );
}
