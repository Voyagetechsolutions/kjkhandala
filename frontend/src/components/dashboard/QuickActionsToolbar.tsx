import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Calendar, Users, DollarSign, FileText, Settings, Truck, Bus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function QuickActionsToolbar() {
  const [addBusOpen, setAddBusOpen] = useState(false);
  const [scheduleTripOpen, setScheduleTripOpen] = useState(false);
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch routes for trip scheduling
  const { data: routes } = useQuery({
    queryKey: ['routes-quick'],
    queryFn: async () => {
      const response = await api.get('/routes');
      return Array.isArray(response.data) ? response.data : (response.data?.routes || []);
    },
  });

  // Fetch buses for trip scheduling
  const { data: buses } = useQuery({
    queryKey: ['buses-quick'],
    queryFn: async () => {
      const response = await api.get('/buses');
      return Array.isArray(response.data) ? response.data : (response.data?.buses || []);
    },
  });

  // Add Bus Mutation
  const addBusMutation = useMutation({
    mutationFn: async (formData: any) => {
      await api.post('/buses', formData);
    },
    onSuccess: () => {
      toast.success('Bus added successfully!');
      setAddBusOpen(false);
      queryClient.invalidateQueries({ queryKey: ['buses'] });
    },
    onError: () => {
      toast.error('Failed to add bus');
    },
  });

  // Schedule Trip Mutation
  const scheduleTripMutation = useMutation({
    mutationFn: async (formData: any) => {
      await api.post('/schedules', formData);
    },
    onSuccess: () => {
      toast.success('Trip scheduled successfully!');
      setScheduleTripOpen(false);
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
    onError: () => {
      toast.error('Failed to schedule trip');
    },
  });

  // Add Employee Mutation
  const addEmployeeMutation = useMutation({
    mutationFn: async (formData: any) => {
      await api.post('/staff', formData);
    },
    onSuccess: () => {
      toast.success('Employee added successfully!');
      setAddEmployeeOpen(false);
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: () => {
      toast.error('Failed to add employee');
    },
  });

  const handleAddBus = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addBusMutation.mutate({
      name: formData.get('name'),
      number_plate: formData.get('number_plate'),
      seating_capacity: parseInt(formData.get('seating_capacity') as string),
      layout_rows: parseInt(formData.get('layout_rows') as string) || 10,
      layout_columns: parseInt(formData.get('layout_columns') as string) || 4,
    });
  };

  const handleScheduleTrip = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    scheduleTripMutation.mutate({
      route_id: formData.get('route_id'),
      bus_id: formData.get('bus_id'),
      departure_date: formData.get('departure_date'),
      departure_time: formData.get('departure_time'),
      available_seats: parseInt(formData.get('available_seats') as string),
    });
  };

  const handleAddEmployee = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addEmployeeMutation.mutate({
      full_name: formData.get('full_name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      position: formData.get('position'),
      department: formData.get('department'),
      salary: parseFloat(formData.get('salary') as string),
      hire_date: formData.get('hire_date'),
      status: 'active',
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Quick Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Create New</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setAddBusOpen(true)}>
            <Truck className="mr-2 h-4 w-4" />
            Add Bus
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setScheduleTripOpen(true)}>
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Trip
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setAddEmployeeOpen(true)}>
            <Users className="mr-2 h-4 w-4" />
            Add Employee
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <DollarSign className="mr-2 h-4 w-4" />
            Approve Expense
          </DropdownMenuItem>
          <DropdownMenuItem>
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            System Settings
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Add Bus Dialog */}
      <Dialog open={addBusOpen} onOpenChange={setAddBusOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Add New Bus
            </DialogTitle>
            <DialogDescription>
              Add a new bus to your fleet
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddBus} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Bus Name</Label>
              <Input id="name" name="name" placeholder="e.g., Express 001" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="number_plate">Number Plate</Label>
              <Input id="number_plate" name="number_plate" placeholder="e.g., ABC-123" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seating_capacity">Seating Capacity</Label>
              <Input id="seating_capacity" name="seating_capacity" type="number" placeholder="e.g., 40" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="layout_rows">Layout Rows</Label>
                <Input id="layout_rows" name="layout_rows" type="number" defaultValue="10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="layout_columns">Layout Columns</Label>
                <Input id="layout_columns" name="layout_columns" type="number" defaultValue="4" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setAddBusOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addBusMutation.isPending}>
                {addBusMutation.isPending ? 'Adding...' : 'Add Bus'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Schedule Trip Dialog */}
      <Dialog open={scheduleTripOpen} onOpenChange={setScheduleTripOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule New Trip
            </DialogTitle>
            <DialogDescription>
              Create a new trip schedule
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleScheduleTrip} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="route_id">Route</Label>
              <select id="route_id" name="route_id" className="w-full px-3 py-2 border rounded-lg" required>
                <option value="">Select a route</option>
                {Array.isArray(routes) && routes.map((route: any) => (
                  <option key={route.id} value={route.id}>
                    {route.origin} → {route.destination}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bus_id">Bus</Label>
              <select id="bus_id" name="bus_id" className="w-full px-3 py-2 border rounded-lg" required>
                <option value="">Select a bus</option>
                {Array.isArray(buses) && buses.map((bus: any) => (
                  <option key={bus.id} value={bus.id}>
                    {bus.name} ({bus.number_plate})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departure_date">Date</Label>
                <Input id="departure_date" name="departure_date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="departure_time">Time</Label>
                <Input id="departure_time" name="departure_time" type="time" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="available_seats">Available Seats</Label>
              <Input id="available_seats" name="available_seats" type="number" placeholder="e.g., 40" required />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setScheduleTripOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={scheduleTripMutation.isPending}>
                {scheduleTripMutation.isPending ? 'Scheduling...' : 'Schedule Trip'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Employee Dialog */}
      <Dialog open={addEmployeeOpen} onOpenChange={setAddEmployeeOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Add New Employee
            </DialogTitle>
            <DialogDescription>
              Register a new employee or staff member
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEmployee} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" name="full_name" placeholder="John Doe" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="john@example.com" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" placeholder="+267 1234567" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input id="position" name="position" placeholder="e.g., Manager" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <select id="department" name="department" className="w-full px-3 py-2 border rounded-lg" required>
                  <option value="">Select department</option>
                  <option value="operations">Operations</option>
                  <option value="finance">Finance</option>
                  <option value="hr">Human Resources</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="customer_service">Customer Service</option>
                  <option value="management">Management</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">Monthly Salary (BWP)</Label>
                <Input id="salary" name="salary" type="number" step="0.01" placeholder="5000.00" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hire_date">Hire Date</Label>
              <Input id="hire_date" name="hire_date" type="date" required />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setAddEmployeeOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addEmployeeMutation.isPending}>
                {addEmployeeMutation.isPending ? 'Adding...' : 'Add Employee'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
