import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import MaintenanceLayout from '@/components/maintenance/MaintenanceLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function Schedule() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : MaintenanceLayout;

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    bus_id: '',
    maintenance_type: '',
    frequency_km: 0,
    next_service_date: '',
  });

  const queryClient = useQueryClient();

  // Fetch schedules
  const { data: schedulesData } = useQuery({
    queryKey: ['maintenance-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_schedules')
        .select(`
          *,
          bus:buses(*)
        `)
        .order('next_service_date');
      if (error) throw error;
      return { schedules: data || [] };
    },
  });

  // Fetch buses
  const { data: buses = [] } = useQuery({
    queryKey: ['buses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buses')
        .select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // Mutation to create schedule
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('maintenance_schedules')
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-schedules'] });
      toast.success('Schedule created successfully');
      setShowCreateDialog(false);
      setFormData({
        bus_id: '',
        maintenance_type: '',
        frequency_km: 0,
        next_service_date: '',
      });
    },
    onError: (error: any) => {
      console.error('Supabase insert error:', error);
      toast.error('Failed to create schedule');
    },
  });

  const handleCreateSchedule = () => {
    const payload = {
      bus_id: formData.bus_id || null,
      maintenance_type: formData.maintenance_type || null, // must match enum: routine, repair, inspection, emergency
      frequency_km: formData.frequency_km > 0 ? formData.frequency_km : null,
      next_service_date: formData.next_service_date || null,
    };
    createMutation.mutate(payload);
  };

  const schedules = schedulesData?.schedules || [];
  const today = new Date();

  const summary = {
    upcoming: schedules.filter((s: any) => {
      const nextDate = new Date(s.next_service_date);
      return nextDate > today && (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24) > 7;
    }).length,
    dueSoon: schedules.filter((s: any) => {
      const nextDate = new Date(s.next_service_date);
      const days = (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return days >= 0 && days <= 7;
    }).length,
    overdue: schedules.filter((s: any) => new Date(s.next_service_date) < today).length,
    completed: schedules.filter((s: any) => s.status === 'completed').length,
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Maintenance Schedule</h1>
            <p className="text-muted-foreground">Track scheduled maintenance and service intervals</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Schedule Service
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.upcoming}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{summary.dueSoon}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.overdue}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.completed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Maintenance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Services</CardTitle>
            <CardDescription>All scheduled maintenance activities</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bus</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Last Service</TableHead>
                  <TableHead>Next Service</TableHead>
                  <TableHead>Current Mileage</TableHead>
                  <TableHead>Next Mileage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      No scheduled maintenance found
                    </TableCell>
                  </TableRow>
                ) : (
                  schedules.map((schedule: any) => {
                    const bus = buses.find((b: any) => b.id === schedule.bus_id);
                    const nextDate = new Date(schedule.next_service_date);
                    const daysUntil = Math.floor((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    const status = daysUntil < 0 ? 'overdue' : daysUntil <= 7 ? 'due-soon' : 'upcoming';
                    
                    return (
                      <TableRow key={schedule.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{bus?.registrationNumber || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">{bus?.model || ''}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{schedule.maintenance_type}</TableCell>
                        <TableCell className="text-sm">{schedule.frequency_km ? `Every ${schedule.frequency_km} km` : 'N/A'}</TableCell>
                        <TableCell>
                          <div>{schedule.last_service_date ? new Date(schedule.last_service_date).toLocaleDateString() : 'N/A'}</div>
                        </TableCell>
                        <TableCell>
                          <div>{new Date(schedule.next_service_date).toLocaleDateString()}</div>
                        </TableCell>
                        <TableCell className="font-medium">{bus?.mileage?.toLocaleString() || 0} km</TableCell>
                        <TableCell>{schedule.frequency_km ? (bus?.mileage + schedule.frequency_km)?.toLocaleString() : 'N/A'} km</TableCell>
                        <TableCell>
                          <Badge className={
                            status === 'overdue' ? 'bg-red-500' :
                            status === 'due-soon' ? 'bg-yellow-500' :
                            'bg-blue-500'
                          }>
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm">Complete</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Service</DialogTitle>
              <DialogDescription>Create a new maintenance schedule</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Bus</Label>
                <select 
                  className="w-full p-2 border rounded"
                  value={formData.bus_id}
                  onChange={(e) => setFormData({...formData, bus_id: e.target.value})}
                >
                  <option value="">Select bus</option>
                  {buses.map((bus: any) => (
                    <option key={bus.id} value={bus.id}>
                      {bus.registrationNumber} ({bus.model})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Service Type</Label>
                <select 
                  className="w-full p-2 border rounded"
                  value={formData.maintenance_type}
                  onChange={(e) => setFormData({...formData, maintenance_type: e.target.value})}
                >
                  <option value="">Select service type</option>
                  <option value="routine">Routine</option>
                  <option value="repair">Repair</option>
                  <option value="inspection">Inspection</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>

              <div>
                <Label>Frequency (km)</Label>
                <Input 
                  type="number" 
                  placeholder="5000" 
                  value={formData.frequency_km}
                  onChange={(e) => setFormData({...formData, frequency_km: parseInt(e.target.value) || 0})}
                />
              </div>

              <div>
                <Label>Next Service Date</Label>
                <Input 
                  type="date" 
                  value={formData.next_service_date}
                  onChange={(e) => setFormData({...formData, next_service_date: e.target.value})}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateSchedule} disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Schedule'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
