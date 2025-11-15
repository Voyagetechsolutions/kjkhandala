import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import HRLayout from '@/components/hr/HRLayout';
import { Calendar, Clock, MapPin, Plus, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Shift {
  id: string;
  driverId: string;
  driverName: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  status: string;
  hoursWorked?: number;
  busNumber?: string;
  route?: string;
}

export default function Shifts() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : HRLayout;
  const queryClient = useQueryClient();

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    driverId: '',
    shiftDate: new Date().toISOString().split('T')[0],
    shiftType: '',
    startTime: '',
    endTime: '',
    busId: '',
    routeId: ''
  });

  // Fetch drivers
  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('id, full_name, license_number')
        .eq('status', 'ACTIVE')
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch buses
  const { data: buses = [] } = useQuery({
    queryKey: ['buses-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buses')
        .select('id, name, number_plate, registration_number')
        .eq('status', 'ACTIVE')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch routes
  const { data: routes = [] } = useQuery({
    queryKey: ['routes-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routes')
        .select('id, origin, destination')
        .order('origin');
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      const { data, error } = await supabase
        .from('driver_shifts')
.select(`*,drivers!driver_id(*)`)
.order('shift_date', { ascending: false });

      if (error) throw error;
      setShifts(data || []);
    } catch (error) {
      console.error('Failed to fetch shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Driver Shifts</h1>
            <p className="text-gray-600">Manage driver schedules and shifts</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Create Shift
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Total Shifts</p>
            <p className="text-2xl font-bold">{shifts.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Active Now</p>
            <p className="text-2xl font-bold text-green-600">
              {shifts.filter(s => s.status === 'ACTIVE').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Scheduled</p>
            <p className="text-2xl font-bold text-blue-600">
              {shifts.filter(s => s.status === 'SCHEDULED').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Completed Today</p>
            <p className="text-2xl font-bold text-gray-600">
              {shifts.filter(s => s.status === 'COMPLETED').length}
            </p>
          </div>
        </div>

        {/* Shifts List */}
        <div className="bg-white rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shift Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bus/Route</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {shifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{shift.driverName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{shift.shiftType}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {new Date(shift.startTime).toLocaleTimeString()} - {new Date(shift.endTime).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium">{shift.busNumber || 'Not assigned'}</div>
                        <div className="text-gray-500">{shift.route || '-'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium">
                        {shift.hoursWorked ? `${shift.hoursWorked.toFixed(1)}h` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(shift.status)}`}>
                        {shift.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Shift Dialog */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Shift</DialogTitle>
              <DialogDescription>
                Schedule a new shift for a driver
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Driver *</Label>
                <Select value={formData.driverId} onValueChange={(value) => setFormData({...formData, driverId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No active drivers found</div>
                    ) : (
                      drivers.map((driver: any) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.full_name} ({driver.license_number})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Shift Date *</Label>
                  <Input 
                    type="date" 
                    value={formData.shiftDate} 
                    onChange={(e) => setFormData({...formData, shiftDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Shift Type *</Label>
                  <Select value={formData.shiftType} onValueChange={(value) => setFormData({...formData, shiftType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MORNING">Morning Shift</SelectItem>
                      <SelectItem value="AFTERNOON">Afternoon Shift</SelectItem>
                      <SelectItem value="EVENING">Evening Shift</SelectItem>
                      <SelectItem value="NIGHT">Night Shift</SelectItem>
                      <SelectItem value="FULL_DAY">Full Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time *</Label>
                  <Input 
                    type="time" 
                    value={formData.startTime} 
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  />
                </div>
                <div>
                  <Label>End Time *</Label>
                  <Input 
                    type="time" 
                    value={formData.endTime} 
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label>Bus Assignment (Optional)</Label>
                <Select value={formData.busId} onValueChange={(value) => setFormData({...formData, busId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No bus assigned</SelectItem>
                    {buses.map((bus: any) => (
                      <SelectItem key={bus.id} value={bus.id}>
                        {bus.name || bus.number_plate || bus.registration_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Route Assignment (Optional)</Label>
                <Select value={formData.routeId} onValueChange={(value) => setFormData({...formData, routeId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select route" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No route assigned</SelectItem>
                    {routes.map((route: any) => (
                      <SelectItem key={route.id} value={route.id}>
                        {route.origin} → {route.destination}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ driverId: '', shiftDate: new Date().toISOString().split('T')[0], shiftType: '', startTime: '', endTime: '', busId: '', routeId: '' });
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateShift}
                  disabled={!formData.driverId || !formData.shiftType || !formData.startTime || !formData.endTime}
                >
                  Create Shift
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );

  async function handleCreateShift() {
    if (!formData.driverId || !formData.shiftType || !formData.startTime || !formData.endTime) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      // Check for overlapping shifts
      const { data: existingShifts, error: checkError } = await supabase
        .from('driver_shifts')
        .select('*')
        .eq('driver_id', formData.driverId)
        .eq('shift_date', formData.shiftDate)
        .in('status', ['SCHEDULED', 'ACTIVE']);

      if (checkError) throw checkError;

      if (existingShifts && existingShifts.length > 0) {
        toast.error('Driver already has a shift scheduled for this date');
        return;
      }

      // Create shift via backend API
      const shiftStart = new Date(`${formData.shiftDate}T${formData.startTime}`);
      const shiftEnd = new Date(`${formData.shiftDate}T${formData.endTime}`);
      
      await api.post('/hr/shifts', {
        driver_id: formData.driverId,
        shift_date: formData.shiftDate,
        shift_type: formData.shiftType,
        start_time: shiftStart.toISOString(),
        end_time: shiftEnd.toISOString(),
        bus_id: formData.busId === 'none' ? null : formData.busId || null,
        route_id: formData.routeId === 'none' ? null : formData.routeId || null
      });

      toast.success('Shift created successfully');
      setShowCreateModal(false);
      setFormData({ driverId: '', shiftDate: new Date().toISOString().split('T')[0], shiftType: '', startTime: '', endTime: '', busId: '', routeId: '' });
      fetchShifts();
    } catch (error: any) {
      console.error('Create shift error:', error);
      toast.error(error.message || 'Failed to create shift');
    }
  }
};
