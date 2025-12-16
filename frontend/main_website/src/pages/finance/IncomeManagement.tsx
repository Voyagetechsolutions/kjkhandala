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
import { Download, Plus, Filter, TrendingUp } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function IncomeManagement() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : FinanceLayout;

  const [showAddForm, setShowAddForm] = useState(false);
  const [filters, setFilters] = useState({
    source: 'all',
    dateFrom: '',
    dateTo: '',
    route: 'all',
  });

  const [newIncome, setNewIncome] = useState({
    date: new Date().toISOString().split('T')[0],
    source: 'tickets',
    description: '',
    amount: '',
    route: '',
    reference: '',
  });

  const queryClient = useQueryClient();

  const { data: incomeData, isLoading } = useQuery({
    queryKey: ['income', filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('income')
        .select('*')
        .gte('date', filters.dateFrom)
        .lte('date', filters.dateTo)
        .order('date', { ascending: false });
      if (error) throw error;
      return { records: data || [], summary: {} };
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await supabase
        .from('income')
        .insert(data);
      await api.post('/finance/income', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-income'] });
      toast.success('Income record added successfully');
      setShowAddForm(false);
      setNewIncome({
        date: new Date().toISOString().split('T')[0],
        source: 'tickets',
        description: '',
        amount: '',
        route: '',
        reference: '',
      });
    },
    onError: () => {
      toast.error('Failed to add income record');
    },
  });

  const incomeRecords = incomeData?.records || [];
  
  const filteredRecords = incomeRecords.filter((record: any) => {
    if (filters.source !== 'all' && record.source !== filters.source) return false;
    if (filters.route !== 'all' && record.route !== filters.route) return false;
    if (filters.dateFrom && record.date < filters.dateFrom) return false;
    if (filters.dateTo && record.date > filters.dateTo) return false;
    return true;
  });

  const summary = {
    ticketRevenue: incomeRecords.filter((r: any) => r.source?.toLowerCase().includes('ticket')).reduce((sum: number, r: any) => sum + parseFloat(r.amount || 0), 0),
    cargoRevenue: incomeRecords.filter((r: any) => r.source?.toLowerCase().includes('cargo')).reduce((sum: number, r: any) => sum + parseFloat(r.amount || 0), 0),
    charterIncome: incomeRecords.filter((r: any) => r.source?.toLowerCase().includes('charter')).reduce((sum: number, r: any) => sum + parseFloat(r.amount || 0), 0),
    commissionIncome: incomeRecords.filter((r: any) => r.source?.toLowerCase().includes('commission')).reduce((sum: number, r: any) => sum + parseFloat(r.amount || 0), 0),
    totalIncome: incomeRecords.reduce((sum: number, r: any) => sum + parseFloat(r.amount || 0), 0),
  };

  const handleAddIncome = () => {
    createMutation.mutate(newIncome);
  };

  const handleExport = () => {
    toast.info('Export functionality coming soon');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Income Management</h1>
            <p className="text-muted-foreground">Track all incoming revenue streams</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Income
            </Button>
            <Button onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {summary.ticketRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cargo Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {summary.cargoRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Charter Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {summary.charterIncome.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commission</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {summary.commissionIncome.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">P {summary.totalIncome.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">This month</p>
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
                <Label>Income Source</Label>
                <Select value={filters.source} onValueChange={(v) => setFilters({...filters, source: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="tickets">Ticket Sales</SelectItem>
                    <SelectItem value="cargo">Cargo/Parcel</SelectItem>
                    <SelectItem value="charter">Charter/Private Hire</SelectItem>
                    <SelectItem value="commission">Agent Commission</SelectItem>
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
              <div>
                <Label>Route</Label>
                <Select value={filters.route} onValueChange={(v) => setFilters({...filters, route: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Routes</SelectItem>
                    <SelectItem value="route1">Gaborone - Francistown</SelectItem>
                    <SelectItem value="route2">Gaborone - Maun</SelectItem>
                    <SelectItem value="route3">Francistown - Kasane</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Income Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>Income Records</CardTitle>
            <CardDescription>Detailed transaction history</CardDescription>
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
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomeRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>{record.source}</TableCell>
                    <TableCell>{record.description}</TableCell>
                    <TableCell>{record.route}</TableCell>
                    <TableCell className="font-mono text-sm">{record.reference}</TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      P {record.amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add Income Dialog */}
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Income Record</DialogTitle>
              <DialogDescription>Record a new income transaction</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newIncome.date}
                    onChange={(e) => setNewIncome({...newIncome, date: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Source</Label>
                  <Select value={newIncome.source} onValueChange={(v) => setNewIncome({...newIncome, source: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tickets">Ticket Sales</SelectItem>
                      <SelectItem value="cargo">Cargo/Parcel</SelectItem>
                      <SelectItem value="charter">Charter/Private Hire</SelectItem>
                      <SelectItem value="commission">Agent Commission</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  placeholder="Enter description"
                  value={newIncome.description}
                  onChange={(e) => setNewIncome({...newIncome, description: e.target.value})}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Amount (P)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newIncome.amount}
                    onChange={(e) => setNewIncome({...newIncome, amount: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Reference Number</Label>
                  <Input
                    placeholder="REF-001"
                    value={newIncome.reference}
                    onChange={(e) => setNewIncome({...newIncome, reference: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button onClick={() => setShowAddForm(false)}>Cancel</Button>
                <Button onClick={handleAddIncome}>Add Income</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
