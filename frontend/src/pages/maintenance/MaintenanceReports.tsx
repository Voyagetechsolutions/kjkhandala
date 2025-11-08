import { useState } from 'react';
import MaintenanceLayout from '@/components/maintenance/MaintenanceLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Download, BarChart3, FileText, TrendingUp, Wrench } from 'lucide-react';

export default function MaintenanceReports() {
  const [selectedReport, setSelectedReport] = useState('cost');
  const [period, setPeriod] = useState('month');
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  const reports = [
    { id: 'cost', name: 'Cost Report', icon: BarChart3, color: 'text-red-600', description: 'Maintenance costs analysis' },
    { id: 'downtime', name: 'Downtime Report', icon: TrendingUp, color: 'text-orange-600', description: 'Vehicle downtime metrics' },
    { id: 'issues', name: 'Frequent Issues', icon: FileText, color: 'text-yellow-600', description: 'Common problems analysis' },
    { id: 'parts', name: 'Parts Consumption', icon: FileText, color: 'text-green-600', description: 'Parts usage tracking' },
    { id: 'productivity', name: 'Mechanic Productivity', icon: Wrench, color: 'text-blue-600', description: 'Mechanic performance' },
    { id: 'compliance', name: 'Compliance Report', icon: FileText, color: 'text-purple-600', description: 'Inspection compliance' },
  ];

  const handleGenerate = () => {
    console.log('Generating report:', selectedReport, period, dateRange);
  };

  const handleExport = (format: string) => {
    console.log(`Exporting ${selectedReport} as ${format}`);
  };

  return (
    <MaintenanceLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Reports & Analytics</h1>
          <p className="text-muted-foreground">Generate maintenance insights and reports</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
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
                    <Icon className={`h-12 w-12 mb-4 ${report.color}`} />
                    <h3 className="font-medium mb-2">{report.name}</h3>
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Report Parameters</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>Report Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-16 text-muted-foreground">
              <BarChart3 className="h-20 w-20 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Click "Generate Report" to view data</p>
              <p className="text-sm">Report will be displayed here with charts and analytics</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MaintenanceLayout>
  );
}
