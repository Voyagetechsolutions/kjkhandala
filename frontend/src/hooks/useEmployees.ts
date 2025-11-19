import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface EmployeeInput {
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

// Fetch all employees
export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

// Fetch single employee
export function useEmployee(id: string) {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

// Add new employee (creates auth user + profile)
export function useAddEmployee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (employee: EmployeeInput) => {
      // Generate employee_number
      const { data: lastEmployee } = await supabase
        .from('employees')
        .select('employee_number')
        .not('employee_number', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      const lastNumber = lastEmployee?.employee_number 
        ? parseInt(lastEmployee.employee_number.split('-')[1]) 
        : 0;
      
      const employeeNumber = `EMP-${String(lastNumber + 1).padStart(5, '0')}`;

      let userId = null;

      // If has_dashboard is true, create auth user and profile
      if (employee.has_dashboard) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: employee.email,
          password: employee.password || generateRandomPassword(),
          options: {
            data: {
              full_name: employee.full_name,
              role: employee.role,
            },
          },
        });

        if (authError) throw new Error(`Auth creation failed: ${authError.message}`);
        if (!authData.user) throw new Error('Failed to create user');

        userId = authData.user.id;

        // Update profile with role
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            role: employee.role,
          })
          .eq('id', authData.user.id);

        if (profileError) throw new Error(`Profile update failed: ${profileError.message}`);
      }

      // Create employee record
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .insert({
          employee_number: employeeNumber,
          full_name: employee.full_name,
          email: employee.email,
          phone: employee.phone || null,
          department: employee.department || null,
          position: employee.position || null,
          hire_date: employee.hire_date || new Date().toISOString().split('T')[0],
          salary: employee.salary || null,
          user_id: userId,
          employment_status: 'active',
        })
        .select()
        .single();

      if (employeeError) throw new Error(`Employee creation failed: ${employeeError.message}`);
      
      return employeeData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      if (data.has_dashboard) {
        toast.success('Employee added successfully! Login credentials sent to email.');
      } else {
        toast.success('Employee added successfully!');
      }
    },
    onError: (error: any) => {
      console.error('Failed to add employee:', error);
      toast.error(error.message || 'Failed to add employee');
    },
  });
}

// Update existing employee
export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<EmployeeInput> }) => {
      const { data, error } = await supabase
        .from('employees')
        .update({
          full_name: updates.full_name,
          phone: updates.phone || null,
          department: updates.department || null,
          position: updates.position || null,
          hire_date: updates.hire_date || null,
          salary: updates.salary || null,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update employee');
    },
  });
}

// Deactivate employee (soft delete)
export function useDeactivateEmployee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('employees')
        .update({ 
          employment_status: 'inactive',
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee deactivated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to deactivate employee');
    },
  });
}

// Reactivate employee
export function useReactivateEmployee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('employees')
        .update({ 
          employment_status: 'active',
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee reactivated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reactivate employee');
    },
  });
}

// Helper function to generate random password
function generateRandomPassword(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// Fetch departments for dropdown
export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('department')
        .not('department', 'is', null);
      
      if (error) throw error;
      
      // Get unique departments
      const uniqueDepartments = [...new Set(data.map(p => p.department))];
      return uniqueDepartments.filter(Boolean);
    },
  });
}

// Fetch positions for dropdown
export function usePositions() {
  return useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('position')
        .not('position', 'is', null);
      
      if (error) throw error;
      
      // Get unique positions
      const uniquePositions = [...new Set(data.map(p => p.position))];
      return uniquePositions.filter(Boolean);
    },
  });
}
