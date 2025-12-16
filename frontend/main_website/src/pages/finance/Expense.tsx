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
import { Download, Plus, Filter, TrendingDown, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function Expense() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : FinanceLayout;
  const queryClient = useQueryClient();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
  });
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'fuel',
    description: '',
    vendor: '',
    receipt_number: '',
    amount: '',
    payment_method: 'cash',
  });

  const { data: expenseRecords = [], isLoading } = useQuery({
    queryKey: ['expense-records', filters],
    queryFn: async () => {
      let query = supabase
        .from('expense_records')
        .select('*')
        .gte('date', filters.dateFrom)
        .lte('date', filters.dateTo)
        .order('date', { ascending: false });

      if (filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const createExpense = useMutation({
    mutationFn: async (expenseData: any) => {
      const { data, error } = await supabase
        .from('expense_records')
        .insert([{
          ...expenseData,
          amount: parseFloat(expenseData.amount),
          recorded_by: user?.id,
          status: 'pending'
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-records'] });
      toast.success('Expense record created successfully');
      setShowAddDialog(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        category: 'fuel',
        description: '',
        vendor: '',
        receipt_number: '',
        amount: '',
        payment_method: 'cash',
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create expense record');
    }
  });

  const approveExpense = useMutation({
    mutationFn: async (expenseId: string) => {
      const { data, error } = await supabase
        .from('expense_records')
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', expenseId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-records'] });
      toast.success('Expense approved');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve expense');
    }
  });

  const rejectExpense = useMutation({
    mutationFn: async (expenseId: string) => {
      const { data, error } = await supabase
        .from('expense_records')
        .update({
          status: 'rejected',
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', expenseId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-records'] });
      toast.success('Expense rejected');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject expense');
    }
  });

  const handleSubmit = () => {
    if (!formData.date || !formData.category || !formData.description || !formData.amount) {
      toast.error('Please fill all required fields');
      return;
    }
    createExpense.mutate(formData);
  };

  const totalExpenses = expenseRecords.reduce((sum, record: any) => sum + parseFloat(record.amount || 0), 0);
  const pendingExpenses = expenseRecords.filter((r: any) => r.status === 'pending');
  const approvedExpenses = expenseRecords.filter((r: any) => r.status === 'approved');
  const paidExpenses = expenseRecords.filter((r: any) => r.status === 'paid');

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Expense Management</h1>
            <p className="text-muted-foreground">Track and manage all business expenses</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {totalExpenses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{expenseRecords.length} transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingExpenses.length}</div>
              <p className="text-xs text-muted-foreground">
                P {pendingExpenses.reduce((sum, e: any) => sum + parseFloat(e.amount || 0), 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvedExpenses.length}</div>
              <p className="text-xs text-muted-foreground">
                P {approvedExpenses.reduce((sum, e: any) => sum + parseFloat(e.amount || 0), 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{paidExpenses.length}</div>
              <p className="text-xs text-muted-foreground">
                P {paidExpenses.reduce((sum, e: any) => sum + parseFloat(e.amount || 0), 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-5 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="fuel">Fuel</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="salaries">Salaries</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="rent">Rent</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="supplies">Supplies</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>From Date</Label>
                <Input type="date" value={filters.dateFrom} onChange={(e) => setFilters({...filters, dateFrom: e.target.value})} />
              </div>
              <div>
                <Label>To Date</Label>
                <Input type="date" value={filters.dateTo} onChange={(e) => setFilters({...filters, dateTo: e.target.value})} />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={() => setFilters({
                  category: 'all',
                  status: 'all',
                  dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
                  dateTo: new Date().toISOString().split('T')[0],
                })}>
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expense Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Records</CardTitle>
            <CardDescription>All expense transactions for the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : expenseRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      No expense records found
                    </TableCell>
                  </TableRow>
                ) : (
                  expenseRecords.map((record: any) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.date}</TableCell>
                      <TableCell className="capitalize">{record.category}</TableCell>
                      <TableCell>{record.description}</TableCell>
                      <TableCell>{record.vendor || '-'}</TableCell>
                      <TableCell>{record.receipt_number || '-'}</TableCell>
                      <TableCell className="capitalize">{record.payment_method}</TableCell>
                      <TableCell className="font-bold">P {parseFloat(record.amount).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={
                          record.status === 'paid' ? 'bg-blue-500' :
                          record.status === 'approved' ? 'bg-green-500' :
                          record.status === 'rejected' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => approveExpense.mutate(record.id)}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => rejectExpense.mutate(record.id)}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add Expense Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Expense Record</DialogTitle>
              <DialogDescription>Record a new business expense</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date *</Label>
                  <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                </div>
                <div>
                  <Label>Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fuel">Fuel</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="salaries">Salaries</SelectItem>
                      <SelectItem value="utilities">Utilities</SelectItem>
                      <SelectItem value="rent">Rent</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="supplies">Supplies</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Enter description..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vendor</Label>
                  <Input value={formData.vendor} onChange={(e) => setFormData({...formData, vendor: e.target.value})} placeholder="Vendor name" />
                </div>
                <div>
                  <Label>Receipt Number</Label>
                  <Input value={formData.receipt_number} onChange={(e) => setFormData({...formData, receipt_number: e.target.value})} placeholder="e.g., REC-001" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Amount *</Label>
                  <Input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} placeholder="0.00" />
                </div>
                <div>
                  <Label>Payment Method *</Label>
                  <Select value={formData.payment_method} onValueChange={(value) => setFormData({...formData, payment_method: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={createExpense.isPending}>
                  {createExpense.isPending ? 'Saving...' : 'Save Expense'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
