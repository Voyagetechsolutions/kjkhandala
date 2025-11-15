const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { supabase } = require('../config/supabase');

// ==================== EMPLOYEES ====================

// Get all employees
router.get('/employees', auth, authorize('SUPER_ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const { department, position, status } = req.query;
    let q = supabase.from('profiles').select('*');
    if (department) q = q.eq('department', department);
    if (position) q = q.eq('position', position);
    if (status) q = q.eq('status', status);
    q = q.order('first_name');
    const { data: employees, error } = await q;
    if (error) throw error;
    res.json({ data: employees || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get employee by ID
router.get('/employees/:id', auth, authorize('SUPER_ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id },
      include: {
        certifications: true,
        leaveRequests: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ data: employee });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create employee
router.post('/employees', auth, authorize('SUPER_ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const { data: employee, error } = await supabase.from('profiles').insert(req.body).select('*').single();
    if (error) throw error;
    res.status(201).json({ data: employee });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update employee
router.put('/employees/:id', auth, authorize('SUPER_ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const employee = await prisma.employee.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json({ data: employee });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ATTENDANCE ====================

// Get attendance
router.get('/attendance', auth, async (req, res) => {
  try {
    const { date, employeeId, startDate, endDate } = req.query;
    let q = supabase.from('attendance').select('*');
    if (employeeId) q = q.eq('employee_id', employeeId);
    if (date) q = q.eq('date', new Date(date).toISOString().split('T')[0]);
    if (startDate && endDate) {
      q = q.gte('date', new Date(startDate).toISOString().split('T')[0]).lte('date', new Date(endDate).toISOString().split('T')[0]);
    }
    q = q.order('date', { ascending: false });
    const { data: attendance, error } = await q;
    if (error) throw error;
    res.json({ data: attendance || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check in
router.post('/attendance/checkin', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Check if already checked in today
    const existing = await prisma.attendance.findFirst({
      where: {
        employeeId: req.user.id,
        date: new Date(today),
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    const attendance = await prisma.attendance.create({
      data: {
        employeeId: req.user.id,
        date: new Date(),
        checkIn: new Date(),
        status: 'PRESENT',
      },
    });

    // Emit WebSocket event
    req.app.get('io').emit('employee:update', { type: 'checkin', attendance });

    res.status(201).json({ data: attendance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check out
router.post('/attendance/checkout', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const attendance = await prisma.attendance.updateMany({
      where: {
        employeeId: req.user.id,
        date: new Date(today),
        checkOut: null,
      },
      data: {
        checkOut: new Date(),
      },
    });

    res.json({ data: attendance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== LEAVE REQUESTS ====================

// Get leave requests
router.get('/leave/requests', auth, async (req, res) => {
  try {
    const { status, employeeId } = req.query;
    let q = supabase.from('leave_requests').select('*');
    if (status) q = q.eq('status', status);
    if (employeeId) q = q.eq('employee_id', employeeId);
    q = q.order('created_at', { ascending: false });
    const { data: requests, error } = await q;
    if (error) throw error;
    res.json({ data: requests || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create leave request
router.post('/leave/requests', auth, async (req, res) => {
  try {
    const payload = {
      ...req.body,
      employee_id: req.user.id,
      status: 'PENDING',
    };
    const { data: request, error } = await supabase.from('leave_requests').insert(payload).select('*').single();
    if (error) throw error;
    res.status(201).json({ data: request });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve leave request
router.put('/leave/requests/:id/approve', auth, authorize('SUPER_ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const request = await prisma.leaveRequest.update({
      where: { id: req.params.id },
      data: {
        status: 'APPROVED',
        approvedById: req.user.id,
        approvedAt: new Date(),
        notes: req.body.notes,
      },
    });

    res.json({ data: request });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject leave request
router.put('/leave/requests/:id/reject', auth, authorize('SUPER_ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const { reason } = req.body;

    const request = await prisma.leaveRequest.update({
      where: { id: req.params.id },
      data: {
        status: 'REJECTED',
        approvedById: req.user.id,
        approvedAt: new Date(),
        notes: reason,
      },
    });

    res.json({ data: request });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CERTIFICATIONS ====================

// Get certifications
router.get('/certifications', auth, async (req, res) => {
  try {
    const { employeeId, status } = req.query;
    let q = supabase.from('certifications').select('*');
    if (employeeId) q = q.eq('employee_id', employeeId);
    if (status === 'expiring') {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      q = q.lte('expiry_date', futureDate.toISOString()).gte('expiry_date', new Date().toISOString());
    }
    q = q.order('expiry_date');
    const { data: certifications, error } = await q;
    if (error) throw error;
    res.json({ data: certifications || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get expiring certifications
router.get('/certifications/expiring', auth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const certifications = await prisma.certification.findMany({
      where: {
        expiryDate: {
          lte: futureDate,
          gte: new Date(),
        },
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true, position: true },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });

    res.json({ data: certifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add certification
router.post('/certifications', auth, authorize('SUPER_ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const { data: certification, error } = await supabase.from('certifications').insert(req.body).select('*').single();
    if (error) throw error;
    res.status(201).json({ data: certification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== RECRUITMENT ====================

// Get job postings
router.get('/recruitment/jobs', async (req, res) => {
  try {
    const { status } = req.query;
    
    const where = status ? { status } : { status: 'ACTIVE' };

    const jobs = await prisma.jobPosting.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: jobs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create job posting
router.post('/recruitment/jobs', auth, authorize('SUPER_ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const job = await prisma.jobPosting.create({
      data: {
        ...req.body,
        createdById: req.user.id,
      },
    });

    res.status(201).json({ data: job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get applications
router.get('/recruitment/applications', auth, authorize('SUPER_ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const { jobId, status } = req.query;
    
    const where = {};
    if (jobId) where.jobId = jobId;
    if (status) where.status = status;

    const applications = await prisma.application.findMany({
      where,
      include: {
        job: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: applications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update application status
router.put('/recruitment/applications/:id/status', auth, authorize('SUPER_ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const { status, notes } = req.body;

    const application = await prisma.application.update({
      where: { id: req.params.id },
      data: { status, notes },
    });

    res.json({ data: application });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PERFORMANCE ====================

// Get evaluations
router.get('/performance/evaluations', auth, async (req, res) => {
  try {
    const { employeeId } = req.query;
    
    const where = {};
    if (employeeId) where.employeeId = employeeId;

    const evaluations = await prisma.performanceEvaluation.findMany({
      where,
      include: {
        employee: {
          select: { firstName: true, lastName: true, position: true },
        },
        evaluator: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: evaluations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create evaluation
router.post('/performance/evaluations', auth, authorize('SUPER_ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const evaluation = await prisma.performanceEvaluation.create({
      data: {
        ...req.body,
        evaluatorId: req.user.id,
      },
    });

    res.status(201).json({ data: evaluation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PAYROLL (HR VIEW) ====================

// Get payroll records
router.get('/payroll/:month', auth, authorize('SUPER_ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER'), async (req, res) => {
  try {
    const payroll = await prisma.payroll.findMany({
      where: { month: req.params.month },
      include: {
        employee: {
          select: { firstName: true, lastName: true, position: true },
        },
      },
    });

    res.json({ data: payroll });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update salary
router.put('/employees/:id/salary', auth, authorize('SUPER_ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const { salary, effectiveDate } = req.body;

    const employee = await prisma.employee.update({
      where: { id: req.params.id },
      data: {
        salary: parseFloat(salary),
        salaryEffectiveDate: new Date(effectiveDate),
      },
    });

    res.json({ data: employee });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SHIFTS ====================

// Create shift
router.post('/shifts', auth, authorize('SUPER_ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER'), async (req, res) => {
  try {
    const { userId, shiftType, startTime, endTime, date } = req.body;

    if (!userId || !shiftType || !startTime || !endTime || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const shift = await prisma.shift.create({
      data: {
        userId,
        shiftType,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        date: new Date(date),
        status: 'SCHEDULED',
      },
    });

    res.status(201).json({ success: true, data: shift });
  } catch (error) {
    console.error('Error creating shift:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get shifts
router.get('/shifts/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { from, to } = req.query;

    const where = { userId };
    if (from && to) {
      where.date = {
        gte: new Date(from),
        lte: new Date(to),
      };
    }

    const shifts = await prisma.shift.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    res.json({ success: true, data: shifts });
  } catch (error) {
    console.error('Error fetching shifts:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== DOCUMENTS ====================

// Upload document
router.post('/documents', auth, async (req, res) => {
  try {
    const { userId, documentType, documentNumber, expiryDate, fileUrl } = req.body;

    if (!userId || !documentType || !fileUrl) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const document = await prisma.document.create({
      data: {
        userId,
        documentType,
        documentNumber: documentNumber || '',
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        fileUrl,
        uploadedBy: req.user.id,
        status: 'PENDING',
      },
    });

    res.status(201).json({ success: true, data: document });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get expiring documents
router.get('/documents/expiring', auth, authorize('SUPER_ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const daysAhead = parseInt(req.query.days) || 30;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const expiringDocuments = await prisma.document.findMany({
      where: {
        expiryDate: {
          lte: futureDate,
          gte: new Date(),
        },
        status: 'APPROVED',
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });

    res.json({ success: true, data: expiringDocuments, count: expiringDocuments.length });
  } catch (error) {
    console.error('Error fetching expiring documents:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== LEAVE MANAGEMENT ====================

// Submit leave request
router.post('/leave', auth, async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId: req.user.id,
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason: reason || '',
        status: 'PENDING',
      },
    });

    res.status(201).json({ success: true, data: leaveRequest });
  } catch (error) {
    console.error('Error submitting leave request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Approve/Reject leave
router.put('/leave/:id/:action', auth, authorize('SUPER_ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const { id, action } = req.params;
    const { notes } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const leaveRequest = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: action === 'approve' ? 'APPROVED' : 'REJECTED',
        approvedBy: req.user.id,
        approvedAt: new Date(),
        notes: notes || '',
      },
    });

    res.json({ success: true, data: leaveRequest, message: `Leave ${action}d successfully` });
  } catch (error) {
    console.error(`Error ${action}ing leave:`, error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== PAYROLL ====================

// Process monthly payroll
router.post('/payroll/process', auth, authorize('SUPER_ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    // Get all employees
    const employees = await prisma.user.findMany({
      where: {
        role: {
          in: ['DRIVER', 'TICKETING_AGENT', 'OPERATIONS_MANAGER', 'FINANCE_MANAGER', 'HR_MANAGER', 'MAINTENANCE_MANAGER'],
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    const payrollRecords = [];

    for (const employee of employees) {
      // Get attendance for the month
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0);

      const attendance = await prisma.attendance.findMany({
        where: {
          userId: employee.id,
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      const daysWorked = attendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
      const totalHours = attendance.reduce((sum, a) => sum + (a.hoursWorked || 0), 0);

      // Calculate salary (basic calculation - customize as needed)
      const baseSalary = 5000; // Default base salary
      const dailyRate = baseSalary / 22; // 22 working days
      const grossSalary = dailyRate * daysWorked;

      const payroll = await prisma.payroll.create({
        data: {
          userId: employee.id,
          month: `${year}-${String(month).padStart(2, '0')}`,
          grossSalary: parseFloat(grossSalary.toFixed(2)),
          daysWorked,
          totalHours: parseFloat(totalHours.toFixed(2)),
          status: 'PENDING',
          processedBy: req.user.id,
        },
      });

      payrollRecords.push(payroll);
    }

    res.json({
      success: true,
      message: `Processed payroll for ${employees.length} employees`,
      data: payrollRecords,
    });
  } catch (error) {
    console.error('Error processing payroll:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get payroll for a month
router.get('/payroll/:month', auth, authorize('SUPER_ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER'), async (req, res) => {
  try {
    const { month } = req.params;

    const payroll = await prisma.payroll.findMany({
      where: { month },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const summary = {
      totalEmployees: payroll.length,
      totalGrossSalary: payroll.reduce((sum, p) => sum + parseFloat(p.grossSalary || 0), 0),
      pending: payroll.filter(p => p.status === 'PENDING').length,
      paid: payroll.filter(p => p.status === 'PAID').length,
    };

    res.json({ success: true, data: payroll, summary });
  } catch (error) {
    console.error('Error fetching payroll:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== JOB POSTINGS (RLS Bypass) ====================

// Create job posting
router.post('/job-postings', auth, authorize('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const { title, department, location, employment_type, salary_range, description, requirements, responsibilities } = req.body;
    
    const { data, error } = await supabase
      .from('job_postings')
      .insert([{
        title,
        department,
        location,
        employment_type,
        salary_range,
        description,
        requirements,
        responsibilities,
        status: 'active',
        posted_by: req.user.id,
        posted_date: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating job posting:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update job posting
router.put('/job-postings/:id', auth, authorize('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, department, location, employment_type, salary_range, description, requirements, responsibilities, status } = req.body;
    
    const { data, error } = await supabase
      .from('job_postings')
      .update({
        title,
        department,
        location,
        employment_type,
        salary_range,
        description,
        requirements,
        responsibilities,
        status
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating job posting:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete job posting
router.delete('/job-postings/:id', auth, authorize('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('job_postings')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: 'Job posting deleted' });
  } catch (error) {
    console.error('Error deleting job posting:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== DRIVER SHIFTS (RLS Bypass) ====================

// Create driver shift
router.post('/shifts', auth, authorize('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER'), async (req, res) => {
  try {
    const { driver_id, shift_date, shift_type, start_time, end_time, bus_id, route_id } = req.body;
    
    const { data, error } = await supabase
      .from('driver_shifts')
      .insert([{
        driver_id,
        shift_date,
        shift_type,
        start_time,
        end_time,
        bus_id: bus_id || null,
        route_id: route_id || null,
        status: 'SCHEDULED',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating shift:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update driver shift
router.put('/shifts/:id', auth, authorize('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { driver_id, shift_date, shift_type, start_time, end_time, bus_id, route_id, status } = req.body;
    
    const { data, error } = await supabase
      .from('driver_shifts')
      .update({
        driver_id,
        shift_date,
        shift_type,
        start_time,
        end_time,
        bus_id: bus_id || null,
        route_id: route_id || null,
        status
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating shift:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== PERFORMANCE EVALUATIONS (RLS Bypass) ====================

// Create performance evaluation
router.post('/evaluations', auth, authorize('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER'), async (req, res) => {
  try {
    const {
      employee_id,
      period_start,
      period_end,
      attendance_score,
      quality_of_work_score,
      teamwork_score,
      communication_score,
      leadership_score,
      problem_solving_score,
      strengths,
      areas_for_improvement,
      goals,
      comments
    } = req.body;
    
    const { data, error } = await supabase
      .from('performance_evaluations')
      .insert([{
        employee_id,
        evaluator_id: req.user.id,
        evaluation_date: new Date().toISOString().split('T')[0],
        period_start,
        period_end,
        attendance_score,
        quality_of_work_score,
        teamwork_score,
        communication_score,
        leadership_score,
        problem_solving_score,
        strengths,
        areas_for_improvement,
        goals,
        comments,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating evaluation:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
