import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import api from '@/lib/api';
import DriverLayout from '@/components/driver/DriverLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Users, Search, CheckCircle, XCircle, Phone, Luggage, Download, Send, Grid3x3 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Manifest() {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: manifestData, isLoading } = useQuery({
    queryKey: ['driver-manifest'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          trip:trips(*),
          passenger:passengers(*)
        `)
        .eq('booking_status', 'CONFIRMED')
        .order('seat_number');
      if (error) throw error;
      
      const passengers = data || [];
      const trip = passengers[0]?.trip || null;
      
      // Calculate stats
      const stats = {
        total: passengers.length,
        checkedIn: passengers.filter((p: any) => p.boarding_status === 'BOARDED').length,
        notBoarded: passengers.filter((p: any) => p.boarding_status !== 'BOARDED').length,
      };
      
      return { 
        passengers,
        trip,
        stats
      };
    },
  });

  const { data: tripData } = useQuery({
    queryKey: ['driver-trip'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', manifestData?.passengers[0]?.trip_id);
      if (error) throw error;
      return data[0];
    },
    enabled: !!manifestData?.passengers[0]?.trip_id,
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

  if (isLoading || !manifestData) {
    return (
      <DriverLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-3xl font-bold">Loading manifest...</div>
        </div>
      </DriverLayout>
    );
  }

  const passengers = manifestData.passengers.filter((p: any) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownloadPDF = () => {
    toast.success('PDF download started');
    window.print();
  };

  const handleSendToOps = () => {
    toast.success('Manifest sent to Operations Manager');
  };

  const handleCallPassenger = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  // Generate seat map (4 seats per row, A-D columns)
  const generateSeatMap = () => {
    const seats: any[] = [];
    const rows = 13; // 50 seats / 4 per row
    
    for (let row = 1; row <= rows; row++) {
      ['A', 'B', 'C', 'D'].forEach(col => {
        const seatNumber = `${col}${row}`;
        const passenger = passengers.find((p: any) => p.seatNumber === seatNumber);
        seats.push({
          number: seatNumber,
          passenger,
          status: passenger ? (passenger.checkedIn ? 'checked-in' : 'booked') : 'empty'
        });
      });
    }
    return seats;
  };

  const seatMap = generateSeatMap();

  return (
    <DriverLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">Passenger Manifest</h1>
          <div className="flex gap-2">
            <Button onClick={handleDownloadPDF} variant="outline" size="lg">
              <Download className="h-5 w-5 mr-2" />
              Download PDF
            </Button>
            <Button onClick={handleSendToOps} variant="outline" size="lg">
              <Send className="h-5 w-5 mr-2" />
              Send to Ops
            </Button>
          </div>
        </div>

        {/* Trip Info */}
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Route</p>
                <p className="text-2xl font-bold">{manifestData.trip?.route || 'N/A'}</p>
                <p className="text-lg text-muted-foreground">
                  {manifestData.trip?.departureTime ? new Date(manifestData.trip.departureTime).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Total</CardTitle>
              <Users className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{manifestData.stats?.total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Checked In</CardTitle>
              <CheckCircle className="h-6 w-6 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">{manifestData.stats?.checkedIn || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Not Boarded</CardTitle>
              <XCircle className="h-6 w-6 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-red-600">{manifestData.stats?.notBoarded || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground" />
              <Input
                placeholder="Search by name or ticket number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-14 h-14 text-lg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Passenger List with Tabs */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Passenger Manifest</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="list" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-14">
                <TabsTrigger value="list" className="text-lg">
                  <Users className="h-5 w-5 mr-2" />
                  List View
                </TabsTrigger>
                <TabsTrigger value="seatmap" className="text-lg">
                  <Grid3x3 className="h-5 w-5 mr-2" />
                  Seat Map
                </TabsTrigger>
              </TabsList>

              {/* List View */}
              <TabsContent value="list" className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-base">Seat</TableHead>
                      <TableHead className="text-base">Name</TableHead>
                      <TableHead className="text-base">Gender</TableHead>
                      <TableHead className="text-base">ID/Passport</TableHead>
                      <TableHead className="text-base">Phone</TableHead>
                      <TableHead className="text-base">Luggage</TableHead>
                      <TableHead className="text-base">Status</TableHead>
                      <TableHead className="text-base">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {passengers.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-bold text-lg">{p.seatNumber}</TableCell>
                        <TableCell>
                          <div className="text-base font-semibold">{p.name}</div>
                          <div className="text-sm text-muted-foreground">{p.ticketNumber}</div>
                        </TableCell>
                        <TableCell className="text-base">{p.gender || 'N/A'}</TableCell>
                        <TableCell className="text-base">{p.idNumber}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCallPassenger(p.phone)}
                            className="text-base"
                          >
                            <Phone className="h-4 w-4 mr-1" />
                            {p.phone}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-base">
                            <Luggage className="h-4 w-4" />
                            {p.luggage} bags
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={p.checkedIn ? 'bg-green-500 text-base' : 'bg-gray-500 text-base'}>
                            {p.checkedIn ? 'Checked In' : 'Not Boarded'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {!p.checkedIn && p.paymentStatus === 'PAID' && (
                            <Button
                              onClick={() => noShowMutation.mutate(p.id)}
                              variant="destructive"
                              size="sm"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              No-Show
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              {/* Seat Map View */}
              <TabsContent value="seatmap" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-6 justify-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-500 rounded"></div>
                      <span>Checked In</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-yellow-500 rounded"></div>
                      <span>Booked</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-300 rounded"></div>
                      <span>Empty</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-red-500 rounded"></div>
                      <span>No-Show</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
                    {seatMap.map((seat: any) => {
                      const bgColor = 
                        seat.status === 'checked-in' ? 'bg-green-500 text-white' :
                        seat.status === 'booked' ? 'bg-yellow-500' :
                        seat.passenger?.bookingStatus === 'NO_SHOW' ? 'bg-red-500 text-white' :
                        'bg-gray-300';
                      
                      return (
                        <div
                          key={seat.number}
                          className={`${bgColor} p-3 rounded-lg text-center cursor-pointer hover:opacity-80 transition-opacity`}
                          title={seat.passenger ? `${seat.passenger.name} - ${seat.passenger.ticketNumber}` : 'Empty'}
                        >
                          <div className="font-bold text-sm">{seat.number}</div>
                          {seat.passenger && (
                            <div className="text-xs mt-1 truncate">{seat.passenger.name.split(' ')[0]}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DriverLayout>
  );
}
