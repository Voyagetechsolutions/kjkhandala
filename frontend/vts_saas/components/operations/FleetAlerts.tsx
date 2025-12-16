import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, AlertCircle, Clock, Navigation, Wrench, X } from 'lucide-react';
import { format } from 'date-fns';

interface FleetAlertsProps {
  alerts: any[];
}

export default function FleetAlerts({ alerts }: FleetAlertsProps) {
  if (alerts.length === 0) {
    return null;
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'overdue_service':
        return <Wrench className="h-4 w-4" />;
      case 'high_odometer':
        return <AlertCircle className="h-4 w-4" />;
      case 'gps_offline':
        return <Navigation className="h-4 w-4" />;
      case 'off_route':
        return <Navigation className="h-4 w-4" />;
      case 'delay':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-900';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  const getAlertBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">Medium</Badge>;
      default:
        return <Badge variant="outline">Low</Badge>;
    }
  };

  const getAlertTitle = (type: string) => {
    switch (type) {
      case 'overdue_service':
        return 'Overdue Service';
      case 'high_odometer':
        return 'High Odometer Reading';
      case 'gps_offline':
        return 'GPS Offline';
      case 'off_route':
        return 'Off-Route';
      case 'delay':
        return 'Delay Detected';
      default:
        return 'Alert';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Fleet Alerts ({alerts.length})
          </CardTitle>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.slice(0, 5).map((alert: any) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border ${getAlertColor(alert.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-0.5">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{getAlertTitle(alert.type)}</span>
                      {getAlertBadge(alert.severity)}
                    </div>
                    <p className="text-sm mb-2">{alert.message}</p>
                    <div className="flex items-center gap-4 text-xs">
                      <span>Bus: {alert.bus_number || 'N/A'}</span>
                      <span>•</span>
                      <span>{format(new Date(alert.created_at), 'PPp')}</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {alerts.length > 5 && (
          <div className="mt-4 text-center">
            <Button variant="link">
              View {alerts.length - 5} more alerts
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
