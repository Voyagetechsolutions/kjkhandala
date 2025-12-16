import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
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
import { Download, Plus, Upload, CheckCircle, XCircle, TrendingDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

export default function ExpenseManagement() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : FinanceLayout;

  const [showAddForm, setShowAddForm] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
  });

  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'fuel',
    description: '',
    amount: '',
    vendor: '',
    receipt: null as File | null,
  });

  const queryClient = useQueryClient();

  const { data: expensesData, isLoading } = useQuery({
    queryKey: ['expenses', filters],
    queryFn: async () => {
      let query = supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });
      
      if (filters.category !== 'all') query = query.eq('category', filters.category);
      if (filters.dateFrom) query = query.gte('date', filters.dateFrom);
      if (filters.dateTo) query = query.lte('date', filters.dateTo);
      
      const { data, error } = await query;
      if (error) throw error;
      return { expenses: data || [] };
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: newExpenseData, error } = await supabase
        .from('expenses')
        .insert([data]);
      if (error) throw error;
      return newExpenseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', filters] });
      toast.success('Expense added successfully');
      setShowAddForm(false);
      setNewExpense({
        date: new Date().toISOString().split('T')[0],
        category: 'fuel',
        description: '',
        amount: '',
        vendor: '',
        receipt: null,
      });
    },
    onError: () => {
      toast.error('Failed to add expense');
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/finance/expenses/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-expenses'] });
      toast.success('Expense approved');
    },
    onError: () => {
      toast.error('Failed to approve expense');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/finance/expenses/${id}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-expenses'] });
      toast.success('Expense rejected');
    },
    onError: () => {
      toast.error('Failed to reject expense');
    },
  });

  const expenses = expensesData?.expenses || [];
  
  const filteredExpenses = expenses.filter((exp: any) => {
    if (filters.category !== 'all' && exp.category !== filters.category) return false;
    if (filters.status !== 'all' && exp.status !== filters.status) return false;
    if (filters.dateFrom && exp.date < filters.dateFrom) return false;
    if (filters.dateTo && exp.date > filters.dateTo) return false;
    return true;
  });

  const summary = {
    payroll: expenses.filter((e: any) => e.category?.toLowerCase().includes('payroll')).reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0),
    fuel: expenses.filter((e: any) => e.category?.toLowerCase().includes('fuel')).reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0),
    maintenance: expenses.filter((e: any) => e.category?.toLowerCase().includes('maintenance')).reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0),
    utilities: expenses.filter((e: any) => e.category?.toLowerCase().includes('utilities')).reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0),
    insurance: expenses.filter((e: any) => e.category?.toLowerCase().includes('insurance')).reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0),
    miscellaneous: expenses.filter((e: any) => e.category?.toLowerCase().includes('misc')).reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0),
    totalExpenses: expenses.reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0),
  };

  const handleAddExpense = () => {
    createMutation.mutate(newExpense);
  };

  const handleApprove = (id: number) => {
    approveMutation.mutate(id.toString());
  };

  const handleReject = (id: number) => {
    rejectMutation.mutate(id.toString());
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Expense Management</h1>
            <p className="text-muted-foreground">Track and manage all company expenses</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
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
              <CardTitle className="text-sm font-medium">Payroll</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {summary.payroll.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fuel & Lubricants</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {summary.fuel.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {summary.maintenance.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">P {summary.totalExpenses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">This month</p>
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
                <Label>Category</Label>
                <Select value={filters.category} onValueChange={(v) => setFilters({...filters, category: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="payroll">Payroll</SelectItem>
                    <SelectItem value="fuel">Fuel & Lubricants</SelectItem>
                    <SelectItem value="maintenance">Maintenance & Repairs</SelectItem>
                    <SelectItem value="rent">Office/Terminal Rent</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="insurance">Insurance & Licensing</SelectItem>
                    <SelectItem value="misc">Miscellaneous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                    <SelectItem value="rejected">Rejected</SelectItem>
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

        {/* Expense Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Records</CardTitle>
            <CardDescription>All company expenses and pending approvals</CardDescription>
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
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{expense.date}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>{expense.vendor}</TableCell>
                    <TableCell>
                      {expense.receipt ? (
                        <Badge className="bg-green-500">Attached</Badge>
                      ) : (
                        <Badge className="bg-gray-500">None</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        expense.status === 'approved' ? 'bg-green-500' :
                        expense.status === 'pending' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }>
                        {expense.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-red-600">
                      P {expense.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {expense.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button onClick={() => handleApprove(expense.id)}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button onClick={() => handleReject(expense.id)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add Expense Dialog */}
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Expense Record</DialogTitle>
              <DialogDescription>Record a new company expense</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={newExpense.category} onValueChange={(v) => setNewExpense({...newExpense, category: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="payroll">Payroll</SelectItem>
                      <SelectItem value="fuel">Fuel & Lubricants</SelectItem>
                      <SelectItem value="maintenance">Maintenance & Repairs</SelectItem>
                      <SelectItem value="rent">Office/Terminal Rent</SelectItem>
                      <SelectItem value="utilities">Utilities</SelectItem>
                      <SelectItem value="insurance">Insurance & Licensing</SelectItem>
                      <SelectItem value="misc">Miscellaneous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Enter expense description"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Vendor/Supplier</Label>
                  <Input
                    placeholder="Vendor name"
                    value={newExpense.vendor}
                    onChange={(e) => setNewExpense({...newExpense, vendor: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Amount (P)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label>Upload Receipt/Invoice</Label>
                <Input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setNewExpense({...newExpense, receipt: e.target.files?.[0] || null})}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button onClick={() => setShowAddForm(false)}>Cancel</Button>
                <Button onClick={handleAddExpense}>Add Expense</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
