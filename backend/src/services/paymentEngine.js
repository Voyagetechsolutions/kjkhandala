const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const crypto = require('crypto');
const prisma = new PrismaClient();

class PaymentEngine {
  constructor() {
    this.dpoUrl = process.env.DPO_URL || 'https://secure.3gdirectpay.com';
    this.dpoCompanyToken = process.env.DPO_COMPANY_TOKEN;
    this.dpoServiceType = process.env.DPO_SERVICE_TYPE || '3854';
  }

  /**
   * CREATE DPO PAYMENT TOKEN
   */
  async createDPOToken(paymentData) {
    const {
      amount,
      currency = 'BWP',
      reference,
      customerName,
      customerEmail,
      customerPhone,
      description
    } = paymentData;

    const xml = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${this.dpoCompanyToken}</CompanyToken>
  <Request>createToken</Request>
  <Transaction>
    <PaymentAmount>${amount}</PaymentAmount>
    <PaymentCurrency>${currency}</PaymentCurrency>
    <CompanyRef>${reference}</CompanyRef>
    <RedirectURL>${process.env.FRONTEND_URL}/payment/callback</RedirectURL>
    <BackURL>${process.env.FRONTEND_URL}/payment/cancel</BackURL>
    <CompanyRefUnique>0</CompanyRefUnique>
    <PTL>5</PTL>
  </Transaction>
  <Services>
    <Service>
      <ServiceType>${this.dpoServiceType}</ServiceType>
      <ServiceDescription>${description}</ServiceDescription>
      <ServiceDate>${new Date().toISOString().split('T')[0]}</ServiceDate>
    </Service>
  </Services>
  <Customer>
    <CustomerName>${customerName}</CustomerName>
    <CustomerEmail>${customerEmail}</CustomerEmail>
    <CustomerPhone>${customerPhone}</CustomerPhone>
  </Customer>
</API3G>`;

    try {
      const response = await axios.post(`${this.dpoUrl}/API/v6/`, xml, {
        headers: { 'Content-Type': 'application/xml' }
      });

      // Parse XML response
      const transToken = this.extractXMLValue(response.data, 'TransToken');
      const transRef = this.extractXMLValue(response.data, 'TransRef');

      if (!transToken) {
        throw new Error('Failed to create payment token');
      }

      return {
        token: transToken,
        reference: transRef,
        paymentUrl: `${this.dpoUrl}/payv2.php?ID=${transToken}`
      };
    } catch (error) {
      console.error('DPO Token Creation Error:', error);
      throw new Error('Payment gateway error');
    }
  }

  /**
   * VERIFY DPO PAYMENT
   */
  async verifyDPOPayment(transToken) {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${this.dpoCompanyToken}</CompanyToken>
  <Request>verifyToken</Request>
  <TransactionToken>${transToken}</TransactionToken>
</API3G>`;

    try {
      const response = await axios.post(`${this.dpoUrl}/API/v6/`, xml, {
        headers: { 'Content-Type': 'application/xml' }
      });

      const result = this.extractXMLValue(response.data, 'Result');
      const resultExplanation = this.extractXMLValue(response.data, 'ResultExplanation');
      const transRef = this.extractXMLValue(response.data, 'TransRef');

      return {
        success: result === '000',
        result,
        message: resultExplanation,
        reference: transRef,
        rawResponse: response.data
      };
    } catch (error) {
      console.error('DPO Verification Error:', error);
      throw new Error('Payment verification failed');
    }
  }

  /**
   * PROCESS BOOKING PAYMENT
   */
  async processBookingPayment(bookingId, paymentMethod = 'DPO') {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        passenger: true,
        trip: {
          include: {
            route: true
          }
        }
      }
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.paymentStatus === 'PAID') {
      throw new Error('Booking already paid');
    }

    const amount = parseFloat(booking.totalAmount) - parseFloat(booking.amountPaid || 0);

    // Create payment transaction record
    const transaction = await prisma.paymentTransaction.create({
      data: {
        bookingId,
        amount,
        paymentMethod,
        status: 'PENDING',
        reference: `BK-${bookingId}-${Date.now()}`,
        transactionDate: new Date()
      }
    });

    // Create DPO payment token
    const dpoPayment = await this.createDPOToken({
      amount,
      currency: 'BWP',
      reference: transaction.reference,
      customerName: booking.passenger.name,
      customerEmail: booking.passenger.email,
      customerPhone: booking.passenger.phone,
      description: `Bus ticket: ${booking.trip.route.origin} to ${booking.trip.route.destination}`
    });

    // Update transaction with DPO details
    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        gatewayResponse: dpoPayment
      }
    });

    return {
      transactionId: transaction.id,
      paymentUrl: dpoPayment.paymentUrl,
      token: dpoPayment.token,
      reference: transaction.reference
    };
  }

  /**
   * HANDLE PAYMENT CALLBACK
   */
  async handlePaymentCallback(transToken, transRef) {
    // Verify payment with DPO
    const verification = await this.verifyDPOPayment(transToken);

    // Find transaction
    const transaction = await prisma.paymentTransaction.findFirst({
      where: {
        gatewayResponse: {
          path: ['reference'],
          equals: transRef
        }
      },
      include: {
        booking: true
      }
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (verification.success) {
      // Update transaction
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'COMPLETED',
          gatewayResponse: {
            ...transaction.gatewayResponse,
            verification
          }
        }
      });

      // Update booking
      const newAmountPaid = parseFloat(transaction.booking.amountPaid || 0) + parseFloat(transaction.amount);
      const isPaid = newAmountPaid >= parseFloat(transaction.booking.totalAmount);

      await prisma.booking.update({
        where: { id: transaction.bookingId },
        data: {
          amountPaid: newAmountPaid,
          paymentStatus: isPaid ? 'PAID' : 'PARTIAL'
        }
      });

      return {
        success: true,
        booking: transaction.booking,
        transaction
      };
    } else {
      // Payment failed
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          notes: verification.message
        }
      });

      return {
        success: false,
        message: verification.message
      };
    }
  }

  /**
   * PROCESS REFUND
   */
  async processRefund(bookingId, amount, reason) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.paymentStatus !== 'PAID') {
      throw new Error('Cannot refund unpaid booking');
    }

    // Create refund transaction
    const refund = await prisma.paymentTransaction.create({
      data: {
        bookingId,
        amount: -amount,
        paymentMethod: booking.paymentMethod,
        status: 'REFUNDED',
        reference: `REFUND-${bookingId}-${Date.now()}`,
        notes: reason,
        transactionDate: new Date()
      }
    });

    // Update booking
    const newAmountPaid = parseFloat(booking.amountPaid) - amount;
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        amountPaid: newAmountPaid,
        paymentStatus: newAmountPaid <= 0 ? 'REFUNDED' : 'PARTIAL'
      }
    });

    return refund;
  }

  /**
   * GET TRANSACTION LEDGER
   */
  async getTransactionLedger(filters = {}) {
    const { startDate, endDate, status, bookingId } = filters;

    const where = {};

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate.gte = new Date(startDate);
      if (endDate) where.transactionDate.lte = new Date(endDate);
    }

    if (status) where.status = status;
    if (bookingId) where.bookingId = bookingId;

    const transactions = await prisma.paymentTransaction.findMany({
      where,
      include: {
        booking: {
          include: {
            passenger: true,
            trip: {
              include: {
                route: true
              }
            }
          }
        }
      },
      orderBy: {
        transactionDate: 'desc'
      }
    });

    // Calculate totals
    const totals = {
      totalRevenue: 0,
      totalRefunds: 0,
      netRevenue: 0,
      transactionCount: transactions.length
    };

    transactions.forEach(t => {
      const amount = parseFloat(t.amount);
      if (amount > 0) {
        totals.totalRevenue += amount;
      } else {
        totals.totalRefunds += Math.abs(amount);
      }
    });

    totals.netRevenue = totals.totalRevenue - totals.totalRefunds;

    return {
      transactions,
      totals
    };
  }

  /**
   * RECONCILE PAYMENTS
   */
  async reconcilePayments(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const transactions = await prisma.paymentTransaction.findMany({
      where: {
        transactionDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        booking: true
      }
    });

    const reconciliation = {
      date,
      totalTransactions: transactions.length,
      completed: transactions.filter(t => t.status === 'COMPLETED').length,
      failed: transactions.filter(t => t.status === 'FAILED').length,
      pending: transactions.filter(t => t.status === 'PENDING').length,
      refunded: transactions.filter(t => t.status === 'REFUNDED').length,
      totalAmount: 0,
      byMethod: {}
    };

    transactions.forEach(t => {
      if (t.status === 'COMPLETED') {
        reconciliation.totalAmount += parseFloat(t.amount);
      }

      if (!reconciliation.byMethod[t.paymentMethod]) {
        reconciliation.byMethod[t.paymentMethod] = {
          count: 0,
          amount: 0
        };
      }

      reconciliation.byMethod[t.paymentMethod].count++;
      if (t.status === 'COMPLETED') {
        reconciliation.byMethod[t.paymentMethod].amount += parseFloat(t.amount);
      }
    });

    return reconciliation;
  }

  /**
   * HELPER: Extract value from XML
   */
  extractXMLValue(xml, tag) {
    const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1] : null;
  }
}

module.exports = new PaymentEngine();
