import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import OperationsLayout from '@/components/operations/OperationsLayout';
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
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  Activity,
  Users,
  Bus,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function OperationsReports() {
  const [reportType, setReportType] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // Fetch daily report
  const { data: dailyReport, isLoading: isDailyLoading } = useQuery({
    queryKey: ['operations-reports-daily', selectedDate],
    queryFn: async () => {
      const response = await api.get(`/operations/reports/daily?date=${selectedDate}`);
      return response.data;
    },
    enabled: reportType === 'daily',
  });

  // Fetch performance report
  const { data: performanceReport, isLoading: isPerformanceLoading } = useQuery({
    queryKey: ['operations-reports-performance', dateRange],
    queryFn: async () => {
      const response = await api.get(
        `/operations/reports/performance?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      );
      return response.data;
    },
    enabled: reportType === 'performance',
  });

  const report = reportType === 'daily' ? dailyReport?.report : performanceReport?.performance;
  const isLoading = reportType === 'daily' ? isDailyLoading : isPerformanceLoading;

  const handleExport = (format: string) => {
    toast.info(`Export to ${format} coming soon`);
  };

  const reports = [
    { id: 'daily', name: 'Daily Operations Report', icon: Activity, description: 'Daily trip performance and metrics' },
    { id: 'performance', name: 'Performance Report', icon: TrendingUp, description: 'Long-term performance analysis' },
  ];

  return (
    <OperationsLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Reports & Analytics</h1>
            <p className="text-muted-foreground">Generate and export operations reports</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => handleExport('PDF')}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button variant="outline" onClick={() => handleExport('Excel')}>
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Report Type Selection */}
        <div className="grid md:grid-cols-2 gap-4">
          {reports.map((r) => {
            const Icon = r.icon;
            return (
              <Card
                key={r.id}
                className={`cursor-pointer transition-all ${
                  reportType === r.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setReportType(r.id)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">{r.name}</div>
                      <div className="text-sm text-muted-foreground">{r.description}</div>
                    </div>
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
            {reportType === 'daily' ? (
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label>Report Date</Label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
                <Button>Generate Report</Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-4 items-end">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  />
                </div>
                <Button>Generate Report</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report Display */}
        {isLoading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Generating report...</p>
              </div>
            </CardContent>
          </Card>
        ) : report ? (
          <>
            {/* Summary Cards */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
                  <Activity className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{report.totalTrips || 0}</div>
                  {reportType === 'daily' ? (
                    <p className="text-xs text-muted-foreground">For selected date</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">In period</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reportType === 'daily' ? report.completedTrips : report.onTimeTrips || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Successfully completed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {reportType === 'daily' ? 'On-Time %' : 'Delayed'}
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reportType === 'daily' 
                      ? `${report.onTimePerformance || 0}%`
                      : report.delayedTrips || 0
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {reportType === 'daily' ? 'Performance metric' : 'Delayed trips'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {reportType === 'daily' ? 'Total Passengers' : 'Load Factor'}
                  </CardTitle>
                  <Users className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reportType === 'daily' 
                      ? report.totalPassengers || 0
                      : `${report.averageLoadFactor || 0}%`
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {reportType === 'daily' ? 'Total carried' : 'Average capacity used'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Metrics */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Trip Status Breakdown</CardTitle>
                  <CardDescription>Distribution of trip statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span>Completed</span>
                      </div>
                      <div className="font-semibold">
                        {reportType === 'daily' ? report.completedTrips : report.onTimeTrips || 0}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                        <span>Delayed</span>
                      </div>
                      <div className="font-semibold">
                        {report.delayedTrips || 0}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <span>Cancelled</span>
                      </div>
                      <div className="font-semibold">
                        {report.cancelledTrips || 0}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Financial Summary</CardTitle>
                  <CardDescription>Revenue metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Revenue</span>
                      <div className="text-xl font-bold">
                        P {(report.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    {reportType === 'daily' && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total Passengers</span>
                        <div className="text-xl font-bold">{report.totalPassengers || 0}</div>
                      </div>
                    )}
                    {reportType === 'performance' && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Average Load Factor</span>
                        <div className="text-xl font-bold">{report.averageLoadFactor}%</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Insights */}
            {reportType === 'performance' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance Insights
                  </CardTitle>
                  <CardDescription>
                    Period: {dateRange.startDate} to {dateRange.endDate}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">On-Time Rate</div>
                      <div className="text-3xl font-bold">
                        {report.totalTrips > 0
                          ? ((report.onTimeTrips / report.totalTrips) * 100).toFixed(1)
                          : 0}
                        %
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Cancellation Rate</div>
                      <div className="text-3xl font-bold">
                        {report.totalTrips > 0
                          ? ((report.cancelledTrips / report.totalTrips) * 100).toFixed(1)
                          : 0}
                        %
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Average Load</div>
                      <div className="text-3xl font-bold">{report.averageLoadFactor}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select report parameters and click "Generate Report" to view data</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </OperationsLayout>
  );
}
