import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useLocation } from 'react-router-dom';
import api from '@/services/api';
import AdminLayout from '@/components/admin/AdminLayout';
import FinanceLayout from '@/components/finance/FinanceLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, CheckCircle, XCircle, RefreshCw, Calculator } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

export default function Refunds() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : FinanceLayout;
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<any>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    dateFrom: '',
    dateTo: '',
  });

  const [refundDecision, setRefundDecision] = useState({
    action: 'approve',
    refundAmount: '',
    penalty: '',
    reason: '',
  });

  const queryClient = useQueryClient();

  const { data: refundsData, isLoading } = useQuery({
    queryKey: ['refunds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('refunds')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { refunds: data || [] };
    },
  });

  const processRefundMutation = useMutation({
    mutationFn: async ({ id, decision }: any) => {
      await supabase
        .from('refunds')
        .update({ id: id, ...decision });
      await api.post(`/finance/refunds/${id}/process`, decision);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-refunds'] });
      toast.success('Refund processed successfully');
      setShowProcessDialog(false);
    },
    onError: () => {
      toast.error('Failed to process refund');
    },
  });

  const refundRequests = refundsData?.refunds || [];
  
  const filteredRefunds = refundRequests.filter((req: any) => {
    if (filters.status !== 'all' && req.status !== filters.status) return false;
    if (filters.dateFrom && req.requestDate < filters.dateFrom) return false;
    if (filters.dateTo && req.requestDate > filters.dateTo) return false;
    return true;
  });

  const _mockRefundRequests = [
    {
      id: 1,
      requestDate: '2024-11-06',
      bookingRef: 'BKG-2024-1234',
      passenger: 'John Doe',
      passengerEmail: 'john@example.com',
      route: 'Gaborone - Francistown',
      travelDate: '2024-11-15',
      ticketAmount: 250,
      reason: 'Medical emergency',
      requestedAmount: 250,
      status: 'pending',
      daysBeforeTravel: 9,
    },
    {
      id: 2,
      requestDate: '2024-11-05',
      bookingRef: 'BKG-2024-1235',
      passenger: 'Jane Smith',
      passengerEmail: 'jane@example.com',
      route: 'Gaborone - Maun',
      travelDate: '2024-11-08',
      ticketAmount: 350,
      reason: 'Change of plans',
      requestedAmount: 280,
      status: 'approved',
      daysBeforeTravel: 3,
      approvedAmount: 280,
      penalty: 70,
    },
    {
      id: 3,
      requestDate: '2024-11-04',
      bookingRef: 'BKG-2024-1236',
      passenger: 'Mike Johnson',
      passengerEmail: 'mike@example.com',
      route: 'Francistown - Kasane',
      travelDate: '2024-11-05',
      ticketAmount: 400,
      reason: 'Late cancellation',
      requestedAmount: 400,
      status: 'declined',
      daysBeforeTravel: 1,
      declineReason: 'Cancellation within 24 hours - no refund per policy',
    },
  ];

  const summary = {
    totalRequests: 45,
    pendingRequests: 12,
    approvedThisMonth: 28,
    declinedThisMonth: 5,
    totalRefunded: 45200,
    totalPenalties: 8500,
  };

  const refundPolicy = {
    moreThan7Days: 100, // 100% refund
    between3And7Days: 80, // 80% refund (20% penalty)
    between1And3Days: 50, // 50% refund (50% penalty)
    lessThan24Hours: 0, // No refund
  };

  const calculateRefund = (ticketAmount: number, daysBeforeTravel: number) => {
    let percentage = 0;
    if (daysBeforeTravel > 7) percentage = refundPolicy.moreThan7Days;
    else if (daysBeforeTravel >= 3) percentage = refundPolicy.between3And7Days;
    else if (daysBeforeTravel >= 1) percentage = refundPolicy.between1And3Days;
    else percentage = refundPolicy.lessThan24Hours;

    const refundAmount = (ticketAmount * percentage) / 100;
    const penalty = ticketAmount - refundAmount;

    return { refundAmount, penalty, percentage };
  };

  const handleProcessRefund = (refund: any) => {
    setSelectedRefund(refund);
    const calculated = calculateRefund(refund.ticketAmount, refund.daysBeforeTravel);
    setRefundDecision({
      action: 'approve',
      refundAmount: calculated.refundAmount.toString(),
      penalty: calculated.penalty.toString(),
      reason: '',
    });
    setShowProcessDialog(true);
  };

  const handleSubmitDecision = () => {
    console.log('Processing refund:', selectedRefund, refundDecision);
    setShowProcessDialog(false);
  };

  const handleApprove = (id: number) => {
    console.log('Quick approve refund:', id);
  };

  const handleDecline = (id: number) => {
    console.log('Quick decline refund:', id);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Refunds & Adjustments</h1>
            <p className="text-muted-foreground">Handle ticket refunds and fare adjustments</p>
          </div>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <RefreshCw className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.pendingRequests}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.approvedThisMonth}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Refunded</CardTitle>
              <RefreshCw className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">P {summary.totalRefunded.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Penalties Collected</CardTitle>
              <Calculator className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">P {summary.totalPenalties.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Refund Policy */}
        <Card>
          <CardHeader>
            <CardTitle>Refund Policy</CardTitle>
            <CardDescription>Automatic penalty calculation based on cancellation timing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">More than 7 days</div>
                <div className="text-2xl font-bold text-green-600">{refundPolicy.moreThan7Days}%</div>
                <div className="text-xs text-muted-foreground">Full refund</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">3-7 days before</div>
                <div className="text-2xl font-bold text-blue-600">{refundPolicy.between3And7Days}%</div>
                <div className="text-xs text-muted-foreground">20% penalty</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">1-3 days before</div>
                <div className="text-2xl font-bold text-orange-600">{refundPolicy.between1And3Days}%</div>
                <div className="text-xs text-muted-foreground">50% penalty</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">Less than 24 hours</div>
                <div className="text-2xl font-bold text-red-600">{refundPolicy.lessThan24Hours}%</div>
                <div className="text-xs text-muted-foreground">No refund</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                />
              </div>
              <div>
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Refund Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Refund Requests</CardTitle>
            <CardDescription>All ticket refund and cancellation requests</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request Date</TableHead>
                  <TableHead>Booking Ref</TableHead>
                  <TableHead>Passenger</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Travel Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Ticket Amount</TableHead>
                  <TableHead className="text-right">Refund Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refundRequests.map((refund) => {
                  const calculated = calculateRefund(refund.ticketAmount, refund.daysBeforeTravel);
                  return (
                    <TableRow key={refund.id}>
                      <TableCell>{refund.requestDate}</TableCell>
                      <TableCell className="font-mono">{refund.bookingRef}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{refund.passenger}</div>
                          <div className="text-sm text-muted-foreground">{refund.passengerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{refund.route}</TableCell>
                      <TableCell>
                        <div>
                          <div>{refund.travelDate}</div>
                          <div className="text-xs text-muted-foreground">{refund.daysBeforeTravel} days before</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{refund.reason}</TableCell>
                      <TableCell className="text-right font-medium">P {refund.ticketAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {refund.status === 'pending' ? (
                          <div>
                            <div className="font-bold text-green-600">P {calculated.refundAmount.toLocaleString()}</div>
                            <div className="text-xs text-red-600">Penalty: P {calculated.penalty.toLocaleString()}</div>
                          </div>
                        ) : refund.status === 'approved' ? (
                          <div className="font-bold text-green-600">P {refund.approvedAmount?.toLocaleString()}</div>
                        ) : (
                          <div className="text-red-600">P 0</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          refund.status === 'approved' ? 'bg-green-500' :
                          refund.status === 'pending' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }>
                          {refund.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {refund.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button onClick={() => handleProcessRefund(refund)}>
                              <Calculator className="h-4 w-4 mr-1" />
                              Process
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Process Refund Dialog */}
        <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Process Refund Request</DialogTitle>
              <DialogDescription>
                {selectedRefund?.bookingRef} - {selectedRefund?.passenger}
              </DialogDescription>
            </DialogHeader>
            {selectedRefund && (
              <div className="space-y-4">
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Ticket Amount</span>
                    <span className="font-medium">P {selectedRefund.ticketAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Days Before Travel</span>
                    <span className="font-medium">{selectedRefund.daysBeforeTravel} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cancellation Reason</span>
                    <span className="font-medium">{selectedRefund.reason}</span>
                  </div>
                </div>

                <div>
                  <Label>Decision</Label>
                  <Select value={refundDecision.action} onValueChange={(v) => setRefundDecision({...refundDecision, action: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approve">Approve Refund</SelectItem>
                      <SelectItem value="decline">Decline Refund</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {refundDecision.action === 'approve' && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Refund Amount (P)</Label>
                      <Input
                        type="number"
                        value={refundDecision.refundAmount}
                        onChange={(e) => setRefundDecision({...refundDecision, refundAmount: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Penalty (P)</Label>
                      <Input
                        type="number"
                        value={refundDecision.penalty}
                        onChange={(e) => setRefundDecision({...refundDecision, penalty: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label>Notes/Reason</Label>
                  <Textarea
                    placeholder="Add notes or reason for decision"
                    value={refundDecision.reason}
                    onChange={(e) => setRefundDecision({...refundDecision, reason: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button onClick={() => setShowProcessDialog(false)}>Cancel</Button>
                  <Button onClick={handleSubmitDecision}>
                    {refundDecision.action === 'approve' ? (
                      <><CheckCircle className="mr-2 h-4 w-4" /> Approve Refund</>
                    ) : (
                      <><XCircle className="mr-2 h-4 w-4" /> Decline Refund</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
