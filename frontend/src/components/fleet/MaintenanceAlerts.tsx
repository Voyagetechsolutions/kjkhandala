import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface MaintenanceAlertsProps {
  reminders: any[];
}

export default function MaintenanceAlerts({ reminders }: MaintenanceAlertsProps) {
  const getUrgencyColor = (dueDate: string) => {
    const daysUntilDue = differenceInDays(new Date(dueDate), new Date());
    if (daysUntilDue < 0) return 'bg-red-500';
    if (daysUntilDue <= 3) return 'bg-orange-500';
    if (daysUntilDue <= 7) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getUrgencyLabel = (dueDate: string) => {
    const daysUntilDue = differenceInDays(new Date(dueDate), new Date());
    if (daysUntilDue < 0) return 'Overdue';
    if (daysUntilDue === 0) return 'Due Today';
    if (daysUntilDue === 1) return 'Due Tomorrow';
    if (daysUntilDue <= 7) return `${daysUntilDue} days`;
    return 'Upcoming';
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <CardTitle className="text-orange-900">Maintenance Alerts</CardTitle>
          <Badge variant="secondary">{reminders.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-center justify-between p-3 bg-white rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {reminder.buses?.name} - {reminder.reminder_type}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {reminder.buses?.number_plate}
                  </p>
                  {reminder.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {reminder.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <Badge className={getUrgencyColor(reminder.due_date)}>
                  {getUrgencyLabel(reminder.due_date)}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(reminder.due_date), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
