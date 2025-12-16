import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Bus, 
  CheckCircle, 
  Wrench, 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp,
  Fuel,
  Clock
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface RealTimeStatusBarProps {
  metrics: any;
  loading: boolean;
}

/**
 * Real-Time Status Bar Component
 * Displays company-wide metrics at the top of the dashboard
 * Updates every minute with live data
 */
export default function RealTimeStatusBar({ metrics, loading }: RealTimeStatusBarProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(10)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statusCards = [
    {
      title: 'Total Buses',
      value: metrics?.totalBuses || 0,
      icon: Bus,
      description: 'Fleet size',
      color: 'text-blue-600'
    },
    {
      title: 'Active Buses',
      value: metrics?.activeBuses || 0,
      icon: CheckCircle,
      description: 'Currently operating',
      color: 'text-green-600',
      badge: metrics?.totalBuses > 0 
        ? `${((metrics.activeBuses / metrics.totalBuses) * 100).toFixed(0)}%`
        : '0%'
    },
    {
      title: 'In Maintenance',
      value: metrics?.busesInMaintenance || 0,
      icon: Wrench,
      description: 'Under service',
      color: 'text-orange-600'
    },
    {
      title: 'Trips Today',
      value: metrics?.tripsToday || 0,
      icon: Calendar,
      description: 'Scheduled trips',
      color: 'text-purple-600'
    },
    {
      title: 'On-Time Performance',
      value: '95%', // This will be calculated from trip_tracking
      icon: Clock,
      description: 'vs delayed trips',
      color: 'text-green-600'
    },
    {
      title: 'Passengers Today',
      value: metrics?.totalPassengersToday || 0,
      icon: Users,
      description: 'Bookings today',
      color: 'text-indigo-600'
    },
    {
      title: 'Revenue Today',
      value: `P ${(metrics?.revenueToday || 0).toLocaleString()}`,
      icon: DollarSign,
      description: 'Daily income',
      color: 'text-green-600'
    },
    {
      title: 'Revenue This Month',
      value: `P ${(metrics?.revenueThisMonth || 0).toLocaleString()}`,
      icon: TrendingUp,
      description: 'Monthly income',
      color: 'text-green-600'
    },
    {
      title: 'Expenses This Month',
      value: `P ${(metrics?.expensesThisMonth || 0).toLocaleString()}`,
      icon: DollarSign,
      description: 'Total costs',
      color: 'text-red-600'
    },
    {
      title: 'Profit Margin',
      value: `${metrics?.profitMargin || 0}%`,
      icon: TrendingUp,
      description: 'Current month',
      color: parseFloat(metrics?.profitMargin || 0) >= 30 ? 'text-green-600' : 'text-orange-600'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {statusCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold">{card.value}</div>
                {card.badge && (
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                    {card.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
