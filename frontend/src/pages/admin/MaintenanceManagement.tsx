import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Wrench, AlertTriangle, CheckCircle, Clock, Calendar, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function MaintenanceManagement() {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [newRecordOpen, setNewRecordOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch maintenance records
  const { data: records, isLoading } = useQuery({
    queryKey: ['maintenance-records', selectedStatus],
    queryFn: async () => {
      const params = selectedStatus !== 'all' ? `?status=${selectedStatus}` : '';
      const response = await api.get(`/maintenance_records${params}`);
      return response.data.data || [];
    },
  });

  // Fetch buses for the form
  const { data: buses } = useQuery({
    queryKey: ['buses-maintenance'],
    queryFn: async () => {
      const response = await api.get('/buses');
      return response.data.data || [];
    },
  });

  // Fetch maintenance reminders
  const { data: reminders } = useQuery({
    queryKey: ['maintenance-reminders'],
    queryFn: async () => {
      try {
        const response = await api.get('/maintenance_reminders');
        return response.data.data || [];
      } catch (error) {
        console.error('Error fetching reminders:', error);
        return [];
      }
    },
  });

  // Add Service Record Mutation
  const addRecordMutation = useMutation({
    mutationFn: async (formData: any) => {
      await api.post('/maintenance_records', formData);
    },
    onSuccess: () => {
      toast.success('Service record added successfully!');
      setNewRecordOpen(false);
      queryClient.invalidateQueries({ queryKey: ['maintenance-records'] });
    },
    onError: () => {
      toast.error('Failed to add service record');
    },
  });

  const handleAddRecord = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addRecordMutation.mutate({
      busId: formData.get('bus_id'),
      type: formData.get('service_type'),
      date: formData.get('maintenance_date'),
      mileage: parseInt(formData.get('odometer_reading') as string),
      cost: parseFloat(formData.get('cost') as string),
      performedBy: formData.get('service_provider'),
      description: formData.get('description'),
    });
  };

  // Calculate stats
  const totalRecords = records?.length || 0;
  const pendingMaintenance = records?.filter((r: any) => r.status === 'PENDING').length || 0;
  const inProgressMaintenance = records?.filter((r: any) => r.status === 'IN_PROGRESS').length || 0;
  const completedMaintenance = records?.filter((r: any) => r.status === 'COMPLETED').length || 0;

  const overdueReminders = reminders?.filter((r: any) => 
    new Date(r.due_date) < new Date() && !r.completed
  ).length || 0;

  const upcomingReminders = reminders?.filter((r: any) => {
    const dueDate = new Date(r.due_date);
    const daysUntil = Math.floor((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 7 && daysUntil >= 0 && !r.completed;
  }).length || 0;

  const totalCost = records?.filter((r: any) => r.status === 'completed')
    .reduce((sum: number, r: any) => sum + parseFloat(r.cost || 0), 0) || 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-500';
      case 'in_progress': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'in_progress': return <Wrench className="h-3 w-3" />;
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Maintenance Management</h1>
            <p className="text-muted-foreground">Track vehicle maintenance and service schedules</p>
          </div>
          <Button onClick={() => setNewRecordOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Service Record
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Total Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalRecords}</p>
              <p className="text-xs text-muted-foreground">
                {completedMaintenance} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{inProgressMaintenance}</p>
              <p className="text-xs text-muted-foreground">{pendingMaintenance} pending</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{overdueReminders}</p>
              <p className="text-xs text-muted-foreground">{upcomingReminders} due this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Total Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">P{totalCost.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">All completed services</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="records" className="space-y-4">
          <TabsList>
            <TabsTrigger value="records">Service Records</TabsTrigger>
            <TabsTrigger value="reminders">Upcoming Maintenance</TabsTrigger>
            <TabsTrigger value="schedule">Service Schedule</TabsTrigger>
          </TabsList>

          {/* Service Records Tab */}
          <TabsContent value="records" className="space-y-4">
            <div className="flex gap-4">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bus</TableHead>
                      <TableHead>Service Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Loading records...
                        </TableCell>
                      </TableRow>
                    ) : records?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No maintenance records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      records?.map((record: any) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{record.buses?.bus_number}</p>
                              <p className="text-xs text-muted-foreground">{record.buses?.model}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{record.service_type}</Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(record.maintenance_date), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {record.description || 'No description'}
                          </TableCell>
                          <TableCell className="font-medium">
                            {record.cost ? `P${parseFloat(record.cost).toFixed(2)}` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(record.status)} gap-1`}>
                              {getStatusIcon(record.status)}
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm">View</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reminders Tab */}
          <TabsContent value="reminders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Maintenance & Renewals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reminders?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No upcoming maintenance scheduled</p>
                    </div>
                  ) : (
                    reminders?.map((reminder: any) => {
                      const dueDate = new Date(reminder.due_date);
                      const daysUntil = Math.floor((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      const isOverdue = daysUntil < 0;
                      const isUrgent = daysUntil <= 7 && daysUntil >= 0;

                      return (
                        <div
                          key={reminder.id}
                          className={`p-4 border rounded-lg ${
                            isOverdue ? 'bg-red-50 border-red-200' :
                            isUrgent ? 'bg-orange-50 border-orange-200' :
                            'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                isOverdue ? 'bg-red-500' :
                                isUrgent ? 'bg-orange-500' :
                                'bg-blue-500'
                              }`}>
                                <Wrench className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold">
                                  {reminder.buses?.bus_number} - {reminder.service_type}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {reminder.description}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-medium ${
                                isOverdue ? 'text-red-600' :
                                isUrgent ? 'text-orange-600' :
                                ''
                              }`}>
                                {format(dueDate, 'MMM dd, yyyy')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {isOverdue ? `${Math.abs(daysUntil)} days overdue` :
                                 daysUntil === 0 ? 'Due today' :
                                 `${daysUntil} days remaining`}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Service Schedule Calendar - Coming Soon</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 rounded-lg p-8 min-h-[400px] flex flex-col items-center justify-center">
                  <Calendar className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Calendar View Coming Soon</h3>
                  <p className="text-sm text-gray-500 text-center max-w-md">
                    Interactive calendar showing all scheduled maintenance with drag-and-drop rescheduling.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* New Service Record Dialog */}
      <Dialog open={newRecordOpen} onOpenChange={setNewRecordOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              New Service Record
            </DialogTitle>
            <DialogDescription>
              Record a new maintenance or service activity
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddRecord} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bus_id">Bus</Label>
                <select id="bus_id" name="bus_id" className="w-full px-3 py-2 border rounded-lg" required>
                  <option value="">Select a bus</option>
                  {buses?.map((bus: any) => (
                    <option key={bus.id} value={bus.id}>
                      {bus.name} - {bus.number_plate}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="service_type">Service Type</Label>
                <select id="service_type" name="service_type" className="w-full px-3 py-2 border rounded-lg" required>
                  <option value="">Select type</option>
                  <option value="oil_change">Oil Change</option>
                  <option value="tire_replacement">Tire Replacement</option>
                  <option value="brake_service">Brake Service</option>
                  <option value="engine_repair">Engine Repair</option>
                  <option value="transmission">Transmission Service</option>
                  <option value="inspection">Safety Inspection</option>
                  <option value="cleaning">Cleaning & Detailing</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maintenance_date">Service Date</Label>
                <Input id="maintenance_date" name="maintenance_date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="odometer_reading">Odometer Reading (km)</Label>
                <Input id="odometer_reading" name="odometer_reading" type="number" placeholder="e.g., 45000" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Cost (BWP)</Label>
                <Input id="cost" name="cost" type="number" step="0.01" placeholder="e.g., 500.00" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service_provider">Service Provider</Label>
                <Input id="service_provider" name="service_provider" placeholder="e.g., ABC Garage" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description / Notes</Label>
              <Textarea 
                id="description" 
                name="description" 
                placeholder="Describe the service performed, parts replaced, etc."
                rows={3}
                required
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setNewRecordOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addRecordMutation.isPending}>
                {addRecordMutation.isPending ? 'Saving...' : 'Save Record'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
