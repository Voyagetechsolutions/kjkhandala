import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
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
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    bus: 'all',
  });
  const [formData, setFormData] = useState({
    busId: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    assignedToId: '',
    scheduledDate: '',
  });

  const queryClient = useQueryClient();

  const { data: workOrders = [] } = useQuery({
    queryKey: ['work-orders', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status.toUpperCase());
      if (filters.priority !== 'all') params.append('priority', filters.priority.toUpperCase());
      if (filters.bus !== 'all') params.append('busId', filters.bus);
      
      const response = await api.get(`/maintenance/work-orders?${params.toString()}`);
      return Array.isArray(response.data) ? response.data : (response.data?.workOrders || []);
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
      await api.post('/maintenance/work-orders', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      toast.success('Work order created successfully');
      setShowCreateDialog(false);
      setFormData({
        busId: '',
        title: '',
        description: '',
        priority: 'MEDIUM',
        assignedToId: '',
        scheduledDate: '',
      });
    },
    onError: () => {
      toast.error('Failed to create work order');
    },
  });

  const summary = {
    open: workOrders.filter((wo: any) => wo.status === 'PENDING').length,
    inProgress: workOrders.filter((wo: any) => wo.status === 'IN_PROGRESS').length,
    completed: workOrders.filter((wo: any) => wo.status === 'COMPLETED').length,
    highPriority: workOrders.filter((wo: any) => wo.priority === 'HIGH' || wo.priority === 'URGENT').length,
  };

  const handleCreateWorkOrder = () => {
    createMutation.mutate(formData);
  };

  return (
    <MaintenanceLayout>
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

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open</CardTitle>
              <Wrench className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.open}</div>
              <p className="text-xs text-muted-foreground">Awaiting assignment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{summary.inProgress}</div>
              <p className="text-xs text-muted-foreground">Being worked on</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.completed}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.highPriority}</div>
              <p className="text-xs text-muted-foreground">Urgent attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={filters.priority} onValueChange={(v) => setFilters({...filters, priority: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Bus</Label>
                <Select value={filters.bus} onValueChange={(v) => setFilters({...filters, bus: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Buses</SelectItem>
                    {buses.map((bus: any) => (
                      <SelectItem key={bus.id} value={bus.id}>
                        {bus.registrationNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      No work orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  workOrders.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono font-medium">WO-{order.id.slice(0, 8)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.bus?.registrationNumber || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">{order.bus?.model || ''}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.title}</div>
                          <div className="text-sm text-muted-foreground">{order.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>{order.assignedTo?.firstName} {order.assignedTo?.lastName || 'Unassigned'}</TableCell>
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
                      <TableCell>
                        <Badge className={
                          order.status === 'COMPLETED' ? 'bg-green-500' :
                          order.status === 'IN_PROGRESS' ? 'bg-yellow-500' :
                          order.status === 'PENDING' ? 'bg-blue-500' :
                          'bg-gray-500'
                        }>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{order.scheduledDate ? new Date(order.scheduledDate).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>
                        <Button size="sm">View</Button>
                      </TableCell>
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
                  <Select value={formData.busId} onValueChange={(v) => setFormData({...formData, busId: v})}>
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
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
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
    </MaintenanceLayout>
  );
}
