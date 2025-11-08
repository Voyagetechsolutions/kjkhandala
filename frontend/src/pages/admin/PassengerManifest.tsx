import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, 
  Bus, 
  CheckCircle, 
  XCircle, 
  Download, 
  FileSpreadsheet,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function PassengerManifest() {
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'SCHEDULED' | 'DEPARTED' | 'COMPLETED'>('all');
  const queryClient = useQueryClient();

  // Fetch all trips with manifest data
  const { data: trips, isLoading } = useQuery({
    queryKey: ['manifest-trips', filterStatus],
    queryFn: async () => {
      const params = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const response = await api.get(`/trips${params}`);
      return response.data.data || [];
    },
  });

  // Generate manifest mutation
  const generateManifestMutation = useMutation({
    mutationFn: async (tripId: string) => {
      await api.post(`/manifests/${tripId}/generate`);
    },
    onSuccess: () => {
      toast.success('Manifest generated successfully');
      queryClient.invalidateQueries({ queryKey: ['manifests'] });
    },
  });

  // Download CSV
  const handleDownloadCSV = (tripId: string) => {
    window.open(`http://localhost:3001/api/manifests/${tripId}/export?format=csv`, '_blank');
    toast.success('Downloading manifest...');
  };

  // Fetch manifest for selected trip
  const { data: manifest } = useQuery({
    queryKey: ['manifest', selectedTrip],
    queryFn: async () => {
      if (!selectedTrip) return null;
      const response = await api.get(`/manifests/${selectedTrip}`);
      return response.data.data;
    },
    enabled: !!selectedTrip,
  });

  // Fetch passengers for selected trip
  const { data: passengers } = useQuery({
    queryKey: ['manifest-passengers', selectedTrip],
    queryFn: async () => {
      if (!selectedTrip) return [];
      const response = await api.get(`/bookings?tripId=${selectedTrip}`);
      return response.data.data || [];
    },
    enabled: !!selectedTrip,
  });

  // Filter trips based on search
  const filteredTrips = trips?.filter((trip: any) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      trip.route?.origin?.toLowerCase().includes(searchLower) ||
      trip.route?.destination?.toLowerCase().includes(searchLower) ||
      trip.bus?.registrationNumber?.toLowerCase().includes(searchLower)
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
    switch (status) {
      case 'CONFIRMED': return 'bg-green-500';
      case 'CHECKED_IN': return 'bg-blue-500';
      case 'PENDING': return 'bg-yellow-500';
      case 'CANCELLED': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading manifests...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Passenger Manifests</h1>
            <p className="text-muted-foreground">Generate and manage trip manifests</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
              <Bus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trips?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {trips?.filter((t: any) => t.status === 'SCHEDULED').length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Transit</CardTitle>
              <Bus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {trips?.filter((t: any) => t.status === 'DEPARTED').length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {trips?.filter((t: any) => t.status === 'COMPLETED').length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <Input
            placeholder="Search by route or bus..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Tabs value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="SCHEDULED">Scheduled</TabsTrigger>
              <TabsTrigger value="DEPARTED">Departed</TabsTrigger>
              <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Trips List */}
        <Card>
          <CardHeader>
            <CardTitle>Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Bus</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Passengers</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrips?.map((trip: any) => (
                  <TableRow key={trip.id}>
                    <TableCell>
                      <div className="font-medium">
                        {trip.departureDate ? format(new Date(trip.departureDate), 'MMM dd, yyyy') : 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {trip.departureDate ? format(new Date(trip.departureDate), 'HH:mm') : ''}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{trip.route?.origin || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">
                        to {trip.route?.destination || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>{trip.bus?.registrationNumber || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(trip.status)} text-white`}>
                        {trip.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{trip._count?.bookings || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTrip(trip.id);
                            generateManifestMutation.mutate(trip.id);
                          }}
                        >
                          Generate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadCSV(trip.id)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          CSV
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Selected Trip Manifest */}
        {selectedTrip && manifest && (
          <Card>
            <CardHeader>
              <CardTitle>Manifest Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Route</p>
                    <p className="font-medium">{manifest.route}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bus</p>
                    <p className="font-medium">{manifest.bus}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Departure</p>
                    <p className="font-medium">{manifest.departureTime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Passengers</p>
                    <p className="font-medium">{manifest.totalPassengers}</p>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Seat</TableHead>
                      <TableHead>Passenger Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {passengers?.map((passenger: any) => (
                      <TableRow key={passenger.id}>
                        <TableCell>{passenger.seatNumber}</TableCell>
                        <TableCell>{passenger.passengerName}</TableCell>
                        <TableCell>{passenger.passengerPhone}</TableCell>
                        <TableCell>
                          <Badge className={`${getBookingStatusColor(passenger.status)} text-white`}>
                            {passenger.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
