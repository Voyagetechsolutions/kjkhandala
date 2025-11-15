import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import HRLayout from '@/components/hr/HRLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, BarChart3, Users, TrendingUp, Calendar, FileText } from 'lucide-react';

export default function HRReports() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : HRLayout;
  const [selectedReport, setSelectedReport] = useState('headcount');
  const [period, setPeriod] = useState('month');
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['hr-reports'],
    queryFn: async () => {
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('*');
      if (empError) throw empError;
      
      const { data: attendance, error: attError } = await supabase
        .from('attendance')
        .select('*');
      if (attError) throw attError;
      
      return { employees: employees || [], attendance: attendance || [] };
    },
  });

  const employees = reportsData?.employees || [];
  const attendance = reportsData?.attendance || [];

  const reports = [
    { id: 'headcount', name: 'Headcount Report', icon: Users, color: 'text-blue-600', description: 'Employee count by department' },
    { id: 'attendance', name: 'Attendance Report', icon: Calendar, color: 'text-green-600', description: 'Attendance trends and patterns' },
    { id: 'leave', name: 'Leave Report', icon: Calendar, color: 'text-orange-600', description: 'Leave utilization analysis' },
    { id: 'turnover', name: 'Turnover Report', icon: TrendingUp, color: 'text-red-600', description: 'Employee turnover metrics' },
    { id: 'performance', name: 'Performance Report', icon: BarChart3, color: 'text-purple-600', description: 'Performance evaluation summary' },
    { id: 'compliance', name: 'Compliance Report', icon: FileText, color: 'text-indigo-600', description: 'Certifications and compliance status' },
    { id: 'payroll', name: 'Payroll Summary', icon: FileText, color: 'text-green-600', description: 'Payroll costs and breakdown' },
    { id: 'recruitment', name: 'Recruitment Report', icon: Users, color: 'text-blue-600', description: 'Hiring pipeline and metrics' },
  ];

  const handleGenerate = () => {
    console.log('Generating report:', selectedReport, period, dateRange);
  };

  const handleExport = (format: string) => {
    console.log(`Exporting ${selectedReport} as ${format}`);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">HR Reports & Analytics</h1>
            <p className="text-muted-foreground">Generate comprehensive HR insights and reports</p>
          </div>
        </div>

        {/* Report Selection Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <Card
                key={report.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedReport === report.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedReport(report.id)}
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <Icon className={`h-10 w-10 mb-3 ${report.color}`} />
                    <h3 className="font-medium mb-1">{report.name}</h3>
                    <p className="text-xs text-muted-foreground">{report.description}</p>
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
            <CardDescription>Configure report settings and filters</CardDescription>
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
            <div className="text-center py-16 text-muted-foreground">
              <BarChart3 className="h-20 w-20 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Click "Generate Report" to view data</p>
              <p className="text-sm">Report will be displayed here with charts, tables, and analytics</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{employees.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {employees.filter((e: any) => e.status === 'active').length} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Avg Attendance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {attendance.length > 0 
                  ? `${((attendance.filter((a: any) => a.status === 'present').length / attendance.length) * 100).toFixed(1)}%`
                  : 'N/A'
                }
              </div>
              <p className="text-xs text-muted-foreground mt-1">Current period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Turnover Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {employees.length > 0
                  ? `${((employees.filter((e: any) => e.status === 'terminated').length / employees.length) * 100).toFixed(1)}%`
                  : 'N/A'
                }
              </div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
