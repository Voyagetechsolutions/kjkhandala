import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Search, 
  Download, 
  CheckCircle, 
  XCircle, 
  Phone, 
  Mail,
  MapPin,
  Luggage,
  AlertCircle,
  Bus
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PassengerManifest() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrip, setSelectedTrip] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock data - replace with API call
  const passengers = [
    {
      id: 1,
      name: 'John Doe',
      seatNumber: 'A1',
      ticketNumber: 'TKT-001234',
      phone: '+267 71234567',
      email: 'john@example.com',
      pickup: 'Gaborone Main Terminal',
      dropoff: 'Francistown Station',
      paymentStatus: 'paid',
      boardingStatus: 'not-boarded',
      luggage: '1 bag',
      specialNeeds: null,
    },
    {
      id: 2,
      name: 'Jane Smith',
      seatNumber: 'A2',
      ticketNumber: 'TKT-001235',
      phone: '+267 72345678',
      email: 'jane@example.com',
      pickup: 'Gaborone Main Terminal',
      dropoff: 'Maun',
      paymentStatus: 'paid',
      boardingStatus: 'boarded',
      luggage: '2 bags',
      specialNeeds: 'Wheelchair',
    },
  ];

  const tripInfo = {
    route: 'Gaborone - Francistown',
    departureTime: '08:00',
    busNumber: 'BUS-001',
    driverName: 'Mike Johnson',
    capacity: 45,
    occupied: passengers.length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'reserved': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getBoardingColor = (status: string) => {
    switch (status) {
      case 'boarded': return 'bg-green-500';
      case 'not-boarded': return 'bg-gray-500';
      case 'no-show': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleSyncWithDriver = () => {
    console.log('Sync manifest with driver dashboard');
    // API call to sync
  };

  const handleDownloadManifest = () => {
    console.log('Download manifest');
    // Generate PDF
  };

  const handleSendToDriver = () => {
    console.log('Send manifest to driver');
    // Send via email/SMS
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Passenger Manifest</h1>
        <p className="text-muted-foreground">Operations view of passenger lists and trip assignments</p>
      </div>

      {/* Trip Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Trip Information</CardTitle>
          <CardDescription>Current trip details and capacity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-6 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Route</div>
              <div className="font-medium">{tripInfo.route}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Departure</div>
              <div className="font-medium">{tripInfo.departureTime}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Bus</div>
              <div className="font-medium flex items-center gap-1">
                <Bus className="h-4 w-4" />
                {tripInfo.busNumber}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Driver</div>
              <div className="font-medium">{tripInfo.driverName}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Capacity</div>
              <div className="font-medium">{tripInfo.occupied}/{tripInfo.capacity}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Occupancy</div>
              <div className="font-medium">{Math.round((tripInfo.occupied / tripInfo.capacity) * 100)}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Manifest Controls</CardTitle>
          <CardDescription>Search, filter, and manage passenger list</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-5 gap-4">
            {/* Trip Selection */}
            <Select value={selectedTrip} onValueChange={setSelectedTrip}>
              <SelectTrigger>
                <SelectValue placeholder="Select Trip" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trip1">Gaborone - Francistown (08:00)</SelectItem>
                <SelectItem value="trip2">Gaborone - Maun (09:30)</SelectItem>
                <SelectItem value="trip3">Francistown - Kasane (10:00)</SelectItem>
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search passengers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Download Button */}
            <Button onClick={handleDownloadManifest}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>

            {/* Sync Button */}
            <Button onClick={handleSyncWithDriver}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Sync with Driver
            </Button>

            {/* Send Button */}
            <Button onClick={handleSendToDriver}>
              <Mail className="mr-2 h-4 w-4" />
              Send to Driver
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Passengers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{passengers.length}</div>
            <p className="text-xs text-muted-foreground">On this trip</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Boarded</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {passengers.filter(p => p.boardingStatus === 'boarded').length}
            </div>
            <p className="text-xs text-muted-foreground">Checked in</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Users className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {passengers.filter(p => p.boardingStatus === 'not-boarded').length}
            </div>
            <p className="text-xs text-muted-foreground">Not yet boarded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Special Needs</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {passengers.filter(p => p.specialNeeds).length}
            </div>
            <p className="text-xs text-muted-foreground">Require assistance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Show</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {passengers.filter(p => p.boardingStatus === 'no-show').length}
            </div>
            <p className="text-xs text-muted-foreground">Did not board</p>
          </CardContent>
        </Card>
      </div>

      {/* Passenger List */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Passenger Manifest</CardTitle>
          <CardDescription>Detailed list for operations monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seat</TableHead>
                <TableHead>Passenger Details</TableHead>
                <TableHead>Ticket #</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Journey</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Boarding Status</TableHead>
                <TableHead>Special Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {passengers.map((passenger) => (
                <TableRow key={passenger.id}>
                  <TableCell className="font-bold text-lg">{passenger.seatNumber}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{passenger.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Luggage className="h-3 w-3" />
                        {passenger.luggage}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-mono">{passenger.ticketNumber}</TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {passenger.phone}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {passenger.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-green-500" />
                        <span className="font-medium">From:</span> {passenger.pickup}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-red-500" />
                        <span className="font-medium">To:</span> {passenger.dropoff}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(passenger.paymentStatus)}>
                      {passenger.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getBoardingColor(passenger.boardingStatus)}>
                      {passenger.boardingStatus.replace('-', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {passenger.specialNeeds ? (
                      <Badge className="bg-blue-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {passenger.specialNeeds}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">None</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
