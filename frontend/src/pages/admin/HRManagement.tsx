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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, UserPlus, DollarSign, Calendar, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function HRManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch staff
  const { data: staff, isLoading: staffLoading } = useQuery({
    queryKey: ['staff-directory', selectedDepartment],
    queryFn: async () => {
      const params = selectedDepartment !== 'all' ? `?department=${selectedDepartment}` : '';
      const response = await api.get(`/staff${params}`);
      return response.data.data || [];
    },
  });

  // Fetch drivers
  const { data: drivers, isLoading: driversLoading } = useQuery({
    queryKey: ['drivers-hr'],
    queryFn: async () => {
      const response = await api.get('/drivers');
      return response.data.data || [];
    },
  });

  // Fetch attendance - today's overview
  const { data: attendance } = useQuery({
    queryKey: ['staff-attendance'],
    queryFn: async () => {
      try {
        const response = await api.get('/staff_attendance');
        return response.data.data || [];
      } catch (error) {
        console.error('Error fetching attendance:', error);
        return [];
      }
    },
  });

  // Fetch payroll
  const { data: payroll } = useQuery({
    queryKey: ['payroll-data'],
    queryFn: async () => {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const response = await api.get(`/hr/payroll/${currentMonth}`);
      return response.data.data || [];
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
      queryClient.invalidateQueries({ queryKey: ['staff-directory'] });
    },
    onError: () => {
      toast.error('Failed to add employee');
    },
  });

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

  // Calculate summary stats
  const totalStaff = (staff?.length || 0) + (drivers?.length || 0);
  const activeStaff = staff?.filter((s: any) => s.status === 'active').length || 0;
  const activeDrivers = drivers?.filter((d: any) => d.status === 'active').length || 0;
  const presentToday = attendance?.filter((a: any) => a.status === 'present').length || 0;
  const attendanceRate = attendance?.length ? ((presentToday / attendance.length) * 100).toFixed(1) : '0';
  
  const totalPayroll = payroll?.reduce((sum: number, p: any) => sum + parseFloat(p.total_amount), 0) || 0;

  // Filter staff by search
  const filteredStaff = staff?.filter((s: any) =>
    (s.firstName || s.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'on_leave': return 'bg-orange-500';
      case 'suspended': return 'bg-red-500';
      case 'inactive': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">HR Management</h1>
            <p className="text-muted-foreground">Manage employees, drivers, payroll, and performance</p>
          </div>
          <Button onClick={() => setAddEmployeeOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Staff
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalStaff}</p>
              <p className="text-xs text-muted-foreground">
                {activeStaff} staff + {activeDrivers} drivers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Attendance Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{attendanceRate}%</p>
              <p className="text-xs text-muted-foreground">{presentToday} present</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Payroll
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">P{totalPayroll.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Last 50 payments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Expiring Licenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">
                {drivers?.filter((d: any) => {
                  const expiry = new Date(d.license_expiry);
                  const daysUntil = Math.floor((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return daysUntil <= 45 && daysUntil >= 0;
                }).length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Within 45 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="staff" className="space-y-4">
          <TabsList>
            <TabsTrigger value="staff">Staff Directory</TabsTrigger>
            <TabsTrigger value="drivers">Driver Management</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Staff Directory Tab */}
          <TabsContent value="staff" className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="all">All Departments</option>
                <option value="operations">Operations</option>
                <option value="finance">Finance</option>
                <option value="hr">HR</option>
                <option value="maintenance">Maintenance</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Hire Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Loading staff...
                        </TableCell>
                      </TableRow>
                    ) : filteredStaff?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No staff members found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStaff?.map((member: any) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{member.full_name}</p>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{member.role || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{member.department}</Badge>
                          </TableCell>
                          <TableCell>{member.phone}</TableCell>
                          <TableCell>
                            {member.hire_date ? format(new Date(member.hire_date), 'MMM dd, yyyy') : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(member.status)}>
                              {member.status}
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

          {/* Driver Management Tab */}
          <TabsContent value="drivers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Drivers</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>License No.</TableHead>
                      <TableHead>License Expiry</TableHead>
                      <TableHead>Total Trips</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {driversLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Loading drivers...
                        </TableCell>
                      </TableRow>
                    ) : drivers?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No drivers found
                        </TableCell>
                      </TableRow>
                    ) : (
                      drivers?.map((driver: any) => {
                        const expiry = new Date(driver.license_expiry);
                        const daysUntil = Math.floor((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                        const isExpiringSoon = daysUntil <= 45 && daysUntil >= 0;

                        return (
                          <TableRow key={driver.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{driver.full_name}</p>
                                <p className="text-xs text-muted-foreground">{driver.phone}</p>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{driver.license_number}</TableCell>
                            <TableCell>
                              <div className={isExpiringSoon ? 'text-orange-600 font-medium' : ''}>
                                {format(expiry, 'MMM dd, yyyy')}
                                {isExpiringSoon && (
                                  <p className="text-xs">⚠️ Expiring soon</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{driver.total_trips || 0}</TableCell>
                            <TableCell>
                              {driver.rating ? `⭐ ${parseFloat(driver.rating).toFixed(1)}` : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(driver.status)}>
                                {driver.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm">View</Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Today's Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No attendance records for today
                        </TableCell>
                      </TableRow>
                    ) : (
                      attendance?.map((record: any) => (
                        <TableRow key={record.id}>
                          <TableCell>{record.staff?.full_name}</TableCell>
                          <TableCell>{record.check_in_time || 'N/A'}</TableCell>
                          <TableCell>{record.check_out_time || 'N/A'}</TableCell>
                          <TableCell>{record.hours_worked ? `${record.hours_worked}h` : 'N/A'}</TableCell>
                          <TableCell>
                            <Badge className={record.status === 'present' ? 'bg-green-500' : 'bg-red-500'}>
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
          </TabsContent>

          {/* Payroll Tab */}
          <TabsContent value="payroll" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payroll Records</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Base Salary</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payroll?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No payroll records
                        </TableCell>
                      </TableRow>
                    ) : (
                      payroll?.map((record: any) => (
                        <TableRow key={record.id}>
                          <TableCell>{record.staff?.full_name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{record.staff?.department}</Badge>
                          </TableCell>
                          <TableCell>{record.payment_period}</TableCell>
                          <TableCell>P{parseFloat(record.base_salary).toFixed(2)}</TableCell>
                          <TableCell className="text-red-600">
                            -P{parseFloat(record.deductions || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="font-bold">
                            P{parseFloat(record.total_amount).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge className={record.status === 'paid' ? 'bg-green-500' : 'bg-orange-500'}>
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
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Reports - Coming Soon</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Driver ratings, incident history, and performance metrics will be displayed here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Employee Dialog */}
      <Dialog open={addEmployeeOpen} onOpenChange={setAddEmployeeOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
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
    </AdminLayout>
  );
}
