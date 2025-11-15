// ENHANCED PAYMENTS PAGE - Complete Implementation
// File: frontend/src/pages/ticketing/Payments.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import TicketingLayout from '@/components/ticketing/TicketingLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { DollarSign, CreditCard, Smartphone, Banknote, AlertTriangle, CheckCircle } from 'lucide-react';

export default function Payments() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : TicketingLayout;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showReconciliation, setShowReconciliation] = useState(false);
  const [actualCash, setActualCash] = useState('');
  const [reconciliationNotes, setReconciliationNotes] = useState('');

  // Fetch payment summary for today
  const { data: paymentSummary } = useQuery({
    queryKey: ['payment-summary-today'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_summary_today')
        .select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch all transactions for today
  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions-today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          booking:bookings(*,
            trip:trips(*,
              route:routes(*)
            )
          )
        `)
        .gte('payment_date', `${today}T00:00:00`)
        .lte('payment_date', `${today}T23:59:59`)
        .order('payment_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch daily reconciliation
  const { data: reconciliation } = useQuery({
    queryKey: ['daily-reconciliation'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_reconciliations')
        .select('*')
        .eq('date', today)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Submit reconciliation mutation
  const reconcileMutation = useMutation({
    mutationFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const expectedCash = paymentSummary?.find((p: any) => p.payment_method === 'cash')?.total_amount || 0;
      const actualCashAmount = parseFloat(actualCash) || 0;
      const discrepancy = actualCashAmount - expectedCash;

      const { error } = await supabase
        .from('daily_reconciliations')
        .upsert({
          date: today,
          expected_cash: expectedCash,
          actual_cash: actualCashAmount,
          card_payments: paymentSummary?.find((p: any) => p.payment_method === 'card')?.total_amount || 0,
          mobile_money: paymentSummary?.find((p: any) => p.payment_method === 'mobile_money')?.total_amount || 0,
          total_revenue: paymentSummary?.reduce((sum: number, p: any) => sum + parseFloat(p.total_amount || 0), 0) || 0,
          discrepancies: discrepancy,
          notes: reconciliationNotes,
          reconciled_by: user?.id,
          status: Math.abs(discrepancy) > 10 ? 'flagged' : 'completed',
        }, {
          onConflict: 'date'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-reconciliation'] });
      toast.success('Reconciliation completed successfully');
      setShowReconciliation(false);
      setActualCash('');
      setReconciliationNotes('');
    },
    onError: () => {
      toast.error('Failed to complete reconciliation');
    },
  });

  const cashPayments = paymentSummary?.find((p: any) => p.payment_method === 'cash')?.total_amount || 0;
  const cardPayments = paymentSummary?.find((p: any) => p.payment_method === 'card')?.total_amount || 0;
  const mobileMoneyPayments = paymentSummary?.find((p: any) => p.payment_method === 'mobile_money')?.total_amount || 0;
  const totalRevenue = cashPayments + cardPayments + mobileMoneyPayments;

  const expectedCash = cashPayments;
  const actualCashAmount = parseFloat(actualCash) || 0;
  const discrepancy = actualCashAmount - expectedCash;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Payments & Collections</h1>
            <p className="text-muted-foreground">Track daily payments and reconcile cash</p>
          </div>
          <Button onClick={() => setShowReconciliation(true)}>
            <DollarSign className="mr-2 h-4 w-4" />
            End of Day Reconciliation
          </Button>
        </div>

        {/* Payment Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cash Payments</CardTitle>
              <Banknote className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {cashPayments.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {paymentSummary?.find((p: any) => p.payment_method === 'cash')?.transaction_count || 0} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Card Payments</CardTitle>
              <CreditCard className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {cardPayments.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {paymentSummary?.find((p: any) => p.payment_method === 'card')?.transaction_count || 0} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mobile Money</CardTitle>
              <Smartphone className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {mobileMoneyPayments.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {paymentSummary?.find((p: any) => p.payment_method === 'mobile_money')?.transaction_count || 0} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {transactions.length} total transactions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Reconciliation Status */}
        {reconciliation && (
          <Card>
            <CardHeader>
              <CardTitle>Today's Reconciliation Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Expected Cash</p>
                  <p className="text-lg font-bold">P {parseFloat(reconciliation.expected_cash).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Actual Cash</p>
                  <p className="text-lg font-bold">P {parseFloat(reconciliation.actual_cash).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Discrepancy</p>
                  <p className={`text-lg font-bold ${parseFloat(reconciliation.discrepancies) !== 0 ? 'text-red-500' : 'text-green-500'}`}>
                    P {parseFloat(reconciliation.discrepancies).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={reconciliation.status === 'completed' ? 'bg-green-500' : 'bg-red-500'}>
                    {reconciliation.status}
                  </Badge>
                </div>
              </div>
              {reconciliation.notes && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">Notes:</p>
                  <p className="text-sm">{reconciliation.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No transactions today
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction: any) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{new Date(transaction.payment_date).toLocaleTimeString()}</TableCell>
                      <TableCell className="font-mono text-xs">{transaction.booking?.ticket_number}</TableCell>
                      <TableCell>{transaction.booking?.trip?.route?.route_name || 'N/A'}</TableCell>
                      <TableCell className="capitalize">
                        {transaction.payment_method === 'cash' && <Banknote className="h-4 w-4 inline mr-1" />}
                        {transaction.payment_method === 'card' && <CreditCard className="h-4 w-4 inline mr-1" />}
                        {transaction.payment_method === 'mobile_money' && <Smartphone className="h-4 w-4 inline mr-1" />}
                        {transaction.payment_method?.replace('_', ' ')}
                      </TableCell>
                      <TableCell className="font-bold">P {parseFloat(transaction.amount).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={transaction.payment_status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}>
                          {transaction.payment_status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Reconciliation Dialog */}
        <Dialog open={showReconciliation} onOpenChange={setShowReconciliation}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>End of Day Reconciliation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Expected Cash:</span>
                  <span className="font-bold">P {expectedCash.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Card Payments:</span>
                  <span className="font-bold">P {cardPayments.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mobile Money:</span>
                  <span className="font-bold">P {mobileMoneyPayments.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-bold">Total Revenue:</span>
                  <span className="font-bold">P {totalRevenue.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <Label>Actual Cash Counted *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  placeholder="Enter actual cash amount"
                />
              </div>

              {actualCash && (
                <div className={`p-4 rounded-lg ${Math.abs(discrepancy) > 10 ? 'bg-red-50' : 'bg-green-50'}`}>
                  <div className="flex items-center gap-2">
                    {Math.abs(discrepancy) > 10 ? (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    <div>
                      <p className="font-medium">
                        {discrepancy === 0 ? 'Perfect Match!' : discrepancy > 0 ? 'Cash Overage' : 'Cash Shortage'}
                      </p>
                      <p className={`text-lg font-bold ${discrepancy !== 0 ? 'text-red-500' : 'text-green-500'}`}>
                        P {Math.abs(discrepancy).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label>Notes</Label>
                <Input
                  value={reconciliationNotes}
                  onChange={(e) => setReconciliationNotes(e.target.value)}
                  placeholder="Add any notes about discrepancies..."
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowReconciliation(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={() => reconcileMutation.mutate()}
                  disabled={!actualCash || reconcileMutation.isPending}
                  className="flex-1"
                >
                  {reconcileMutation.isPending ? 'Submitting...' : 'Submit Reconciliation'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
