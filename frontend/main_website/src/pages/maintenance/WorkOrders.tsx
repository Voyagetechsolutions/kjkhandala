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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Wrench, Clock, CheckCircle, AlertCircle } from 'lucide-react';
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

export default function WorkOrders() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : MaintenanceLayout;

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    bus_id: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    maintenance_type: 'ROUTINE', // Added
    assigned_to: '',
    scheduled_date: '',
  });

  const queryClient = useQueryClient();

  const { data: workOrdersData } = useQuery({
    queryKey: ['work-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_orders')
        .select(`*, bus:buses(*)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { workOrders: data || [] };
    },
  });

  const { data: buses = [] } = useQuery({
    queryKey: ['buses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('buses').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('work_orders').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      toast.success('Work order created successfully');
      setShowCreateDialog(false);
      setFormData({
        bus_id: '',
        title: '',
        description: '',
        priority: 'MEDIUM',
        maintenance_type: 'ROUTINE',
        assigned_to: '',
        scheduled_date: '',
      });
    },
    onError: (err: any) => {
      console.error('Supabase insert error:', err);
      toast.error('Failed to create work order. Check console for details.');
    },
  });

  const workOrders = workOrdersData?.workOrders || [];

  const handleCreateWorkOrder = () => {
    const payload = {
      bus_id: formData.bus_id || null,
      title: formData.title || null,
      description: formData.description || null,
      priority: formData.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
      maintenance_type: formData.maintenance_type.toUpperCase() as 'ROUTINE' | 'REPAIR' | 'INSPECTION' | 'EMERGENCY', // Added
      assigned_to: formData.assigned_to || null,
      scheduled_date: formData.scheduled_date || null,
    };
    createMutation.mutate(payload);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Work Orders Management</h1>
            <p className="text-muted-foreground">Track and manage maintenance work orders</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Work Order
          </Button>
        </div>

        {/* Work Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Work Orders</CardTitle>
            <CardDescription>All maintenance work orders</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Bus</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No work orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  workOrders.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell>WO-{order.id.slice(0, 8)}</TableCell>
                      <TableCell>{order.bus?.registrationNumber || 'N/A'}</TableCell>
                      <TableCell>{order.title}</TableCell>
                      <TableCell>{order.maintenance_type}</TableCell>
                      <TableCell>
                        <Badge className={
                          order.priority === 'URGENT' ? 'bg-red-600' :
                          order.priority === 'HIGH' ? 'bg-red-500' :
                          order.priority === 'MEDIUM' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }>
                          {order.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.scheduled_date ? new Date(order.scheduled_date).toLocaleDateString() : 'N/A'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create Work Order Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Work Order</DialogTitle>
              <DialogDescription>Create a new maintenance work order</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Bus</Label>
                  <Select value={formData.bus_id} onValueChange={(v) => setFormData({...formData, bus_id: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bus" />
                    </SelectTrigger>
                    <SelectContent>
                      {buses.map((bus: any) => (
                        <SelectItem key={bus.id} value={bus.id}>
                          {bus.registrationNumber} ({bus.model})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({...formData, priority: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Maintenance Type</Label>
                <Select value={formData.maintenance_type} onValueChange={(v) => setFormData({...formData, maintenance_type: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ROUTINE">Routine</SelectItem>
                    <SelectItem value="REPAIR">Repair</SelectItem>
                    <SelectItem value="INSPECTION">Inspection</SelectItem>
                    <SelectItem value="EMERGENCY">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Issue Title</Label>
                <Input 
                  placeholder="e.g., Engine overheating" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea 
                  rows={3} 
                  placeholder="Detailed description of the issue..." 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div>
                <Label>Scheduled Date</Label>
                <Input 
                  type="date" 
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateWorkOrder} disabled={createMutation.isPending}>
                  <Plus className="mr-2 h-4 w-4" />
                  {createMutation.isPending ? 'Creating...' : 'Create Work Order'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
