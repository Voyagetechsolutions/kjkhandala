import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import TicketingLayout from '@/components/ticketing/TicketingLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Printer, Edit, User, Calendar, MapPin } from 'lucide-react';

export default function FindTicket() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['find-ticket', searchQuery],
    queryFn: async () => {
      if (!searchQuery) return null;
      const response = await api.get('/ticketing/find-ticket', { params: { search: searchQuery } });
      return response.data;
    },
    enabled: !!searchQuery,
  });

  const handleSearch = () => {
    setSearchQuery(searchTerm);
  };

  const handlePrint = (booking: any) => {
    console.log('Print ticket:', booking.ticketNumber);
    window.print();
  };

  return (
    <TicketingLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Find Ticket</h1>
          <p className="text-muted-foreground">Search by ticket number, name, ID, or phone number</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search Tickets</CardTitle>
            <CardDescription>Enter ticket number, passenger name, ID, or phone number</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={!searchTerm.trim()}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading && (
          <Card>
            <CardContent className="py-12 text-center">
              <p>Searching...</p>
            </CardContent>
          </Card>
        )}

        {data && data.bookings && data.bookings.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tickets found</p>
              <p className="text-sm">Try a different search term</p>
            </CardContent>
          </Card>
        )}

        {data && data.bookings && data.bookings.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Found {data.bookings.length} ticket(s)</p>
            {data.bookings.map((booking: any) => (
              <Card key={booking.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-2xl font-bold">{booking.ticketNumber}</p>
                      <Badge variant={booking.bookingStatus === 'CONFIRMED' ? 'default' : 'secondary'} className="mt-1">
                        {booking.bookingStatus}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handlePrint(booking)}>
                        <Printer className="h-4 w-4 mr-1" />
                        Print
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Modify
                      </Button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Passenger</p>
                          <p className="font-medium">
                            {booking.passenger?.firstName} {booking.passenger?.lastName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Route</p>
                          <p className="font-medium">
                            {booking.trip?.route?.origin} → {booking.trip?.route?.destination}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Departure</p>
                          <p className="font-medium">
                            {new Date(booking.trip?.departureTime).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Seat</p>
                        <p className="font-medium">{booking.seatNumber}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Status</p>
                      <Badge className="bg-green-500 mt-1">{booking.paymentStatus}</Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Paid</p>
                      <p className="text-lg font-bold">P {booking.totalPrice}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </TicketingLayout>
  );
}
