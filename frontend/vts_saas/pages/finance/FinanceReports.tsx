import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import FinanceLayout from '@/components/finance/FinanceLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileText, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export default function FinanceReports() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : FinanceLayout;

  const [reportType, setReportType] = useState('revenue');
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  const { data: revenueData = [], isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-report', dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_revenue_summary')
        .select('*')
        .gte('date', dateFrom)
        .lte('date', dateTo)
        .order('date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: reportType === 'revenue',
  });

  const { data: expenseData = [], isLoading: expenseLoading } = useQuery({
    queryKey: ['expense-report', dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_expense_summary')
        .select('*')
        .gte('date', dateFrom)
        .lte('date', dateTo)
        .order('date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: reportType === 'expenses',
  });

  const { data: profitLossData = [], isLoading: plLoading } = useQuery({
    queryKey: ['profit-loss-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monthly_profit_loss')
        .select('*')
        .order('month', { ascending: false })
        .limit(12);
      if (error) throw error;
      return data || [];
    },
    enabled: reportType === 'profit_loss',
  });

  const { data: routeProfitability = [], isLoading: routeLoading } = useQuery({
    queryKey: ['route-profitability'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('route_profitability')
        .select('*')
        .order('gross_profit', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: reportType === 'route_profitability',
  });

  const { data: fuelEfficiency = [], isLoading: fuelLoading } = useQuery({
    queryKey: ['fuel-efficiency'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_efficiency_by_bus')
        .select('*')
        .order('avg_fuel_efficiency', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: reportType === 'fuel_efficiency',
  });

  const { data: outstandingInvoices = [], isLoading: invoiceLoading } = useQuery({
    queryKey: ['outstanding-invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outstanding_invoices')
        .select('*')
        .order('days_overdue', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: reportType === 'outstanding_payments',
  });

  const { data: payrollData = [], isLoading: payrollLoading } = useQuery({
    queryKey: ['payroll-report', dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll')
        .select(`
          *,
          employee:profiles(full_name, employee_id, department)
        `)
        .gte('pay_period_start', dateFrom)
        .lte('pay_period_end', dateTo)
        .order('pay_period_start', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: reportType === 'payroll',
  });

  const handleExport = () => {
    toast.success('Export functionality coming soon');
  };

  const renderReportContent = () => {
    const isLoading = revenueLoading || expenseLoading || plLoading || routeLoading || fuelLoading || invoiceLoading || payrollLoading;

    if (isLoading) {
      return <div className="text-center py-8">Loading report data...</div>;
    }

    switch (reportType) {
      case 'revenue':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Total Revenue</TableHead>
                <TableHead>Ticket Sales</TableHead>
                <TableHead>Cargo Revenue</TableHead>
                <TableHead>Charter Revenue</TableHead>
                <TableHead>Transactions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revenueData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">No data available</TableCell>
                </TableRow>
              ) : (
                revenueData.map((row: any) => (
                  <TableRow key={row.date}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell className="font-bold">P {parseFloat(row.total_revenue || 0).toLocaleString()}</TableCell>
                    <TableCell>P {parseFloat(row.ticket_sales || 0).toLocaleString()}</TableCell>
                    <TableCell>P {parseFloat(row.cargo_revenue || 0).toLocaleString()}</TableCell>
                    <TableCell>P {parseFloat(row.charter_revenue || 0).toLocaleString()}</TableCell>
                    <TableCell>{row.transaction_count}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        );

      case 'expenses':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Total Expenses</TableHead>
                <TableHead>Fuel Cost</TableHead>
                <TableHead>Salary Cost</TableHead>
                <TableHead>Maintenance Cost</TableHead>
                <TableHead>Transactions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenseData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">No data available</TableCell>
                </TableRow>
              ) : (
                expenseData.map((row: any) => (
                  <TableRow key={row.date}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell className="font-bold">P {parseFloat(row.total_expenses || 0).toLocaleString()}</TableCell>
                    <TableCell>P {parseFloat(row.fuel_cost || 0).toLocaleString()}</TableCell>
                    <TableCell>P {parseFloat(row.salary_cost || 0).toLocaleString()}</TableCell>
                    <TableCell>P {parseFloat(row.maintenance_cost || 0).toLocaleString()}</TableCell>
                    <TableCell>{row.transaction_count}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        );

      case 'profit_loss':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Total Income</TableHead>
                <TableHead>Total Expenses</TableHead>
                <TableHead>Net Profit</TableHead>
                <TableHead>Profit Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profitLossData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">No data available</TableCell>
                </TableRow>
              ) : (
                profitLossData.map((row: any) => {
                  const income = parseFloat(row.total_income || 0);
                  const expenses = parseFloat(row.total_expenses || 0);
                  const profit = parseFloat(row.net_profit || 0);
                  const margin = income > 0 ? ((profit / income) * 100).toFixed(1) : 0;
                  return (
                    <TableRow key={row.month}>
                      <TableCell>{new Date(row.month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</TableCell>
                      <TableCell className="text-green-600 font-bold">P {income.toLocaleString()}</TableCell>
                      <TableCell className="text-red-600">P {expenses.toLocaleString()}</TableCell>
                      <TableCell className={`font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        P {profit.toLocaleString()}
                      </TableCell>
                      <TableCell>{margin}%</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        );

      case 'route_profitability':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route</TableHead>
                <TableHead>Total Trips</TableHead>
                <TableHead>Total Revenue</TableHead>
                <TableHead>Fuel Cost</TableHead>
                <TableHead>Gross Profit</TableHead>
                <TableHead>Profit Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routeProfitability.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">No data available</TableCell>
                </TableRow>
              ) : (
                routeProfitability.map((row: any) => (
                  <TableRow key={row.route_id}>
                    <TableCell className="font-medium">{row.route_name}</TableCell>
                    <TableCell>{row.total_trips}</TableCell>
                    <TableCell>P {parseFloat(row.total_revenue || 0).toLocaleString()}</TableCell>
                    <TableCell>P {parseFloat(row.fuel_cost || 0).toLocaleString()}</TableCell>
                    <TableCell className="font-bold text-green-600">P {parseFloat(row.gross_profit || 0).toLocaleString()}</TableCell>
                    <TableCell>{parseFloat(row.profit_margin || 0).toFixed(1)}%</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        );

      case 'fuel_efficiency':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bus</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Refuel Count</TableHead>
                <TableHead>Total Fuel (L)</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead>Avg Efficiency (km/L)</TableHead>
                <TableHead>Total Distance (km)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fuelEfficiency.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">No data available</TableCell>
                </TableRow>
              ) : (
                fuelEfficiency.map((row: any) => (
                  <TableRow key={row.bus_id}>
                    <TableCell className="font-medium">{row.registration_number}</TableCell>
                    <TableCell>{row.model}</TableCell>
                    <TableCell>{row.refuel_count}</TableCell>
                    <TableCell>{parseFloat(row.total_fuel_used || 0).toFixed(1)} L</TableCell>
                    <TableCell>P {parseFloat(row.total_fuel_cost || 0).toLocaleString()}</TableCell>
                    <TableCell className="font-bold">{parseFloat(row.avg_fuel_efficiency || 0).toFixed(2)} km/L</TableCell>
                    <TableCell>{parseFloat(row.total_distance || 0).toLocaleString()} km</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        );

      case 'outstanding_payments':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Days Overdue</TableHead>
                <TableHead>Urgency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outstandingInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">No outstanding invoices</TableCell>
                </TableRow>
              ) : (
                outstandingInvoices.map((row: any) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.invoice_number}</TableCell>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.due_date}</TableCell>
                    <TableCell>{row.client_name}</TableCell>
                    <TableCell>P {parseFloat(row.amount || 0).toLocaleString()}</TableCell>
                    <TableCell>P {parseFloat(row.paid_amount || 0).toLocaleString()}</TableCell>
                    <TableCell className="font-bold">P {parseFloat(row.balance || 0).toLocaleString()}</TableCell>
                    <TableCell>{row.days_overdue > 0 ? row.days_overdue : '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        row.urgency === 'overdue' ? 'bg-red-100 text-red-700' :
                        row.urgency === 'due_soon' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {row.urgency}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        );

      case 'payroll':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Gross Salary</TableHead>
                <TableHead>Allowances</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Salary</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">No payroll data available</TableCell>
                </TableRow>
              ) : (
                payrollData.map((row: any) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{row.employee?.full_name || '-'}</div>
                        <div className="text-xs text-muted-foreground">{row.employee?.employee_id || '-'}</div>
                      </div>
                    </TableCell>
                    <TableCell>{row.employee?.department || '-'}</TableCell>
                    <TableCell>{row.pay_period_start} to {row.pay_period_end}</TableCell>
                    <TableCell>P {parseFloat(row.gross_salary || 0).toLocaleString()}</TableCell>
                    <TableCell>P {parseFloat(row.total_allowances || 0).toLocaleString()}</TableCell>
                    <TableCell>P {parseFloat(row.total_deductions || 0).toLocaleString()}</TableCell>
                    <TableCell className="font-bold">P {parseFloat(row.net_salary || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        row.status === 'paid' ? 'bg-green-100 text-green-700' :
                        row.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {row.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        );

      default:
        return <div className="text-center py-8 text-muted-foreground">Select a report type</div>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Reports & Analytics</h1>
            <p className="text-muted-foreground">Generate financial reports and insights</p>
          </div>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Report Parameters
            </CardTitle>
            <CardDescription>Select report type and date range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label>Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue Report</SelectItem>
                    <SelectItem value="expenses">Expense Breakdown</SelectItem>
                    <SelectItem value="profit_loss">Profit & Loss Statement</SelectItem>
                    <SelectItem value="route_profitability">Route Profitability</SelectItem>
                    <SelectItem value="fuel_efficiency">Fuel Efficiency</SelectItem>
                    <SelectItem value="payroll">Payroll Summary</SelectItem>
                    <SelectItem value="outstanding_payments">Outstanding Payments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!['profit_loss', 'route_profitability', 'fuel_efficiency', 'outstanding_payments'].includes(reportType) && (
                <>
                  <div>
                    <Label>From Date</Label>
                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  </div>
                  <div>
                    <Label>To Date</Label>
                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Report Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderReportContent()}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
