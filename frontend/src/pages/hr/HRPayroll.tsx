import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import HRLayout from '@/components/hr/HRLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DollarSign, Users, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

export default function HRPayroll() {
  const [showBonusDialog, setShowBonusDialog] = useState(false);
  const [showDeductionDialog, setShowDeductionDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const queryClient = useQueryClient();

  const { data: payrollRecords = [] } = useQuery({
    queryKey: ['hr-payroll'],
    queryFn: async () => {
      const response = await api.get('/hr/payroll');
      return Array.isArray(response.data) ? response.data : (response.data?.payroll || []);
    },
  });

  const summary = {
    totalEmployees: payrollRecords.length,
    totalGrossPay: payrollRecords.reduce((sum: number, p: any) => sum + parseFloat(p.grossPay || p.basicSalary || 0), 0),
    totalDeductions: payrollRecords.reduce((sum: number, p: any) => sum + parseFloat(p.deductions || 0), 0),
    totalNetPay: payrollRecords.reduce((sum: number, p: any) => sum + parseFloat(p.netSalary || 0), 0),
    totalBonuses: payrollRecords.reduce((sum: number, p: any) => sum + parseFloat(p.bonuses || 0), 0),
    totalAllowances: payrollRecords.reduce((sum: number, p: any) => sum + parseFloat(p.allowances || 0), 0),
  };

  const handleAddBonus = () => {
    console.log('Adding bonus for:', selectedEmployee);
    setShowBonusDialog(false);
  };

  const handleAddDeduction = () => {
    console.log('Adding deduction for:', selectedEmployee);
    setShowDeductionDialog(false);
  };

  return (
    <HRLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Payroll Management</h1>
            <p className="text-muted-foreground">Manage employee salaries and compensation</p>
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
                        <div className="font-medium">{record.name}</div>
                        <div className="text-sm text-muted-foreground">{record.employeeId}</div>
                      </div>
                    </TableCell>
                    <TableCell>{record.department}</TableCell>
                    <TableCell className="text-right font-medium">P {record.basicSalary.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-green-600">+P {record.allowances.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-green-600">
                      {record.bonuses > 0 ? `+P ${record.bonuses.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell className="text-right text-red-600">-P {record.deductions.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold text-blue-600">P {record.netSalary.toLocaleString()}</TableCell>
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

        {/* Add Bonus Dialog */}
        <Dialog open={showBonusDialog} onOpenChange={setShowBonusDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Bonus</DialogTitle>
              <DialogDescription>
                {selectedEmployee && `Add bonus for ${selectedEmployee.name}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Bonus Type</Label>
                <select className="w-full p-2 border rounded">
                  <option>Performance Bonus</option>
                  <option>Attendance Bonus</option>
                  <option>Safety Bonus</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <Label>Amount (P)</Label>
                <Input type="number" placeholder="0.00" />
              </div>
              <div>
                <Label>Reason</Label>
                <Input placeholder="Enter reason for bonus" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button onClick={() => setShowBonusDialog(false)}>Cancel</Button>
                <Button onClick={handleAddBonus}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Bonus
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Deduction Dialog */}
        <Dialog open={showDeductionDialog} onOpenChange={setShowDeductionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Deduction</DialogTitle>
              <DialogDescription>
                {selectedEmployee && `Add deduction for ${selectedEmployee.name}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Deduction Type</Label>
                <select className="w-full p-2 border rounded">
                  <option>Tax</option>
                  <option>Insurance</option>
                  <option>Loan Repayment</option>
                  <option>Penalty</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <Label>Amount (P)</Label>
                <Input type="number" placeholder="0.00" />
              </div>
              <div>
                <Label>Reason</Label>
                <Input placeholder="Enter reason for deduction" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button onClick={() => setShowDeductionDialog(false)}>Cancel</Button>
                <Button onClick={handleAddDeduction}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Deduction
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </HRLayout>
  );
}
