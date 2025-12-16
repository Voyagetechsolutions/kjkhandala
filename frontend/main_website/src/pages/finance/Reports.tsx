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
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, TrendingUp, TrendingDown, BarChart3, FileText } from 'lucide-react';

export default function Reports() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : FinanceLayout;
  const [selectedReport, setSelectedReport] = useState('revenue');
  const [period, setPeriod] = useState('month');
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  const reports = [
    { id: 'revenue', name: 'Revenue Report', icon: TrendingUp, color: 'text-green-600' },
    { id: 'profit-loss', name: 'Profit & Loss Statement', icon: BarChart3, color: 'text-blue-600' },
    { id: 'expenses', name: 'Expense Breakdown', icon: TrendingDown, color: 'text-red-600' },
    { id: 'route-profitability', name: 'Route Profitability', icon: BarChart3, color: 'text-purple-600' },
    { id: 'fuel-efficiency', name: 'Fuel Efficiency Report', icon: FileText, color: 'text-orange-600' },
    { id: 'payroll', name: 'Payroll Summary', icon: FileText, color: 'text-indigo-600' },
    { id: 'outstanding', name: 'Outstanding Payments', icon: FileText, color: 'text-yellow-600' },
    { id: 'balance-sheet', name: 'Balance Sheet', icon: FileText, color: 'text-gray-600' },
  ];

  const { data: income = [] } = useQuery({
    queryKey: ['finance-income'],
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

  const handleExport = (format: string) => {
    toast.info(`Export to ${format} coming soon`);
  };

  const handleGenerate = () => {
    toast.success('Report generated successfully');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Reports & Analytics</h1>
            <p className="text-muted-foreground">Generate financial insights and reports</p>
          </div>
        </div>

        {/* Report Selection */}
        <div className="grid md:grid-cols-4 gap-4">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <Card
                key={report.id}
                className={`cursor-pointer transition-all ${
                  selectedReport === report.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedReport(report.id)}
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <Icon className={`h-8 w-8 mb-2 ${report.color}`} />
                    <div className="font-medium text-sm">{report.name}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Report Parameters */}
        <Card>
          <CardHeader>
            <CardTitle>Report Parameters</CardTitle>
            <CardDescription>Configure report settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Period</Label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Daily</SelectItem>
                    <SelectItem value="week">Weekly</SelectItem>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="quarter">Quarterly</SelectItem>
                    <SelectItem value="year">Annual</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                />
              </div>
              <div>
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={handleGenerate}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
              <Button onClick={() => handleExport('pdf')}>
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
              <Button onClick={() => handleExport('excel')}>
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
              <Button onClick={() => handleExport('csv')}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Report Preview</CardTitle>
            <CardDescription>
              {reports.find(r => r.id === selectedReport)?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Click "Generate Report" to view data</p>
              <p className="text-sm mt-2">Report will be displayed here with charts and tables</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
