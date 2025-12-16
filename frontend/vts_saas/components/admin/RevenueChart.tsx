import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface RevenueData {
  date: string;
  revenue: number;
  bookings: number;
}

interface RevenueChartProps {
  data: RevenueData[];
  currency?: string;
}

export default function RevenueChart({ data, currency = 'P' }: RevenueChartProps) {
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));
  }, [data]);

  const totalRevenue = useMemo(() => {
    return data.reduce((sum, item) => sum + item.revenue, 0);
  }, [data]);

  const totalBookings = useMemo(() => {
    return data.reduce((sum, item) => sum + item.bookings, 0);
  }, [data]);

  const averageRevenue = useMemo(() => {
    return data.length > 0 ? totalRevenue / data.length : 0;
  }, [data, totalRevenue]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="text-sm text-muted-foreground mb-1">Total Revenue</div>
          <div className="text-3xl font-bold text-primary">
            {currency}{totalRevenue.toFixed(2)}
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="text-sm text-muted-foreground mb-1">Total Bookings</div>
          <div className="text-3xl font-bold text-secondary">
            {totalBookings}
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="text-sm text-muted-foreground mb-1">Average Daily Revenue</div>
          <div className="text-3xl font-bold text-accent">
            {currency}{averageRevenue.toFixed(2)}
          </div>
        </Card>
      </div>

      {/* Revenue Bar Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Daily Revenue</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => [`${currency}${value.toFixed(2)}`, 'Revenue']}
            />
            <Legend />
            <Bar dataKey="revenue" fill="#DC2626" name="Revenue" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Bookings Line Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Daily Bookings</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="bookings" 
              stroke="#1E3A8A" 
              strokeWidth={2}
              name="Bookings"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
