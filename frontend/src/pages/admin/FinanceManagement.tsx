import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, TrendingUp, TrendingDown, FileText, CheckCircle, XCircle, Clock, Download } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function FinanceManagement() {
  const [dateRange, setDateRange] = useState('month');
  const [expenseFilter, setExpenseFilter] = useState('all');
  const queryClient = useQueryClient();

  // Fetch finance data
  const { data: financeData, isLoading } = useQuery({
    queryKey: ['admin-finance'],
    queryFn: async () => {
      const { data: income, error: incomeError } = await supabase
        .from('income')
        .select('*');
      if (incomeError) throw incomeError;
      
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('*');
      if (expensesError) throw expensesError;
      
      return { income: income || [], expenses: expenses || [] };
    },
  });

  // Approve expense mutation
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .update({ status: 'approved' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Expense approved');
      queryClient.invalidateQueries({ queryKey: ['expenses-data'] });
    },
  });

  // Calculate summary stats
  const income = financeData?.income || [];
  const expenses = financeData?.expenses || [];
  
  const totalIncome = income.reduce((sum: number, r: any) => sum + parseFloat(r.amount || 0), 0);
  const totalExpenses = expenses
    .filter((e: any) => e.status === 'approved')
    .reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0);
  const netProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0';

  const pendingExpenses = expenses.filter((e: any) => e.status === 'pending').length;

  // Prepare chart data
  const chartData = income.slice(0, 30).reverse().map((r: any) => ({
    date: format(new Date(r.created_at), 'MMM dd'),
    revenue: parseFloat(r.amount),
  }));

  // Expense breakdown
  const expenseBreakdown = expenses?.reduce((acc: any, exp: any) => {
    const category = exp.category || 'Other';
    if (!acc[category]) acc[category] = 0;
    if (exp.status === 'approved') {
      acc[category] += parseFloat(exp.amount);
    }
    return acc;
  }, {});

  const expenseChartData = Object.entries(expenseBreakdown || {}).map(([category, amount]) => ({
    category,
    amount,
  }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Finance & Accounting</h1>
            <p className="text-muted-foreground">Track revenue, expenses, and financial performance</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Total Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">P{totalIncome.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">From ticket sales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Total Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">P{totalExpenses.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{pendingExpenses} pending approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Net Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                P{netProfit.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">Income - Expenses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Profit Margin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{profitMargin}%</p>
              <p className="text-xs text-muted-foreground">Net profit / Revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="expenses">Expense Management</TabsTrigger>
            <TabsTrigger value="analysis">Revenue Analysis</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend (Last 30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Expense Breakdown by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={expenseChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="amount" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {income.slice(0, 20).map((transaction: any) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-500">Income</Badge>
                        </TableCell>
                        <TableCell>Ticket Sale</TableCell>
                        <TableCell className="font-bold text-green-600">+P{parseFloat(transaction.amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Confirmed
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-4">
            <div className="flex gap-4 mb-4">
              <Select value={expenseFilter} onValueChange={setExpenseFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="fuel">Fuel</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="salary">Salary</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Expense Records</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No expenses recorded
                        </TableCell>
                      </TableRow>
                    ) : (
                      expenses?.map((expense: any) => (
                        <TableRow key={expense.id}>
                          <TableCell>{format(new Date(expense.expense_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{expense.category}</Badge>
                          </TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell className="font-bold text-red-600">-P{parseFloat(expense.amount).toFixed(2)}</TableCell>
                          <TableCell>
                            {expense.status === 'approved' && (
                              <Badge className="bg-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approved
                              </Badge>
                            )}
                            {expense.status === 'pending' && (
                              <Badge className="bg-orange-500">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                            {expense.status === 'rejected' && (
                              <Badge className="bg-red-500">
                                <XCircle className="h-3 w-3 mr-1" />
                                Rejected
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {expense.status === 'pending' && (
                              <Button 
                                size="sm" 
                                onClick={() => approveMutation.mutate(expense.id)}
                                disabled={approveMutation.isPending}
                              >
                                Approve
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
          </TabsContent>

          {/* Revenue Analysis Tab */}
          <TabsContent value="analysis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analysis - Coming Soon</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Detailed revenue analysis by route, branch, driver, and time period will be available here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
