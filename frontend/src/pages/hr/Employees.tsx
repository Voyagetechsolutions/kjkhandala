import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import HRLayout from '@/components/hr/HRLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Plus, Users, UserCheck, UserX, Pencil, Ban, CheckCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { useEmployees, useDeactivateEmployee, useReactivateEmployee } from '@/hooks/useEmployees';
import EmployeeForm from '@/components/hr/EmployeeForm';

export default function Employees() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : HRLayout;
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editEmployee, setEditEmployee] = useState<any>(null);
  const [filters, setFilters] = useState({
    department: 'all',
    status: 'all',
    search: '',
  });

  const { data: employees = [], isLoading } = useEmployees();
  const deactivateEmployee = useDeactivateEmployee();
  const reactivateEmployee = useReactivateEmployee();

  const handleDeactivate = async (id: string) => {
    if (confirm('Are you sure you want to deactivate this employee?')) {
      await deactivateEmployee.mutateAsync(id);
    }
  };

  const handleReactivate = async (id: string) => {
    await reactivateEmployee.mutateAsync(id);
  };

  const filteredEmployees = employees.filter((emp: any) => {
    const matchesDept = filters.department === 'all' || emp.department === filters.department;
    const matchesStatus = filters.status === 'all' || emp.employment_status === filters.status;
    const matchesSearch = !filters.search || 
      emp.full_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      emp.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
      emp.employee_number?.toLowerCase().includes(filters.search.toLowerCase());
    return matchesDept && matchesStatus && matchesSearch;
  });

  const summary = {
    total: employees.length,
    active: employees.filter((e: any) => e.employment_status === 'active').length,
    inactive: employees.filter((e: any) => e.employment_status === 'inactive').length,
  };

  const departments = [...new Set(employees.map((e: any) => e.department))].filter(Boolean);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Employee Management</h1>
            <p className="text-muted-foreground">Manage employee records and information</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total}</div>
              <p className="text-xs text-muted-foreground">All staff members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.active}</div>
              <p className="text-xs text-muted-foreground">Currently working</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <UserX className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.inactive}</div>
              <p className="text-xs text-muted-foreground">Not active</p>
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
              <div className="space-y-2">
                <Label>Search</Label>
                <Input
                  placeholder="Search by name, email or ID..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={filters.department} onValueChange={(v) => setFilters({...filters, department: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept: string) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Table */}
        <Card>
          <CardHeader>
            <CardTitle>Employee List</CardTitle>
            <CardDescription>
              {isLoading ? 'Loading employees...' : `${filteredEmployees.length} employees`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Hire Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No employees found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmployees.map((employee: any) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-mono">
                          {employee.employee_id || employee.id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="font-medium">{employee.full_name}</TableCell>
                        <TableCell>{employee.department || '-'}</TableCell>
                        <TableCell>{employee.position || '-'}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{employee.email}</div>
                            <div className="text-muted-foreground">{employee.phone || '-'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={employee.is_active ? 'default' : 'secondary'}>
                            {employee.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditEmployee(employee);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {employee.is_active ? (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeactivate(employee.id)}
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleReactivate(employee.id)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Employee Dialog */}
        <EmployeeForm
          employee={editEmployee}
          open={showAddDialog || !!editEmployee}
          onClose={() => {
            setShowAddDialog(false);
            setEditEmployee(null);
          }}
        />
      </div>
    </Layout>
  );
}
