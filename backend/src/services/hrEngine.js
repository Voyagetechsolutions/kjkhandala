const { supabase, pool } = require('../config/supabase');

class HREngine {
  /**
   * ===== DRIVER SHIFTS =====
   */
  
  async createShift(shiftData) {
    const { driverId, shiftType, startTime, endTime, busId, routeId } = shiftData;

    // Check for overlapping shifts
    const overlapping = await prisma.driverShift.findFirst({
      where: {
        driverId,
        OR: [
          {
            startTime: { lte: startTime },
            endTime: { gte: startTime }
          },
          {
            startTime: { lte: endTime },
            endTime: { gte: endTime }
          }
        ]
      }
    });

    if (overlapping) {
      throw new Error('Driver already has a shift during this time');
    }

    return await prisma.driverShift.create({
      data: {
        driverId,
        shiftType,
        startTime,
        endTime,
        busId,
        routeId,
        status: 'SCHEDULED'
      }
    });
  }

  async checkInShift(shiftId, location) {
    const shift = await prisma.driverShift.findUnique({
      where: { id: shiftId }
    });

    if (!shift) {
      throw new Error('Shift not found');
    }

    if (shift.status !== 'SCHEDULED') {
      throw new Error('Shift already checked in');
    }

    return await prisma.driverShift.update({
      where: { id: shiftId },
      data: {
        status: 'ACTIVE',
        actualStartTime: new Date(),
        checkInLocation: location
      }
    });
  }

  async checkOutShift(shiftId, location) {
    const shift = await prisma.driverShift.findUnique({
      where: { id: shiftId }
    });

    if (!shift) {
      throw new Error('Shift not found');
    }

    if (shift.status !== 'ACTIVE') {
      throw new Error('Shift not active');
    }

    const actualEndTime = new Date();
    const hoursWorked = (actualEndTime - new Date(shift.actualStartTime)) / (1000 * 60 * 60);

    return await prisma.driverShift.update({
      where: { id: shiftId },
      data: {
        status: 'COMPLETED',
        actualEndTime,
        checkOutLocation: location,
        hoursWorked
      }
    });
  }

  async getDriverShifts(driverId, startDate, endDate) {
    return await prisma.driverShift.findMany({
      where: {
        driverId,
        startTime: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      include: {
        driver: true,
        bus: true,
        route: true
      },
      orderBy: {
        startTime: 'asc'
      }
    });
  }

  /**
   * ===== DRIVER DOCUMENTS =====
   */

  async uploadDocument(documentData) {
    const { driverId, documentType, documentNumber, issueDate, expiryDate, fileUrl } = documentData;

    return await prisma.driverDocument.create({
      data: {
        driverId,
        documentType,
        documentNumber,
        issueDate,
        expiryDate,
        fileUrl,
        status: 'ACTIVE',
        verifiedBy: null
      }
    });
  }

  async verifyDocument(documentId, verifiedBy) {
    return await prisma.driverDocument.update({
      where: { id: documentId },
      data: {
        status: 'VERIFIED',
        verifiedBy,
        verifiedAt: new Date()
      }
    });
  }

  async checkExpiringDocuments(daysAhead = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const expiring = await prisma.driverDocument.findMany({
      where: {
        expiryDate: {
          lte: futureDate,
          gte: new Date()
        },
        status: { in: ['ACTIVE', 'VERIFIED'] }
      },
      include: {
        driver: true
      }
    });

    // Send notifications
    for (const doc of expiring) {
      const daysUntilExpiry = Math.ceil((new Date(doc.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      
      await prisma.notification.create({
        data: {
          userId: doc.driverId,
          type: 'DOCUMENT_EXPIRING',
          title: 'Document Expiring Soon',
          message: `Your ${doc.documentType} expires in ${daysUntilExpiry} days. Please renew.`,
          data: { documentId: doc.id, daysUntilExpiry }
        }
      });
    }

    return expiring;
  }

  async getDriverDocuments(driverId) {
    return await prisma.driverDocument.findMany({
      where: { driverId },
      orderBy: { expiryDate: 'asc' }
    });
  }

  /**
   * ===== LEAVE MANAGEMENT =====
   */

  async requestLeave(leaveData) {
    const { employeeId, leaveType, startDate, endDate, reason } = leaveData;

    // Calculate days
    const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;

    // Check leave balance
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    const leaveBalance = employee.leaveBalance || 0;
    if (leaveType === 'ANNUAL' && days > leaveBalance) {
      throw new Error('Insufficient leave balance');
    }

    return await prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveType,
        startDate,
        endDate,
        days,
        reason,
        status: 'PENDING'
      }
    });
  }

  async approveLeave(leaveId, approverId, comments) {
    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
      include: { employee: true }
    });

    if (!leave) {
      throw new Error('Leave request not found');
    }

    if (leave.status !== 'PENDING') {
      throw new Error('Leave already processed');
    }

    // Update leave request
    const updated = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: 'APPROVED',
        approvedBy: approverId,
        approvedAt: new Date(),
        approverComments: comments
      }
    });

    // Deduct from leave balance if annual leave
    if (leave.leaveType === 'ANNUAL') {
      await prisma.employee.update({
        where: { id: leave.employeeId },
        data: {
          leaveBalance: {
            decrement: leave.days
          }
        }
      });
    }

    // Send notification
    await prisma.notification.create({
      data: {
        userId: leave.employeeId,
        type: 'LEAVE_APPROVED',
        title: 'Leave Request Approved',
        message: `Your leave request from ${leave.startDate.toLocaleDateString()} has been approved.`,
        data: { leaveId }
      }
    });

    return updated;
  }

  async rejectLeave(leaveId, approverId, reason) {
    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId }
    });

    if (!leave) {
      throw new Error('Leave request not found');
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: 'REJECTED',
        approvedBy: approverId,
        approvedAt: new Date(),
        approverComments: reason
      }
    });

    // Send notification
    await prisma.notification.create({
      data: {
        userId: leave.employeeId,
        type: 'LEAVE_REJECTED',
        title: 'Leave Request Rejected',
        message: `Your leave request has been rejected. Reason: ${reason}`,
        data: { leaveId }
      }
    });

    return updated;
  }

  async getLeaveRequests(filters = {}) {
    const { employeeId, status, startDate, endDate } = filters;

    const where = {};
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate);
      if (endDate) where.startDate.lte = new Date(endDate);
    }

    return await prisma.leaveRequest.findMany({
      where,
      include: {
        employee: true,
        approver: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * ===== PAYROLL INTEGRATION =====
   */

  async calculatePayroll(employeeId, month, year) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Get shifts for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const shifts = await prisma.driverShift.findMany({
      where: {
        driverId: employeeId,
        status: 'COMPLETED',
        actualStartTime: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const totalHours = shifts.reduce((sum, shift) => sum + (shift.hoursWorked || 0), 0);
    const regularHours = Math.min(totalHours, 160); // 40 hours/week * 4 weeks
    const overtimeHours = Math.max(totalHours - 160, 0);

    const baseSalary = employee.baseSalary || 0;
    const hourlyRate = baseSalary / 160;
    const overtimeRate = hourlyRate * 1.5;

    const regularPay = regularHours * hourlyRate;
    const overtimePay = overtimeHours * overtimeRate;
    const grossPay = regularPay + overtimePay;

    // Deductions
    const tax = grossPay * 0.15; // 15% tax
    const pension = grossPay * 0.05; // 5% pension
    const totalDeductions = tax + pension;

    const netPay = grossPay - totalDeductions;

    return {
      employeeId,
      month,
      year,
      totalHours,
      regularHours,
      overtimeHours,
      baseSalary,
      regularPay,
      overtimePay,
      grossPay,
      tax,
      pension,
      totalDeductions,
      netPay,
      shifts: shifts.length
    };
  }

  async generatePayrollReport(month, year) {
    const employees = await prisma.employee.findMany({
      where: {
        status: 'ACTIVE'
      }
    });

    const payrollData = [];

    for (const employee of employees) {
      const payroll = await this.calculatePayroll(employee.id, month, year);
      payrollData.push(payroll);
    }

    const summary = {
      totalEmployees: payrollData.length,
      totalGrossPay: payrollData.reduce((sum, p) => sum + p.grossPay, 0),
      totalDeductions: payrollData.reduce((sum, p) => sum + p.totalDeductions, 0),
      totalNetPay: payrollData.reduce((sum, p) => sum + p.netPay, 0),
      totalHours: payrollData.reduce((sum, p) => sum + p.totalHours, 0)
    };

    return {
      month,
      year,
      summary,
      employees: payrollData
    };
  }

  async processPayroll(payrollData) {
    const { employeeId, month, year, netPay } = payrollData;

    return await prisma.payrollRecord.create({
      data: {
        employeeId,
        month,
        year,
        grossPay: payrollData.grossPay,
        deductions: payrollData.totalDeductions,
        netPay,
        paymentDate: new Date(),
        paymentMethod: 'BANK_TRANSFER',
        status: 'PAID'
      }
    });
  }

  /**
   * ===== ATTENDANCE TRACKING =====
   */

  async markAttendance(employeeId, date, status, notes) {
    return await prisma.attendance.create({
      data: {
        employeeId,
        date,
        status,
        notes,
        recordedAt: new Date()
      }
    });
  }

  async getAttendanceReport(employeeId, startDate, endDate) {
    const attendance = await prisma.attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    const summary = {
      totalDays: attendance.length,
      present: attendance.filter(a => a.status === 'PRESENT').length,
      absent: attendance.filter(a => a.status === 'ABSENT').length,
      late: attendance.filter(a => a.status === 'LATE').length,
      leave: attendance.filter(a => a.status === 'LEAVE').length
    };

    return {
      attendance,
      summary
    };
  }
}

module.exports = new HREngine();
