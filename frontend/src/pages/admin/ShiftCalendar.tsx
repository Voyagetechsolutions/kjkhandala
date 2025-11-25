import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar as CalendarIcon,
  Plus,
  RefreshCw,
  User,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameDay, isSameMonth, isToday } from 'date-fns';
import { toast } from 'sonner';

interface Shift {
  id: string;
  shift_id?: string;
  driver_id: string;
  driver_name?: string;
  driver_phone?: string;
  driver_license?: string;
  route_id: string;
  route_display?: string;
  origin?: string;
  destination?: string;
  bus_id?: string | null;
  bus_number?: string;
  bus_model?: string;
  bus_registration?: string;
  shift_date: string;
  calendar_date?: string;
  shift_type: string;
  status: string;
  start_time?: string | null;
  end_time?: string | null;
  shift_start_time?: string | null;
  shift_end_time?: string | null;
  notes?: string | null;
  auto_generated?: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function ShiftCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAutoGenerate, setShowAutoGenerate] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [formData, setFormData] = useState({
    driver_id: '',
    route_id: '',
    bus_id: '',
  });
  const [autoGenData, setAutoGenData] = useState({
    start_date: '',
    end_date: '',
    route_ids: [] as string[],
  });

  const queryClient = useQueryClient();

  // Fetch shifts for current month using the new view
  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['shifts-calendar', format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('driver_shifts_with_names')
        .select('*')
        .gte('shift_date', start)
        .lte('shift_date', end)
        .order('shift_date', { ascending: true });
      
      if (error) {
        console.error('Error fetching shifts:', error);
        throw error;
      }
      
      console.log('Shifts with names query successful:', data);

      // Transform data for calendar display (much simpler now!)
      return (data || []).map((shift: any) => ({
        ...shift,
        shift_id: shift.id,
        calendar_date: shift.shift_date,
        bus_registration: shift.bus_number || 'No bus',
        // These fields are now directly available from the view
        // driver_name, route_display are already included
      })) as Shift[];
    },
  });

  // Fetch drivers
  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('id, full_name')
        .eq('status', 'active')
        .order('full_name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch route_frequencies joined with routes
  const { data: routes = [] } = useQuery({
    queryKey: ['route-frequencies-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('route_frequencies')
        .select(`
          id,
          route_id,
          driver_id,
          bus_id,
          departure_time,
          frequency_type,
          days_of_week,
          active,
          routes:routes!route_id (
            id,
            origin,
            destination,
            duration_hours
          )
        `)
        .eq('active', true)
        .order('departure_time');
      
      console.log('Route frequencies data:', data);

      if (error) {
        console.error('Error fetching route frequencies:', error);
        throw error;
      }

      // Transform data to include route details at top level
      return (data || []).map((rf: any) => ({
        id: rf.route_id, // Use route_id for compatibility with existing shift logic
        route_frequency_id: rf.id, // Keep frequency ID for reference
        driver_id: rf.driver_id,
        bus_id: rf.bus_id,
        origin: Array.isArray(rf.routes) ? rf.routes[0]?.origin : rf.routes?.origin || '',
        destination: Array.isArray(rf.routes) ? rf.routes[0]?.destination : rf.routes?.destination || '',
        duration_hours: Array.isArray(rf.routes) ? rf.routes[0]?.duration_hours : rf.routes?.duration_hours || null,
        departure_time: rf.departure_time,
        frequency_type: rf.frequency_type,
        days_of_week: rf.days_of_week,
      }));
    },
  });

  // Fetch buses
  const { data: buses = [] } = useQuery({
    queryKey: ['buses-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buses')
        .select('id, registration_number')
        .eq('status', 'active')
        .order('registration_number');
      if (error) throw error;
      return data;
    },
  });

  // Create shift mutation
  const createShiftMutation = useMutation({
    mutationFn: async (shiftData: any) => {
      const { error } = await supabase.from('driver_shifts').insert({
        driver_id: shiftData.driver_id,
        route_id: shiftData.route_id, // This is the route_id from route_frequencies
        bus_id: shiftData.bus_id === 'none' ? null : shiftData.bus_id || null,
        shift_date: format(selectedDate!, 'yyyy-MM-dd'),
        shift_type: 'single',
        status: 'ACTIVE', // Use UPPERCASE to match enum
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Shift created successfully');
      queryClient.invalidateQueries({ queryKey: ['shifts-calendar'] });
      setShowAddDialog(false);
      setFormData({ driver_id: '', route_id: '', bus_id: '' });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create shift');
    },
  });

  // Auto-generate mutation (uses new generate_driver_shifts function)
  const autoGenerateMutation = useMutation({
    mutationFn: async (data: any) => {
      // Use the new generate_driver_shifts function
      const { error } = await supabase.rpc('generate_driver_shifts', {
        start_date: data.start_date,
        end_date: data.end_date,
      });
      
      if (error) throw error;
      
      // Count the newly generated shifts for feedback
      const { data: generatedShifts, error: countError } = await supabase
        .from('driver_shifts')
        .select('*')
        .eq('auto_generated', true)
        .gte('shift_date', data.start_date)
        .lte('shift_date', data.end_date);
      
      console.log('Generated shifts query result:', { generatedShifts, countError });
      
      if (countError) {
        console.warn('Could not count generated shifts:', countError);
        return { count: 0 };
      }
      
      return { count: generatedShifts?.length || 0 };
    },
    onSuccess: (result: any) => {
      const generatedCount = result?.count || 0;
      
      console.log('Generate shifts result:', { generatedCount });
      
      if (generatedCount > 0) {
        toast.success(`Successfully generated ${generatedCount} shifts!`);
      } else {
        toast.info('No new shifts to generate for the selected date range. Check if shifts already exist or route frequencies are configured.');
      }
      
      queryClient.invalidateQueries({ queryKey: ['shifts-calendar'] });
      setShowAutoGenerate(false);
      setAutoGenData({ start_date: '', end_date: '', route_ids: [] });
    },
    onError: (error: any) => {
      console.error('Auto-generate error:', error);
      toast.error(error.message || 'Failed to generate shifts');
    },
  });

  // Calendar rendering
  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day;
        const dayShifts = shifts.filter((s) => isSameDay(new Date(s.calendar_date), currentDay));
        const isCurrentMonth = isSameMonth(currentDay, monthStart);
        
        // Debug logging for a specific day
        if (format(currentDay, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) {
          console.log('Today shifts debug:', {
            currentDay: format(currentDay, 'yyyy-MM-dd'),
            allShifts: shifts,
            dayShifts,
            shiftsCount: shifts.length
          });
        }

        days.push(
          <div
            key={day.toString()}
            className={`min-h-[120px] border p-2 ${
              !isCurrentMonth ? 'bg-muted/30' : 'bg-background'
            } ${isToday(currentDay) ? 'ring-2 ring-primary' : ''} cursor-pointer hover:bg-accent/50 transition-colors`}
            onClick={() => {
              setSelectedDate(currentDay);
              setShowAddDialog(true);
            }}
          >
            <div className={`text-sm font-medium mb-1 ${!isCurrentMonth ? 'text-muted-foreground' : ''}`}>
              {format(currentDay, 'd')}
            </div>
            <div className="space-y-1">
              {dayShifts.slice(0, 3).map((shift, index) => (
                <div
                  key={shift.shift_id || `${shift.driver_id}-${shift.calendar_date}-${index}`}
                  className="text-xs p-1 bg-primary/10 rounded border-l-2 border-primary truncate cursor-pointer hover:bg-primary/20 transition-colors"
                  title={`${shift.driver_name} - ${shift.route_display}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedShift(shift);
                    setShowViewDialog(true);
                  }}
                >
                  <div className="font-medium truncate">{shift.driver_name}</div>
                  <div className="text-muted-foreground truncate">{shift.route_display}</div>
                </div>
              ))}
              {dayShifts.length > 3 && (
                <div className="text-xs text-muted-foreground">+{dayShifts.length - 3} more</div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-px bg-border">
          {days}
        </div>
      );
      days = [];
    }
    return <div className="space-y-px">{rows}</div>;
  };

  const totalShifts = shifts.length;
  const uniqueDrivers = new Set(shifts.map((s) => s.driver_id)).size;
  const uniqueRoutes = new Set(shifts.map((s) => s.route_id)).size;
  
  // Debug shifts data
  console.log('Shifts summary:', { totalShifts, shifts });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Shift Calendar</h1>
            <p className="text-muted-foreground">Assign drivers to routes and manage schedules</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAutoGenerate(true)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Auto-Generate
            </Button>
            <Button onClick={() => { setSelectedDate(new Date()); setShowAddDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Shift
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Total Shifts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalShifts}</p>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Active Drivers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{uniqueDrivers}</p>
              <p className="text-xs text-muted-foreground">Assigned this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Active Routes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{uniqueRoutes}</p>
              <p className="text-xs text-muted-foreground">With assignments</p>
            </CardContent>
          </Card>
        </div>

        {/* Calendar */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{format(currentMonth, 'MMMM yyyy')}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-px bg-border mb-px">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="bg-muted p-2 text-center text-sm font-medium">
                  {day}
                </div>
              ))}
            </div>
            {/* Calendar grid */}
            {isLoading ? (
              <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              renderCalendar()
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Shift Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Driver Shift</DialogTitle>
            <DialogDescription>
              Assign a driver to a route for {selectedDate && format(selectedDate, 'yyyy-MM-dd')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="driver">Driver</Label>
              <Select value={formData.driver_id} onValueChange={(value: any) => setFormData({ ...formData, driver_id: value })}>
                <SelectTrigger id="driver">
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((driver: { id: any; full_name: any; }) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="route">Route</Label>
              <Select value={formData.route_id} onValueChange={(value: any) => setFormData({ ...formData, route_id: value })}>
                <SelectTrigger id="route">
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent>
                  {routes.map((route: { id: any; origin: any; destination: any; }) => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.origin} → {route.destination}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bus">Bus (Optional)</Label>
              <Select value={formData.bus_id} onValueChange={(value: any) => setFormData({ ...formData, bus_id: value })}>
                <SelectTrigger id="bus">
                  <SelectValue placeholder="Select bus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {buses.map((bus: { id: any; registration_number: any; }) => (
                    <SelectItem key={bus.id} value={bus.id}>
                      {bus.registration_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createShiftMutation.mutate(formData)}
              disabled={!formData.driver_id || !formData.route_id || createShiftMutation.isPending}
            >
              {createShiftMutation.isPending ? 'Creating...' : 'Create Shift'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto-Generate Dialog */}
      <Dialog open={showAutoGenerate} onOpenChange={setShowAutoGenerate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Auto-Generate Shifts</DialogTitle>
            <DialogDescription>
              Generate shifts based on route frequencies and schedules for a date range
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={autoGenData.start_date}
                onChange={(e: { target: { value: any; }; }) => setAutoGenData({ ...autoGenData, start_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={autoGenData.end_date}
                onChange={(e: { target: { value: any; }; }) => setAutoGenData({ ...autoGenData, end_date: e.target.value })}
              />
            </div>

            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="text-muted-foreground">
                This will generate shifts based on your configured route frequencies. Make sure route frequencies are set up with assigned drivers, buses, and schedules.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAutoGenerate(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => autoGenerateMutation.mutate(autoGenData)}
              disabled={!autoGenData.start_date || !autoGenData.end_date || autoGenerateMutation.isPending}
            >
              {autoGenerateMutation.isPending ? 'Generating...' : 'Generate Shifts'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Shift Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Shift Details</DialogTitle>
            <DialogDescription>
              View shift information
            </DialogDescription>
          </DialogHeader>
          {selectedShift && (
            <div className="space-y-4">
              {/* Driver Info */}
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4" />
                  <span>Driver Information</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedShift.driver_name || 'Unassigned'}</p>
                  </div>
                  {selectedShift.driver_phone && (
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedShift.driver_phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Route Info */}
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4" />
                  <span>Route Information</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Origin</p>
                    <p className="font-medium">{selectedShift.origin || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Destination</p>
                    <p className="font-medium">{selectedShift.destination || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Shift Details */}
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Shift Details</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-medium">{format(new Date(selectedShift.shift_date), 'yyyy-MM-dd')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="font-medium capitalize">{selectedShift.shift_type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        selectedShift.status === 'ACTIVE' || selectedShift.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedShift.status}
                      </span>
                    </p>
                  </div>
                  {selectedShift.bus_number && (
                    <div>
                      <p className="text-muted-foreground">Bus</p>
                      <p className="font-medium">{selectedShift.bus_number}</p>
                      {selectedShift.bus_model && (
                        <p className="text-xs text-muted-foreground">{selectedShift.bus_model}</p>
                      )}
                    </div>
                  )}
                  {selectedShift.start_time && (
                    <div>
                      <p className="text-muted-foreground">Start Time</p>
                      <p className="font-medium">{selectedShift.start_time}</p>
                    </div>
                  )}
                  {selectedShift.end_time && (
                    <div>
                      <p className="text-muted-foreground">End Time</p>
                      <p className="font-medium">{selectedShift.end_time}</p>
                    </div>
                  )}
                </div>
                {selectedShift.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-muted-foreground text-sm">Notes</p>
                    <p className="text-sm">{selectedShift.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
