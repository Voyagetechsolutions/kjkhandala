import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import TicketingLayout from '@/components/ticketing/TicketingLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, XCircle, DollarSign, AlertCircle, CheckCircle2, Loader2, ArrowLeft 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CancelRefund() {
  const { user, userRoles, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : TicketingLayout;

  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [refundData, setRefundData] = useState({
    reason: '',
    cancellation_charge: 0,
    refund_method: 'cash',
  });

  useEffect(() => {
    // Check if booking reference was passed
    const bookingRef = sessionStorage.getItem('bookingReference');
    if (bookingRef) {
      setSearchTerm(bookingRef);
      searchBooking(bookingRef);
    }
  }, []);

  const searchBooking = async (ref?: string) => {
    const searchRef = ref || searchTerm;
    if (!searchRef) {
      toast({
        variant: 'destructive',
        title: 'Enter booking reference',
        description: 'Please enter a booking reference',
      });
      return;
    }

    try {
      setSearching(true);

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          trips (
            trip_number,
            departure_time,
            routes (origin, destination)
          ),
          passengers (full_name, phone)
        `)
        .eq('booking_reference', searchRef)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            title: 'Not found',
            description: 'No booking found with this reference',
          });
        } else {
          throw error;
        }
        return;
      }

      // Check if already cancelled
      if (data.status === 'cancelled') {
        toast({
          variant: 'destructive',
          title: 'Already cancelled',
          description: 'This booking has already been cancelled',
        });
        return;
      }

      setBooking(data);

      // Calculate cancellation charge (example: 10% of total)
      const charge = data.total_amount * 0.1;
      setRefundData({ ...refundData, cancellation_charge: charge });

    } catch (error: any) {
      console.error('Error searching booking:', error);
      toast({
        variant: 'destructive',
        title: 'Search failed',
        description: error.message,
      });
    } finally {
      setSearching(false);
    }
  };

  const processRefund = async () => {
    if (!refundData.reason) {
      toast({
        variant: 'destructive',
        title: 'Missing reason',
        description: 'Please provide a cancellation reason',
      });
      return;
    }

    try {
      setProcessing(true);

      // Get agent ID
      const { data: agentData } = await supabase
        .from('ticketing_agents')
        .select('id')
        .eq('profile_id', user?.id)
        .single();

      const refundAmount = booking.amount_paid;
      const netRefund = refundAmount - refundData.cancellation_charge;

      // Create refund record
      const { error: refundError } = await supabase
        .from('booking_refunds')
        .insert({
          booking_id: booking.id,
          refund_amount: refundAmount,
          cancellation_charge: refundData.cancellation_charge,
          net_refund: netRefund,
          refund_reason: refundData.reason,
          refund_method: refundData.refund_method,
          requested_by: agentData?.id,
          status: 'pending', // Requires approval
        });

      if (refundError) throw refundError;

      // Update booking status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_date: new Date().toISOString(),
          cancellation_reason: refundData.reason,
          cancelled_by: agentData?.id,
        })
        .eq('id', booking.id);

      if (updateError) throw updateError;

      // Update seat status
      const { error: seatError } = await supabase
        .from('booking_seats')
        .update({ status: 'cancelled' })
        .eq('booking_id', booking.id);

      if (seatError) throw seatError;

      toast({
        title: 'Refund requested',
        description: 'Cancellation and refund request submitted for approval',
      });

      // Clear and navigate
      sessionStorage.removeItem('bookingReference');
      navigate('/ticketing');

    } catch (error: any) {
      console.error('Error processing refund:', error);
      toast({
        variant: 'destructive',
        title: 'Refund failed',
        description: error.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const netRefund = booking ? booking.amount_paid - refundData.cancellation_charge : 0;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">❌ Cancel & Refund</h1>
            <p className="text-muted-foreground">Process booking cancellations and refund requests</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate(isAdminRoute ? '/admin/ticketing' : '/ticketing')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Search */}
        {!booking && (
          <Card>
            <CardHeader>
              <CardTitle>Search Booking</CardTitle>
              <CardDescription>Enter booking reference to cancel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., BK-20241115-A3F9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchBooking()}
                />
                <Button onClick={() => searchBooking()} disabled={searching}>
                  <Search className="h-4 w-4 mr-2" />
                  {searching ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Booking Details */}
        {booking && (
          <>
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-orange-900">Warning</h3>
                    <p className="text-sm text-orange-700">
                      This action will cancel the booking and initiate a refund request.
                      This cannot be undone.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Booking Details</CardTitle>
                    <CardDescription>Reference: {booking.booking_reference}</CardDescription>
                  </div>
                  <Badge variant="default">{booking.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Passenger:</span>
                    <p className="font-medium">{booking.passengers?.full_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <p className="font-medium">{booking.passengers?.phone}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Route:</span>
                    <p className="font-medium">
                      {booking.trips?.routes?.origin} → {booking.trips?.routes?.destination}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Departure:</span>
                    <p className="font-medium">
                      {new Date(booking.trips?.departure_time).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cancellation Details</CardTitle>
                <CardDescription>Provide reason and refund information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reason">
                    Cancellation Reason <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="reason"
                    placeholder="e.g., Customer requested cancellation, Trip cancelled, etc."
                    value={refundData.reason}
                    onChange={(e) => setRefundData({ ...refundData, reason: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="refund_method">Refund Method</Label>
                  <select
                    id="refund_method"
                    className="w-full p-2 border rounded"
                    value={refundData.refund_method}
                    onChange={(e) => setRefundData({ ...refundData, refund_method: e.target.value })}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="wallet">Wallet Credit</option>
                  </select>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Refund Calculation
                  </h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount Paid:</span>
                      <span className="font-medium">P {booking.amount_paid?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cancellation Charge (10%):</span>
                      <span className="font-medium text-red-600">
                        - P {refundData.cancellation_charge.toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Net Refund:</span>
                      <span className="text-green-600">P {netRefund.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> This refund request will be sent for supervisor approval.
                    The customer will be notified once approved.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={processRefund}
                    variant="destructive"
                    className="flex-1"
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel & Request Refund
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setBooking(null);
                      setSearchTerm('');
                      sessionStorage.removeItem('bookingReference');
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}
