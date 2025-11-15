import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import TicketingLayout from '@/components/ticketing/TicketingLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Users, 
  Search, 
  Download, 
  FileText,
  RefreshCw,
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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function PassengerManifest() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : TicketingLayout;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrip, setSelectedTrip] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch today's trips for dropdown
  const { data: trips = [] } = useQuery({
    queryKey: ['todays-trips-manifest'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          route:routes(*),
          bus:buses(*)
        `)
        .gte('departure_time', `${today}T00:00:00`)
        .lte('departure_time', `${today}T23:59:59`)
        .in('status', ['SCHEDULED', 'BOARDING', 'DEPARTED'])
        .order('departure_time');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch manifest for selected trip
  const { data: manifestData, isLoading, refetch } = useQuery({
    queryKey: ['passenger-manifest', selectedTrip],
    queryFn: async () => {
      if (!selectedTrip) return null;

      // Get trip details
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select(`
          *,
          route:routes(*),
          bus:buses(*),
          driver:drivers(*)
        `)
        .eq('id', selectedTrip)
        .single();

      if (tripError) throw tripError;

      // Get passengers with check-in status
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          passenger:profiles(*),
          checkin:checkin_records(*)
        `)
        .eq('trip_id', selectedTrip)
        .in('status', ['confirmed', 'checked_in'])
        .order('seat_number');

      if (bookingsError) throw bookingsError;

      return { passengers: bookings || [], trip };
    },
    enabled: !!selectedTrip,
  });

  const passengers = manifestData?.passengers || [];
  const tripDetails = manifestData?.trip || null;

  const getStatusBadge = (passenger: any) => {
    const checkin = passenger.checkin?.[0];
    if (!checkin) return <Badge variant="outline">Not Checked In</Badge>;
    
    switch (checkin.boarding_status) {
      case 'checked_in':
        return <Badge className="bg-blue-500">Checked In</Badge>;
      case 'boarded':
        return <Badge className="bg-green-500">Boarded</Badge>;
      case 'no_show':
        return <Badge variant="destructive">No Show</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleDownloadPDF = () => {
    if (!tripDetails || passengers.length === 0) {
      toast.error('No data to export');
      return;
    }

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text('Passenger Manifest', 14, 20);
    
    // Trip details
    doc.setFontSize(10);
    doc.text(`Route: ${tripDetails.route?.route_name}`, 14, 30);
    doc.text(`From: ${tripDetails.route?.origin_city} To: ${tripDetails.route?.destination_city}`, 14, 36);
    doc.text(`Departure: ${new Date(tripDetails.departure_time).toLocaleString()}`, 14, 42);
    doc.text(`Bus: ${tripDetails.bus?.registration_number} (${tripDetails.bus?.seating_capacity} seats)`, 14, 48);
    doc.text(`Driver: ${tripDetails.driver?.full_name}`, 14, 54);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 60);

    // Table
    const tableData = passengers.map((p: any) => [
      p.seat_number,
      p.ticket_number,
      p.passenger_name,
      p.passenger_phone,
      p.checkin?.[0]?.boarding_status || 'Not Checked In',
      `P ${parseFloat(p.total_amount).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['Seat', 'Ticket #', 'Passenger', 'Phone', 'Status', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 },
    });

    // Summary
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Total Passengers: ${passengers.length}`, 14, finalY);
    doc.text(`Total Revenue: P ${passengers.reduce((sum: number, p: any) => sum + parseFloat(p.total_amount || 0), 0).toFixed(2)}`, 14, finalY + 6);

    doc.save(`manifest-${tripDetails.route?.route_name}-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF downloaded successfully');
  };

  const handleDownloadExcel = () => {
    if (!tripDetails || passengers.length === 0) {
      toast.error('No data to export');
      return;
    }

    const excelData = passengers.map((p: any) => ({
      'Seat': p.seat_number,
      'Ticket Number': p.ticket_number,
      'Passenger Name': p.passenger_name,
      'Phone': p.passenger_phone,
      'Email': p.passenger_email || 'N/A',
      'Status': p.checkin?.[0]?.boarding_status || 'Not Checked In',
      'Check-In Time': p.checkin?.[0]?.checkin_time ? new Date(p.checkin[0].checkin_time).toLocaleString() : 'N/A',
      'Amount': parseFloat(p.total_amount).toFixed(2),
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Manifest');
    
    XLSX.writeFile(wb, `manifest-${tripDetails.route?.route_name}-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel file downloaded successfully');
  };

  // Filter passengers based on search and status
  const filteredPassengers = passengers.filter((passenger: any) => {
    const matchesSearch = !searchTerm || 
      passenger.passenger_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      passenger.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      passenger.passenger_phone?.includes(searchTerm);
    
    const checkinStatus = passenger.checkin?.[0]?.boarding_status;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'checked_in' && checkinStatus === 'checked_in') ||
      (filterStatus === 'boarded' && checkinStatus === 'boarded') ||
      (filterStatus === 'no_show' && checkinStatus === 'no_show') ||
      (filterStatus === 'not_checked_in' && !checkinStatus);
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: passengers.length,
    checkedIn: passengers.filter((p: any) => p.checkin?.[0]?.boarding_status === 'checked_in').length,
    boarded: passengers.filter((p: any) => p.checkin?.[0]?.boarding_status === 'boarded').length,
    noShow: passengers.filter((p: any) => p.checkin?.[0]?.boarding_status === 'no_show').length,
    notCheckedIn: passengers.filter((p: any) => !p.checkin || p.checkin.length === 0).length,
  };

  return (
    <Layout>
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
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Trip Selection */}
                <div>
                  <Label>Select Trip</Label>
                  <Select value={selectedTrip} onValueChange={setSelectedTrip}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a trip" />
                    </SelectTrigger>
                    <SelectContent>
                      {trips.map((trip: any) => (
                        <SelectItem key={trip.id} value={trip.id}>
                          {trip.route?.route_name} - {new Date(trip.departure_time).toLocaleTimeString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div>
                  <Label>Filter by Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Passengers</SelectItem>
                      <SelectItem value="checked_in">Checked In</SelectItem>
                      <SelectItem value="boarded">Boarded</SelectItem>
                      <SelectItem value="no_show">No Show</SelectItem>
                      <SelectItem value="not_checked_in">Not Checked In</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, ticket, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Action Buttons */}
                <Button onClick={() => refetch()} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={handleDownloadPDF} disabled={!selectedTrip || passengers.length === 0}>
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button onClick={handleDownloadExcel} disabled={!selectedTrip || passengers.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trip Details & Stats */}
        {tripDetails && (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Selected Trip</p>
                    <p className="text-xl font-bold">
                      {tripDetails.route?.origin_city} → {tripDetails.route?.destination_city}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(tripDetails.departure_time).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Capacity</p>
                    <p className="text-2xl font-bold">{passengers.length} / {tripDetails.bus?.seating_capacity}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid md:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">Passengers</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Checked In</CardTitle>
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.checkedIn}</div>
                  <p className="text-xs text-muted-foreground">Ready</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Boarded</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.boarded}</div>
                  <p className="text-xs text-muted-foreground">On Bus</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">No Show</CardTitle>
                  <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.noShow}</div>
                  <p className="text-xs text-muted-foreground">Absent</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Users className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.notCheckedIn}</div>
                  <p className="text-xs text-muted-foreground">Not Checked</p>
                </CardContent>
              </Card>
            </div>
          </>
        )}

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
                    <TableCell className="font-medium font-mono">{booking.seat_number}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{booking.passenger_name}</div>
                        <div className="text-sm text-muted-foreground">{booking.passenger?.id_number || 'N/A'}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-mono">{booking.ticket_number}</TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {booking.passenger_phone}
                        </div>
                        {booking.passenger_email && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {booking.passenger_email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Luggage className="h-3 w-3" />
                        0 bags
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-500">Paid</Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(booking)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>
    </Layout>
  );
}
