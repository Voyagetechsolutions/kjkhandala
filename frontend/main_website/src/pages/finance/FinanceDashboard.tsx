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

  const { data: bookings = [] } = useQuery({
    queryKey: ['finance-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['finance-expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });
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
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
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

  const { data: trips = [] } = useQuery({
    queryKey: ['finance-trips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          id,
          trip_number,
          route:routes(id, origin, destination)
        `);
      if (error) throw error;
      return data || [];
    },
  });

  const today = new Date().toISOString().split('T')[0];
  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisYear = new Date().getFullYear().toString();

  // Revenue from bookings
  const todayRevenue = bookings.filter((b: any) => b.created_at?.startsWith(today)).reduce((sum: number, b: any) => sum + parseFloat(b.total_amount || 0), 0);
  const monthRevenue = bookings.filter((b: any) => b.created_at?.startsWith(thisMonth)).reduce((sum: number, b: any) => sum + parseFloat(b.total_amount || 0), 0);
  const yearRevenue = bookings.filter((b: any) => b.created_at?.startsWith(thisYear)).reduce((sum: number, b: any) => sum + parseFloat(b.total_amount || 0), 0);

  // Expenses
  const todayExpenses = expenses.filter((e: any) => e.expense_date === today).reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0);
  const monthExpenses = expenses.filter((e: any) => e.expense_date?.startsWith(thisMonth)).reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0);
  const yearExpenses = expenses.filter((e: any) => e.expense_date?.startsWith(thisYear)).reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0);

  // Category breakdowns
  const ticketSales = monthRevenue; // All bookings are ticket sales
  const fuelCost = expenses.filter((e: any) => e.category === 'fuel' && e.expense_date?.startsWith(thisMonth)).reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0);
  const payrollCost = expenses.filter((e: any) => e.category === 'payroll' && e.expense_date?.startsWith(thisMonth)).reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0);

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
  const totalRefundAmount = refunds.reduce((sum: number, r: any) => sum + parseFloat(r.net_refund || 0), 0);

  // Fuel variance check
  const highVarianceFuel = fuelLogs.filter((f: any) => {
    const expected = parseFloat(f.expected_consumption || 0);
    const actual = parseFloat(f.actual_consumption || 0);
    const variance = Math.abs(actual - expected) / expected;
    return variance > 0.15; // 15% variance threshold
  });

  // Low ticket sales check
  const dailyThreshold = 5000; // P5000 daily target
  const lowSalesToday = todayRevenue < dailyThreshold;

  const alerts = [
    overdueInvoices.length > 0 && { 
      id: 1, 
      type: 'warning', 
      icon: '⚠️',
      message: `Overdue Invoices: ${overdueInvoices.length} invoice${overdueInvoices.length > 1 ? 's' : ''} overdue`, 
      amount: overdueInvoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.amount || 0), 0),
      priority: 'high' 
    },
    pendingRefunds > 0 && { 
      id: 2, 
      type: 'info',
      icon: '⚠️', 
      message: `Pending Refund Requests: ${pendingRefunds} request${pendingRefunds > 1 ? 's' : ''} awaiting approval`, 
      amount: totalRefundAmount,
      priority: 'medium' 
    },
    highVarianceFuel.length > 0 && {
      id: 3,
      type: 'warning',
      icon: '⛽',
      message: `Fuel Variance Warning: ${highVarianceFuel.length} log${highVarianceFuel.length > 1 ? 's' : ''} show high variance`,
      priority: 'medium'
    },
    lowSalesToday && {
      id: 4,
      type: 'warning',
      icon: '📉',
      message: `Low Ticket Sales Today: Sales below daily threshold (P${todayRevenue.toFixed(0)} / P${dailyThreshold})`,
      priority: 'medium'
    },
  ].filter(Boolean);

  // Group bookings by trip to get route revenue
  const tripRevenue = bookings
    .filter((b: any) => b.created_at?.startsWith(thisMonth))
    .reduce((acc: any, booking: any) => {
      const tripId = booking.trip_id;
      if (!acc[tripId]) {
        acc[tripId] = { trip_id: tripId, revenue: 0, count: 0 };
      }
      acc[tripId].revenue += parseFloat(booking.total_amount || 0);
      acc[tripId].count += 1;
      return acc;
    }, {});

  // Map trip revenue to route names
  const topRoutes = Object.values(tripRevenue)
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((tripRev: any) => {
      const trip = trips.find((t: any) => t.id === tripRev.trip_id);
      const route = Array.isArray(trip?.route) ? trip.route[0] : trip?.route;
      return {
        ...tripRev,
        route_name: route ? `${route.origin} → ${route.destination}` : 'Unknown Route',
        trip_number: trip?.trip_number || 'N/A',
      };
    });

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
              {alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No alerts at this time</p>
              ) : (
                alerts.map((alert: any) => (
                  <div key={alert.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <span className="text-2xl">{alert.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alert.message}</p>
                      {alert.amount && (
                        <p className="text-xs text-muted-foreground mt-1">Amount: P {alert.amount.toFixed(2)}</p>
                      )}
                    </div>
                    <Badge variant={alert.priority === 'high' ? 'destructive' : 'secondary'}>
                      {alert.priority}
                    </Badge>
                  </div>
                ))
              )}
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
                topRoutes.map((route: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{route.route_name}</div>
                      <div className="text-sm text-muted-foreground">{route.count} trip{route.count > 1 ? 's' : ''}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">P {route.revenue.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">revenue</div>
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
