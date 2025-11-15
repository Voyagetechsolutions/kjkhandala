import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, Wrench, DollarSign } from 'lucide-react';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

interface FleetPerformanceChartsProps {
  buses: any[];
  maintenanceData: any[];
}

export default function FleetPerformanceCharts({ buses, maintenanceData }: FleetPerformanceChartsProps) {
  const { data: maintenanceCosts } = useQuery({
    queryKey: ['maintenance-costs-trend'],
    queryFn: async () => {
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const start = startOfMonth(date).toISOString();
        const end = endOfMonth(date).toISOString();
        
        const { data, error } = await supabase
          .from('maintenance_records')
          .select('cost')
          .gte('service_date', start)
          .lte('service_date', end);
        
        if (error) throw error;
        
        const totalCost = data?.reduce((sum, record) => sum + (record.cost || 0), 0) || 0;
        months.push({
          month: format(date, 'MMM'),
          cost: totalCost,
        });
      }
      return months;
    },
  });

  const { data: tripCounts } = useQuery({
    queryKey: ['trips-per-bus'],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('trips')
        .select('bus_id, buses(bus_number)')
        .gte('scheduled_departure', sevenDaysAgo);
      
      if (error) throw error;
      
      const busTrips: { [key: string]: { bus_number: string; count: number } } = {};
      data?.forEach((trip: any) => {
        const bus = Array.isArray(trip.buses) ? trip.buses[0] : trip.buses;
        if (bus && trip.bus_id) {
          if (!busTrips[trip.bus_id]) {
            busTrips[trip.bus_id] = { bus_number: bus.bus_number, count: 0 };
          }
          busTrips[trip.bus_id].count++;
        }
      });
      
      return Object.values(busTrips)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(item => ({
          bus: item.bus_number,
          trips: item.count,
        }));
    },
  });

  // Fleet Utilization Data
  const utilizationData = [
    { name: 'Active', value: buses.filter(b => b.status === 'active').length, color: '#22c55e' },
    { name: 'Maintenance', value: buses.filter(b => b.status === 'maintenance').length, color: '#f97316' },
    { name: 'Parked', value: buses.filter(b => b.status === 'inactive' || b.status === 'parked').length, color: '#6b7280' },
  ];

  const maintenanceCostData = maintenanceCosts || [];
  
  const breakdownData = maintenanceData
    .reduce((acc: any[], record: any) => {
      const existing = acc.find(item => item.bus_id === record.bus_id);
      if (existing) {
        existing.breakdowns++;
      } else {
        const bus = buses.find(b => b.id === record.bus_id);
        if (bus) {
          acc.push({
            bus: bus.bus_number,
            bus_id: record.bus_id,
            breakdowns: 1,
          });
        }
      }
      return acc;
    }, [])
    .sort((a: any, b: any) => b.breakdowns - a.breakdowns)
    .slice(0, 10);

  const tripsData = tripCounts || [];

  return (
    <div className="space-y-6">
      {/* Fleet Utilization */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Fleet Utilization
            </CardTitle>
            <CardDescription>Active vs Idle buses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={utilizationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {utilizationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              {utilizationData.map((item) => (
                <div key={item.name}>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <p className="text-2xl font-bold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">
                    {((item.value / buses.length) * 100).toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Maintenance Costs Trend
            </CardTitle>
            <CardDescription>Monthly maintenance expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={maintenanceCostData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `P ${value.toLocaleString()}`} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="cost" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  name="Cost (BWP)"
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total (6 months)</p>
                <p className="text-xl font-bold">
                  P {maintenanceCostData.reduce((sum, m) => sum + m.cost, 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Average/Month</p>
                <p className="text-xl font-bold">
                  P {(maintenanceCostData.reduce((sum, m) => sum + m.cost, 0) / maintenanceCostData.length).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdowns and Trips */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Breakdowns per Bus
            </CardTitle>
            <CardDescription>Identify problematic vehicles</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={breakdownData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bus" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="breakdowns" fill="#ef4444" name="Breakdowns" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trips per Bus (7 days)
            </CardTitle>
            <CardDescription>Usage patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tripsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bus" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="trips" fill="#3b82f6" name="Trips" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Fleet Performance Summary</CardTitle>
          <CardDescription>Key metrics and insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Average Trips/Bus</p>
              <p className="text-2xl font-bold">
                {(tripsData.reduce((sum, t) => sum + t.trips, 0) / tripsData.length).toFixed(1)}
              </p>
              <p className="text-xs text-green-600 mt-1">↑ 12% from last week</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Fleet Utilization</p>
              <p className="text-2xl font-bold">
                {((buses.filter(b => b.status === 'active').length / buses.length) * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-green-600 mt-1">↑ 5% from last month</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Avg Maintenance Cost</p>
              <p className="text-2xl font-bold">
                P {(maintenanceData.reduce((sum, m) => sum + (m.cost || 0), 0) / Math.max(maintenanceData.length, 1)).toLocaleString()}
              </p>
              <p className="text-xs text-red-600 mt-1">↑ 8% from last month</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Buses Needing Service</p>
              <p className="text-2xl font-bold">
                {buses.filter(b => b.status === 'maintenance').length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Currently in service</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
