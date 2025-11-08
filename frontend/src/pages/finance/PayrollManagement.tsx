import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
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
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showPayslipDialog, setShowPayslipDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [showProcessDialog, setShowProcessDialog] = useState(false);

  const queryClient = useQueryClient();

  const { data: payrollRecords = [] } = useQuery({
    queryKey: ['finance-payroll', selectedMonth],
    queryFn: async () => {
      const response = await api.get(`/finance/payroll?month=${selectedMonth}`);
      return Array.isArray(response.data) ? response.data : (response.data?.payroll || []);
    },
  });

  const processPayrollMutation = useMutation({
    mutationFn: async (month: string) => {
      await api.post('/finance/payroll/process', { month });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-payroll'] });
      toast.success('Payroll processed successfully');
      setShowProcessDialog(false);
    },
    onError: () => {
      toast.error('Failed to process payroll');
    },
  });

  const employees = payrollRecords.length > 0 ? payrollRecords : [
    {
      id: 1,
      name: 'John Driver',
      employeeId: 'EMP-001',
      department: 'Drivers',
      position: 'Senior Driver',
      basicSalary: 8500,
      allowances: 1200,
      overtime: 450,
      deductions: 1850,
      netSalary: 8300,
      status: 'pending',
      attendance: 22,
      workingDays: 22,
    },
    {
      id: 2,
      name: 'Jane Mechanic',
      employeeId: 'EMP-002',
      department: 'Maintenance',
      position: 'Lead Mechanic',
      basicSalary: 9500,
      allowances: 800,
      overtime: 0,
      deductions: 2100,
      netSalary: 8200,
      status: 'approved',
      attendance: 22,
      workingDays: 22,
    },
    {
      id: 3,
      name: 'Mike Agent',
      employeeId: 'EMP-003',
      department: 'Ticketing',
      position: 'Ticketing Agent',
      basicSalary: 6500,
      allowances: 500,
      overtime: 200,
      deductions: 1400,
      netSalary: 5800,
      status: 'pending',
      attendance: 20,
      workingDays: 22,
    },
  ];

  const summary = {
    totalEmployees: 156,
    totalGrossPay: 1450000,
    totalDeductions: 285000,
    totalNetPay: 1165000,
    processed: 148,
    pending: 8,
  };

  const handleGeneratePayslip = (employee: any) => {
    setSelectedEmployee(employee);
    setShowPayslipDialog(true);
  };

  const handleDownloadPayslip = () => {
    console.log('Downloading payslip for:', selectedEmployee);
    // Generate PDF payslip
  };

  const handleProcessPayroll = () => {
    console.log('Processing payroll for month:', selectedMonth);
    setShowProcessDialog(false);
  };

  const handleApproveAll = () => {
    console.log('Approving all pending payroll');
  };

  const handleExportToBank = () => {
    console.log('Exporting to bank format');
  };

  return (
    <FinanceLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Payroll Management</h1>
            <p className="text-muted-foreground">Automate salary processing and payslips</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowProcessDialog(true)}>
              <Calculator className="mr-2 h-4 w-4" />
              Process Payroll
            </Button>
            <Button onClick={handleExportToBank}>
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
              <div className="flex items-end">
                <Button onClick={handleApproveAll}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve All Pending
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4">
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
                  <TableHead className="text-right">Overtime</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
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
                ))}
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
    </FinanceLayout>
  );
}
