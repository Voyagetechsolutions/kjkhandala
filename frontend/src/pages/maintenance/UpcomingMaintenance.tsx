import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import MaintenanceLayout from '@/components/maintenance/MaintenanceLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertCircle, Clock, CheckCircle, Wrench } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

export default function UpcomingMaintenance() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : MaintenanceLayout;

  const [filter, setFilter] = useState<'all' | 'due-soon' | 'overdue'>('all');

  const today = new Date();
  const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Fetch maintenance schedules
  const { data: schedules = [], refetch } = useQuery({
    queryKey: ['upcoming-maintenance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_schedules')
        .select('*, bus:buses(*)')
        .order('next_service_date', { ascending: true });

      if (error) {
        console.error('Fetch error:', error);
        return [];
      }
      return data || [];
    },
  });

  // Fetch buses for dropdown
  const { data: buses = [] } = useQuery({
    queryKey: ['buses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buses')
        .select('*')
        .eq('status', 'active');
      if (error) throw error;
      return data || [];
    },
  });

  // Filter schedules
  const filteredSchedules = schedules.filter((schedule: any) => {
    const nextDate = new Date(schedule.next_service_date);
    const daysUntil = Math.floor((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (filter === 'due-soon') {
      return daysUntil >= 0 && daysUntil <= 7;
    }
    if (filter === 'overdue') {
      return daysUntil < 0;
    }
    return true; // all
  });

  // Calculate summary
  const summary = {
    total: schedules.length,
    dueSoon: schedules.filter((s: any) => {
      const nextDate = new Date(s.next_service_date);
      const days = Math.floor((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 7;
    }).length,
    overdue: schedules.filter((s: any) => {
      const nextDate = new Date(s.next_service_date);
      return nextDate < today;
    }).length,
    upcoming: schedules.filter((s: any) => {
      const nextDate = new Date(s.next_service_date);
      const days = Math.floor((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 1000));
      return days > 7;
    }).length,
  };

  // Mark as complete
  const handleMarkComplete = async (scheduleId: string, schedule: any) => {
    try {
      const { error } = await supabase
        .from('maintenance_schedules')
        .update({
          last_service_date: new Date().toISOString().split('T')[0],
          next_service_date: calculateNextServiceDate(schedule),
        })
        .eq('id', scheduleId);

      if (error) throw error;

      toast.success('Maintenance marked as complete');
      refetch();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Failed to mark as complete');
    }
  };

  // Calculate next service date based on frequency
  const calculateNextServiceDate = (schedule: any) => {
    const today = new Date();
    if (schedule.frequency_km) {
      // For km-based, add 30 days as estimate
      const nextDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      return nextDate.toISOString().split('T')[0];
    }
    // Default: 30 days
    const nextDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    return nextDate.toISOString().split('T')[0];
  };

  // Get status badge
  const getStatusBadge = (nextServiceDate: string) => {
    const nextDate = new Date(nextServiceDate);
    const daysUntil = Math.floor((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) {
      return (
        <Badge className="bg-red-500">
          Overdue ({Math.abs(daysUntil)} days)
        </Badge>
      );
    }
    if (daysUntil <= 7) {
      return (
        <Badge className="bg-yellow-500">
          Due Soon ({daysUntil} days)
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-500">
        Upcoming ({daysUntil} days)
      </Badge>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Upcoming Maintenance</h1>
            <p className="text-muted-foreground">Track and manage scheduled vehicle maintenance</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Scheduled</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{summary.dueSoon}</div>
              <p className="text-xs text-muted-foreground">Within 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.overdue}</div>
              <p className="text-xs text-muted-foreground">Needs attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Wrench className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.upcoming}</div>
              <p className="text-xs text-muted-foreground">More than 7 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All ({schedules.length})
          </Button>
          <Button
            variant={filter === 'due-soon' ? 'default' : 'outline'}
            onClick={() => setFilter('due-soon')}
          >
            Due Soon ({summary.dueSoon})
          </Button>
          <Button
            variant={filter === 'overdue' ? 'default' : 'outline'}
            onClick={() => setFilter('overdue')}
          >
            Overdue ({summary.overdue})
          </Button>
        </div>

        {/* Maintenance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bus</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Last Service</TableHead>
                  <TableHead>Next Service</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchedules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No maintenance schedules found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSchedules.map((schedule: any) => (
                    <TableRow key={schedule.id}>
                      <TableCell>
                        <div className="font-medium">{schedule.bus?.name || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">
                          {schedule.bus?.number_plate || ''}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{schedule.maintenance_type}</TableCell>
                      <TableCell>
                        {schedule.last_service_date
                          ? new Date(schedule.last_service_date).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        {new Date(schedule.next_service_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {schedule.frequency_km ? `Every ${schedule.frequency_km} km` : 'N/A'}
                      </TableCell>
                      <TableCell>{getStatusBadge(schedule.next_service_date)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleMarkComplete(schedule.id, schedule)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
