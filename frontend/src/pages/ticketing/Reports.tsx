import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import TicketingLayout from '@/components/ticketing/TicketingLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Calendar, TrendingUp, Users, DollarSign } from 'lucide-react';

export default function Reports() {
  const [reportType, setReportType] = useState('daily-sales');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: payments } = useQuery({
    queryKey: ['payments', startDate],
    queryFn: async () => {
      const response = await api.get('/ticketing/payments', { params: { date: startDate } });
      return response.data;
    },
  });

  const handleExport = () => {
    console.log('Exporting report...');
    // In production, this would generate and download a PDF/CSV
  };

  const summary = payments?.summary || { cash: 0, card: 0, mobileMoney: 0, total: 0, count: 0 };

  return (
    <TicketingLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Reports & Audit</h1>
          <p className="text-muted-foreground">Generate and view ticketing reports</p>
        </div>

        {/* Report Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
            <CardDescription>Select report type and date range</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily-sales">Daily Sales Summary</SelectItem>
                    <SelectItem value="payment-breakdown">Payment Breakdown</SelectItem>
                    <SelectItem value="agent-performance">Agent Performance</SelectItem>
                    <SelectItem value="no-shows">No-Show Report</SelectItem>
                    <SelectItem value="route-performance">Route Performance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleExport} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.count}</div>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {summary.total.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Ticket Price</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                P {summary.count > 0 ? (summary.total / summary.count).toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">No-Shows</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>
        </div>

        {/* Available Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Available Reports</CardTitle>
            <CardDescription>Common reports for ticketing operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Daily Sales Summary', desc: 'Total tickets and revenue for the day' },
                { name: 'Payment Breakdown', desc: 'Revenue by payment method (Cash, Card, Mobile)' },
                { name: 'Agent Performance', desc: 'Tickets sold and revenue per agent' },
                { name: 'Route Performance', desc: 'Most popular routes and occupancy rates' },
                { name: 'No-Show Report', desc: 'Passengers who did not board' },
                { name: 'Check-In Report', desc: 'Check-in times and boarding efficiency' },
                { name: 'Refund Report', desc: 'All refunds processed with reasons' },
                { name: 'Audit Log', desc: 'All ticketing transactions and modifications' },
              ].map((report, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted cursor-pointer">
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <p className="text-sm text-muted-foreground">{report.desc}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    Generate
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </TicketingLayout>
  );
}
