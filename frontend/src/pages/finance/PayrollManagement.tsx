import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import FinanceLayout from '@/components/finance/FinanceLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
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
import { Download, FileText, CheckCircle, Users, DollarSign, Calculator } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

export default function PayrollManagement() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : FinanceLayout;
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showPayslipDialog, setShowPayslipDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [showProcessDialog, setShowProcessDialog] = useState(false);

  const queryClient = useQueryClient();

  // Fetch all employees for payroll (both dashboard and non-dashboard)
  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees-payroll'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('employment_status', 'active')
        .order('full_name');
      
      if (error) throw error;
      
      return data || [];
    },
  });

  // Fetch attendance data for selected month
  const { data: attendanceData } = useQuery({
    queryKey: ['attendance', selectedMonth],
    queryFn: async () => {
      const [year, month] = selectedMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('attendance')
        .select('employee_id, date, hours_worked, overtime_hours, status')
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (error) {
        console.error('Error fetching attendance:', error);
        return [];
      }
      return data || [];
    },
  });

  // Fetch bonuses for selected month
  const { data: bonusesData } = useQuery({
    queryKey: ['bonuses', selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bonuses')
        .select('*')
        .eq('period', selectedMonth);
      
      if (error) {
        console.error('Error fetching bonuses:', error);
        return [];
      }
      return data || [];
    },
  });

  // Fetch payroll records for selected month
  const { data: payrollData, isLoading: payrollLoading } = useQuery({
    queryKey: ['payroll', selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll')
        .select(`
          *,
          employees (
            id,
            full_name,
            employee_id,
            department,
            position,
            basic_salary
          )
        `)
        .eq('month', selectedMonth)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching payroll:', error);
        throw error;
      }
      return data || [];
    },
  });

  const isLoading = employeesLoading || payrollLoading;

  // Calculate payroll for all employees
  const calculatePayrollMutation = useMutation({
    mutationFn: async (month: string) => {
      if (!employeesData) throw new Error('No employees data');
      
      // Calculate payroll for each active employee
      const payrollRecords = employeesData.map((emp: any) => {
        // Get attendance for this employee
        const empAttendance = (attendanceData || []).filter(
          (att: any) => att.employee_id === emp.id && att.status === 'PRESENT'
        );
        
        const daysWorked = empAttendance.length;
        const totalOvertimeHours = empAttendance.reduce(
          (sum: number, att: any) => sum + (att.overtime_hours || 0), 0
        );
        
        // Get bonuses for this employee
        const empBonuses = (bonusesData || []).filter(
          (bonus: any) => bonus.employee_id === emp.id
        );
        const totalBonuses = empBonuses.reduce(
          (sum: number, bonus: any) => sum + (bonus.amount || 0), 0
        );
        
        // Calculate components
        const basicSalary = emp.basic_salary || 0;
        const allowances = (emp.transport_allowance || 0) + 
                          (emp.housing_allowance || 0) + 
                          (emp.meal_allowance || 0);
        const overtimePay = totalOvertimeHours * (emp.hourly_rate || 0);
        
        // Calculate gross pay
        const grossPay = basicSalary + allowances + overtimePay + totalBonuses;
        
        // Calculate deductions (simplified - should use tax rules)
        const taxRate = 0.25; // 25% tax
        const insuranceRate = 0.05; // 5% insurance
        const pensionRate = 0.06; // 6% pension
        
        const tax = grossPay * taxRate;
        const insurance = grossPay * insuranceRate;
        const pension = grossPay * pensionRate;
        const totalDeductions = tax + insurance + pension;
        
        // Calculate net pay
        const netPay = grossPay - totalDeductions;
        
        return {
          employee_id: emp.id,
          month: month,
          basic_salary: basicSalary,
          allowances: allowances,
          overtime_pay: overtimePay,
          bonuses: totalBonuses,
          gross_pay: grossPay,
          tax: tax,
          insurance: insurance,
          pension: pension,
          deductions: totalDeductions,
          net_salary: netPay,
          days_worked: daysWorked,
          total_working_days: new Date(
            parseInt(month.split('-')[0]), 
            parseInt(month.split('-')[1]), 
            0
          ).getDate(),
          overtime_hours: totalOvertimeHours,
          status: 'PENDING',
          created_at: new Date().toISOString(),
        };
      });
      
      // Insert payroll records
      const { error } = await supabase
        .from('payroll')
        .upsert(payrollRecords, { 
          onConflict: 'employee_id,month',
          ignoreDuplicates: false 
        });
      
      if (error) throw error;
      return payrollRecords;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      toast.success('Payroll calculated successfully for all employees');
      setShowProcessDialog(false);
    },
    onError: (error: any) => {
      console.error('Error calculating payroll:', error);
      toast.error('Failed to calculate payroll: ' + error.message);
    },
  });

  // Process (approve) payroll
  const processPayrollMutation = useMutation({
    mutationFn: async (month: string) => {
      const { error } = await supabase
        .from('payroll')
        .update({ status: 'PROCESSED', processed_at: new Date().toISOString() })
        .eq('month', month)
        .eq('status', 'PENDING');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      toast.success('Payroll processed and approved successfully');
    },
    onError: (error: any) => {
      console.error('Error processing payroll:', error);
      toast.error('Failed to process payroll');
    },
  });

  // Map payroll data to display format
  const employees = (payrollData || []).map((record: any) => ({
    id: record.id,
    name: record.employees?.full_name || 'N/A',
    employeeId: record.employees?.employee_id || 'N/A',
    department: record.employees?.department || 'N/A',
    position: record.employees?.position || 'N/A',
    basicSalary: record.basic_salary || 0,
    allowances: record.allowances || 0,
    overtime: record.overtime_pay || 0,
    bonuses: record.bonuses || 0,
    grossPay: record.gross_pay || 0,
    tax: record.tax || 0,
    insurance: record.insurance || 0,
    pension: record.pension || 0,
    deductions: record.deductions || 0,
    netSalary: record.net_salary || 0,
    status: record.status?.toLowerCase() || 'pending',
    attendance: record.days_worked || 0,
    workingDays: record.total_working_days || 22,
    overtimeHours: record.overtime_hours || 0,
  }));

  // Calculate summary from actual data
  const summary = {
    totalEmployees: employeesData?.length || 0,
    totalGrossPay: employees.reduce((sum, emp) => sum + (emp.grossPay || 0), 0),
    totalBonuses: employees.reduce((sum, emp) => sum + (emp.bonuses || 0), 0),
    totalAllowances: employees.reduce((sum, emp) => sum + (emp.allowances || 0), 0),
    totalDeductions: employees.reduce((sum, emp) => sum + (emp.deductions || 0), 0),
    totalNetPay: employees.reduce((sum, emp) => sum + (emp.netSalary || 0), 0),
    processed: employees.filter(emp => emp.status === 'processed' || emp.status === 'approved').length,
    pending: employees.filter(emp => emp.status === 'pending').length,
  };

  const handleGeneratePayslip = (employee: any) => {
    setSelectedEmployee(employee);
    setShowPayslipDialog(true);
  };

  const handleDownloadPayslip = () => {
    console.log('Downloading payslip for:', selectedEmployee);
    // Generate PDF payslip
  };

  const handleCalculatePayroll = () => {
    if (!employeesData || employeesData.length === 0) {
      toast.error('No active employees found');
      return;
    }
    calculatePayrollMutation.mutate(selectedMonth);
  };

  const handleProcessPayroll = () => {
    if (employees.length === 0) {
      toast.error('No payroll records to process. Calculate payroll first.');
      return;
    }
    processPayrollMutation.mutate(selectedMonth);
  };

  const handleApproveAll = async () => {
    try {
      const { error } = await supabase
        .from('payroll')
        .update({ status: 'APPROVED' })
        .eq('month', selectedMonth)
        .eq('status', 'PENDING');
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      toast.success('All pending payroll approved');
    } catch (error: any) {
      console.error('Error approving payroll:', error);
      toast.error('Failed to approve payroll');
    }
  };

  const handleExportToBank = () => {
    // Generate CSV for bank transfer
    const csvData = employees
      .filter(emp => emp.status === 'approved' || emp.status === 'processed')
      .map(emp => `${emp.employeeId},${emp.name},${emp.netSalary}`)
      .join('\n');
    
    const blob = new Blob([`Employee ID,Name,Amount\n${csvData}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-${selectedMonth}.csv`;
    a.click();
    
    toast.success('Bank file exported');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Payroll Management</h1>
            <p className="text-muted-foreground">Automate salary processing and payslips</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCalculatePayroll} disabled={calculatePayrollMutation.isPending}>
              <Calculator className="mr-2 h-4 w-4" />
              {calculatePayrollMutation.isPending ? 'Calculating...' : 'Calculate Payroll'}
            </Button>
            <Button onClick={() => setShowProcessDialog(true)} disabled={employees.length === 0}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve & Process
            </Button>
            <Button onClick={handleExportToBank} disabled={employees.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export to Bank
            </Button>
          </div>
        </div>

        {/* Month Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Select Payroll Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label>Month</Label>
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleCalculatePayroll} disabled={calculatePayrollMutation.isPending}>
                  <Calculator className="mr-2 h-4 w-4" />
                  Calculate Payroll
                </Button>
                <Button onClick={handleApproveAll} disabled={employees.length === 0}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve All Pending
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalEmployees}</div>
              <p className="text-xs text-muted-foreground">Active staff</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gross Pay</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {summary.totalGrossPay.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Before deductions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
              <DollarSign className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">P {summary.totalDeductions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Tax, insurance, etc.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bonuses</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">P {summary.totalBonuses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Performance & incentives</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Allowances</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">P {summary.totalAllowances.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Transport, housing, etc.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Pay</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">P {summary.totalNetPay.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">To be paid</p>
            </CardContent>
          </Card>
        </div>

        {/* Status Summary */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Processed</span>
                  <Badge className="bg-green-500">{summary.processed} employees</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pending Approval</span>
                  <Badge className="bg-yellow-500">{summary.pending} employees</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button className="w-full" onClick={() => setShowProcessDialog(true)}>
                  Calculate Payroll
                </Button>
                <Button className="w-full" onClick={handleExportToBank}>
                  Generate Bank File
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Payroll Table */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Payroll Details</CardTitle>
            <CardDescription>Salary breakdown for {selectedMonth}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead className="text-right">Basic Salary</TableHead>
                  <TableHead className="text-right">Allowances</TableHead>
                  <TableHead className="text-right">Bonuses</TableHead>
                  <TableHead className="text-right">Overtime</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="text-muted-foreground">Loading payroll data...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No payroll records found for {selectedMonth}
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((employee) => (
                    <TableRow key={employee.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-sm text-muted-foreground">{employee.employeeId}</div>
                      </div>
                    </TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {employee.attendance}/{employee.workingDays} days
                      </div>
                    </TableCell>
                    <TableCell className="text-right">P {employee.basicSalary.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-green-600">+P {employee.allowances.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-purple-600">+P {employee.bonuses.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-blue-600">+P {employee.overtime.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-red-600">-P {employee.deductions.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold">P {employee.netSalary.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={employee.status === 'approved' ? 'bg-green-500' : 'bg-yellow-500'}>
                        {employee.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button onClick={() => handleGeneratePayslip(employee)}>
                        <FileText className="h-4 w-4 mr-1" />
                        Payslip
                      </Button>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Payslip Dialog */}
        <Dialog open={showPayslipDialog} onOpenChange={setShowPayslipDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Payslip - {selectedEmployee?.name}</DialogTitle>
              <DialogDescription>Period: {selectedMonth}</DialogDescription>
            </DialogHeader>
            {selectedEmployee && (
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Employee ID</div>
                      <div className="font-medium">{selectedEmployee.employeeId}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Department</div>
                      <div className="font-medium">{selectedEmployee.department}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Position</div>
                      <div className="font-medium">{selectedEmployee.position}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Attendance</div>
                      <div className="font-medium">{selectedEmployee.attendance}/{selectedEmployee.workingDays} days</div>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Basic Salary</span>
                      <span className="font-medium">P {selectedEmployee.basicSalary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Allowances</span>
                      <span className="font-medium">+P {selectedEmployee.allowances.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-blue-600">
                      <span>Overtime</span>
                      <span className="font-medium">+P {selectedEmployee.overtime.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-2">
                      <span>Gross Pay</span>
                      <span>P {(selectedEmployee.basicSalary + selectedEmployee.allowances + selectedEmployee.overtime).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Deductions (Tax, Insurance)</span>
                      <span className="font-medium">-P {selectedEmployee.deductions.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Net Pay</span>
                      <span className="text-green-600">P {selectedEmployee.netSalary.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button onClick={() => setShowPayslipDialog(false)}>Close</Button>
                  <Button onClick={handleDownloadPayslip}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Process Payroll Dialog */}
        <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Payroll</DialogTitle>
              <DialogDescription>Calculate salaries for {selectedMonth}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span>Total Employees</span>
                  <span className="font-medium">{summary.totalEmployees}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gross Pay</span>
                  <span className="font-medium">P {summary.totalGrossPay.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Total Deductions</span>
                  <span className="font-medium">P {summary.totalDeductions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Net Payroll</span>
                  <span className="text-green-600">P {summary.totalNetPay.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button onClick={() => setShowProcessDialog(false)}>Cancel</Button>
                <Button onClick={handleProcessPayroll}>
                  <Calculator className="mr-2 h-4 w-4" />
                  Process Payroll
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
