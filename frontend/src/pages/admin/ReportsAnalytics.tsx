import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import OperationsLayout from '@/components/operations/OperationsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, TrendingUp, DollarSign, Users, Bus, Calendar } from 'lucide-react';
import { format, addDays } from 'date-fns';

export default function ReportsAnalytics() {
  const location = useLocation();
  const isOperationsRoute = location.pathname.startsWith('/operations');
  const Layout = isOperationsRoute ? OperationsLayout : AdminLayout;

  const [reportType, setReportType] = useState('financial');
  const [dateRangeType, setDateRangeType] = useState('month');
  const [dateRange, setDateRange] = useState({ from: new Date().toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] });
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Fetch daily sales
  const { data: dailySales } = useQuery({
    queryKey: ['daily-sales', selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('total_amount, created_at')
        .gte('created_at', format(selectedDate, 'yyyy-MM-dd'))
        .lt('created_at', format(addDays(selectedDate, 1), 'yyyy-MM-dd'));
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch financial data
  const { data: financialData } = useQuery({
    queryKey: ['financial-report', dateRange],
    queryFn: async () => {
      const { data: income, error: incomeError } = await supabase
        .from('income')
        .select('*')
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to);
      if (incomeError) throw incomeError;
      
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to);
      if (expensesError) throw expensesError;
      
      return { income: income || [], expenses: expenses || [] };
    },
  });

  // Fetch trip performance
  const { data: tripPerformance } = useQuery({
    queryKey: ['trip-performance', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .gte('scheduled_departure', dateRange.from)
        .lte('scheduled_departure', dateRange.to);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch operational data
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*');
      if (bookingsError) throw bookingsError;

      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select('*');
      if (tripsError) throw tripsError;

      const { data: buses, error: busesError } = await supabase
        .from('buses')
        .select('*');
      if (busesError) throw busesError;
      
      return { bookings: bookings || [], trips: trips || [], buses: buses || [] };
    },
  });

  // Fetch HR data
  const { data: hrData } = useQuery({
    queryKey: ['hr-report'],
    queryFn: async () => {
      const { data: staff, error: staffError } = await supabase
        .from('profiles')
        .select('*');
      
      const { data: drivers, error: driverError } = await supabase
        .from('drivers')
        .select('*');
      
      const { data: attendance, error: attError } = await supabase
        .from('staff_attendance')
        .select('*')
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      
      if (staffError || driverError || attError) throw staffError || driverError || attError;
      
      return { staff, drivers, attendance };
    },
  });

  // Calculate financial metrics
  const totalRevenue = financialData?.income?.reduce((sum: number, r: any) => sum + parseFloat(r.amount), 0) || 0;
  const totalExpenses = financialData?.expenses?.reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

  // Calculate operational metrics
  const operationalData = reportsData || { schedules: [] };
  const totalTrips = tripPerformance?.length || 0;
  const completedTrips = tripPerformance?.filter((t: any) => t.status === 'COMPLETED').length || 0;
  const onTimeRate = totalTrips > 0 ? ((completedTrips / totalTrips) * 100).toFixed(1) : '0';

  // Calculate HR metrics
  const totalEmployees = (hrData?.staff?.length || 0) + (hrData?.drivers?.length || 0);
  const activeEmployees = (hrData?.staff?.filter(s => s.status === 'active').length || 0) + 
                          (hrData?.drivers?.filter(d => d.status === 'active').length || 0);

  const handleExportPDF = () => {
    alert('PDF export functionality will be implemented with a PDF library');
  };

  const handleExportExcel = () => {
    alert('Excel export functionality will be implemented with a spreadsheet library');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground">Comprehensive business intelligence and reporting</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button onClick={handleExportExcel}>
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">P{totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Net Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                P{netProfit.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">{profitMargin}% margin</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Bus className="h-4 w-4" />
                Total Trips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalTrips}</p>
              <p className="text-xs text-muted-foreground">{onTimeRate}% on-time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalEmployees}</p>
              <p className="text-xs text-muted-foreground">{activeEmployees} active</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="financial" className="space-y-4">
          <TabsList>
            <TabsTrigger value="financial">Financial Report</TabsTrigger>
            <TabsTrigger value="operational">Operational Report</TabsTrigger>
            <TabsTrigger value="hr">HR Report</TabsTrigger>
            <TabsTrigger value="fleet">Fleet Report</TabsTrigger>
            <TabsTrigger value="custom">Custom Report</TabsTrigger>
          </TabsList>

          {/* Financial Report */}
          <TabsContent value="financial" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Financial Performance Report
                  </CardTitle>
                  <Select value={dateRangeType} onValueChange={setDateRangeType}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Last Week</SelectItem>
                      <SelectItem value="month">Last Month</SelectItem>
                      <SelectItem value="quarter">Last Quarter</SelectItem>
                      <SelectItem value="year">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Revenue Summary */}
                  <div>
                    <h3 className="font-semibold mb-3">Revenue Summary</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Income</p>
                        <p className="text-xl font-bold text-green-600">P{totalRevenue.toFixed(2)}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Expenses</p>
                        <p className="text-xl font-bold text-red-600">P{totalExpenses.toFixed(2)}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Net Profit</p>
                        <p className={`text-xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          P{netProfit.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Expense Breakdown */}
                  <div>
                    <h3 className="font-semibold mb-3">Expense Breakdown by Category</h3>
                    <div className="space-y-2">
                      {['fuel', 'maintenance', 'salary', 'insurance', 'other'].map((category) => {
                        const categoryExpenses = financialData?.expenses?.filter(e => e.category === category) || [];
                        const categoryTotal = categoryExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
                        const percentage = totalExpenses > 0 ? ((categoryTotal / totalExpenses) * 100).toFixed(1) : '0';
                        
                        return (
                          <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="capitalize font-medium">{category}</span>
                            <div className="text-right">
                              <p className="font-bold">P{categoryTotal.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">{percentage}% of total</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Operational Report */}
          <TabsContent value="operational" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bus className="h-5 w-5" />
                  Operational Performance Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Trips</p>
                      <p className="text-xl font-bold">{totalTrips}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Completed Trips</p>
                      <p className="text-xl font-bold text-green-600">{completedTrips}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">On-Time Rate</p>
                      <p className="text-xl font-bold">{onTimeRate}%</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Fleet Utilization</h3>
                    <p className="text-sm text-muted-foreground">
                      Total Buses: {(operationalData && 'buses' in operationalData) ? operationalData.buses?.length || 0 : 0}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Active: {(operationalData && 'buses' in operationalData) ? operationalData.buses?.filter((b: any) => b.status === 'active').length || 0 : 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* HR Report */}
          <TabsContent value="hr" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Human Resources Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Staff</p>
                      <p className="text-xl font-bold">{hrData?.staff?.length || 0}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Drivers</p>
                      <p className="text-xl font-bold">{hrData?.drivers?.length || 0}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Active Employees</p>
                      <p className="text-xl font-bold text-green-600">{activeEmployees}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Attendance (Last 30 Days)</h3>
                    <p className="text-sm text-muted-foreground">
                      Total Records: {hrData?.attendance?.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fleet Report */}
          <TabsContent value="fleet" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bus className="h-5 w-5" />
                  Fleet Management Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Detailed fleet utilization, maintenance frequency, downtime analysis, and fuel efficiency reports.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Custom Report */}
          <TabsContent value="custom" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Custom Report Builder
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground mb-4">
                    Build custom reports by selecting specific data fields and date ranges.
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Report Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g., Monthly Revenue by Route"
                        className="w-full mt-1 px-3 py-2 border rounded-lg"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Data Source</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select data source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bookings">Bookings</SelectItem>
                          <SelectItem value="revenue">Revenue</SelectItem>
                          <SelectItem value="expenses">Expenses</SelectItem>
                          <SelectItem value="trips">Trips</SelectItem>
                          <SelectItem value="drivers">Drivers</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">Start Date</label>
                        <input type="date" className="w-full mt-1 px-3 py-2 border rounded-lg" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">End Date</label>
                        <input type="date" className="w-full mt-1 px-3 py-2 border rounded-lg" />
                      </div>
                    </div>

                    <Button className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
