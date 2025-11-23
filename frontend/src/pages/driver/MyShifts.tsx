import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import DriverLayout from '@/components/driver/DriverLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Bus, 
  CheckCircle,
  AlertCircle,
  Play,
  User
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

export default function MyShifts() {
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch shifts for the current driver using the view
  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['driver-shifts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('driver_shifts_with_names')
        .select('*')
        .eq('driver_id', user.id)
        .gte('shift_date', format(new Date(), 'yyyy-MM-dd'))
        .order('shift_date', { ascending: true });
      
      if (error) {
        console.error('Error fetching driver shifts:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user?.id,
  });

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'bg-green-500';
      case 'SCHEDULED': return 'bg-blue-500';
      case 'COMPLETED': return 'bg-gray-500';
      case 'CANCELLED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return <Play className="h-4 w-4" />;
      case 'SCHEDULED': return <Clock className="h-4 w-4" />;
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />;
      case 'CANCELLED': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredShifts = filterStatus === 'all' 
    ? shifts 
    : shifts.filter(shift => shift.status?.toUpperCase() === filterStatus.toUpperCase());

  return (
    <DriverLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Shifts</h1>
            <p className="text-muted-foreground">View your assigned driving shifts</p>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Shifts</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shifts.length}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Shifts</CardTitle>
              <Play className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {shifts.filter(s => s.status === 'ACTIVE').length}
              </div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {shifts.filter(s => s.status === 'SCHEDULED').length}
              </div>
              <p className="text-xs text-muted-foreground">Upcoming</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {shifts.filter(s => s.status === 'COMPLETED').length}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Shifts List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading your shifts...</p>
              </CardContent>
            </Card>
          ) : filteredShifts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No shifts found</p>
                <p className="text-sm text-muted-foreground">
                  {filterStatus === 'all' ? 'No shifts assigned yet' : 'Try changing the filter'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredShifts.map((shift) => (
              <Card key={shift.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {shift.route_display || `${shift.origin} → ${shift.destination}`}
                        <Badge className={getStatusColor(shift.status)}>
                          {getStatusIcon(shift.status)}
                          <span className="ml-1">{shift.status}</span>
                        </Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(shift.shift_date), 'EEEE, MMMM dd, yyyy')}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Bus</div>
                      <div className="font-medium">{shift.bus_number || 'Not assigned'}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-green-500" />
                        Origin
                      </div>
                      <div className="font-medium">{shift.origin || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-red-500" />
                        Destination
                      </div>
                      <div className="font-medium">{shift.destination || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Start Time
                      </div>
                      <div className="font-medium">
                        {shift.shift_start_time 
                          ? format(new Date(shift.shift_start_time), 'HH:mm')
                          : 'Not set'
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        End Time
                      </div>
                      <div className="font-medium">
                        {shift.shift_end_time 
                          ? format(new Date(shift.shift_end_time), 'HH:mm')
                          : 'Not set'
                        }
                      </div>
                    </div>
                  </div>

                  {shift.auto_generated && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-md">
                      <p className="text-sm text-blue-600">
                        <span className="font-medium">Auto-generated shift:</span> This shift was automatically created based on route schedules.
                      </p>
                    </div>
                  )}

                  {shift.notes && !shift.notes.includes('-') && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {shift.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DriverLayout>
  );
}
