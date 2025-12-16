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
import { Download, Plus, Filter, TrendingUp, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function Income() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : FinanceLayout;
  const queryClient = useQueryClient();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filters, setFilters] = useState({
    source: 'all',
    dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
  });
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    source: 'ticket_sales',
    description: '',
    route_id: '',
    reference_number: '',
    amount: '',
    payment_method: 'cash',
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['routes-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routes')
        .select('id, origin, destination')
        .order('origin');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: incomeRecords = [], isLoading } = useQuery({
    queryKey: ['income-records', filters],
    queryFn: async () => {
      let query = supabase
        .from('income_records')
        .select(`
          *,
          route:routes(origin, destination)
        `)
        .gte('date', filters.dateFrom)
        .lte('date', filters.dateTo)
        .order('date', { ascending: false });

      if (filters.source !== 'all') {
        query = query.eq('source', filters.source);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const createIncome = useMutation({
    mutationFn: async (incomeData: any) => {
      const { data, error } = await supabase
        .from('income_records')
        .insert([{
          ...incomeData,
          amount: parseFloat(incomeData.amount),
          route_id: incomeData.route_id || null,
          recorded_by: user?.id,
          status: 'confirmed'
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income-records'] });
      toast.success('Income record created successfully');
      setShowAddDialog(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        source: 'ticket_sales',
        description: '',
        route_id: '',
        reference_number: '',
        amount: '',
        payment_method: 'cash',
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create income record');
    }
  });

  const handleSubmit = () => {
    if (!formData.date || !formData.source || !formData.amount) {
      toast.error('Please fill all required fields');
      return;
    }
    createIncome.mutate(formData);
  };

  const totalIncome = incomeRecords.reduce((sum, record: any) => sum + parseFloat(record.amount || 0), 0);
  const ticketSales = incomeRecords.filter((r: any) => r.source === 'ticket_sales').reduce((sum, r: any) => sum + parseFloat(r.amount || 0), 0);
  const cargoRevenue = incomeRecords.filter((r: any) => r.source === 'cargo').reduce((sum, r: any) => sum + parseFloat(r.amount || 0), 0);
  const charterRevenue = incomeRecords.filter((r: any) => r.source === 'charter').reduce((sum, r: any) => sum + parseFloat(r.amount || 0), 0);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Income Management</h1>
            <p className="text-muted-foreground">Track and manage all revenue sources</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Income
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {totalIncome.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{incomeRecords.length} transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Sales</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {ticketSales.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {((ticketSales / totalIncome) * 100).toFixed(0)}% of total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cargo Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {cargoRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {((cargoRevenue / totalIncome) * 100).toFixed(0)}% of total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Charter Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {charterRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {((charterRevenue / totalIncome) * 100).toFixed(0)}% of total
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
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label>Source</Label>
                <Select value={filters.source} onValueChange={(value) => setFilters({...filters, source: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="ticket_sales">Ticket Sales</SelectItem>
                    <SelectItem value="cargo">Cargo</SelectItem>
                    <SelectItem value="charter">Charter</SelectItem>
                    <SelectItem value="commission">Commission</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
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
                  source: 'all',
                  dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
                  dateTo: new Date().toISOString().split('T')[0],
                })}>
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Income Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>Income Records</CardTitle>
            <CardDescription>All income transactions for the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : incomeRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No income records found
                    </TableCell>
                  </TableRow>
                ) : (
                  incomeRecords.map((record: any) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.date}</TableCell>
                      <TableCell className="capitalize">{record.source.replace('_', ' ')}</TableCell>
                      <TableCell>{record.description || '-'}</TableCell>
                      <TableCell>
                        {record.route ? `${record.route.origin} - ${record.route.destination}` : '-'}
                      </TableCell>
                      <TableCell>{record.reference_number || '-'}</TableCell>
                      <TableCell className="capitalize">{record.payment_method}</TableCell>
                      <TableCell className="font-bold">P {parseFloat(record.amount).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={record.status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500'}>
                          {record.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add Income Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Income Record</DialogTitle>
              <DialogDescription>Record a new income transaction</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date *</Label>
                  <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                </div>
                <div>
                  <Label>Source *</Label>
                  <Select value={formData.source} onValueChange={(value) => setFormData({...formData, source: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ticket_sales">Ticket Sales</SelectItem>
                      <SelectItem value="cargo">Cargo</SelectItem>
                      <SelectItem value="charter">Charter</SelectItem>
                      <SelectItem value="commission">Commission</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Enter description..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Route (Optional)</Label>
                  <Select value={formData.route_id} onValueChange={(value) => setFormData({...formData, route_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select route (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {routes.map((route: any) => (
                        <SelectItem key={route.id} value={route.id}>
                          {route.origin} - {route.destination}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Reference Number</Label>
                  <Input value={formData.reference_number} onChange={(e) => setFormData({...formData, reference_number: e.target.value})} placeholder="e.g., INV-001" />
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
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={createIncome.isPending}>
                  {createIncome.isPending ? 'Saving...' : 'Save Income'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
