import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, Bus, MapPin } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';

interface TripCalendarProps {
  trips: any[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export default function TripCalendar({ trips, selectedDate, onDateSelect }: TripCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get all days in current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get trips for a specific date
  const getTripsForDate = (date: Date) => {
    return trips.filter((trip: any) => {
      if (!trip.scheduled_departure) return false;
      const tripDate = new Date(trip.scheduled_departure);
      return isSameDay(tripDate, date);
    });
  };

  // Navigate months
  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  // Get trips for selected date
  const selectedDateTrips = getTripsForDate(selectedDate);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Grid */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Trip Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold min-w-[120px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Actual days */}
            {daysInMonth.map((day) => {
              const dayTrips = getTripsForDate(day);
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isTodayDate = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => onDateSelect(day)}
                  className={`
                    aspect-square p-2 rounded-lg border-2 transition-all
                    ${isSelected ? 'border-primary bg-primary/10' : 'border-transparent hover:border-gray-300'}
                    ${!isCurrentMonth ? 'opacity-40' : ''}
                    ${isTodayDate ? 'bg-blue-50 font-bold' : ''}
                    ${dayTrips.length > 0 ? 'bg-green-50' : ''}
                  `}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className={`text-sm ${isTodayDate ? 'text-blue-600' : ''}`}>
                      {format(day, 'd')}
                    </span>
                    {dayTrips.length > 0 && (
                      <Badge variant="secondary" className="mt-1 text-xs px-1 py-0">
                        {dayTrips.length}
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-50 border-2 border-blue-600" />
              <span className="text-sm text-muted-foreground">Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-50" />
              <span className="text-sm text-muted-foreground">Has Trips</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-primary" />
              <span className="text-sm text-muted-foreground">Selected</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDateTrips.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No trips scheduled</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold">
                  {selectedDateTrips.length} {selectedDateTrips.length === 1 ? 'Trip' : 'Trips'}
                </span>
                <Badge variant="secondary">{selectedDateTrips.length}</Badge>
              </div>
              {selectedDateTrips.map((trip: any) => (
                <div key={trip.id} className="p-3 border rounded-lg hover:bg-accent transition-colors">
                  <div className="flex items-start gap-2 mb-2">
                    <Bus className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">
                        {trip.routes?.origin} → {trip.routes?.destination}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Bus: {trip.buses?.bus_number || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>🕐 {trip.scheduled_departure ? format(new Date(trip.scheduled_departure), 'HH:mm') : 'N/A'}</span>
                    <span>→</span>
                    <span>🕐 {trip.scheduled_arrival ? format(new Date(trip.scheduled_arrival), 'HH:mm') : 'N/A'}</span>
                  </div>
                  <div className="mt-2">
                    <Badge variant={trip.status === 'SCHEDULED' ? 'secondary' : 'default'} className="text-xs">
                      {trip.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
