import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

interface TripCalendarProps {
  trips: any[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export default function TripCalendar({ trips, selectedDate, onDateSelect }: TripCalendarProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Trip Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-100 rounded-lg p-8 min-h-[400px] flex flex-col items-center justify-center">
          <Calendar className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Calendar View Coming Soon</h3>
          <p className="text-sm text-gray-500 text-center max-w-md">
            Interactive calendar showing all scheduled trips with daily/weekly/monthly views.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
