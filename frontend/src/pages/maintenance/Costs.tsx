import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import MaintenanceLayout from '@/components/maintenance/MaintenanceLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : MaintenanceLayout;

  // Fetch costs
  const { data: costsData, isLoading } = useQuery({
    queryKey: ['maintenance-costs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_records')
        .select('*');

      if (error) {
        console.error('Costs fetch error:', error);
        return [];
      }
      return data || [];
    },
  });

  // Fetch buses
  const { data: buses = [] } = useQuery({
    queryKey: ['buses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('buses').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const costs = costsData || [];

  // Group costs per bus
  const costsByBusMap: any = {};
  costs.forEach((cost: any) => {
    const busId = cost.busId;
    if (!costsByBusMap[busId]) {
      costsByBusMap[busId] = { parts: 0, labor: 0, external: 0, total: 0 };
    }
    costsByBusMap[busId][cost.category] = 
      (costsByBusMap[busId][cost.category] || 0) + parseFloat(cost.amount);
    costsByBusMap[busId].total += parseFloat(cost.amount);
  });

  const costsByBus = Object.entries(costsByBusMap).map(([busId, data]: any) => {
    const bus = buses.find((b: any) => b.id === busId);
    const budget = bus?.maintenance_budget || 0; // dynamic if you add budget column later

    return {
      bus: bus?.registrationNumber || 'Unknown',
      parts: data.parts || 0,
      labor: data.labor || 0,
      external: data.external || 0,
      total: data.total || 0,
      budget: budget,
      percentage: budget > 0 ? Math.round((data.total / budget) * 100) : 0,
    };
  });

  // Summary
  const summary = {
    totalCosts: costs.reduce((s, c) => s + parseFloat(c.amount), 0),
    partsCost: costs
      .filter((c: any) => c.category === 'parts')
      .reduce((s, c) => s + parseFloat(c.amount), 0),
    laborCost: costs
      .filter((c: any) => c.category === 'labor')
      .reduce((s, c) => s + parseFloat(c.amount), 0),
  };

  // Category totals
  const categoryTotals = costs.reduce((acc: any, cost: any) => {
    if (!acc[cost.category]) acc[cost.category] = 0;
    acc[cost.category] += parseFloat(cost.amount);
    return acc;
  }, {});

  return (
    <Layout>
      <div className="space-y-6">

        {/* HEADER */}
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

        {/* TOP CARDS */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
              <DollarSign className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                P {summary.totalCosts.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Parts Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                P {summary.partsCost.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Labor Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                P {summary.laborCost.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COSTS BY BUS */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown by Bus</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bus</TableHead>
                  <TableHead className="text-right">Parts</TableHead>
                  <TableHead className="text-right">Labor</TableHead>
                  <TableHead className="text-right">External</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">% of Budget</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costsByBus.map((item) => (
                  <TableRow key={item.bus}>
                    <TableCell className="font-medium">{item.bus}</TableCell>
                    <TableCell className="text-right">P {item.parts.toLocaleString()}</TableCell>
                    <TableCell className="text-right">P {item.labor.toLocaleString()}</TableCell>
                    <TableCell className="text-right">P {item.external.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold">P {item.total.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {item.budget ? `P ${item.budget.toLocaleString()}` : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.budget ? (
                        <span className={item.percentage > 100 ? 'text-red-600' : 'text-green-600'}>
                          {item.percentage}%
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* CATEGORY TOTALS */}
        <Card>
          <CardHeader>
            <CardTitle>Cost by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(categoryTotals).map(([category, value]: any) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="capitalize">{category}</span>
                  <span className="font-bold">P {value.toLocaleString()}</span>
                </div>
              ))}

              {Object.keys(categoryTotals).length === 0 && (
                <p className="text-muted-foreground text-center py-6">
                  No cost data available.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* TREND (DYNAMIC WHEN DATA EXISTS) */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Trend charts will appear once trend data is added.</p>
            </div>
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}
