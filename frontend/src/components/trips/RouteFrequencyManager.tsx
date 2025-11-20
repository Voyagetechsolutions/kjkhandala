import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Calendar, Clock, MapPin, Bus, User } from 'lucide-react';
import { toast } from 'sonner';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function RouteFrequencyManager() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingFrequency, setEditingFrequency] = useState<any>(null);
  const [formData, setFormData] = useState({
    route_id: '',
    bus_id: '',
    driver_id: '',
    departure_time: '',
    frequency_type: 'SPECIFIC_DAYS',
    days_of_week: [] as number[],
    interval_days: 1,
    fare_per_seat: 0,
    active: true,
  });

  // Fetch route frequencies
  const { data: frequencies, isLoading } = useQuery({
    queryKey: ['route-frequencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('route_frequencies')
        .select(`
          *,
          routes:route_id (id, origin, destination, duration_hours),
          buses:bus_id (id, registration_number, model),
          drivers:driver_id (id, full_name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch routes
  const { data: routesData } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .order('origin');
      if (error) {
        console.error('Error fetching routes:', error);
        return [];
      }
      return data || [];
    },
  });
  
  const routes = Array.isArray(routesData) ? routesData : [];

  // Fetch buses
  const { data: busesData } = useQuery({
    queryKey: ['buses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buses')
        .select('*')
        .order('registration_number');
      if (error) {
        console.error('Error fetching buses:', error);
        return [];
      }
      return data || [];
    },
  });
  
  const buses = Array.isArray(busesData) ? busesData : [];

  // Fetch drivers
  const { data: driversData } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('full_name');
      if (error) {
        console.error('Error fetching drivers:', error);
        return [];
      }
      return data || [];
    },
  });
  
  const drivers = Array.isArray(driversData) ? driversData : [];

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const cleanedData = {
        ...data,
        bus_id: data.bus_id || null,
        driver_id: data.driver_id || null,
      };

      console.log('Saving route frequency:', cleanedData);

      if (editingFrequency) {
        const { error } = await supabase
          .from('route_frequencies')
          .update(cleanedData)
          .eq('id', editingFrequency.id);
        if (error) {
          console.error('Update error:', error);
          throw error;
        }
      } else {
        const { data: result, error } = await supabase
          .from('route_frequencies')
          .insert([cleanedData])
          .select();
        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        console.log('Insert result:', result);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route-frequencies'] });
      toast.success(editingFrequency ? 'Schedule updated' : 'Schedule created');
      handleCloseDialog();
    },
    onError: (error: any) => {
      console.error('Save mutation error:', error);
      toast.error(error.message || 'Failed to save schedule');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('route_frequencies')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route-frequencies'] });
      toast.success('Schedule deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete schedule');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleEdit = (frequency: any) => {
    setEditingFrequency(frequency);
    setFormData({
      route_id: frequency.route_id,
      bus_id: frequency.bus_id || '',
      driver_id: frequency.driver_id || '',
      departure_time: frequency.departure_time,
      frequency_type: frequency.frequency_type,
      days_of_week: frequency.days_of_week || [],
      interval_days: frequency.interval_days || 1,
      fare_per_seat: frequency.fare_per_seat || 0,
      active: frequency.active,
    });
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingFrequency(null);
    setFormData({
      route_id: '',
      bus_id: '',
      driver_id: '',
      departure_time: '',
      frequency_type: 'SPECIFIC_DAYS',
      days_of_week: [],
      interval_days: 1,
      fare_per_seat: 0,
      active: true,
    });
  };

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day].sort(),
    }));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Automated Route Schedules</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Create schedules once — trips generate automatically with seat-based pricing
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingFrequency(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingFrequency ? 'Edit Route Schedule' : 'Create Route Schedule'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Route *</Label>
                <Select
                  value={formData.route_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, route_id: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select route" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes?.map((route: any) => (
                      <SelectItem key={route.id} value={route.id}>
                        {route.origin} → {route.destination}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Departure Time *</Label>
                <Input
                  type="time"
                  value={formData.departure_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, departure_time: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Frequency Type *</Label>
                <Select
                  value={formData.frequency_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, frequency_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="SPECIFIC_DAYS">Specific Days</SelectItem>
                    <SelectItem value="WEEKLY">Weekly Interval</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.frequency_type === 'SPECIFIC_DAYS' && (
                <div className="space-y-2">
                  <Label>Select Days</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <Button
                        key={day.value}
                        type="button"
                        variant={formData.days_of_week.includes(day.value) ? 'default' : 'outline'}
                        onClick={() => toggleDay(day.value)}
                        className="w-full"
                      >
                        {day.label.slice(0, 3)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {formData.frequency_type === 'WEEKLY' && (
                <div className="space-y-2">
                  <Label>Interval (days)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.interval_days}
                    onChange={(e) => setFormData(prev => ({ ...prev, interval_days: parseInt(e.target.value) }))}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Default Bus (Optional)</Label>
                <Select
                  value={formData.bus_id || 'none'}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, bus_id: value === 'none' ? '' : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {buses?.map((bus: any) => (
                      <SelectItem key={bus.id} value={bus.id}>
                        {bus.registration_number} - {bus.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Default Driver (Optional)</Label>
                <Select
                  value={formData.driver_id || 'none'}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, driver_id: value === 'none' ? '' : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {drivers?.map((driver: any) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.full_name || driver.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fare Per Seat (P) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.fare_per_seat}
                  onChange={(e) => setFormData(prev => ({ ...prev, fare_per_seat: parseFloat(e.target.value) || 0 }))}
                  placeholder="e.g. 150.00"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Price per seat for this schedule. Total booking cost = fare × number of seats.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                />
                <Label>Active (Generate trips automatically)</Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : editingFrequency ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading schedules...</div>
        ) : frequencies && frequencies.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route</TableHead>
                <TableHead>Departure</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Fare/Seat</TableHead>
                <TableHead>Bus</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {frequencies.map((freq: any) => (
                <TableRow key={freq.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{freq.routes?.origin} → {freq.routes?.destination}</p>
                        <p className="text-xs text-muted-foreground">{freq.routes?.duration_hours}h duration</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {freq.departure_time}
                    </div>
                  </TableCell>
                  <TableCell>
                    {freq.frequency_type === 'DAILY' && <Badge>Daily</Badge>}
                    {freq.frequency_type === 'WEEKLY' && <Badge>Every {freq.interval_days} days</Badge>}
                    {freq.frequency_type === 'SPECIFIC_DAYS' && (
                      <div className="flex flex-wrap gap-1">
                        {freq.days_of_week?.map((day: number) => (
                          <Badge key={day} variant="outline">
                            {DAYS_OF_WEEK.find(d => d.value === day)?.label.slice(0, 3)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-primary">
                      P {freq.fare_per_seat?.toFixed(2) || '0.00'}
                    </div>
                    <p className="text-xs text-muted-foreground">per seat</p>
                  </TableCell>
                  <TableCell>
                    {freq.buses ? (
                      <div className="flex items-center gap-2">
                        <Bus className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{freq.buses.registration_number}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {freq.drivers ? (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{freq.drivers.full_name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={freq.active ? 'default' : 'secondary'}>
                      {freq.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(freq)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm('Delete this schedule? Future trips will not be auto-generated.')) {
                            deleteMutation.mutate(freq.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No route schedules configured</p>
            <p className="text-sm">Create a schedule to automatically generate trips</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
