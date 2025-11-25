import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import OperationsLayout from '@/components/operations/OperationsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, 
  Bus, 
  Download, 
  FileText,
  Search,
  ClipboardList
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Booking {
  id: string;
  booking_reference: string;
  passenger_name: string;
  passenger_phone: string;
  passenger_email: string | null;
  passenger_id_number: string | null;
  seat_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
}

interface Trip {
  id: string;
  trip_number: string;
  scheduled_departure: string;
  scheduled_arrival: string;
  status: string;
  routes: {
    origin: string;
    destination: string;
  } | null;
  buses: {
    registration_number: string;
    name: string;
  } | null;
}

export default function PassengerManifest() {
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all trips with route and bus data
  const { data: trips, isLoading } = useQuery({
    queryKey: ['manifest-trips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          id,
          trip_number,
          scheduled_departure,
          scheduled_arrival,
          status,
          routes (origin, destination),
          buses (registration_number, name)
        `)
        .in('status', ['SCHEDULED', 'BOARDING', 'DEPARTED', 'COMPLETED'])
        .order('scheduled_departure', { ascending: false })
        .limit(100);
      if (error) throw error;
      // Transform the data to handle Supabase's array response
      return (data || []).map(trip => ({
        ...trip,
        routes: Array.isArray(trip.routes) ? trip.routes[0] : trip.routes,
        buses: Array.isArray(trip.buses) ? trip.buses[0] : trip.buses,
      })) as Trip[];
    },
  });

  // Fetch bookings for selected trip
  const { data: bookings, isLoading: isBookingsLoading } = useQuery({
    queryKey: ['trip-bookings', selectedTrip],
    queryFn: async () => {
      if (!selectedTrip) return [];
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('trip_id', selectedTrip)
        .in('payment_status', ['completed', 'paid'])
        .order('seat_number');
      if (error) throw error;
      return data as Booking[];
    },
    enabled: !!selectedTrip,
  });

  // Get selected trip data
  const selectedTripData = trips?.find(t => t.id === selectedTrip);

  // Download CSV function
  const handleDownloadCSV = () => {
    if (!selectedTrip || !bookings || bookings.length === 0) {
      toast.error('No passengers to download');
      return;
    }

    const selectedTripData = trips?.find(t => t.id === selectedTrip);
    if (!selectedTripData) return;

    // Create CSV content
    const headers = [
      'Seat Number',
      'Passenger Name',
      'ID Number',
      'Phone',
      'Email',
      'Booking Reference',
      'Status',
      'Payment Status'
    ];

    const rows = bookings.map(booking => [
      booking.seat_number || '',
      booking.passenger_name || '',
      booking.passenger_id_number || 'N/A',
      booking.passenger_phone || '',
      booking.passenger_email || '',
      booking.booking_reference || '',
      booking.status || '',
      booking.payment_status || ''
    ]);

    const csvContent = [
      // Title
      [`Passenger Manifest - ${selectedTripData.routes?.origin || 'N/A'} to ${selectedTripData.routes?.destination || 'N/A'}`],
      [`Trip Number: ${selectedTripData.trip_number}`],
      [`Departure: ${format(new Date(selectedTripData.scheduled_departure), 'PPpp')}`],
      [`Bus: ${selectedTripData.buses?.registration_number || selectedTripData.buses?.name || 'N/A'}`],
      [`Total Passengers: ${bookings.length}`],
      [],
      headers,
      ...rows
    ]
      .map(row => row.join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `manifest_${selectedTripData.trip_number}_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Manifest downloaded successfully');
  };

  // Filter trips based on search
  const filteredTrips = trips?.filter((trip) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      trip.routes?.origin?.toLowerCase().includes(searchLower) ||
      trip.routes?.destination?.toLowerCase().includes(searchLower) ||
      trip.buses?.registration_number?.toLowerCase().includes(searchLower) ||
      trip.trip_number?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-500';
      case 'BOARDING': return 'bg-yellow-500';
      case 'DEPARTED': return 'bg-green-500';
      case 'COMPLETED': return 'bg-gray-500';
      case 'CANCELLED': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getBookingStatusColor = (status: string) => {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case 'CONFIRMED': return 'bg-green-500';
      case 'CHECKED_IN': return 'bg-blue-500';
      case 'PENDING': return 'bg-yellow-500';
      case 'CANCELLED': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'completed':
      case 'paid': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  if (isLoading) {
    return (
      <OperationsLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading manifests...</div>
        </div>
      </OperationsLayout>
    );
  }

  return (
    <OperationsLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Passenger Manifests</h1>
          <p className="text-muted-foreground">View and download trip passenger manifests</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
              <Bus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trips?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Available trips</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Selected Trip Passengers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookings?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Confirmed bookings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With ID Numbers</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bookings?.filter(b => b.passenger_id_number).length || 0}
              </div>
              <p className="text-xs text-muted-foreground">ID verification</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by route, bus, or trip number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Trips List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Select Trip
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trip Number</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Bus</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrips?.map((trip) => (
                    <TableRow 
                      key={trip.id}
                      className={selectedTrip === trip.id ? 'bg-muted' : ''}
                    >
                      <TableCell className="font-medium">{trip.trip_number}</TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {format(new Date(trip.scheduled_departure), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(trip.scheduled_departure), 'HH:mm')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{trip.routes?.origin || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">
                          to {trip.routes?.destination || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {trip.buses?.registration_number || trip.buses?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(trip.status)} text-white`}>
                          {trip.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={selectedTrip === trip.id ? 'default' : 'outline'}
                          onClick={() => setSelectedTrip(trip.id)}
                        >
                          View Manifest
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Selected Trip Manifest */}
        {selectedTrip && selectedTripData && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Passenger Manifest
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedTripData.routes?.origin || 'N/A'} → {selectedTripData.routes?.destination || 'N/A'}
                </p>
              </div>
              <Button
                onClick={handleDownloadCSV}
                disabled={!bookings || bookings.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Trip Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Trip Number</p>
                    <p className="font-medium">{selectedTripData.trip_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Departure</p>
                    <p className="font-medium">
                      {format(new Date(selectedTripData.scheduled_departure), 'PPp')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bus</p>
                    <p className="font-medium">
                      {selectedTripData.buses?.registration_number || selectedTripData.buses?.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Passengers</p>
                    <p className="font-medium text-lg">{bookings?.length || 0}</p>
                  </div>
                </div>

                {/* Passengers Table */}
                {isBookingsLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading passengers...</p>
                  </div>
                ) : bookings && bookings.length > 0 ? (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Seat</TableHead>
                          <TableHead>Passenger Name</TableHead>
                          <TableHead>ID Number</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Booking Ref</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Payment</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell className="font-medium">{booking.seat_number}</TableCell>
                            <TableCell>{booking.passenger_name}</TableCell>
                            <TableCell>
                              {booking.passenger_id_number ? (
                                <span className="font-mono text-sm">{booking.passenger_id_number}</span>
                              ) : (
                                <span className="text-muted-foreground text-sm">Not provided</span>
                              )}
                            </TableCell>
                            <TableCell>{booking.passenger_phone}</TableCell>
                            <TableCell className="text-sm">
                              {booking.passenger_email || <span className="text-muted-foreground">N/A</span>}
                            </TableCell>
                            <TableCell className="font-mono text-sm">{booking.booking_reference}</TableCell>
                            <TableCell>
                              <Badge className={`${getBookingStatusColor(booking.status)} text-white`}>
                                {booking.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getPaymentStatusColor(booking.payment_status)} text-white`}>
                                {booking.payment_status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No passengers found for this trip</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </OperationsLayout>
  );
}
