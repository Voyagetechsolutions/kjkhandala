import { useState } from 'react';
import DriverLayout from '@/components/driver/DriverLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Play, 
  Square, 
  AlertCircle,
  CheckCircle,
  Navigation,
  FileText
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from 'react-router-dom';

export default function MyTrips() {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock data - replace with API call
  const trips = [
    {
      id: 1,
      route: 'Gaborone - Francistown',
      origin: 'Gaborone Main Terminal',
      destination: 'Francistown Station',
      departureTime: '08:00',
      arrivalTime: '12:00',
      date: '2024-11-06',
      busNumber: 'BUS-001',
      passengers: 35,
      capacity: 45,
      status: 'active',
      distance: '420 km',
    },
    {
      id: 2,
      route: 'Francistown - Maun',
      origin: 'Francistown Station',
      destination: 'Maun Terminal',
      departureTime: '14:00',
      arrivalTime: '18:30',
      date: '2024-11-06',
      busNumber: 'BUS-001',
      passengers: 28,
      capacity: 45,
      status: 'upcoming',
      distance: '520 km',
    },
    {
      id: 3,
      route: 'Gaborone - Kasane',
      origin: 'Gaborone Main Terminal',
      destination: 'Kasane Border',
      departureTime: '06:00',
      arrivalTime: '16:00',
      date: '2024-11-05',
      busNumber: 'BUS-001',
      passengers: 42,
      capacity: 45,
      status: 'completed',
      distance: '850 km',
    },
    {
      id: 4,
      route: 'Maun - Gaborone',
      origin: 'Maun Terminal',
      destination: 'Gaborone Main Terminal',
      departureTime: '09:00',
      arrivalTime: '13:30',
      date: '2024-11-04',
      busNumber: 'BUS-001',
      passengers: 38,
      capacity: 45,
      status: 'completed',
      distance: '520 km',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'upcoming': return 'bg-blue-500';
      case 'completed': return 'bg-gray-500';
      case 'canceled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="h-4 w-4" />;
      case 'upcoming': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'canceled': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleStartTrip = (tripId: number) => {
    console.log('Start trip:', tripId);
    navigate('/driver/live-trip');
  };

  const handleEndTrip = (tripId: number) => {
    console.log('End trip:', tripId);
    // API call to end trip
  };

  const handleViewManifest = (tripId: number) => {
    navigate('/driver/manifest');
  };

  const handleReportIssue = (tripId: number) => {
    navigate('/driver/communication');
  };

  const filteredTrips = filterStatus === 'all' 
    ? trips 
    : trips.filter(trip => trip.status === filterStatus);

  return (
    <DriverLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Trips</h1>
            <p className="text-muted-foreground">View and manage your assigned trips</p>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trips</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Trips</CardTitle>
              <Play className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {trips.filter(t => t.status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {trips.filter(t => t.status === 'upcoming').length}
              </div>
              <p className="text-xs text-muted-foreground">Scheduled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {trips.filter(t => t.status === 'completed').length}
              </div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
              <Navigation className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,310 km</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>
        </div>

        {/* Trips List */}
        <div className="space-y-4">
          {filteredTrips.map((trip) => (
            <Card key={trip.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {trip.route}
                      <Badge className={getStatusColor(trip.status)}>
                        {getStatusIcon(trip.status)}
                        <span className="ml-1">{trip.status}</span>
                      </Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {trip.date}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Bus</div>
                    <div className="font-medium">{trip.busNumber}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-green-500" />
                      Origin
                    </div>
                    <div className="font-medium">{trip.origin}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-red-500" />
                      Destination
                    </div>
                    <div className="font-medium">{trip.destination}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Departure
                    </div>
                    <div className="font-medium">{trip.departureTime}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Arrival
                    </div>
                    <div className="font-medium">{trip.arrivalTime}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Passengers
                    </div>
                    <div className="font-medium">{trip.passengers}/{trip.capacity}</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {trip.status === 'upcoming' && (
                    <Button onClick={() => handleStartTrip(trip.id)}>
                      <Play className="mr-2 h-4 w-4" />
                      Start Trip
                    </Button>
                  )}
                  {trip.status === 'active' && (
                    <>
                      <Button onClick={() => navigate('/driver/live-trip')}>
                        <Navigation className="mr-2 h-4 w-4" />
                        View Live Trip
                      </Button>
                      <Button onClick={() => handleEndTrip(trip.id)}>
                        <Square className="mr-2 h-4 w-4" />
                        End Trip
                      </Button>
                    </>
                  )}
                  <Button onClick={() => handleViewManifest(trip.id)}>
                    <Users className="mr-2 h-4 w-4" />
                    View Manifest
                  </Button>
                  <Button onClick={() => handleReportIssue(trip.id)}>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Report Issue
                  </Button>
                  {trip.status === 'completed' && (
                    <Button onClick={() => navigate('/driver/history')}>
                      <FileText className="mr-2 h-4 w-4" />
                      View Report
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTrips.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No trips found</p>
              <p className="text-sm text-muted-foreground">Try changing the filter</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DriverLayout>
  );
}
