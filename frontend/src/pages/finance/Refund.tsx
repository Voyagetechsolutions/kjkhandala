import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import FinanceLayout from '@/components/finance/FinanceLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function Refund() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : FinanceLayout;
  const queryClient = useQueryClient();

  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<any>(null);

  const { data: refundRequests = [], isLoading } = useQuery({
    queryKey: ['refund-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('refund_requests')
        .select('*')
        .order('request_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const approveRefund = useMutation({
    mutationFn: async (refundId: string) => {
      const { data, error } = await supabase
        .from('refund_requests')
        .update({
          status: 'approved',
          processed_by: user?.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', refundId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refund-requests'] });
      toast.success('Refund approved');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve refund');
    }
  });

  const rejectRefund = useMutation({
    mutationFn: async (refundId: string) => {
      const { data, error } = await supabase
        .from('refund_requests')
        .update({
          status: 'rejected',
          processed_by: user?.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', refundId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refund-requests'] });
      toast.success('Refund rejected');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject refund');
    }
  });

  const processRefund = useMutation({
    mutationFn: async (refundId: string) => {
      const { data, error } = await supabase
        .from('refund_requests')
        .update({
          status: 'processed',
          processed_by: user?.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', refundId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refund-requests'] });
      toast.success('Refund processed');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to process refund');
    }
  });

  const pendingRequests = refundRequests.filter((r: any) => r.status === 'pending');
  const approvedRefunds = refundRequests.filter((r: any) => r.status === 'approved' || r.status === 'processed');
  const totalRefunded = approvedRefunds.reduce((sum, r: any) => sum + parseFloat(r.refunded_amount || 0), 0);
  const totalPenalties = approvedRefunds.reduce((sum, r: any) => sum + parseFloat(r.penalty_amount || 0), 0);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Refunds & Adjustments</h1>
            <p className="text-muted-foreground">Manage booking refunds and cancellations</p>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</div>
              <p className="text-xs text-muted-foreground">
                P {pendingRequests.reduce((sum, r: any) => sum + parseFloat(r.refunded_amount || 0), 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Refunds</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvedRefunds.length}</div>
              <p className="text-xs text-muted-foreground">Total approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Refunded</CardTitle>
              <DollarSign className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">P {totalRefunded.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Amount returned</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Penalties Collected</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">P {totalPenalties.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Cancellation fees</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Refund Policy</CardTitle>
            <CardDescription>Automated refund calculation based on cancellation timing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg bg-green-50">
                <div className="font-bold text-green-700">More than 7 days</div>
                <div className="text-2xl font-bold text-green-600">100%</div>
                <div className="text-xs text-muted-foreground">Full refund</div>
              </div>
              <div className="p-4 border rounded-lg bg-blue-50">
                <div className="font-bold text-blue-700">3-7 days before</div>
                <div className="text-2xl font-bold text-blue-600">80%</div>
                <div className="text-xs text-muted-foreground">20% penalty</div>
              </div>
              <div className="p-4 border rounded-lg bg-yellow-50">
                <div className="font-bold text-yellow-700">1-3 days before</div>
                <div className="text-2xl font-bold text-yellow-600">50%</div>
                <div className="text-xs text-muted-foreground">50% penalty</div>
              </div>
              <div className="p-4 border rounded-lg bg-red-50">
                <div className="font-bold text-red-700">Less than 24 hours</div>
                <div className="text-2xl font-bold text-red-600">0%</div>
                <div className="text-xs text-muted-foreground">No refund</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Refund Requests</CardTitle>
            <CardDescription>All refund requests and their status</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Booking Ref</TableHead>
                  <TableHead>Passenger</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Travel Date</TableHead>
                  <TableHead>Ticket Amount</TableHead>
                  <TableHead>Refund %</TableHead>
                  <TableHead>Refunded</TableHead>
                  <TableHead>Penalty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : refundRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-muted-foreground">
                      No refund requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  refundRequests.map((refund: any) => (
                    <TableRow key={refund.id}>
                      <TableCell>{new Date(refund.request_date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{refund.booking_reference}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{refund.passenger_name}</div>
                          <div className="text-xs text-muted-foreground">{refund.passenger_phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>{refund.route}</TableCell>
                      <TableCell>{refund.travel_date}</TableCell>
                      <TableCell>P {parseFloat(refund.ticket_amount).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={
                          refund.refund_percentage === 100 ? 'bg-green-500' :
                          refund.refund_percentage === 80 ? 'bg-blue-500' :
                          refund.refund_percentage === 50 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }>
                          {refund.refund_percentage}%
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold text-green-600">P {parseFloat(refund.refunded_amount).toLocaleString()}</TableCell>
                      <TableCell className="text-red-600">P {parseFloat(refund.penalty_amount || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={
                          refund.status === 'processed' ? 'bg-green-500' :
                          refund.status === 'approved' ? 'bg-blue-500' :
                          refund.status === 'rejected' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }>
                          {refund.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {refund.status === 'pending' && (
                            <>
                              <Button size="sm" onClick={() => approveRefund.mutate(refund.id)}>
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => rejectRefund.mutate(refund.id)}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {refund.status === 'approved' && (
                            <Button size="sm" onClick={() => processRefund.mutate(refund.id)}>
                              Process
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => {
                            setSelectedRefund(refund);
                            setShowDetailsDialog(true);
                          }}>
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Refund Request Details</DialogTitle>
              <DialogDescription>Booking Reference: {selectedRefund?.booking_reference}</DialogDescription>
            </DialogHeader>
            {selectedRefund && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Passenger Name</Label>
                    <div className="font-medium">{selectedRefund.passenger_name}</div>
                  </div>
                  <div>
                    <Label>Contact</Label>
                    <div className="text-sm">{selectedRefund.passenger_email}</div>
                    <div className="text-sm">{selectedRefund.passenger_phone}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Route</Label>
                    <div className="font-medium">{selectedRefund.route}</div>
                  </div>
                  <div>
                    <Label>Travel Date</Label>
                    <div className="font-medium">{selectedRefund.travel_date}</div>
                  </div>
                </div>
                <div>
                  <Label>Reason for Refund</Label>
                  <div className="p-3 border rounded-lg bg-muted">{selectedRefund.reason}</div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Ticket Amount</Label>
                    <div className="text-lg font-bold">P {parseFloat(selectedRefund.ticket_amount).toLocaleString()}</div>
                  </div>
                  <div>
                    <Label>Refund Amount ({selectedRefund.refund_percentage}%)</Label>
                    <div className="text-lg font-bold text-green-600">P {parseFloat(selectedRefund.refunded_amount).toLocaleString()}</div>
                  </div>
                  <div>
                    <Label>Penalty</Label>
                    <div className="text-lg font-bold text-red-600">P {parseFloat(selectedRefund.penalty_amount || 0).toLocaleString()}</div>
                  </div>
                </div>
                {selectedRefund.notes && (
                  <div>
                    <Label>Notes</Label>
                    <div className="p-3 border rounded-lg">{selectedRefund.notes}</div>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
