import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useAddEmployee, useUpdateEmployee, useDepartments, usePositions } from '@/hooks/useEmployees';

interface EmployeeFormProps {
  employee?: any;
  open: boolean;
  onClose: () => void;
}

interface EmployeeFormData {
  email: string;
  full_name: string;
  phone?: string;
  department?: string;
  position?: string;
  hire_date?: string;
  salary?: number;
  password?: string;
  has_dashboard?: boolean;
  role?: string;
}

export default function EmployeeForm({ employee, open, onClose }: EmployeeFormProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<EmployeeFormData>({
    defaultValues: employee || {},
  });
  
  const [selectedDepartment, setSelectedDepartment] = useState(employee?.department || '');
  const [selectedPosition, setSelectedPosition] = useState(employee?.position || '');
  const [hasDashboard, setHasDashboard] = useState(employee?.has_dashboard || false);
  const [selectedRole, setSelectedRole] = useState(employee?.role || '');
  
  const addEmployee = useAddEmployee();
  const updateEmployee = useUpdateEmployee();
  const { data: departments } = useDepartments();
  const { data: positions } = usePositions();

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      const payload = {
        ...data,
        department: selectedDepartment || undefined,
        position: selectedPosition || undefined,
        salary: data.salary ? Number(data.salary) : undefined,
        has_dashboard: hasDashboard,
        role: hasDashboard ? selectedRole : undefined,
      };

      if (employee) {
        await updateEmployee.mutateAsync({ id: employee.id, updates: payload });
      } else {
        await addEmployee.mutateAsync(payload);
      }
      
      reset();
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
          <DialogDescription>
            {employee 
              ? 'Update employee information' 
              : 'Create a new employee account. Login credentials will be sent to their email.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...register('email', { required: 'Email is required' })}
              placeholder="employee@example.com"
              disabled={!!employee}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>

          {/* Password (only for new employees) */}
          {!employee && (
            <div className="space-y-2">
              <Label htmlFor="password">Password (optional)</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                placeholder="Leave blank for auto-generated password"
              />
              <p className="text-xs text-muted-foreground">
                If left blank, a secure password will be generated and sent to the employee's email.
              </p>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              {...register('full_name', { required: 'Full name is required' })}
              placeholder="John Doe"
            />
            {errors.full_name && <p className="text-sm text-red-500">{errors.full_name.message}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              {...register('phone')}
              placeholder="+267 71234567"
            />
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Operations">Operations</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="HR">Human Resources</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Ticketing">Ticketing</SelectItem>
                <SelectItem value="Management">Management</SelectItem>
                {departments?.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Position */}
          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Select value={selectedPosition} onValueChange={setSelectedPosition}>
              <SelectTrigger>
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Manager">Manager</SelectItem>
                <SelectItem value="Supervisor">Supervisor</SelectItem>
                <SelectItem value="Officer">Officer</SelectItem>
                <SelectItem value="Agent">Agent</SelectItem>
                <SelectItem value="Technician">Technician</SelectItem>
                <SelectItem value="Driver">Driver</SelectItem>
                {positions?.map((pos) => (
                  <SelectItem key={pos} value={pos}>
                    {pos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Hire Date */}
          <div className="space-y-2">
            <Label htmlFor="hire_date">Hire Date</Label>
            <Input
              id="hire_date"
              type="date"
              {...register('hire_date')}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Salary */}
          <div className="space-y-2">
            <Label htmlFor="salary">Salary (P)</Label>
            <Input
              id="salary"
              type="number"
              step="0.01"
              {...register('salary')}
              placeholder="0.00"
            />
          </div>

          {/* Dashboard Access */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="has_dashboard" 
                checked={hasDashboard}
                onCheckedChange={(checked) => setHasDashboard(checked as boolean)}
              />
              <div className="space-y-1">
                <Label htmlFor="has_dashboard" className="cursor-pointer font-medium">
                  Create Dashboard Account
                </Label>
                <p className="text-xs text-muted-foreground">
                  Enable this to give the employee access to the system dashboard
                </p>
              </div>
            </div>

            {hasDashboard && (
              <div className="space-y-2 ml-6">
                <Label htmlFor="role">Dashboard Role *</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select dashboard role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPERATIONS_MANAGER">Operations Manager</SelectItem>
                    <SelectItem value="FINANCE_MANAGER">Finance Manager</SelectItem>
                    <SelectItem value="HR_MANAGER">HR Manager</SelectItem>
                    <SelectItem value="MAINTENANCE_MANAGER">Maintenance Manager</SelectItem>
                    <SelectItem value="TICKETING_SUPERVISOR">Ticketing Supervisor</SelectItem>
                    <SelectItem value="TICKETING_AGENT">Ticketing Agent</SelectItem>
                    <SelectItem value="DRIVER">Driver</SelectItem>
                    <SelectItem value="MECHANIC">Mechanic</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This role determines which modules the employee can access
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={addEmployee.isPending || updateEmployee.isPending}
            >
              {addEmployee.isPending || updateEmployee.isPending 
                ? 'Saving...' 
                : employee ? 'Update Employee' : 'Add Employee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
