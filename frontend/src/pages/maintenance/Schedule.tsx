import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
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
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    busId: '',
    serviceType: '',
    intervalKm: 0,
    nextServiceDate: '',
  });

  const queryClient = useQueryClient();

  const { data: schedules = [] } = useQuery({
    queryKey: ['maintenance-schedules'],
    queryFn: async () => {
      const response = await api.get('/maintenance/maintenance-schedules');
      return Array.isArray(response.data) ? response.data : (response.data?.schedules || []);
    },
  });

  const { data: buses = [] } = useQuery({
    queryKey: ['buses'],
    queryFn: async () => {
      const response = await api.get('/buses');
      return Array.isArray(response.data) ? response.data : (response.data?.buses || []);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post('/maintenance/maintenance-schedules', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-schedules'] });
      toast.success('Schedule created successfully');
      setShowCreateDialog(false);
      setFormData({
        busId: '',
        serviceType: '',
        intervalKm: 0,
        nextServiceDate: '',
      });
    },
    onError: () => {
      toast.error('Failed to create schedule');
    },
  });

  const handleCreateSchedule = () => {
    createMutation.mutate(formData);
  };

  const today = new Date();
  const summary = {
    upcoming: schedules.filter((s: any) => {
      const nextDate = new Date(s.nextServiceDate);
      return nextDate > today && (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24) > 7;
    }).length,
    dueSoon: schedules.filter((s: any) => {
      const nextDate = new Date(s.nextServiceDate);
      const days = (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return days >= 0 && days <= 7;
    }).length,
    overdue: schedules.filter((s: any) => new Date(s.nextServiceDate) < today).length,
    completed: schedules.filter((s: any) => s.status === 'completed').length,
  };

  return (
    <MaintenanceLayout>
      <div className="space-y-6">
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
                    const bus = buses.find((b: any) => b.id === schedule.busId);
                    const nextDate = new Date(schedule.nextServiceDate);
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
                        <TableCell className="font-medium">{schedule.serviceType}</TableCell>
                        <TableCell className="text-sm">{schedule.intervalKm ? `Every ${schedule.intervalKm} km` : schedule.intervalDays ? `Every ${schedule.intervalDays} days` : 'N/A'}</TableCell>
                        <TableCell>
                          <div>
                            <div>{schedule.lastServiceDate ? new Date(schedule.lastServiceDate).toLocaleDateString() : 'N/A'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{new Date(schedule.nextServiceDate).toLocaleDateString()}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{bus?.mileage?.toLocaleString() || 0} km</TableCell>
                        <TableCell>{schedule.intervalKm ? (bus?.mileage + schedule.intervalKm)?.toLocaleString() : 'N/A'} km</TableCell>
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
                  value={formData.busId}
                  onChange={(e) => setFormData({...formData, busId: e.target.value})}
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
                  value={formData.serviceType}
                  onChange={(e) => setFormData({...formData, serviceType: e.target.value})}
                >
                  <option value="">Select service type</option>
                  <option value="Oil Change">Oil Change</option>
                  <option value="Brake Inspection">Brake Inspection</option>
                  <option value="Tire Rotation">Tire Rotation</option>
                  <option value="Full Service">Full Service</option>
                  <option value="Engine Service">Engine Service</option>
                  <option value="Transmission Service">Transmission Service</option>
                </select>
              </div>
              <div>
                <Label>Frequency (km)</Label>
                <Input 
                  type="number" 
                  placeholder="5000" 
                  value={formData.intervalKm}
                  onChange={(e) => setFormData({...formData, intervalKm: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>Next Service Date</Label>
                <Input 
                  type="date" 
                  value={formData.nextServiceDate}
                  onChange={(e) => setFormData({...formData, nextServiceDate: e.target.value})}
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
    </MaintenanceLayout>
  );
}
