import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import MaintenanceLayout from '@/components/maintenance/MaintenanceLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, TrendingUp, BarChart3, Download } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Costs() {
  const { data: costs = [] } = useQuery({
    queryKey: ['maintenance-costs'],
    queryFn: async () => {
      const response = await api.get('/maintenance/maintenance-costs');
      return Array.isArray(response.data) ? response.data : (response.data?.costs || []);
    },
  });

  const { data: buses = [] } = useQuery({
    queryKey: ['buses'],
    queryFn: async () => {
      const response = await api.get('/buses');
      return Array.isArray(response.data) ? response.data : (response.data?.buses || []);
    },
  });

  const costsByBusMap = costs.reduce((acc: any, cost: any) => {
    const busId = cost.busId;
    if (!acc[busId]) {
      acc[busId] = { parts: 0, labor: 0, external: 0, total: 0 };
    }
    acc[busId][cost.category] = (acc[busId][cost.category] || 0) + parseFloat(cost.amount);
    acc[busId].total += parseFloat(cost.amount);
    return acc;
  }, {});

  const costsByBus = Object.entries(costsByBusMap).map(([busId, data]: any) => {
    const bus = buses.find((b: any) => b.id === busId);
    return {
      bus: bus?.registrationNumber || 'Unknown',
      parts: data.parts || 0,
      labor: data.labor || 0,
      total: data.total,
      budget: 25000,
      percentage: Math.round((data.total / 25000) * 100),
    };
  });

  const summary = {
    totalCosts: costs.reduce((sum: number, c: any) => sum + parseFloat(c.amount), 0),
    partsCost: costs.filter((c: any) => c.category === 'parts').reduce((sum: number, c: any) => sum + parseFloat(c.amount), 0),
    laborCost: costs.filter((c: any) => c.category === 'labor').reduce((sum: number, c: any) => sum + parseFloat(c.amount), 0),
    budgetStatus: 85,
  };

  return (
    <MaintenanceLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Cost Management</h1>
            <p className="text-muted-foreground">Track maintenance costs and budget</p>
          </div>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
              <DollarSign className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">P {summary.totalCosts.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Parts Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {summary.partsCost.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">62% of total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Labor Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {summary.laborCost.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">38% of total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Status</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.budgetStatus}%</div>
              <p className="text-xs text-muted-foreground">Within budget</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown by Bus</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bus</TableHead>
                  <TableHead className="text-right">Parts Cost</TableHead>
                  <TableHead className="text-right">Labor Cost</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">% of Budget</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costsByBus.map((item) => (
                  <TableRow key={item.bus}>
                    <TableCell className="font-medium">{item.bus}</TableCell>
                    <TableCell className="text-right">P {item.parts.toLocaleString()}</TableCell>
                    <TableCell className="text-right">P {item.labor.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold">P {item.total.toLocaleString()}</TableCell>
                    <TableCell className="text-right">P {item.budget.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={item.percentage > 100 ? 'text-red-600 font-bold' : 'text-green-600'}>
                        {item.percentage}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={item.percentage > 100 ? 'text-red-600' : 'text-green-600'}>
                        {item.percentage > 100 ? 'Over Budget' : 'Within Budget'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Cost trend chart will be displayed here</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cost by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Engine & Transmission</span>
                  <span className="font-bold">P 125,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Brakes & Suspension</span>
                  <span className="font-bold">P 95,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Electrical</span>
                  <span className="font-bold">P 65,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Body & Interior</span>
                  <span className="font-bold">P 45,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tires & Wheels</span>
                  <span className="font-bold">P 85,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Other</span>
                  <span className="font-bold">P 35,000</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MaintenanceLayout>
  );
}
