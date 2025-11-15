import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import FinanceLayout from '@/components/finance/FinanceLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, 
  TrendingDown, 
  TrendingUp, 
  Ticket, 
  Fuel, 
  AlertCircle,
  BarChart3,
  Users
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function FinanceDashboard() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : FinanceLayout;

  const { data: income = [] } = useQuery({
    queryKey: ['finance-income'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('income_records')
        .select('*')
        .eq('status', 'confirmed')
        .order('date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['finance-expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_records')
        .select('*')
        .in('status', ['approved', 'paid'])
        .order('date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['finance-invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: refunds = [] } = useQuery({
    queryKey: ['finance-refunds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('refund_requests')
        .select('*')
        .eq('status', 'pending');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: fuelLogs = [] } = useQuery({
    queryKey: ['finance-fuel'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_logs')
        .select('*')
        .eq('status', 'approved')
        .gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: payrollData = [] } = useQuery({
    queryKey: ['finance-payroll'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll')
        .select('*')
        .gte('pay_period_start', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
      if (error) throw error;
      return data || [];
    },
  });

  const today = new Date().toISOString().split('T')[0];
  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisYear = new Date().getFullYear().toString();

  const todayRevenue = income.filter((i: any) => i.date === today).reduce((sum: number, i: any) => sum + parseFloat(i.amount || 0), 0);
  const monthRevenue = income.filter((i: any) => i.date?.startsWith(thisMonth)).reduce((sum: number, i: any) => sum + parseFloat(i.amount || 0), 0);
  const yearRevenue = income.filter((i: any) => i.date?.startsWith(thisYear)).reduce((sum: number, i: any) => sum + parseFloat(i.amount || 0), 0);

  const todayExpenses = expenses.filter((e: any) => e.date === today).reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0);
  const monthExpenses = expenses.filter((e: any) => e.date?.startsWith(thisMonth)).reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0);
  const yearExpenses = expenses.filter((e: any) => e.date?.startsWith(thisYear)).reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0);

  const ticketSales = income.filter((i: any) => i.source === 'ticket_sales' && i.date?.startsWith(thisMonth)).reduce((sum: number, i: any) => sum + parseFloat(i.amount || 0), 0);
  const fuelCost = fuelLogs.reduce((sum: number, f: any) => sum + parseFloat(f.total_cost || 0), 0);
  const payrollCost = payrollData.reduce((sum: number, p: any) => sum + parseFloat(p.net_salary || 0), 0);

  const profitLoss = monthRevenue - monthExpenses;
  const profitMargin = monthRevenue > 0 ? ((profitLoss / monthRevenue) * 100).toFixed(1) : 0;

  const financialSummary = {
    todayRevenue,
    monthRevenue,
    yearRevenue,
    todayExpenses,
    monthExpenses,
    yearExpenses,
    profitLoss,
    profitMargin: parseFloat(profitMargin.toString()),
  };

  const overdueInvoices = invoices.filter((inv: any) => {
    const dueDate = new Date(inv.due_date);
    return dueDate < new Date() && inv.status !== 'paid';
  });

  const pendingRefunds = refunds.length;
  const totalRefundAmount = refunds.reduce((sum: number, r: any) => sum + parseFloat(r.refunded_amount || 0), 0);

  const alerts = [
    overdueInvoices.length > 0 && { id: 1, type: 'warning', message: `${overdueInvoices.length} overdue invoices`, priority: 'high' },
    pendingRefunds > 0 && { id: 2, type: 'info', message: `${pendingRefunds} pending refund requests`, priority: 'medium' },
  ].filter(Boolean);

  const routeRevenue = income.reduce((acc: any[], inc: any) => {
    if (inc.route_id) {
      const existing = acc.find(r => r.route_id === inc.route_id);
      if (existing) {
        existing.revenue += parseFloat(inc.amount || 0);
        existing.count += 1;
      } else {
        acc.push({ route_id: inc.route_id, revenue: parseFloat(inc.amount || 0), count: 1 });
      }
    }
    return acc;
  }, []);

  const topRoutes = routeRevenue.sort((a, b) => b.revenue - a.revenue).slice(0, 3);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Finance Dashboard</h1>
          <p className="text-muted-foreground">Real-time financial overview and management</p>
        </div>

        {/* Revenue & Expenses Overview */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {financialSummary.todayRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Month: P {financialSummary.monthRevenue.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {financialSummary.todayExpenses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Month: P {financialSummary.monthExpenses.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {financialSummary.profitLoss.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Margin: {financialSummary.profitMargin}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Year Revenue</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {(financialSummary.yearRevenue / 1000000).toFixed(1)}M</div>
              <p className="text-xs text-muted-foreground">
                Expenses: P {(financialSummary.yearExpenses / 1000000).toFixed(1)}M
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Breakdown */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Sales</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {(ticketSales / 1000).toFixed(0)}K</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fuel Costs</CardTitle>
              <Fuel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {(fuelCost / 1000).toFixed(0)}K</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payroll</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {(payrollCost / 1000).toFixed(0)}K</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Financial Alerts
            </CardTitle>
            <CardDescription>Important notifications requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <AlertCircle className={`h-5 w-5 ${alert.priority === 'high' ? 'text-red-500' : 'text-yellow-500'}`} />
                  <div className="flex-1">
                    <p className="text-sm">{alert.message}</p>
                  </div>
                  <Badge className={alert.priority === 'high' ? 'bg-red-500' : alert.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}>
                    {alert.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Routes */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Routes</CardTitle>
            <CardDescription>Highest revenue generators this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topRoutes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No route data available</p>
              ) : (
                topRoutes.map((route, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Route #{route.route_id?.slice(0, 8)}</div>
                      <div className="text-sm text-muted-foreground">{route.count} transactions</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">P {route.revenue.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Revenue</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Outstanding Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Outstanding Payments</CardTitle>
            <CardDescription>Pending refunds and receivables</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">Pending Refunds</div>
                <div className="text-2xl font-bold text-red-600">P {totalRefundAmount.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">{pendingRefunds} requests</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">Overdue Invoices</div>
                <div className="text-2xl font-bold text-orange-600">P {overdueInvoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.balance || 0), 0).toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">{overdueInvoices.length} invoices</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
