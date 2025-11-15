import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import TicketingLayout from '@/components/ticketing/TicketingLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Search, User, Briefcase, CreditCard, AlertCircle } from 'lucide-react';

export default function CheckIn() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : TicketingLayout;
  const queryClient = useQueryClient();
  const [ticketNumber, setTicketNumber] = useState('');
  const [checkInResult, setCheckInResult] = useState<any>(null);
  const [error, setError] = useState('');

  const checkInMutation = useMutation({
    mutationFn: async (ticketNum: string) => {
      const { error } = await supabase
        .from('bookings')
        .update({ check_in_status: 'CHECKED_IN', checked_in_at: new Date().toISOString() })
        .eq('booking_reference', ticketNum);
      if (error) throw error;
      const response = await supabase
        .from('bookings')
        .select('*, passenger(*)')
        .eq('booking_reference', ticketNum);
      return response.data[0];
    },
    onSuccess: (data) => {
      setCheckInResult(data);
      setError('');
      queryClient.invalidateQueries({ queryKey: ['ticketing-dashboard'] });
      toast.success('Passenger checked in successfully!');
    },
    onError: (err: any) => {
      const errorMsg = err.response?.data?.error || 'Check-in failed';
      setError(errorMsg);
      setCheckInResult(null);
      toast.error(errorMsg);
    },
  });

  const handleCheckIn = () => {
    if (!ticketNumber.trim()) {
      toast.error('Please enter ticket number');
      return;
    }
    checkInMutation.mutate(ticketNumber);
  };

  const handleReset = () => {
    setTicketNumber('');
    setCheckInResult(null);
    setError('');
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Passenger Check-In</h1>
          <p className="text-muted-foreground">Scan QR code or enter ticket number manually</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Check-In System</CardTitle>
            <CardDescription>Validate and check-in passengers for their trip</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Ticket Number Input */}
            <div className="space-y-2">
              <Label>Ticket Number</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter or scan ticket number..."
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCheckIn()}
                  disabled={checkInMutation.isPending}
                />
                <Button onClick={handleCheckIn} disabled={checkInMutation.isPending || !ticketNumber.trim()}>
                  <Search className="h-4 w-4 mr-2" />
                  {checkInMutation.isPending ? 'Checking...' : 'Check-In'}
                </Button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Display */}
            {checkInResult && (
              <div className="space-y-4 border-2 border-green-200 bg-green-50 p-6 rounded-lg">
                <div className="flex items-center justify-center">
                  <CheckCircle2 className="h-16 w-16 text-green-500" />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-green-700">Check-In Successful!</h3>
                  <p className="text-muted-foreground">Passenger has been checked in</p>
                </div>

                {/* Passenger Details */}
                <div className="bg-white p-4 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Passenger Name</p>
                      <p className="font-medium">
                        {checkInResult.passenger?.firstName} {checkInResult.passenger?.lastName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Ticket Number</p>
                      <p className="font-medium">{checkInResult.ticketNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Seat Number</p>
                      <p className="font-medium">{checkInResult.seatNumber}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Route</p>
                      <p className="font-medium text-sm">
                        {checkInResult.trip?.route?.origin} → {checkInResult.trip?.route?.destination}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Departure</p>
                      <p className="font-medium text-sm">
                        {new Date(checkInResult.trip?.departureTime).toLocaleTimeString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Status</p>
                      <Badge className="bg-green-500">{checkInResult.paymentStatus}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Luggage</p>
                      <p className="font-medium text-sm">{checkInResult.luggage || 0} bags</p>
                    </div>
                  </div>
                </div>

                <Button onClick={handleReset} className="w-full">
                  Check-In Another Passenger
                </Button>
              </div>
            )}

            {/* Instructions */}
            {!checkInResult && !error && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Ready to Check-In</p>
                <p className="text-sm">Enter ticket number or scan QR code to begin</p>
                <div className="mt-4 text-sm">
                  <p className="font-medium mb-2">System will validate:</p>
                  <ul className="space-y-1">
                    <li>✓ Ticket exists and is valid</li>
                    <li>✓ Payment has been completed</li>
                    <li>✓ Ticket is not cancelled</li>
                    <li>✓ Passenger not already checked in</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">-</p>
              <p className="text-xs text-muted-foreground">Checked In Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <User className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">-</p>
              <p className="text-xs text-muted-foreground">Pending Check-In</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <XCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <p className="text-2xl font-bold">-</p>
              <p className="text-xs text-muted-foreground">No-Shows</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
