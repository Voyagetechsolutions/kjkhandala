const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class FinanceEngine {
  constructor() {
    // Exchange rates (would be fetched from API in production)
    this.exchangeRates = {
      BWP: 1.0,
      USD: 0.073,
      ZAR: 1.35,
      EUR: 0.067,
      GBP: 0.058
    };
    
    this.baseCurrency = 'BWP';
  }

  /**
   * ===== MULTI-CURRENCY SUPPORT =====
   */

  async convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    // Convert to base currency first
    const amountInBase = amount / this.exchangeRates[fromCurrency];
    
    // Convert to target currency
    const convertedAmount = amountInBase * this.exchangeRates[toCurrency];
    
    return parseFloat(convertedAmount.toFixed(2));
  }

  async updateExchangeRates(rates) {
    this.exchangeRates = { ...this.exchangeRates, ...rates };
    
    // Store in database
    await prisma.exchangeRate.create({
      data: {
        rates: this.exchangeRates,
        updatedAt: new Date()
      }
    });
  }

  /**
   * ===== RECONCILIATION =====
   */

  async reconcileDaily(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all transactions
    const transactions = await prisma.paymentTransaction.findMany({
      where: {
        transactionDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        booking: {
          include: {
            trip: {
              include: {
                route: true
              }
            }
          }
        }
      }
    });

    // Get all expenses
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: 'APPROVED'
      }
    });

    // Calculate totals by payment method
    const byPaymentMethod = {};
    
    transactions.forEach(t => {
      if (!byPaymentMethod[t.paymentMethod]) {
        byPaymentMethod[t.paymentMethod] = {
          revenue: 0,
          refunds: 0,
          count: 0
        };
      }

      const amount = parseFloat(t.amount);
      if (amount > 0) {
        byPaymentMethod[t.paymentMethod].revenue += amount;
      } else {
        byPaymentMethod[t.paymentMethod].refunds += Math.abs(amount);
      }
      byPaymentMethod[t.paymentMethod].count++;
    });

    // Calculate totals
    const totalRevenue = transactions
      .filter(t => parseFloat(t.amount) > 0)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalRefunds = Math.abs(transactions
      .filter(t => parseFloat(t.amount) < 0)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0));

    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    const netRevenue = totalRevenue - totalRefunds - totalExpenses;

    // Create reconciliation record
    const reconciliation = await prisma.reconciliation.create({
      data: {
        date,
        totalRevenue,
        totalRefunds,
        totalExpenses,
        netRevenue,
        byPaymentMethod,
        transactionCount: transactions.length,
        expenseCount: expenses.length,
        status: 'COMPLETED',
        reconciledAt: new Date()
      }
    });

    return reconciliation;
  }

  async getReconciliationReport(startDate, endDate) {
    const reconciliations = await prisma.reconciliation.findMany({
      where: {
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
      totalRevenue: reconciliations.reduce((sum, r) => sum + parseFloat(r.totalRevenue), 0),
      totalRefunds: reconciliations.reduce((sum, r) => sum + parseFloat(r.totalRefunds), 0),
      totalExpenses: reconciliations.reduce((sum, r) => sum + parseFloat(r.totalExpenses), 0),
      netRevenue: reconciliations.reduce((sum, r) => sum + parseFloat(r.netRevenue), 0),
      days: reconciliations.length
    };

    return {
      period: { startDate, endDate },
      summary,
      daily: reconciliations
    };
  }

  /**
   * ===== EXPENSE MANAGEMENT =====
   */

  async submitExpense(expenseData) {
    const { category, amount, currency, description, date, submittedBy, receipts } = expenseData;

    // Convert to base currency
    const amountInBase = await this.convertCurrency(amount, currency, this.baseCurrency);

    return await prisma.expense.create({
      data: {
        category,
        amount: amountInBase,
        originalAmount: amount,
        currency,
        description,
        date,
        submittedBy,
        receipts,
        status: 'PENDING',
        submittedAt: new Date()
      }
    });
  }

  async approveExpense(expenseId, approverId, comments) {
    const expense = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        status: 'APPROVED',
        approvedBy: approverId,
        approvedAt: new Date(),
        approverComments: comments
      }
    });

    // Send notification
    await prisma.notification.create({
      data: {
        userId: expense.submittedBy,
        type: 'EXPENSE_APPROVED',
        title: 'Expense Approved',
        message: `Your expense of ${expense.originalAmount} ${expense.currency} has been approved.`,
        data: { expenseId }
      }
    });

    return expense;
  }

  async rejectExpense(expenseId, approverId, reason) {
    const expense = await prisma.expense.update({
      where: { id: expenseId },
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
        userId: expense.submittedBy,
        type: 'EXPENSE_REJECTED',
        title: 'Expense Rejected',
        message: `Your expense has been rejected. Reason: ${reason}`,
        data: { expenseId }
      }
    });

    return expense;
  }

  async getExpenseReport(filters = {}) {
    const { startDate, endDate, category, status, submittedBy } = filters;

    const where = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    if (category) where.category = category;
    if (status) where.status = status;
    if (submittedBy) where.submittedBy = submittedBy;

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        submitter: true,
        approver: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    const summary = {
      totalExpenses: expenses.length,
      totalAmount: expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0),
      pending: expenses.filter(e => e.status === 'PENDING').length,
      approved: expenses.filter(e => e.status === 'APPROVED').length,
      rejected: expenses.filter(e => e.status === 'REJECTED').length,
      byCategory: this.groupExpensesByCategory(expenses)
    };

    return {
      summary,
      expenses
    };
  }

  groupExpensesByCategory(expenses) {
    const grouped = {};
    expenses.forEach(expense => {
      if (!grouped[expense.category]) {
        grouped[expense.category] = {
          count: 0,
          totalAmount: 0
        };
      }
      grouped[expense.category].count++;
      grouped[expense.category].totalAmount += parseFloat(expense.amount);
    });
    return grouped;
  }

  /**
   * ===== COLLECTIONS =====
   */

  async recordCollection(collectionData) {
    const { collectedBy, amount, currency, paymentMethod, tripId, notes } = collectionData;

    // Convert to base currency
    const amountInBase = await this.convertCurrency(amount, currency, this.baseCurrency);

    return await prisma.collection.create({
      data: {
        collectedBy,
        amount: amountInBase,
        originalAmount: amount,
        currency,
        paymentMethod,
        tripId,
        notes,
        collectedAt: new Date(),
        status: 'COLLECTED'
      }
    });
  }

  async depositCollection(collectionId, depositedBy, bankAccount) {
    const collection = await prisma.collection.update({
      where: { id: collectionId },
      data: {
        status: 'DEPOSITED',
        depositedBy,
        depositedAt: new Date(),
        bankAccount
      }
    });

    return collection;
  }

  async getCollectionsReport(startDate, endDate) {
    const collections = await prisma.collection.findMany({
      where: {
        collectedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      include: {
        collector: true,
        trip: {
          include: {
            route: true
          }
        }
      }
    });

    const summary = {
      totalCollections: collections.length,
      totalAmount: collections.reduce((sum, c) => sum + parseFloat(c.amount), 0),
      collected: collections.filter(c => c.status === 'COLLECTED').length,
      deposited: collections.filter(c => c.status === 'DEPOSITED').length,
      byCollector: this.groupCollectionsByCollector(collections),
      byPaymentMethod: this.groupCollectionsByPaymentMethod(collections)
    };

    return {
      period: { startDate, endDate },
      summary,
      collections
    };
  }

  groupCollectionsByCollector(collections) {
    const grouped = {};
    collections.forEach(collection => {
      const collectorName = `${collection.collector.firstName} ${collection.collector.lastName}`;
      if (!grouped[collectorName]) {
        grouped[collectorName] = {
          count: 0,
          totalAmount: 0
        };
      }
      grouped[collectorName].count++;
      grouped[collectorName].totalAmount += parseFloat(collection.amount);
    });
    return grouped;
  }

  groupCollectionsByPaymentMethod(collections) {
    const grouped = {};
    collections.forEach(collection => {
      if (!grouped[collection.paymentMethod]) {
        grouped[collection.paymentMethod] = {
          count: 0,
          totalAmount: 0
        };
      }
      grouped[collection.paymentMethod].count++;
      grouped[collection.paymentMethod].totalAmount += parseFloat(collection.amount);
    });
    return grouped;
  }

  /**
   * ===== COMMISSIONS =====
   */

  async calculateCommission(employeeId, period) {
    const { startDate, endDate } = period;

    // Get employee commission rate
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee || !employee.commissionRate) {
      return {
        employeeId,
        period,
        commissionRate: 0,
        totalSales: 0,
        commission: 0
      };
    }

    // Get bookings sold by this employee
    const bookings = await prisma.booking.findMany({
      where: {
        soldBy: employeeId,
        bookingDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        },
        paymentStatus: 'PAID'
      }
    });

    const totalSales = bookings.reduce((sum, b) => sum + parseFloat(b.totalAmount), 0);
    const commission = totalSales * (employee.commissionRate / 100);

    return {
      employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      period,
      commissionRate: employee.commissionRate,
      totalSales,
      bookingsCount: bookings.length,
      commission: commission.toFixed(2)
    };
  }

  async generateCommissionReport(startDate, endDate) {
    const employees = await prisma.employee.findMany({
      where: {
        commissionRate: { gt: 0 },
        status: 'ACTIVE'
      }
    });

    const commissions = [];

    for (const employee of employees) {
      const commission = await this.calculateCommission(employee.id, { startDate, endDate });
      commissions.push(commission);
    }

    const summary = {
      totalEmployees: commissions.length,
      totalSales: commissions.reduce((sum, c) => sum + parseFloat(c.totalSales), 0),
      totalCommissions: commissions.reduce((sum, c) => sum + parseFloat(c.commission), 0),
      totalBookings: commissions.reduce((sum, c) => sum + c.bookingsCount, 0)
    };

    return {
      period: { startDate, endDate },
      summary,
      commissions
    };
  }

  async payCommission(employeeId, period, amount) {
    return await prisma.commissionPayment.create({
      data: {
        employeeId,
        period,
        amount,
        paidAt: new Date(),
        status: 'PAID'
      }
    });
  }

  /**
   * ===== FINANCIAL STATEMENTS =====
   */

  async generateIncomeStatement(startDate, endDate) {
    // Revenue
    const transactions = await prisma.paymentTransaction.findMany({
      where: {
        transactionDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        },
        status: 'COMPLETED'
      }
    });

    const revenue = transactions
      .filter(t => parseFloat(t.amount) > 0)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const refunds = Math.abs(transactions
      .filter(t => parseFloat(t.amount) < 0)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0));

    // Expenses
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        },
        status: 'APPROVED'
      }
    });

    const expensesByCategory = this.groupExpensesByCategory(expenses);
    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    // Commissions
    const commissionReport = await this.generateCommissionReport(startDate, endDate);
    const totalCommissions = commissionReport.summary.totalCommissions;

    // Calculate profit
    const grossProfit = revenue - refunds;
    const operatingExpenses = totalExpenses + parseFloat(totalCommissions);
    const netProfit = grossProfit - operatingExpenses;

    return {
      period: { startDate, endDate },
      revenue: {
        totalRevenue: revenue,
        refunds,
        netRevenue: grossProfit
      },
      expenses: {
        byCategory: expensesByCategory,
        commissions: parseFloat(totalCommissions),
        totalExpenses: operatingExpenses
      },
      profit: {
        grossProfit,
        netProfit,
        profitMargin: ((netProfit / revenue) * 100).toFixed(2)
      }
    };
  }

  async generateCashFlowStatement(startDate, endDate) {
    const transactions = await prisma.paymentTransaction.findMany({
      where: {
        transactionDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }
    });

    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        },
        status: 'APPROVED'
      }
    });

    const cashIn = transactions
      .filter(t => parseFloat(t.amount) > 0)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const cashOut = Math.abs(transactions
      .filter(t => parseFloat(t.amount) < 0)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)) +
      expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    const netCashFlow = cashIn - cashOut;

    return {
      period: { startDate, endDate },
      cashIn,
      cashOut,
      netCashFlow
    };
  }
}

module.exports = new FinanceEngine();
