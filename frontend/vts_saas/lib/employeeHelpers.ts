import { supabase } from '@/lib/supabase';

export interface EmployeeInput {
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  department: string;
  position: string;
  hire_date: string;
  salary?: number;
}

/**
 * Check if email already exists in profiles table
 */
export async function checkDuplicateEmail(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  
  return !!data && !error;
}

/**
 * Validate that department exists (or create predefined list)
 */
export async function validateDepartment(department: string): Promise<boolean> {
  const validDepartments = [
    'operations',
    'finance',
    'hr',
    'human resources',
    'maintenance',
    'ticketing',
    'management',
    'administration',
    'it',
    'customer service',
    'drivers',
    'security',
    // Also accept proper case versions
    'Operations',
    'Finance',
    'HR',
    'Human Resources',
    'Maintenance',
    'Ticketing',
    'Management',
    'Administration',
    'IT',
    'Customer Service',
    'Drivers',
    'Security'
  ];
  
  // Case-insensitive check
  return validDepartments.some(dept => dept.toLowerCase() === department.toLowerCase());
}

/**
 * Generate unique employee ID
 */
export async function generateEmployeeId(): Promise<string> {
  const { data: lastEmployee } = await supabase
    .from('profiles')
    .select('employee_id')
    .not('employee_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  const lastNumber = lastEmployee?.employee_id
    ? parseInt(lastEmployee.employee_id.split('-')[2] || '0')
    : 0;
  
  return `EMP-${new Date().getFullYear()}-${String(lastNumber + 1).padStart(3, '0')}`;
}

/**
 * Create initial payroll record for new employee
 */
export async function createPayrollRecord(employeeId: string, salary: number): Promise<void> {
  const currentDate = new Date();
  const currentMonth = currentDate.toISOString().slice(0, 7); // YYYY-MM
  
  const payrollRecord = {
    employee_id: employeeId,
    pay_period: `${currentMonth}-01`,
    basic_salary: salary,
    allowances: 0,
    deductions: 0,
    total_amount: salary,
    payment_status: 'pending',
    payment_date: null,
    created_at: new Date().toISOString(),
  };
  
  const { error } = await supabase
    .from('staff_payroll')
    .insert([payrollRecord]);
  
  if (error) {
    console.error('Failed to create payroll record:', error);
    throw new Error('Failed to initialize payroll');
  }
}

/**
 * Send welcome email with credentials to new employee
 */
export async function sendWelcomeEmail(
  email: string,
  full_name: string,
  employeeId: string,
  temporaryPassword: string
): Promise<void> {
  try {
    // In production, you would use a service like SendGrid, Resend, or AWS SES
    // For now, we'll use Supabase Edge Functions or a simple API call
    
    const emailData = {
      to: email,
      subject: 'Welcome to KJ Khandala - Your Account Details',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to KJ Khandala!</h2>
          <p>Dear ${full_name},</p>
          <p>Your employee account has been created successfully. Here are your login credentials:</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Employee ID:</strong> ${employeeId}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
          </div>
          <p style="color: #dc2626;"><strong>Important:</strong> Please change your password after your first login.</p>
          <p>Login at: <a href="${window.location.origin}/login">${window.location.origin}/login</a></p>
          <p>If you have any questions, please contact HR.</p>
          <p>Best regards,<br>KJ Khandala HR Team</p>
        </div>
      `
    };
    
    // Call your email service API
    // await fetch('/api/send-email', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(emailData)
    // });
    
    console.log('Welcome email would be sent to:', email);
    console.log('Email data:', emailData);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    // Don't throw error - email failure shouldn't block employee creation
  }
}

/**
 * Generate secure temporary password
 */
export function generateTemporaryPassword(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

/**
 * Parse CSV file for bulk employee import
 */
export function parseEmployeeCSV(csvText: string): EmployeeInput[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  const employees: EmployeeInput[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    
    if (values.length < headers.length) continue;
    
    const employee: any = {};
    headers.forEach((header, index) => {
      employee[header] = values[index];
    });
    
    // Map CSV headers to our schema
    employees.push({
      full_name: employee['full_name'] || employee['name'] || '',
      email: employee['email'] || '',
      phone: employee['phone'] || undefined,
      department: employee['department'] || '',
      position: employee['position'] || '',
      hire_date: employee['hire_date'] || new Date().toISOString().split('T')[0],
      salary: employee['salary'] ? parseFloat(employee['salary']) : 0,
    });
  }
  
  return employees;
}

/**
 * Validate employee data before import
 */
export function validateEmployeeData(employee: EmployeeInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!employee.full_name || employee.full_name.length < 2) {
    errors.push('Full name is required and must be at least 2 characters');
  }
  
  if (!employee.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
    errors.push('Valid email is required');
  }
  
  if (!employee.department) {
    errors.push('Department is required');
  }
  
  if (!employee.position) {
    errors.push('Position is required');
  }
  
  if (!employee.hire_date) {
    errors.push('Hire date is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Bulk import employees with validation and error handling
 */
export async function bulkImportEmployees(
  employees: EmployeeInput[]
): Promise<{ success: number; failed: number; errors: Array<{ row: number; error: string }> }> {
  let success = 0;
  let failed = 0;
  const errors: Array<{ row: number; error: string }> = [];
  
  for (let i = 0; i < employees.length; i++) {
    const employee = employees[i];
    const rowNumber = i + 2; // +2 because row 1 is headers, and array is 0-indexed
    
    try {
      // Validate employee data
      const validation = validateEmployeeData(employee);
      if (!validation.valid) {
        errors.push({ row: rowNumber, error: validation.errors.join(', ') });
        failed++;
        continue;
      }
      
      // Check for duplicate email
      const isDuplicate = await checkDuplicateEmail(employee.email);
      if (isDuplicate) {
        errors.push({ row: rowNumber, error: `Email ${employee.email} already exists` });
        failed++;
        continue;
      }
      
      // Validate department
      const isDepartmentValid = await validateDepartment(employee.department);
      if (!isDepartmentValid) {
        errors.push({ row: rowNumber, error: `Invalid department: ${employee.department}` });
        failed++;
        continue;
      }
      
      // Generate employee ID
      const employeeId = await generateEmployeeId();
      
      // Generate temporary password
      const tempPassword = generateTemporaryPassword();
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: employee.email,
        password: tempPassword,
        options: {
          data: {
            full_name: employee.full_name,
          },
        },
      });
      
      if (authError) {
        errors.push({ row: rowNumber, error: `Auth creation failed: ${authError.message}` });
        failed++;
        continue;
      }
      
      if (!authData.user) {
        errors.push({ row: rowNumber, error: 'Failed to create user' });
        failed++;
        continue;
      }
      
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          employee_id: employeeId,
          phone: employee.phone || null,
          department: employee.department,
          position: employee.position,
          hire_date: employee.hire_date,
          salary: employee.salary || 0,
          is_active: true,
          status: 'active',
        })
        .eq('id', authData.user.id);
      
      if (profileError) {
        errors.push({ row: rowNumber, error: `Profile update failed: ${profileError.message}` });
        failed++;
        continue;
      }
      
      // Create payroll record
      if (employee.salary && employee.salary > 0) {
        try {
          await createPayrollRecord(authData.user.id, employee.salary);
        } catch (error) {
          console.error(`Failed to create payroll for row ${rowNumber}:`, error);
          // Don't fail the import if payroll creation fails
        }
      }
      
      // Send welcome email
      try {
        await sendWelcomeEmail(employee.email, employee.full_name, employeeId, tempPassword);
      } catch (error) {
        console.error(`Failed to send welcome email for row ${rowNumber}:`, error);
        // Don't fail the import if email fails
      }
      
      success++;
    } catch (error: any) {
      errors.push({ row: rowNumber, error: error.message || 'Unknown error' });
      failed++;
    }
  }
  
  return { success, failed, errors };
}
