import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import TicketingLayout from '@/components/ticketing/TicketingLayout';
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
  Luggage,
  Calendar
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

  // Fetch today's trips for dropdown
  const { data: dashboardData } = useQuery({
    queryKey: ['ticketing-dashboard'],
    queryFn: async () => {
      const response = await api.get('/ticketing/dashboard');
      return response.data;
    },
  });

  // Fetch manifest for selected trip
  const { data: manifestData, isLoading } = useQuery({
    queryKey: ['manifest', selectedTrip],
    queryFn: async () => {
      const response = await api.get(`/ticketing/manifest/${selectedTrip}`);
      return response.data;
    },
    enabled: !!selectedTrip,
  });

  const passengers = manifestData?.passengers || [];
  const tripDetails = manifestData?.trip || null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'reserved': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const handleDownloadManifest = () => {
    console.log('Download manifest for trip:', selectedTrip);
    // In production, this would generate and download a PDF
    window.print();
  };

  // Filter passengers based on search and status
  const filteredPassengers = passengers.filter((passenger: any) => {
    const matchesSearch = !searchTerm || 
      passenger.passenger?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      passenger.passenger?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      passenger.ticketNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'boarded' && passenger.checkedIn) ||
      (filterStatus === 'not-boarded' && !passenger.checkedIn);
    
    return matchesSearch && matchesStatus;
  });

  const totalBoarded = passengers.filter((p: any) => p.checkedIn).length;
  const totalNotBoarded = passengers.filter((p: any) => !p.checkedIn).length;

  return (
    <TicketingLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Passenger Manifest</h1>
          <p className="text-muted-foreground">View and manage passenger lists for trips</p>
        </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Trip Selection & Filters</CardTitle>
          <CardDescription>Select a trip and filter passengers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            {/* Trip Selection */}
            <Select value={selectedTrip} onValueChange={setSelectedTrip}>
              <SelectTrigger>
                <SelectValue placeholder="Select Trip" />
              </SelectTrigger>
              <SelectContent>
                {dashboardData?.upcomingTrips?.map((trip: any) => (
                  <SelectItem key={trip.id} value={trip.id}>
                    {trip.route?.origin} → {trip.route?.destination} ({new Date(trip.departureTime).toLocaleTimeString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ticket..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Passengers</SelectItem>
                <SelectItem value="boarded">Boarded</SelectItem>
                <SelectItem value="not-boarded">Not Boarded</SelectItem>
                <SelectItem value="no-show">No Show</SelectItem>
              </SelectContent>
            </Select>

            {/* Download Button */}
            <Button onClick={handleDownloadManifest}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trip Details */}
      {tripDetails && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Selected Trip</p>
                <p className="text-xl font-bold">
                  {tripDetails.route?.origin} → {tripDetails.route?.destination}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(tripDetails.departureTime).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Capacity</p>
                <p className="text-2xl font-bold">{passengers.length} / {tripDetails.capacity}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid md:grid-cols-4 gap-4">
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
            <CardTitle className="text-sm font-medium">Checked In</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBoarded}</div>
            <p className="text-xs text-muted-foreground">Boarded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Users className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNotBoarded}</div>
            <p className="text-xs text-muted-foreground">Not yet boarded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tripDetails ? Math.round((passengers.length / tripDetails.capacity) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Full</p>
          </CardContent>
        </Card>
      </div>

      {/* Passenger List */}
      <Card>
        <CardHeader>
          <CardTitle>Passenger List</CardTitle>
          <CardDescription>Complete manifest for selected trip</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">Loading manifest...</div>
          ) : !selectedTrip ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a trip to view passenger manifest</p>
            </div>
          ) : filteredPassengers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No passengers found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seat</TableHead>
                  <TableHead>Passenger Name</TableHead>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Luggage</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPassengers.map((booking: any) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.seatNumber}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {booking.passenger?.firstName} {booking.passenger?.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {booking.passenger?.idNumber}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{booking.ticketNumber}</TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {booking.passenger?.phone}
                        </div>
                        {booking.passenger?.email && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {booking.passenger?.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Luggage className="h-3 w-3" />
                        {booking.luggage || 0} bags
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(booking.paymentStatus.toLowerCase())}>
                        {booking.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={booking.checkedIn ? 'bg-green-500' : 'bg-gray-500'}>
                        {booking.checkedIn ? 'Checked In' : 'Not Boarded'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>
    </TicketingLayout>
  );
}
