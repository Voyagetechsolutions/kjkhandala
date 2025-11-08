import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  Bus,
  Route,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  Download,
  Edit,
  Trash2,
  Repeat,
  User
} from 'lucide-react';

interface Trip {
  id: string;
  routeId: string;
  routeName: string;
  busId: string;
  busNumber: string;
  driverId: string;
  driverName: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled' | 'delayed';
  price: number;
  availableSeats: number;
  totalSeats: number;
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly';
    endDate: string;
  };
}

const TripScheduling = () => {
  const [trips, setTrips] = useState<Trip[]>([
    {
      id: '1',
      routeId: '1',
      routeName: 'Gaborone - Francistown',
      busId: '1',
      busNumber: 'BUS-001',
      driverId: '1',
      driverName: 'John Smith',
      departureDate: '2025-11-06',
      departureTime: '08:00',
      arrivalTime: '14:00',
      status: 'scheduled',
      price: 150,
      availableSeats: 45,
      totalSeats: 50
    },
    {
      id: '2',
      routeId: '2',
      routeName: 'Francistown - Maun',
      busId: '3',
      busNumber: 'BUS-003',
      driverId: '2',
      driverName: 'Sarah Jones',
      departureDate: '2025-11-06',
      departureTime: '08:30',
      arrivalTime: '16:30',
      status: 'active',
      price: 200,
      availableSeats: 38,
      totalSeats: 50
    },
    {
      id: '3',
      routeId: '1',
      routeName: 'Gaborone - Francistown',
      busId: '2',
      busNumber: 'BUS-002',
      driverId: '3',
      driverName: 'Mike Brown',
      departureDate: '2025-11-06',
      departureTime: '09:00',
      arrivalTime: '15:00',
      status: 'delayed',
      price: 150,
      availableSeats: 42,
      totalSeats: 50
    }
  ]);

  const [isAddTripOpen, setIsAddTripOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('calendar');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [newTrip, setNewTrip] = useState({
    routeId: '',
    busId: '',
    driverId: '',
    departureDate: '',
    departureTime: '',
    arrivalTime: '',
    price: '',
    recurring: false,
    recurringType: 'daily' as 'daily' | 'weekly' | 'monthly',
    recurringEndDate: ''
  });

  // Mock data for dropdowns
  const routes = [
    { id: '1', name: 'Gaborone - Francistown', duration: 360 },
    { id: '2', name: 'Francistown - Maun', duration: 480 },
    { id: '3', name: 'Gaborone - Kasane', duration: 720 },
    { id: '4', name: 'Maun - Gaborone', duration: 480 }
  ];

  const buses = [
    { id: '1', number: 'BUS-001', status: 'available', seats: 50 },
    { id: '2', number: 'BUS-002', status: 'available', seats: 50 },
    { id: '3', number: 'BUS-003', status: 'in-use', seats: 50 },
    { id: '4', number: 'BUS-004', status: 'maintenance', seats: 45 }
  ];

  const drivers = [
    { id: '1', name: 'John Smith', status: 'available', license: 'Class A' },
    { id: '2', name: 'Sarah Jones', status: 'available', license: 'Class A' },
    { id: '3', name: 'Mike Brown', status: 'on-duty', license: 'Class A' },
    { id: '4', name: 'Emma Davis', status: 'off-duty', license: 'Class B' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      case 'delayed': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <CalendarIcon className="h-4 w-4" />;
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'delayed': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleAddTrip = () => {
    const selectedRoute = routes.find(r => r.id === newTrip.routeId);
    const selectedBus = buses.find(b => b.id === newTrip.busId);
    const selectedDriver = drivers.find(d => d.id === newTrip.driverId);

    if (!selectedRoute || !selectedBus || !selectedDriver) return;

    const trip: Trip = {
      id: Date.now().toString(),
      routeId: newTrip.routeId,
      routeName: selectedRoute.name,
      busId: newTrip.busId,
      busNumber: selectedBus.number,
      driverId: newTrip.driverId,
      driverName: selectedDriver.name,
      departureDate: newTrip.departureDate,
      departureTime: newTrip.departureTime,
      arrivalTime: newTrip.arrivalTime,
      status: 'scheduled',
      price: parseFloat(newTrip.price),
      availableSeats: selectedBus.seats,
      totalSeats: selectedBus.seats,
      recurring: newTrip.recurring ? {
        type: newTrip.recurringType,
        endDate: newTrip.recurringEndDate
      } : undefined
    };

    setTrips([...trips, trip]);
    setIsAddTripOpen(false);
    setNewTrip({
      routeId: '',
      busId: '',
      driverId: '',
      departureDate: '',
      departureTime: '',
      arrivalTime: '',
      price: '',
      recurring: false,
      recurringType: 'daily',
      recurringEndDate: ''
    });
  };

  const handleRescheduleTrip = (tripId: string, newTime: string) => {
    setTrips(trips.map(trip => 
      trip.id === tripId ? { ...trip, departureTime: newTime } : trip
    ));
  };

  const handleCancelTrip = (tripId: string) => {
    setTrips(trips.map(trip => 
      trip.id === tripId ? { ...trip, status: 'cancelled' } : trip
    ));
  };

  const filteredTrips = filterStatus === 'all' 
    ? trips 
    : trips.filter(trip => trip.status === filterStatus);

  const getTripsByDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return trips.filter(trip => trip.departureDate === dateStr);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Trip Scheduling</h2>
          <p className="text-gray-600">Create and manage daily, weekly, and monthly schedules</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Schedule
          </Button>
          <Dialog open={isAddTripOpen} onOpenChange={setIsAddTripOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Trip
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule New Trip</DialogTitle>
                <DialogDescription>Create a new trip with optional recurring schedule</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="route">Route</Label>
                  <Select value={newTrip.routeId} onValueChange={(value) => setNewTrip({ ...newTrip, routeId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select route" />
                    </SelectTrigger>
                    <SelectContent>
                      {routes.map((route) => (
                        <SelectItem key={route.id} value={route.id}>
                          {route.name} ({route.duration} min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bus">Bus</Label>
                  <Select value={newTrip.busId} onValueChange={(value) => setNewTrip({ ...newTrip, busId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bus" />
                    </SelectTrigger>
                    <SelectContent>
                      {buses.filter(b => b.status === 'available').map((bus) => (
                        <SelectItem key={bus.id} value={bus.id}>
                          {bus.number} ({bus.seats} seats) - {bus.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="driver">Driver</Label>
                  <Select value={newTrip.driverId} onValueChange={(value) => setNewTrip({ ...newTrip, driverId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.filter(d => d.status === 'available').map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.name} ({driver.license}) - {driver.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="price">Price (BWP)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newTrip.price}
                    onChange={(e) => setNewTrip({ ...newTrip, price: e.target.value })}
                    placeholder="150"
                  />
                </div>
                <div>
                  <Label htmlFor="departureDate">Departure Date</Label>
                  <Input
                    id="departureDate"
                    type="date"
                    value={newTrip.departureDate}
                    onChange={(e) => setNewTrip({ ...newTrip, departureDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="departureTime">Departure Time</Label>
                  <Input
                    id="departureTime"
                    type="time"
                    value={newTrip.departureTime}
                    onChange={(e) => setNewTrip({ ...newTrip, departureTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="arrivalTime">Arrival Time</Label>
                  <Input
                    id="arrivalTime"
                    type="time"
                    value={newTrip.arrivalTime}
                    onChange={(e) => setNewTrip({ ...newTrip, arrivalTime: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recurring"
                    checked={newTrip.recurring}
                    onCheckedChange={(checked) => setNewTrip({ ...newTrip, recurring: checked as boolean })}
                  />
                  <Label htmlFor="recurring">Recurring Trip</Label>
                </div>
                {newTrip.recurring && (
                  <>
                    <div>
                      <Label htmlFor="recurringType">Repeat</Label>
                      <Select value={newTrip.recurringType} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setNewTrip({ ...newTrip, recurringType: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="recurringEndDate">End Date</Label>
                      <Input
                        id="recurringEndDate"
                        type="date"
                        value={newTrip.recurringEndDate}
                        onChange={(e) => setNewTrip({ ...newTrip, recurringEndDate: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsAddTripOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTrip}>
                  Schedule Trip
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="conflicts">Conflict Check</TabsTrigger>
        </TabsList>

        {/* Calendar View */}
        <TabsContent value="calendar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Schedule Calendar</CardTitle>
                <CardDescription>Color-coded trip statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                />
                <div className="mt-4 flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    <span>Scheduled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-green-500"></div>
                    <span>Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-yellow-500"></div>
                    <span>Delayed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500"></div>
                    <span>Cancelled</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trips for {selectedDate.toLocaleDateString()}</CardTitle>
                <CardDescription>
                  {getTripsByDate(selectedDate).length} trips scheduled
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getTripsByDate(selectedDate).map((trip) => (
                    <div key={trip.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(trip.status)}`} />
                          <span className="font-medium">{trip.routeName}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {trip.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {trip.departureTime} - {trip.arrivalTime}
                        </div>
                        <div className="flex items-center gap-2">
                          <Bus className="h-3 w-3" />
                          {trip.busNumber}
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          {trip.driverName}
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          {trip.availableSeats}/{trip.totalSeats} seats
                        </div>
                      </div>
                      {trip.recurring && (
                        <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
                          <Repeat className="h-3 w-3" />
                          Repeats {trip.recurring.type}
                        </div>
                      )}
                    </div>
                  ))}
                  {getTripsByDate(selectedDate).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CalendarIcon className="h-8 w-8 mx-auto mb-2" />
                      <p>No trips scheduled for this date</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* List View */}
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>All Scheduled Trips</CardTitle>
                  <CardDescription>Manage and monitor all trips</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="delayed">Delayed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trip Details</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Bus & Driver</TableHead>
                    <TableHead>Seats</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrips.map((trip) => (
                    <TableRow key={trip.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Route className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="font-medium">{trip.routeName}</p>
                            {trip.recurring && (
                              <p className="text-xs text-blue-600">Repeats {trip.recurring.type}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{trip.departureDate}</p>
                          <p className="text-gray-500">{trip.departureTime} - {trip.arrivalTime}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{trip.busNumber}</p>
                          <p className="text-gray-500">{trip.driverName}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{trip.availableSeats}/{trip.totalSeats}</p>
                          <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${((trip.totalSeats - trip.availableSeats) / trip.totalSeats) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>BWP {trip.price}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${getStatusColor(trip.status)} text-white`}>
                          {getStatusIcon(trip.status)}
                          <span className="ml-1">{trip.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleCancelTrip(trip.id)}>
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conflict Check */}
        <TabsContent value="conflicts">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Driver Conflicts
                </CardTitle>
                <CardDescription>Drivers assigned to multiple trips at the same time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>No driver conflicts detected</p>
                  <p className="text-sm">All drivers are properly scheduled</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bus className="h-5 w-5" />
                  Bus Conflicts
                </CardTitle>
                <CardDescription>Buses assigned to multiple trips simultaneously</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>No bus conflicts detected</p>
                  <p className="text-sm">All buses are properly allocated</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Overlapping Routes
                </CardTitle>
                <CardDescription>Trips on similar routes at competing times</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Potential Overlap</span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      Two Gaborone - Francistown trips scheduled within 30 minutes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Maintenance Conflicts
                </CardTitle>
                <CardDescription>Buses scheduled during maintenance periods</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border border-red-200 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-red-800">Maintenance Conflict</span>
                    </div>
                    <p className="text-sm text-red-700">
                      BUS-004 scheduled for trip but under maintenance until Nov 8
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TripScheduling;
