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
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DollarSign, Users, TrendingUp, TrendingDown, Plus, Play, FileText, Mail, Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

export default function HRPayroll() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : HRLayout;
  const queryClient = useQueryClient();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRunDialog, setShowRunDialog] = useState(false);
  const [showBonusDialog, setShowBonusDialog] = useState(false);
  const [showDeductionDialog, setShowDeductionDialog] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<any>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    periodStart: '',
    periodEnd: '',
    basicSalary: '',
    allowances: '0',
    bonuses: '0',
    deductions: '0'
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

  const { data: payrollRecords = [], isLoading } = useQuery({
    queryKey: ['hr-payroll'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll')
        .select(`
          *,
          employee:profiles(full_name, employee_id, department)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const addToPayroll = useMutation({
    mutationFn: async (payrollData: any) => {
      const { data, error } = await supabase
        .from('payroll')
        .insert([{
          employee_id: payrollData.employeeId,
          period_start: payrollData.periodStart,
          period_end: payrollData.periodEnd,
          basic_salary: parseFloat(payrollData.basicSalary),
          allowances: parseFloat(payrollData.allowances),
          bonuses: parseFloat(payrollData.bonuses),
          deductions: parseFloat(payrollData.deductions),
          status: 'pending',
          created_by: user?.id
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-payroll'] });
      toast.success('Employee added to payroll');
      setShowAddDialog(false);
      setFormData({ employeeId: '', periodStart: '', periodEnd: '', basicSalary: '', allowances: '0', bonuses: '0', deductions: '0' });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add to payroll');
    }
  });

  const runPayroll = useMutation({
    mutationFn: async () => {
      const pendingIds = payrollRecords
        .filter((p: any) => p.status === 'pending')
        .map((p: any) => p.id);
      
      const { data, error } = await supabase
        .from('payroll')
        .update({
          status: 'processed',
          processed_by: user?.id,
          processed_at: new Date().toISOString(),
          payment_date: new Date().toISOString().split('T')[0]
        })
        .in('id', pendingIds)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['hr-payroll'] });
      toast.success(`Processed ${data.length} payroll records`);
      setShowRunDialog(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to run payroll');
    }
  });

  const generatePayslip = useMutation({
    mutationFn: async (payrollId: string) => {
      const { data, error } = await supabase
        .from('payslips')
        .insert([{
          payroll_id: payrollId,
          employee_id: selectedPayroll.employee_id
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Payslip generated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate payslip');
    }
  });

  const handleAddSubmit = () => {
    if (!formData.employeeId || !formData.periodStart || !formData.periodEnd || !formData.basicSalary) {
      toast.error('Please fill all required fields');
      return;
    }
    addToPayroll.mutate(formData);
  };

  const summary = {
    totalEmployees: payrollRecords.length,
    totalGrossPay: payrollRecords.reduce((sum: number, p: any) => sum + parseFloat(p.gross_pay || 0), 0),
    totalDeductions: payrollRecords.reduce((sum: number, p: any) => sum + parseFloat(p.deductions || 0), 0),
    totalNetPay: payrollRecords.reduce((sum: number, p: any) => sum + parseFloat(p.net_salary || 0), 0),
    totalBonuses: payrollRecords.reduce((sum: number, p: any) => sum + parseFloat(p.bonuses || 0), 0),
    totalAllowances: payrollRecords.reduce((sum: number, p: any) => sum + parseFloat(p.allowances || 0), 0),
    pending: payrollRecords.filter((p: any) => p.status === 'pending').length,
    processed: payrollRecords.filter((p: any) => p.status === 'processed').length,
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Payroll Management</h1>
            <p className="text-muted-foreground">Manage employee salaries and compensation</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add to Payroll
            </Button>
            <Button onClick={() => setShowRunDialog(true)} disabled={summary.pending === 0}>
              <Play className="h-4 w-4 mr-2" />
              Run Payroll ({summary.pending})
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Employees</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalEmployees}</div>
              <p className="text-xs text-muted-foreground">Total staff</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gross Pay</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">P {summary.totalGrossPay.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deductions</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">P {summary.totalDeductions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Tax, insurance, etc.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Pay</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">P {summary.totalNetPay.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total payout</p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Summary */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bonuses</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">P {summary.totalBonuses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Performance & incentives</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Allowances</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">P {summary.totalAllowances.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Transport, housing, etc.</p>
            </CardContent>
          </Card>
        </div>

        {/* Payroll Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Payroll Records</CardTitle>
            <CardDescription>Monthly salary breakdown for all employees</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Basic Salary</TableHead>
                  <TableHead className="text-right">Allowances</TableHead>
                  <TableHead className="text-right">Bonuses</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{record.employee?.full_name || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">{record.employee?.employee_id || 'N/A'}</div>
                      </div>
                    </TableCell>
                    <TableCell>{record.employee?.department || 'N/A'}</TableCell>
                    <TableCell className="text-right font-medium">P {record.basic_salary.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-green-600">+P {record.allowances.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-green-600">
                      {record.bonuses > 0 ? `+P ${record.bonuses.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell className="text-right text-red-600">-P {record.deductions.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold text-blue-600">P {record.net_salary.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={record.status === 'processed' ? 'bg-green-500' : 'bg-yellow-500'}>
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => {
                            setSelectedEmployee(record);
                            setShowBonusDialog(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Bonus
                        </Button>
                        <Button 
                          onClick={() => {
                            setSelectedEmployee(record);
                            setShowDeductionDialog(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Deduction
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add to Payroll Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to Payroll</DialogTitle>
              <DialogDescription>
                Add employee to payroll
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Employee</Label>
                <Select value={formData.employeeId} onValueChange={(value) => setFormData({ ...formData, employeeId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No employees found</div>
                    ) : (
                      employees.map((employee: any) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.full_name} ({employee.employee_id})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Period Start</Label>
                <Input type="date" value={formData.periodStart} onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })} />
              </div>
              <div>
                <Label>Period End</Label>
                <Input type="date" value={formData.periodEnd} onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })} />
              </div>
              <div>
                <Label>Basic Salary</Label>
                <Input type="number" value={formData.basicSalary} onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })} placeholder="0.00" />
              </div>
              <div>
                <Label>Allowances</Label>
                <Input type="number" value={formData.allowances} onChange={(e) => setFormData({ ...formData, allowances: e.target.value })} placeholder="0.00" />
              </div>
              <div>
                <Label>Bonuses</Label>
                <Input type="number" value={formData.bonuses} onChange={(e) => setFormData({ ...formData, bonuses: e.target.value })} placeholder="0.00" />
              </div>
              <div>
                <Label>Deductions</Label>
                <Input type="number" value={formData.deductions} onChange={(e) => setFormData({ ...formData, deductions: e.target.value })} placeholder="0.00" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button onClick={handleAddSubmit}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add to Payroll
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Run Payroll Dialog */}
        <Dialog open={showRunDialog} onOpenChange={setShowRunDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Run Payroll</DialogTitle>
              <DialogDescription>
                Process payroll for all employees
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p>Are you sure you want to run payroll for all employees?</p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button onClick={() => setShowRunDialog(false)}>Cancel</Button>
                <Button onClick={() => runPayroll.mutate()}>
                  <Play className="mr-2 h-4 w-4" />
                  Run Payroll
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
