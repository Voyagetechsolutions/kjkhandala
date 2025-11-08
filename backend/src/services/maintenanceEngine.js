const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class MaintenanceEngine {
  /**
   * ===== BREAKDOWN REPORTING =====
   */

  async reportBreakdown(breakdownData) {
    const { busId, driverId, tripId, location, description, severity, photos } = breakdownData;

    // Update bus status
    await prisma.bus.update({
      where: { id: busId },
      data: { status: 'BREAKDOWN' }
    });

    // Create breakdown report
    const breakdown = await prisma.breakdownReport.create({
      data: {
        busId,
        driverId,
        tripId,
        location,
        description,
        severity,
        photos,
        reportedAt: new Date(),
        status: 'REPORTED'
      }
    });

    // Create work order
    const workOrder = await prisma.workOrder.create({
      data: {
        busId,
        type: 'BREAKDOWN',
        priority: severity === 'CRITICAL' ? 'URGENT' : 'HIGH',
        description: `Breakdown: ${description}`,
        status: 'PENDING',
        reportedBy: driverId
      }
    });

    // Send notifications
    await prisma.notification.create({
      data: {
        type: 'BREAKDOWN_REPORTED',
        title: 'Bus Breakdown Reported',
        message: `Bus ${busId} has broken down. Severity: ${severity}`,
        data: { breakdownId: breakdown.id, busId, location }
      }
    });

    // Notify maintenance team
    const maintenanceUsers = await prisma.user.findMany({
      where: { role: 'MAINTENANCE_MANAGER' }
    });

    for (const user of maintenanceUsers) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'BREAKDOWN_ALERT',
          title: 'Urgent: Bus Breakdown',
          message: `Bus breakdown reported at ${location}. Immediate attention required.`,
          data: { breakdownId: breakdown.id, workOrderId: workOrder.id }
        }
      });
    }

    return { breakdown, workOrder };
  }

  async updateBreakdownStatus(breakdownId, status, notes) {
    const breakdown = await prisma.breakdownReport.update({
      where: { id: breakdownId },
      data: {
        status,
        resolvedAt: status === 'RESOLVED' ? new Date() : null,
        resolutionNotes: notes
      }
    });

    // Update bus status if resolved
    if (status === 'RESOLVED') {
      await prisma.bus.update({
        where: { id: breakdown.busId },
        data: { status: 'AVAILABLE' }
      });
    }

    return breakdown;
  }

  /**
   * ===== PREVENTIVE MAINTENANCE =====
   */

  async schedulePreventiveMaintenance(maintenanceData) {
    const { busId, maintenanceType, scheduledDate, estimatedDuration, description } = maintenanceData;

    // Check bus availability
    const bus = await prisma.bus.findUnique({
      where: { id: busId }
    });

    if (!bus) {
      throw new Error('Bus not found');
    }

    return await prisma.preventiveMaintenance.create({
      data: {
        busId,
        maintenanceType,
        scheduledDate,
        estimatedDuration,
        description,
        status: 'SCHEDULED',
        nextDueDate: this.calculateNextDueDate(maintenanceType, scheduledDate)
      }
    });
  }

  calculateNextDueDate(maintenanceType, lastDate) {
    const date = new Date(lastDate);
    
    const intervals = {
      'OIL_CHANGE': 90, // 3 months
      'TIRE_ROTATION': 180, // 6 months
      'BRAKE_INSPECTION': 90,
      'ENGINE_SERVICE': 180,
      'ANNUAL_INSPECTION': 365,
      'SAFETY_CHECK': 30
    };

    const days = intervals[maintenanceType] || 90;
    date.setDate(date.getDate() + days);
    
    return date;
  }

  async checkDueMaintenance() {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // 7 days ahead

    const dueMaintenance = await prisma.preventiveMaintenance.findMany({
      where: {
        nextDueDate: {
          lte: futureDate
        },
        status: { in: ['SCHEDULED', 'PENDING'] }
      },
      include: {
        bus: true
      }
    });

    // Send reminders
    for (const maintenance of dueMaintenance) {
      const daysUntilDue = Math.ceil((new Date(maintenance.nextDueDate) - today) / (1000 * 60 * 60 * 24));
      
      await prisma.notification.create({
        data: {
          type: 'MAINTENANCE_DUE',
          title: 'Maintenance Due Soon',
          message: `${maintenance.maintenanceType} for bus ${maintenance.bus.registrationNumber} is due in ${daysUntilDue} days.`,
          data: { maintenanceId: maintenance.id, busId: maintenance.busId }
        }
      });
    }

    return dueMaintenance;
  }

  async completePreventiveMaintenance(maintenanceId, completionData) {
    const { completedBy, actualDuration, cost, notes, partsUsed } = completionData;

    const maintenance = await prisma.preventiveMaintenance.update({
      where: { id: maintenanceId },
      data: {
        status: 'COMPLETED',
        completedDate: new Date(),
        completedBy,
        actualDuration,
        cost,
        notes,
        partsUsed
      }
    });

    // Update next due date
    await prisma.preventiveMaintenance.update({
      where: { id: maintenanceId },
      data: {
        nextDueDate: this.calculateNextDueDate(maintenance.maintenanceType, new Date())
      }
    });

    // Add to service history
    await this.addServiceHistory({
      busId: maintenance.busId,
      serviceType: maintenance.maintenanceType,
      description: maintenance.description,
      cost,
      performedBy: completedBy,
      partsUsed
    });

    return maintenance;
  }

  /**
   * ===== SERVICE HISTORY =====
   */

  async addServiceHistory(serviceData) {
    const { busId, serviceType, description, cost, performedBy, partsUsed } = serviceData;

    return await prisma.serviceHistory.create({
      data: {
        busId,
        serviceType,
        serviceDate: new Date(),
        description,
        cost,
        performedBy,
        partsUsed,
        mileage: await this.getCurrentMileage(busId)
      }
    });
  }

  async getServiceHistory(busId, limit = 50) {
    return await prisma.serviceHistory.findMany({
      where: { busId },
      orderBy: { serviceDate: 'desc' },
      take: limit,
      include: {
        performer: true
      }
    });
  }

  async getCurrentMileage(busId) {
    const latestTrip = await prisma.trip.findFirst({
      where: { busId, status: 'COMPLETED' },
      orderBy: { actualArrivalTime: 'desc' }
    });

    return latestTrip?.endOdometer || 0;
  }

  async getMaintenanceCostAnalysis(busId, startDate, endDate) {
    const services = await prisma.serviceHistory.findMany({
      where: {
        busId,
        serviceDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }
    });

    const breakdown = await prisma.breakdownReport.findMany({
      where: {
        busId,
        reportedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }
    });

    const totalServiceCost = services.reduce((sum, s) => sum + (parseFloat(s.cost) || 0), 0);
    const totalBreakdowns = breakdown.length;

    return {
      busId,
      period: { startDate, endDate },
      totalServiceCost,
      totalBreakdowns,
      serviceCount: services.length,
      averageCostPerService: services.length > 0 ? totalServiceCost / services.length : 0,
      servicesByType: this.groupByType(services)
    };
  }

  groupByType(services) {
    const grouped = {};
    services.forEach(service => {
      if (!grouped[service.serviceType]) {
        grouped[service.serviceType] = {
          count: 0,
          totalCost: 0
        };
      }
      grouped[service.serviceType].count++;
      grouped[service.serviceType].totalCost += parseFloat(service.cost) || 0;
    });
    return grouped;
  }

  /**
   * ===== PARTS INVENTORY =====
   */

  async addPart(partData) {
    const { partNumber, partName, category, quantity, unitPrice, supplier, minStockLevel } = partData;

    return await prisma.part.create({
      data: {
        partNumber,
        partName,
        category,
        quantity,
        unitPrice,
        supplier,
        minStockLevel,
        status: 'IN_STOCK'
      }
    });
  }

  async usePart(partId, quantity, usedFor) {
    const part = await prisma.part.findUnique({
      where: { id: partId }
    });

    if (!part) {
      throw new Error('Part not found');
    }

    if (part.quantity < quantity) {
      throw new Error('Insufficient stock');
    }

    const updated = await prisma.part.update({
      where: { id: partId },
      data: {
        quantity: part.quantity - quantity
      }
    });

    // Log usage
    await prisma.partUsage.create({
      data: {
        partId,
        quantity,
        usedFor,
        usedAt: new Date()
      }
    });

    // Check if reorder needed
    if (updated.quantity <= part.minStockLevel) {
      await prisma.notification.create({
        data: {
          type: 'LOW_STOCK_ALERT',
          title: 'Low Stock Alert',
          message: `${part.partName} is running low. Current stock: ${updated.quantity}`,
          data: { partId, currentStock: updated.quantity, minLevel: part.minStockLevel }
        }
      });
    }

    return updated;
  }

  async reorderPart(partId, quantity) {
    const part = await prisma.part.findUnique({
      where: { id: partId }
    });

    if (!part) {
      throw new Error('Part not found');
    }

    return await prisma.partOrder.create({
      data: {
        partId,
        quantity,
        unitPrice: part.unitPrice,
        totalCost: quantity * parseFloat(part.unitPrice),
        supplier: part.supplier,
        orderDate: new Date(),
        status: 'ORDERED'
      }
    });
  }

  async receivePartOrder(orderId, receivedQuantity) {
    const order = await prisma.partOrder.findUnique({
      where: { id: orderId },
      include: { part: true }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Update order
    await prisma.partOrder.update({
      where: { id: orderId },
      data: {
        status: 'RECEIVED',
        receivedDate: new Date(),
        receivedQuantity
      }
    });

    // Update part stock
    await prisma.part.update({
      where: { id: order.partId },
      data: {
        quantity: {
          increment: receivedQuantity
        }
      }
    });

    return order;
  }

  async getInventoryReport() {
    const parts = await prisma.part.findMany({
      include: {
        usage: {
          take: 10,
          orderBy: { usedAt: 'desc' }
        },
        orders: {
          where: { status: 'ORDERED' }
        }
      }
    });

    const summary = {
      totalParts: parts.length,
      lowStock: parts.filter(p => p.quantity <= p.minStockLevel).length,
      outOfStock: parts.filter(p => p.quantity === 0).length,
      totalValue: parts.reduce((sum, p) => sum + (p.quantity * parseFloat(p.unitPrice)), 0),
      pendingOrders: parts.reduce((sum, p) => sum + p.orders.length, 0)
    };

    return {
      summary,
      parts: parts.map(p => ({
        id: p.id,
        partNumber: p.partNumber,
        partName: p.partName,
        category: p.category,
        quantity: p.quantity,
        minStockLevel: p.minStockLevel,
        unitPrice: p.unitPrice,
        totalValue: p.quantity * parseFloat(p.unitPrice),
        status: p.quantity === 0 ? 'OUT_OF_STOCK' : p.quantity <= p.minStockLevel ? 'LOW_STOCK' : 'IN_STOCK',
        recentUsage: p.usage.length,
        pendingOrders: p.orders.length
      }))
    };
  }

  /**
   * ===== WORK ORDERS =====
   */

  async createWorkOrder(workOrderData) {
    const { busId, type, priority, description, assignedTo } = workOrderData;

    return await prisma.workOrder.create({
      data: {
        busId,
        type,
        priority,
        description,
        assignedTo,
        status: 'PENDING',
        createdAt: new Date()
      }
    });
  }

  async assignWorkOrder(workOrderId, mechanicId) {
    return await prisma.workOrder.update({
      where: { id: workOrderId },
      data: {
        assignedTo: mechanicId,
        status: 'IN_PROGRESS',
        startedAt: new Date()
      }
    });
  }

  async completeWorkOrder(workOrderId, completionData) {
    const { cost, notes, partsUsed } = completionData;

    return await prisma.workOrder.update({
      where: { id: workOrderId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        cost,
        notes,
        partsUsed
      }
    });
  }
}

module.exports = new MaintenanceEngine();
