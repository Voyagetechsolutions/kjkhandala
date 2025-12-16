import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPIMetricsProps {
  metrics: any;
}

export default function KPIMetrics({ metrics }: KPIMetricsProps) {
  const kpis = [
    {
      name: 'On-Time Trips',
      value: '95%',
      target: '>95%',
      status: 'success',
      trend: 'up'
    },
    {
      name: 'Bus Utilization',
      value: metrics?.totalBuses > 0 
        ? `${((metrics.activeBuses / metrics.totalBuses) * 100).toFixed(0)}%`
        : '0%',
      target: '>85%',
      status: metrics?.totalBuses > 0 && (metrics.activeBuses / metrics.totalBuses) >= 0.85 ? 'success' : 'warning',
      trend: 'up'
    },
    {
      name: 'Profit Margin',
      value: `${metrics?.profitMargin || 0}%`,
      target: '>30%',
      status: parseFloat(metrics?.profitMargin || 0) >= 30 ? 'success' : 'warning',
      trend: parseFloat(metrics?.profitMargin || 0) >= 30 ? 'up' : 'down'
    },
    {
      name: 'Driver Attendance',
      value: '95%',
      target: '>95%',
      status: 'success',
      trend: 'stable'
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-orange-600 bg-orange-50';
      case 'danger':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Performance Indicators</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {kpis.map((kpi, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{kpi.name}</p>
                {getTrendIcon(kpi.trend)}
              </div>
              <div className="flex items-center justify-between">
                <div className={`text-2xl font-bold px-3 py-1 rounded-lg ${getStatusColor(kpi.status)}`}>
                  {kpi.value}
                </div>
                <p className="text-xs text-muted-foreground">Target: {kpi.target}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
