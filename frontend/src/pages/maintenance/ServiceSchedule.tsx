import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import MaintenanceLayout from '@/components/maintenance/MaintenanceLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ServiceSchedule() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : MaintenanceLayout;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [selectedBus, setSelectedBus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Fetch maintenance schedules
  const { data: schedules = [] } = useQuery({
    queryKey: ['service-schedules', currentDate.getMonth(), currentDate.getFullYear()],
    queryFn: async () => {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('maintenance_schedules')
        .select('*, bus:buses(*)')
        .gte('next_service_date', startOfMonth.toISOString().split('T')[0])
        .lte('next_service_date', endOfMonth.toISOString().split('T')[0])
        .order('next_service_date');

      if (error) {
        console.error('Fetch error:', error);
        return [];
      }
      return data || [];
    },
  });

  // Fetch buses for filter
  const { data: buses = [] } = useQuery({
    queryKey: ['buses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('buses').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // Filter schedules
  const filteredSchedules = schedules.filter((schedule: any) => {
    if (selectedBus !== 'all' && schedule.bus_id !== selectedBus) return false;
    if (selectedType !== 'all' && schedule.maintenance_type !== selectedType) return false;
    return true;
  });

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  // Get schedules for a specific day
  const getSchedulesForDay = (day: number) => {
    const dateStr = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    ).toISOString().split('T')[0];

    return filteredSchedules.filter(
      (schedule: any) => schedule.next_service_date === dateStr
    );
  };

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get status color
  const getStatusColor = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntil = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return 'bg-red-100 border-red-500';
    if (daysUntil <= 7) return 'bg-yellow-100 border-yellow-500';
    return 'bg-green-100 border-green-500';
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Service Schedule</h1>
            <p className="text-muted-foreground">Calendar view of all scheduled maintenance</p>
          </div>
        </div>

        {/* Controls */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              {/* Month Navigation */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-[200px] text-center font-semibold">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </div>
                <Button variant="outline" size="sm" onClick={goToNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 ml-auto">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedBus} onValueChange={setSelectedBus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Buses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Buses</SelectItem>
                    {buses.map((bus: any) => (
                      <SelectItem key={bus.id} value={bus.id}>
                        {bus.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Monthly Schedule
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Day Headers */}
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="text-center font-semibold text-sm py-2 bg-muted rounded"
                >
                  {day}
                </div>
              ))}

              {/* Empty cells for days before month starts */}
              {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                <div key={`empty-${index}`} className="min-h-[120px] bg-muted/20 rounded" />
              ))}

              {/* Calendar days */}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const daySchedules = getSchedulesForDay(day);
                const isToday =
                  day === new Date().getDate() &&
                  currentDate.getMonth() === new Date().getMonth() &&
                  currentDate.getFullYear() === new Date().getFullYear();

                return (
                  <div
                    key={day}
                    className={`min-h-[120px] border rounded p-2 ${
                      isToday ? 'bg-blue-50 border-blue-500' : 'bg-white'
                    }`}
                  >
                    <div className="font-semibold text-sm mb-2">{day}</div>
                    <div className="space-y-1">
                      {daySchedules.map((schedule: any) => (
                        <div
                          key={schedule.id}
                          className={`text-xs p-1 rounded border ${getStatusColor(
                            schedule.next_service_date
                          )}`}
                        >
                          <div className="font-medium truncate">
                            {schedule.bus?.name || 'N/A'}
                          </div>
                          <div className="text-[10px] capitalize truncate">
                            {schedule.maintenance_type}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle>Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 border border-red-500 rounded" />
                <span className="text-sm">Overdue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-100 border border-yellow-500 rounded" />
                <span className="text-sm">Due Soon (within 7 days)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border border-green-500 rounded" />
                <span className="text-sm">Upcoming</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-50 border border-blue-500 rounded" />
                <span className="text-sm">Today</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>This Month Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold">{filteredSchedules.length}</div>
                <div className="text-sm text-muted-foreground">Total Services</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {
                    filteredSchedules.filter((s: any) => {
                      const date = new Date(s.next_service_date);
                      return date < new Date();
                    }).length
                  }
                </div>
                <div className="text-sm text-muted-foreground">Overdue</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {
                    filteredSchedules.filter((s: any) => {
                      const date = new Date(s.next_service_date);
                      const today = new Date();
                      const days = Math.floor(
                        (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                      );
                      return days >= 0 && days <= 7;
                    }).length
                  }
                </div>
                <div className="text-sm text-muted-foreground">Due This Week</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {
                    filteredSchedules.filter((s: any) => {
                      const date = new Date(s.next_service_date);
                      const today = new Date();
                      const days = Math.floor(
                        (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                      );
                      return days > 7;
                    }).length
                  }
                </div>
                <div className="text-sm text-muted-foreground">Upcoming</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
