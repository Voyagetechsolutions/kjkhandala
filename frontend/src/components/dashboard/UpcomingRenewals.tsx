import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface UpcomingRenewalsProps {
  renewals: any;
}

export default function UpcomingRenewals({ renewals }: UpcomingRenewalsProps) {
  const allRenewals = [
    ...(renewals?.buses || []).map((b: any) => ({
      type: 'Vehicle License',
      name: `${b.name} (${b.number_plate})`,
      date: b.license_expiry || b.insurance_expiry,
      category: 'bus'
    })),
    ...(renewals?.drivers || []).map((d: any) => ({
      type: 'Driver License',
      name: d.full_name,
      date: d.license_expiry,
      category: 'driver'
    })),
    ...(renewals?.maintenance || []).map((m: any) => ({
      type: 'Service Due',
      name: m.buses?.name,
      date: m.due_date,
      category: 'maintenance'
    }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const getUrgencyColor = (date: string) => {
    const days = differenceInDays(new Date(date), new Date());
    if (days < 0) return 'bg-red-500';
    if (days <= 7) return 'bg-orange-500';
    if (days <= 14) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getUrgencyLabel = (date: string) => {
    const days = differenceInDays(new Date(date), new Date());
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Renewals
          </CardTitle>
          <Badge variant="secondary">{allRenewals.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {allRenewals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2" />
              <p>No upcoming renewals</p>
            </div>
          ) : (
            allRenewals.map((renewal, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{renewal.type}</p>
                  <p className="text-xs text-muted-foreground">{renewal.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(renewal.date), 'MMM dd, yyyy')}
                  </p>
                </div>
                <Badge className={getUrgencyColor(renewal.date)}>
                  {getUrgencyLabel(renewal.date)}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
