import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import HRLayout from '@/components/hr/HRLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, UserCheck, UserX, Calendar, Plus, Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function Attendance() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : HRLayout;
  const queryClient = useQueryClient();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    checkInTime: '',
    checkOutTime: '',
    notes: ''
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, employee_id, department, email')
        .order('full_name');
      if (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }
      console.log('Fetched employees:', data);
      return data || [];
    },
  });

  const { data: attendanceRecords = [], isLoading } = useQuery({
    queryKey: ['attendance', selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          employee:profiles(full_name, employee_id, department)
        `)
        .eq('date', selectedDate)
        .order('check_in', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const createAttendance = useMutation({
    mutationFn: async (attendanceData: any) => {
      const checkIn = new Date(`${selectedDate}T${formData.checkInTime}`);
      const checkOut = formData.checkOutTime ? new Date(`${selectedDate}T${formData.checkOutTime}`) : null;
      
      const { data, error } = await supabase
        .from('attendance')
        .insert([{
          employee_id: attendanceData.employeeId,
          date: selectedDate,
          check_in: checkIn.toISOString(),
          check_out: checkOut?.toISOString(),
          notes: attendanceData.notes,
          created_by: user?.id
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Attendance recorded successfully');
      setShowAddDialog(false);
      setFormData({ employeeId: '', checkInTime: '', checkOutTime: '', notes: '' });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to record attendance');
    }
  });

  const handleSubmit = () => {
    if (!formData.employeeId || !formData.checkInTime) {
      toast.error('Please select employee and check-in time');
      return;
    }
    createAttendance.mutate(formData);
  };

  const summary = {
    totalEmployees: attendanceRecords.length,
    present: attendanceRecords.filter((a: any) => a.status === 'present' || a.status === 'late').length,
    absent: attendanceRecords.filter((a: any) => a.status === 'absent').length,
    late: attendanceRecords.filter((a: any) => a.status === 'late').length,
    totalHours: attendanceRecords.reduce((sum: number, a: any) => sum + (parseFloat(a.work_hours) || 0), 0).toFixed(2),
    overtimeHours: attendanceRecords.reduce((sum: number, a: any) => sum + (parseFloat(a.overtime_hours) || 0), 0).toFixed(2),
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Attendance & Shifts</h1>
            <p className="text-muted-foreground">Track employee attendance and working hours</p>
          </div>
          <div className="flex gap-2">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Record Attendance
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present Today</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.present}</div>
              <p className="text-xs text-muted-foreground">Out of {summary.totalEmployees}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent</CardTitle>
              <UserX className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.absent}</div>
              <p className="text-xs text-muted-foreground">Not checked in</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalHours}h</div>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overtime</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{summary.overtimeHours}h</div>
              <p className="text-xs text-muted-foreground">Extra hours</p>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Records */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Attendance</CardTitle>
            <CardDescription>Employee check-in/check-out records for {selectedDate}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Work Hours</TableHead>
                  <TableHead>Overtime</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No attendance records for this date
                    </TableCell>
                  </TableRow>
                ) : (
                  attendanceRecords.map((record: any) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-mono">{record.employee?.employee_id || '-'}</TableCell>
                      <TableCell className="font-medium">{record.employee?.full_name || '-'}</TableCell>
                      <TableCell>{record.employee?.department || '-'}</TableCell>
                      <TableCell>{record.check_in ? new Date(record.check_in).toLocaleTimeString() : '-'}</TableCell>
                      <TableCell>{record.check_out ? new Date(record.check_out).toLocaleTimeString() : '-'}</TableCell>
                      <TableCell>{record.work_hours ? `${record.work_hours}h` : '-'}</TableCell>
                      <TableCell className={record.overtime_hours > 0 ? 'text-orange-600 font-medium' : ''}>
                        {record.overtime_hours ? `${record.overtime_hours}h` : '0h'}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          record.status === 'present' ? 'bg-green-500' :
                          record.status === 'late' ? 'bg-yellow-500' :
                          record.status === 'half_day' ? 'bg-blue-500' :
                          'bg-red-500'
                        }>
                          {record.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add Attendance Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Attendance</DialogTitle>
              <DialogDescription>Record employee check-in and check-out times</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Employee</Label>
                <Select value={formData.employeeId} onValueChange={(value) => setFormData({...formData, employeeId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No employees found</div>
                    ) : (
                      employees.map((emp: any) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.full_name} {emp.employee_id ? `(${emp.employee_id})` : emp.email ? `(${emp.email})` : ''}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Check-In Time</Label>
                <Input
                  type="time"
                  value={formData.checkInTime}
                  onChange={(e) => setFormData({...formData, checkInTime: e.target.value})}
                />
              </div>
              <div>
                <Label>Check-Out Time (Optional)</Label>
                <Input
                  type="time"
                  value={formData.checkOutTime}
                  onChange={(e) => setFormData({...formData, checkOutTime: e.target.value})}
                />
              </div>
              <div>
                <Label>Notes (Optional)</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Any additional notes"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={createAttendance.isPending}>
                  {createAttendance.isPending ? 'Recording...' : 'Record Attendance'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
