import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
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
import { Download, Plus, Send, FileText, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

export default function Invoices() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    client: 'all',
    dateFrom: '',
    dateTo: '',
  });

  const [newInvoice, setNewInvoice] = useState({
    client: '',
    clientEmail: '',
    service: 'charter',
    description: '',
    amount: '',
    dueDate: '',
    items: [] as any[],
  });

  const queryClient = useQueryClient();

  const { data: invoices = [] } = useQuery({
    queryKey: ['finance-invoices'],
    queryFn: async () => {
      const response = await api.get('/finance/invoices');
      return Array.isArray(response.data) ? response.data : (response.data?.invoices || []);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post('/finance/invoices', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-invoices'] });
      toast.success('Invoice created successfully');
      setShowCreateDialog(false);
      setNewInvoice({
        client: '',
        clientEmail: '',
        service: 'charter',
        description: '',
        amount: '',
        dueDate: '',
        items: [],
      });
    },
    onError: () => {
      toast.error('Failed to create invoice');
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/finance/invoices/${id}/send`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-invoices'] });
      toast.success('Invoice sent successfully');
    },
    onError: () => {
      toast.error('Failed to send invoice');
    },
  });

  const filteredInvoices = invoices.filter((inv: any) => {
    if (filters.status !== 'all' && inv.status !== filters.status) return false;
    if (filters.client !== 'all' && inv.client !== filters.client) return false;
    if (filters.dateFrom && inv.date < filters.dateFrom) return false;
    if (filters.dateTo && inv.date > filters.dateTo) return false;
    return true;
  });

  const _mockInvoices = [
    {
      id: 1,
      invoiceNumber: 'INV-2024-001',
      date: '2024-11-01',
      client: 'ABC School',
      clientEmail: 'admin@abcschool.com',
      service: 'Charter Service',
      amount: 25000,
      paid: 0,
      balance: 25000,
      dueDate: '2024-11-15',
      status: 'overdue',
      daysPastDue: 5,
    },
    {
      id: 2,
      invoiceNumber: 'INV-2024-002',
      date: '2024-11-03',
      client: 'XYZ Corporation',
      clientEmail: 'billing@xyzcorp.com',
      service: 'Private Hire',
      amount: 18000,
      paid: 18000,
      balance: 0,
      dueDate: '2024-11-17',
      status: 'paid',
      daysPastDue: 0,
    },
    {
      id: 3,
      invoiceNumber: 'INV-2024-003',
      date: '2024-11-05',
      client: 'Government Department',
      clientEmail: 'procurement@gov.bw',
      service: 'Contract Transport',
      amount: 45000,
      paid: 0,
      balance: 45000,
      dueDate: '2024-11-20',
      status: 'pending',
      daysPastDue: 0,
    },
  ];

  const summary = {
    totalInvoiced: 285000,
    totalPaid: 185000,
    totalOutstanding: 100000,
    overdueAmount: 45000,
    overdueCount: 3,
  };

  const handleCreateInvoice = () => {
    console.log('Creating invoice:', newInvoice);
    setShowCreateDialog(false);
  };

  const handleSendInvoice = (id: number) => {
    console.log('Sending invoice:', id);
  };

  const handleDownloadInvoice = (id: number) => {
    console.log('Downloading invoice:', id);
  };

  const handleRecordPayment = (id: number) => {
    console.log('Recording payment for invoice:', id);
  };

  return (
    <FinanceLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Invoices & Billing</h1>
            <p className="text-muted-foreground">Manage B2B invoicing and payments</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {summary.totalInvoiced.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <FileText className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">P {summary.totalPaid.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Received</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
              <FileText className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">P {summary.totalOutstanding.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Pending payment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">P {summary.overdueAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{summary.overdueCount} invoices</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Client</Label>
                <Select value={filters.client} onValueChange={(v) => setFilters({...filters, client: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    <SelectItem value="client1">ABC School</SelectItem>
                    <SelectItem value="client2">XYZ Corporation</SelectItem>
                    <SelectItem value="client3">Government Department</SelectItem>
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

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice List</CardTitle>
            <CardDescription>All client invoices and payment status</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{invoice.client}</div>
                        <div className="text-sm text-muted-foreground">{invoice.clientEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>{invoice.service}</TableCell>
                    <TableCell className="text-right font-medium">P {invoice.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-green-600">P {invoice.paid.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold">
                      {invoice.balance > 0 ? (
                        <span className="text-red-600">P {invoice.balance.toLocaleString()}</span>
                      ) : (
                        <span className="text-green-600">P 0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{invoice.dueDate}</div>
                        {invoice.daysPastDue > 0 && (
                          <div className="text-xs text-red-600">{invoice.daysPastDue} days overdue</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        invoice.status === 'paid' ? 'bg-green-500' :
                        invoice.status === 'pending' ? 'bg-yellow-500' :
                        invoice.status === 'overdue' ? 'bg-red-500' :
                        'bg-gray-500'
                      }>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button onClick={() => handleDownloadInvoice(invoice.id)} title="Download">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => handleSendInvoice(invoice.id)} title="Send">
                          <Send className="h-4 w-4" />
                        </Button>
                        {invoice.status !== 'paid' && (
                          <Button onClick={() => handleRecordPayment(invoice.id)} title="Record Payment">
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create Invoice Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>Generate an invoice for a client</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Client Name</Label>
                  <Input
                    placeholder="Client/Company name"
                    value={newInvoice.client}
                    onChange={(e) => setNewInvoice({...newInvoice, client: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Client Email</Label>
                  <Input
                    type="email"
                    placeholder="client@example.com"
                    value={newInvoice.clientEmail}
                    onChange={(e) => setNewInvoice({...newInvoice, clientEmail: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Service Type</Label>
                  <Select value={newInvoice.service} onValueChange={(v) => setNewInvoice({...newInvoice, service: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="charter">Charter Service</SelectItem>
                      <SelectItem value="private">Private Hire</SelectItem>
                      <SelectItem value="contract">Contract Transport</SelectItem>
                      <SelectItem value="school">School Transport</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={newInvoice.dueDate}
                    onChange={(e) => setNewInvoice({...newInvoice, dueDate: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Service description and details"
                  value={newInvoice.description}
                  onChange={(e) => setNewInvoice({...newInvoice, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div>
                <Label>Amount (P)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newInvoice.amount}
                  onChange={(e) => setNewInvoice({...newInvoice, amount: e.target.value})}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateInvoice}>
                  <FileText className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </FinanceLayout>
  );
}
