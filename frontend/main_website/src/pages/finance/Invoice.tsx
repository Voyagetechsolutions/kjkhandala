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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Plus, DollarSign, AlertCircle, CheckCircle, Edit } from 'lucide-react';
import { toast } from 'sonner';

export default function Invoice() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : FinanceLayout;
  const queryClient = useQueryClient();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    client_name: '',
    client_email: '',
    client_phone: '',
    service_description: '',
    amount: '',
    tax_amount: '0',
    discount_amount: '0',
    payment_terms: 'Net 30',
    notes: '',
  });

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const createInvoice = useMutation({
    mutationFn: async (invoiceData: any) => {
      const { data, error } = await supabase
        .from('invoices')
        .insert([{
          ...invoiceData,
          amount: parseFloat(invoiceData.amount),
          tax_amount: parseFloat(invoiceData.tax_amount || 0),
          discount_amount: parseFloat(invoiceData.discount_amount || 0),
          paid_amount: 0,
          created_by: user?.id,
          status: 'sent'
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice created successfully');
      setShowAddDialog(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        client_name: '',
        client_email: '',
        client_phone: '',
        service_description: '',
        amount: '',
        tax_amount: '0',
        discount_amount: '0',
        payment_terms: 'Net 30',
        notes: '',
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create invoice');
    }
  });

  const updatePayment = useMutation({
    mutationFn: async ({ id, paid_amount }: { id: string; paid_amount: number }) => {
      const { data, error } = await supabase
        .from('invoices')
        .update({ paid_amount })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Payment updated successfully');
      setShowPaymentDialog(false);
      setSelectedInvoice(null);
      setPaymentAmount('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update payment');
    }
  });

  const handleSubmit = () => {
    if (!formData.client_name || !formData.service_description || !formData.amount) {
      toast.error('Please fill all required fields');
      return;
    }
    createInvoice.mutate(formData);
  };

  const handlePayment = () => {
    if (!paymentAmount || !selectedInvoice) return;
    const newPaidAmount = parseFloat(selectedInvoice.paid_amount || 0) + parseFloat(paymentAmount);
    updatePayment.mutate({ id: selectedInvoice.id, paid_amount: newPaidAmount });
  };

  const totalInvoiced = invoices.reduce((sum, inv: any) => sum + parseFloat(inv.amount || 0), 0);
  const totalPaid = invoices.reduce((sum, inv: any) => sum + parseFloat(inv.paid_amount || 0), 0);
  const outstanding = invoices.reduce((sum, inv: any) => sum + parseFloat(inv.balance || 0), 0);
  const overdue = invoices.filter((inv: any) => {
    const dueDate = new Date(inv.due_date);
    return dueDate < new Date() && inv.status !== 'paid';
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Invoice & Billing</h1>
            <p className="text-muted-foreground">Manage client invoices and payments</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {totalInvoiced.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{invoices.length} invoices</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">P {totalPaid.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{((totalPaid / totalInvoiced) * 100).toFixed(0)}% collected</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">P {outstanding.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Pending payment</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overdue.length}</div>
              <p className="text-xs text-muted-foreground">
                P {overdue.reduce((sum, inv: any) => sum + parseFloat(inv.balance || 0), 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>All client invoices and payment status</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground">
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice: any) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.date}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.client_name}</div>
                          <div className="text-xs text-muted-foreground">{invoice.client_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{invoice.service_description}</TableCell>
                      <TableCell>P {parseFloat(invoice.amount).toLocaleString()}</TableCell>
                      <TableCell>P {parseFloat(invoice.paid_amount || 0).toLocaleString()}</TableCell>
                      <TableCell className="font-bold">P {parseFloat(invoice.balance || 0).toLocaleString()}</TableCell>
                      <TableCell>{invoice.due_date}</TableCell>
                      <TableCell>
                        <Badge className={
                          invoice.status === 'paid' ? 'bg-green-500' :
                          invoice.status === 'overdue' ? 'bg-red-500' :
                          invoice.status === 'pending' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {invoice.status !== 'paid' && (
                          <Button size="sm" onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowPaymentDialog(true);
                          }}>
                            <Edit className="h-4 w-4 mr-1" />
                            Pay
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Invoice</DialogTitle>
              <DialogDescription>Generate a new client invoice</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Invoice Date *</Label>
                  <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                </div>
                <div>
                  <Label>Due Date *</Label>
                  <Input type="date" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} />
                </div>
              </div>
              <div>
                <Label>Client Name *</Label>
                <Input value={formData.client_name} onChange={(e) => setFormData({...formData, client_name: e.target.value})} placeholder="Client name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Client Email</Label>
                  <Input type="email" value={formData.client_email} onChange={(e) => setFormData({...formData, client_email: e.target.value})} placeholder="client@example.com" />
                </div>
                <div>
                  <Label>Client Phone</Label>
                  <Input value={formData.client_phone} onChange={(e) => setFormData({...formData, client_phone: e.target.value})} placeholder="+267 1234 5678" />
                </div>
              </div>
              <div>
                <Label>Service Description *</Label>
                <Textarea value={formData.service_description} onChange={(e) => setFormData({...formData, service_description: e.target.value})} placeholder="Describe the service provided..." />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Amount *</Label>
                  <Input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} placeholder="0.00" />
                </div>
                <div>
                  <Label>Tax Amount</Label>
                  <Input type="number" step="0.01" value={formData.tax_amount} onChange={(e) => setFormData({...formData, tax_amount: e.target.value})} placeholder="0.00" />
                </div>
                <div>
                  <Label>Discount</Label>
                  <Input type="number" step="0.01" value={formData.discount_amount} onChange={(e) => setFormData({...formData, discount_amount: e.target.value})} placeholder="0.00" />
                </div>
              </div>
              <div>
                <Label>Payment Terms</Label>
                <Input value={formData.payment_terms} onChange={(e) => setFormData({...formData, payment_terms: e.target.value})} placeholder="Net 30" />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Additional notes..." />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={createInvoice.isPending}>
                  {createInvoice.isPending ? 'Creating...' : 'Create Invoice'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Invoice: {selectedInvoice?.invoice_number} - Balance: P {parseFloat(selectedInvoice?.balance || 0).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Payment Amount *</Label>
                <Input type="number" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setShowPaymentDialog(false);
                  setSelectedInvoice(null);
                  setPaymentAmount('');
                }}>Cancel</Button>
                <Button onClick={handlePayment} disabled={updatePayment.isPending}>
                  {updatePayment.isPending ? 'Recording...' : 'Record Payment'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
