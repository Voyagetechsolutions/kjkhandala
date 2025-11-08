import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, Bus, DollarSign, Calendar } from 'lucide-react';

interface StatisticsProps {
  totalRevenue: number;
  totalBookings: number;
  totalPassengers: number;
  activeRoutes: number;
  currency?: string;
  previousPeriod?: {
    revenue: number;
    bookings: number;
  };
}

export default function Statistics({
  totalRevenue,
  totalBookings,
  totalPassengers,
  activeRoutes,
  currency = 'P',
  previousPeriod,
}: StatisticsProps) {
  const calculateChange = (current: number, previous: number) => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  const revenueChange = previousPeriod 
    ? calculateChange(totalRevenue, previousPeriod.revenue)
    : 0;

  const bookingsChange = previousPeriod
    ? calculateChange(totalBookings, previousPeriod.bookings)
    : 0;

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    change, 
    color = 'primary' 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    change?: number;
    color?: string;
  }) => (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color}/10`}>
          <Icon className={`h-6 w-6 text-${color}`} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{title}</div>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Revenue"
        value={`${currency}${totalRevenue.toLocaleString()}`}
        icon={DollarSign}
        change={revenueChange}
        color="primary"
      />
      
      <StatCard
        title="Total Bookings"
        value={totalBookings.toLocaleString()}
        icon={Calendar}
        change={bookingsChange}
        color="secondary"
      />
      
      <StatCard
        title="Total Passengers"
        value={totalPassengers.toLocaleString()}
        icon={Users}
        color="accent"
      />
      
      <StatCard
        title="Active Routes"
        value={activeRoutes}
        icon={Bus}
        color="primary"
      />
    </div>
  );
}
