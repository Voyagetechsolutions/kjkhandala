import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import TicketingLayout from '@/components/ticketing/TicketingLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DollarSign, CreditCard, Smartphone, Banknote, Download } from 'lucide-react';

export default function Payments() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data, isLoading } = useQuery({
    queryKey: ['payments', selectedDate],
    queryFn: async () => {
      const response = await api.get('/ticketing/payments', { params: { date: selectedDate } });
      return response.data;
    },
  });

  const summary = data?.summary || { cash: 0, card: 0, mobileMoney: 0, total: 0, count: 0 };
  const payments = data?.payments || [];

  return (
    <TicketingLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Payments & Collections</h1>
            <p className="text-muted-foreground">Daily payment tracking and reconciliation</p>
          </div>
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cash Payments</CardTitle>
              <Banknote className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {isLoading ? '...' : summary.cash.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Cash collections</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Card Payments</CardTitle>
              <CreditCard className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {isLoading ? '...' : summary.card.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Card transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mobile Money</CardTitle>
              <Smartphone className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {isLoading ? '...' : summary.mobileMoney.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Mobile transactions</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Collections</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">P {isLoading ? '...' : summary.total.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{summary.count} transactions</p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              {payments.length} transaction(s) on {new Date(selectedDate).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading transactions...</div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No transactions found</p>
                <p className="text-sm">Select a different date to view transactions</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left text-sm text-muted-foreground">
                      <th className="pb-3">Ticket #</th>
                      <th className="pb-3">Passenger</th>
                      <th className="pb-3">Route</th>
                      <th className="pb-3">Time</th>
                      <th className="pb-3">Payment Method</th>
                      <th className="pb-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {payments.map((payment: any) => (
                      <tr key={payment.id} className="text-sm">
                        <td className="py-3 font-medium">{payment.ticketNumber}</td>
                        <td className="py-3">
                          {payment.passenger?.firstName} {payment.passenger?.lastName}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {payment.trip?.route?.origin} → {payment.trip?.route?.destination}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {new Date(payment.createdAt).toLocaleTimeString()}
                        </td>
                        <td className="py-3">
                          <Badge variant="outline">
                            {payment.paymentMethod === 'CASH' && <Banknote className="h-3 w-3 mr-1" />}
                            {payment.paymentMethod === 'CARD' && <CreditCard className="h-3 w-3 mr-1" />}
                            {payment.paymentMethod === 'MOBILE_MONEY' && <Smartphone className="h-3 w-3 mr-1" />}
                            {payment.paymentMethod}
                          </Badge>
                        </td>
                        <td className="py-3 text-right font-medium">P {payment.totalPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2">
                    <tr className="font-bold text-base">
                      <td className="pt-4" colSpan={5}>Total</td>
                      <td className="pt-4 text-right">P {summary.total.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reconciliation */}
        <Card>
          <CardHeader>
            <CardTitle>End-of-Day Reconciliation</CardTitle>
            <CardDescription>Verify cash and reconcile payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Expected Cash</Label>
                <div className="text-2xl font-bold">P {summary.cash.toFixed(2)}</div>
              </div>
              <div className="space-y-2">
                <Label>Actual Cash Counted</Label>
                <Input type="number" step="0.01" placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Variance</Label>
                <div className="text-2xl font-bold text-muted-foreground">P 0.00</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TicketingLayout>
  );
}
