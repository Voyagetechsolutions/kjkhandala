import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import DriverLayout from '@/components/driver/DriverLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Users, 
  Search, 
  CheckCircle, 
  XCircle, 
  Phone, 
  Luggage,
  Download
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function DriverManifest() {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: tripData } = useQuery({
    queryKey: ['driver-trip'],
    queryFn: async () => {
      const response = await api.get('/driver/my-trip');
      return response.data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['driver-manifest', tripData?.trip?.id],
    queryFn: async () => {
      const response = await api.get(`/driver/manifest/${tripData.trip.id}`);
      return response.data;
    },
    enabled: !!tripData?.trip?.id,
  });

  const noShowMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await api.post(`/driver/no-show/${bookingId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-manifest'] });
      toast.success('Passenger marked as no-show');
    },
    onError: () => {
      toast.error('Failed to mark no-show');
    },
  });

  if (isLoading || !data) {
    return (
      <DriverLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-2xl font-bold">Loading manifest...</div>
        </div>
      </DriverLayout>
    );
  }

  const passengers = data.passengers.filter((p: any) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );
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
      dropoff: 'Francistown Station',
      paymentStatus: 'paid',
      boardingStatus: 'boarded',
      luggage: '2 bags',
      specialNeeds: 'Wheelchair',
    },
    {
      id: 3,
      name: 'Mike Johnson',
      seatNumber: 'B1',
      ticketNumber: 'TKT-001236',
      phone: '+267 73456789',
      email: 'mike@example.com',
      pickup: 'Gaborone Main Terminal',
      dropoff: 'Francistown Station',
      paymentStatus: 'paid',
      boardingStatus: 'not-boarded',
      luggage: '1 bag',
      specialNeeds: null,
    },
  ];

  const getBoardingColor = (status: string) => {
    switch (status) {
      case 'boarded': return 'bg-green-500';
      case 'not-boarded': return 'bg-gray-500';
      case 'no-show': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleMarkBoarded = (passengerId: number) => {
    console.log('Mark passenger as boarded:', passengerId);
    // API call to update boarding status
  };

  const handleMarkNoShow = (passengerId: number) => {
    console.log('Mark passenger as no-show:', passengerId);
    // API call to update boarding status
  };

  const handleDownloadManifest = () => {
    console.log('Download manifest');
    // Generate PDF
  };

  const filteredPassengers = passengers.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.seatNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DriverLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Passenger Manifest</h1>
          <p className="text-muted-foreground">Current trip passenger list and boarding management</p>
        </div>

        {/* Trip Info */}
        <Card>
          <CardHeader>
            <CardTitle>Current Trip Information</CardTitle>
            <CardDescription>{tripInfo.date}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Route</div>
                <div className="font-bold">{tripInfo.route}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Departure</div>
                <div className="font-medium">{tripInfo.departureTime}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Arrival</div>
                <div className="font-medium">{tripInfo.arrivalTime}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Bus</div>
                <div className="font-medium">{tripInfo.busNumber}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Manifest Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ticket, or seat..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleDownloadManifest}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>

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
        </div>

        {/* Passenger List */}
        <Card>
          <CardHeader>
            <CardTitle>Passenger List</CardTitle>
            <CardDescription>Mark passengers as boarded during check-in</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seat</TableHead>
                  <TableHead>Passenger</TableHead>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Journey</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPassengers.map((passenger) => (
                  <TableRow key={passenger.id}>
                    <TableCell className="font-bold text-lg">{passenger.seatNumber}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{passenger.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Luggage className="h-3 w-3" />
                          {passenger.luggage}
                        </div>
                        {passenger.specialNeeds && (
                          <Badge className="bg-blue-500 mt-1 flex items-center gap-1 w-fit">
                            <AlertCircle className="h-3 w-3" />
                            {passenger.specialNeeds}
                          </Badge>
                        )}
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
                          {passenger.pickup}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-red-500" />
                          {passenger.dropoff}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getBoardingColor(passenger.boardingStatus)}>
                        {passenger.boardingStatus.replace('-', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {passenger.boardingStatus === 'not-boarded' && (
                          <>
                            <Button
                              onClick={() => handleMarkBoarded(passenger.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Board
                            </Button>
                            <Button
                              onClick={() => handleMarkNoShow(passenger.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              No Show
                            </Button>
                          </>
                        )}
                        {passenger.boardingStatus === 'boarded' && (
                          <span className="text-sm text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            Checked In
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DriverLayout>
  );
}
