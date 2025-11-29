import express, { Request, Response } from 'express';
//import { supabase } from '../config/supabase';
import dpoPayService from '../services/dpoPayService';
import { format } from 'date-fns';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);


const router = express.Router();

/**
 * Initialize payment for a booking
 * POST /api/payments/initialize
 */
router.post('/initialize', async (req: Request, res: Response) => {
  try {
    const {
      bookingId,
      amount,
      currency = 'BWP',
      customerEmail,
      customerFirstName,
      customerLastName,
      customerPhone,
      customerAddress,
      customerCity,
      customerCountry = 'BW',
    } = req.body;

    if (!bookingId || !amount) {
      return res.status(400).json({ error: 'Booking ID and amount are required' });
    }

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, trips(*, routes(origin, destination))')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Generate unique company reference
    const { data: companyRefData } = await supabase.rpc('generate_company_ref');
    const companyRef = companyRefData || `BK${Date.now()}`;

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([{
        booking_id: bookingId,
        dpo_company_ref: companyRef,
        amount,
        currency,
        status: 'pending',
        customer_email: customerEmail,
        customer_name: `${customerFirstName} ${customerLastName}`,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        customer_city: customerCity,
        customer_country: customerCountry,
      }])
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      return res.status(500).json({ error: 'Failed to create payment record' });
    }

    // Create payment attempt
    await supabase.from('payment_attempts').insert([{
      payment_id: payment.id,
      booking_id: bookingId,
      attempt_number: 1,
      amount,
      currency,
      status: 'initiated',
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    }]);

    // Create DPO Pay token
    const baseURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    const tripInfo = booking.trips?.[0];
    const route = tripInfo?.routes;

    const dpoResponse = await dpoPayService.createToken({
      paymentAmount: amount,
      paymentCurrency: currency,
      companyRef,
      redirectURL: `${baseURL}/booking/payment-success?ref=${companyRef}`,
      backURL: `${baseURL}/booking/payment-cancel?ref=${companyRef}`,
      companyRefUnique: '1', // Ensure unique references
      ptl: '5', // 5 days payment time limit
      customerEmail,
      customerFirstName,
      customerLastName,
      customerPhone,
      customerDialCode: customerCountry,
      customerAddress,
      customerCity,
      customerCountry,
      serviceType: '45', // Bus/Transport service
      serviceDescription: `Bus ticket: ${route?.origin || 'N/A'} to ${route?.destination || 'N/A'}`,
      serviceDate: tripInfo?.departure_date ? format(new Date(tripInfo.departure_date), 'yyyy/MM/dd HH:mm') : format(new Date(), 'yyyy/MM/dd HH:mm'),
      companyAccRef: `BOOKING-${bookingId}`,
    });

    if (dpoResponse.result !== '000') {
      // Update payment status to failed
      await supabase
        .from('payments')
        .update({ status: 'failed', notes: dpoResponse.resultExplanation })
        .eq('id', payment.id);

      return res.status(400).json({
        error: 'Failed to initialize payment',
        message: dpoResponse.resultExplanation,
      });
    }

    // Update payment with DPO token
    await supabase
      .from('payments')
      .update({
        dpo_trans_token: dpoResponse.transToken,
        dpo_trans_ref: dpoResponse.transRef,
        status: 'processing',
      })
      .eq('id', payment.id);

    // Update payment attempt
    await supabase
      .from('payment_attempts')
      .update({
        dpo_trans_token: dpoResponse.transToken,
        dpo_result_code: dpoResponse.result,
        dpo_result_explanation: dpoResponse.resultExplanation,
        status: 'success',
        completed_at: new Date().toISOString(),
      })
      .eq('payment_id', payment.id)
      .eq('attempt_number', 1);

    // Generate payment URL
    const paymentURL = dpoPayService.getPaymentURL(dpoResponse.transToken!);

    res.json({
      success: true,
      paymentId: payment.id,
      transToken: dpoResponse.transToken,
      transRef: dpoResponse.transRef,
      paymentURL,
      companyRef,
    });
  } catch (error: any) {
    console.error('Payment initialization error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * Verify payment status
 * GET /api/payments/verify/:companyRef
 */
router.get('/verify/:companyRef', async (req: Request, res: Response) => {
  try {
    const { companyRef } = req.params;

    // Get payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('dpo_company_ref', companyRef)
      .single();

    if (paymentError || !payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Verify with DPO
    const verifyResponse = await dpoPayService.verifyToken({
      transactionToken: payment.dpo_trans_token,
      companyRef,
    });

    // Update payment record based on verification
    const updateData: any = {
      verified_at: new Date().toISOString(),
    };

    if (verifyResponse.result === '000') {
      // Payment successful
      updateData.status = 'completed';
      updateData.payment_date = new Date().toISOString();
      updateData.customer_name = verifyResponse.customerName;
      updateData.card_last4 = verifyResponse.customerCredit;
      updateData.card_type = verifyResponse.customerCreditType;
      updateData.transaction_approval = verifyResponse.transactionApproval;
      updateData.transaction_net_amount = verifyResponse.transactionNetAmount;
      updateData.transaction_settlement_date = verifyResponse.transactionSettlementDate;
      updateData.fraud_alert = verifyResponse.fraudAlert;
      updateData.fraud_explanation = verifyResponse.fraudExplanation;
    } else if (verifyResponse.result === '900') {
      // Transaction not paid yet
      updateData.status = 'pending';
    } else if (verifyResponse.result === '901') {
      // Transaction declined
      updateData.status = 'failed';
    } else if (verifyResponse.result === '904') {
      // Transaction cancelled
      updateData.status = 'cancelled';
    } else {
      // Other status
      updateData.status = 'failed';
      updateData.notes = verifyResponse.resultExplanation;
    }

    await supabase
      .from('payments')
      .update(updateData)
      .eq('id', payment.id);

    res.json({
      success: verifyResponse.result === '000',
      status: updateData.status,
      result: verifyResponse.result,
      resultExplanation: verifyResponse.resultExplanation,
      payment: {
        ...payment,
        ...updateData,
      },
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * Get mobile payment options
 * GET /api/payments/mobile-options/:transToken
 */
router.get('/mobile-options/:transToken', async (req: Request, res: Response) => {
  try {
    const { transToken } = req.params;

    const options = await dpoPayService.getMobilePaymentOptions(transToken);

    res.json({
      success: true,
      options,
    });
  } catch (error: any) {
    console.error('Get mobile options error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * Charge via mobile money
 * POST /api/payments/charge-mobile
 */
router.post('/charge-mobile', async (req: Request, res: Response) => {
  try {
    const { transToken, phoneNumber, mno, mnoCountry } = req.body;

    if (!transToken || !phoneNumber || !mno || !mnoCountry) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const chargeResponse = await dpoPayService.chargeTokenMobile({
      transactionToken: transToken,
      phoneNumber,
      mno,
      mnoCountry,
    });

    // Update payment record with mobile details
    await supabase
      .from('payments')
      .update({
        payment_method: 'mobile_money',
        mobile_network: mno,
        mobile_number: phoneNumber,
        mobile_instructions: chargeResponse.instructions,
      })
      .eq('dpo_trans_token', transToken);

    res.json({
      success: true,
      statusCode: chargeResponse.statusCode,
      instructions: chargeResponse.instructions,
      redirectOption: chargeResponse.redirectOption,
    });
  } catch (error: any) {
    console.error('Mobile charge error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * Cancel payment
 * POST /api/payments/cancel/:companyRef
 */
router.post('/cancel/:companyRef', async (req: Request, res: Response) => {
  try {
    const { companyRef } = req.params;

    // Get payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('dpo_company_ref', companyRef)
      .single();

    if (paymentError || !payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Cancel with DPO
    const cancelResponse = await dpoPayService.cancelToken({
      transactionToken: payment.dpo_trans_token,
    });

    // Update payment status
    await supabase
      .from('payments')
      .update({
        status: 'cancelled',
        notes: cancelResponse.resultExplanation,
      })
      .eq('id', payment.id);

    res.json({
      success: cancelResponse.result === '000',
      message: cancelResponse.resultExplanation,
    });
  } catch (error: any) {
    console.error('Payment cancellation error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * Refund payment
 * POST /api/payments/refund/:companyRef
 */
router.post('/refund/:companyRef', async (req: Request, res: Response) => {
  try {
    const { companyRef } = req.params;
    const { refundAmount, refundReason, userId } = req.body;

    if (!refundAmount || !refundReason) {
      return res.status(400).json({ error: 'Refund amount and reason are required' });
    }

    // Get payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('dpo_company_ref', companyRef)
      .single();

    if (paymentError || !payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ error: 'Can only refund completed payments' });
    }

    // Process refund with DPO
    const refundResponse = await dpoPayService.refundToken({
      transactionToken: payment.dpo_trans_token,
      refundAmount,
      refundDetails: refundReason,
      refundRef: `REF-${companyRef}`,
    });

    if (refundResponse.result !== '000') {
      return res.status(400).json({
        error: 'Refund failed',
        message: refundResponse.resultExplanation,
      });
    }

    // Update payment record
    const isFullRefund = refundAmount >= payment.amount;
    await supabase
      .from('payments')
      .update({
        status: isFullRefund ? 'refunded' : 'partially_refunded',
        refund_amount: refundAmount,
        refund_reason: refundReason,
        refund_date: new Date().toISOString(),
        refunded_by: userId,
      })
      .eq('id', payment.id);

    res.json({
      success: true,
      message: 'Refund processed successfully',
      refundAmount,
    });
  } catch (error: any) {
    console.error('Refund error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * Webhook endpoint for DPO Pay callbacks
 * POST /api/payments/webhook
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const webhookData = req.body;

    // Store webhook data
    await supabase.from('payment_webhooks').insert([{
      dpo_trans_token: webhookData.TransToken,
      dpo_trans_ref: webhookData.TransRef,
      dpo_company_ref: webhookData.CompanyRef,
      webhook_type: webhookData.Result === '000' ? 'payment_success' : 'payment_failed',
      raw_payload: webhookData,
      ip_address: req.ip,
    }]);

    // Process webhook asynchronously
    // You can add queue processing here

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get payment by booking ID
 * GET /api/payments/booking/:bookingId
 */
router.get('/booking/:bookingId', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;

    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ success: true, payment });
  } catch (error: any) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * Update payment transaction
 * PUT /api/payments/update/:companyRef
 */
router.put('/update/:companyRef', async (req: Request, res: Response) => {
  try {
    const { companyRef } = req.params;
    const updateData = req.body;

    // Get payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('dpo_company_ref', companyRef)
      .single();

    if (paymentError || !payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Update with DPO
    const updateResponse = await dpoPayService.updateToken({
      transactionToken: payment.dpo_trans_token,
      ...updateData,
    });

    if (updateResponse.result !== '000') {
      return res.status(400).json({
        error: 'Update failed',
        message: updateResponse.resultExplanation,
      });
    }

    // Update local record
    await supabase
      .from('payments')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    res.json({
      success: true,
      message: 'Payment updated successfully',
    });
  } catch (error: any) {
    console.error('Payment update error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * Get bank transfer options
 * GET /api/payments/bank-options/:transToken
 */
router.get('/bank-options/:transToken', async (req: Request, res: Response) => {
  try {
    const { transToken } = req.params;

    const options = await dpoPayService.getBankTransferOptions(transToken);

    res.json({
      success: options.result === '000',
      options: options.bankOptions || [],
      message: options.resultExplanation,
    });
  } catch (error: any) {
    console.error('Get bank options error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * Charge via bank transfer
 * POST /api/payments/charge-bank-transfer
 */
router.post('/charge-bank-transfer', async (req: Request, res: Response) => {
  try {
    const { transToken, bankCode } = req.body;

    if (!transToken || !bankCode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const chargeResponse = await dpoPayService.chargeTokenBankTransfer({
      transactionToken: transToken,
      bankCode,
    });

    // Update payment record with bank details
    await supabase
      .from('payments')
      .update({
        payment_method: 'bank_transfer',
        notes: `Bank transfer initiated: ${bankCode}`,
      })
      .eq('dpo_trans_token', transToken);

    res.json({
      success: chargeResponse.result === '000',
      message: chargeResponse.resultExplanation,
      convertedAmount: chargeResponse.convertedAmount,
      convertedCurrency: chargeResponse.convertedCurrency,
    });
  } catch (error: any) {
    console.error('Bank transfer charge error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * Resend payment email
 * POST /api/payments/resend-email/:companyRef
 */
router.post('/resend-email/:companyRef', async (req: Request, res: Response) => {
  try {
    const { companyRef } = req.params;

    // Get payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('dpo_company_ref', companyRef)
      .single();

    if (paymentError || !payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Resend email via DPO
    const emailResponse = await dpoPayService.emailToToken(payment.dpo_trans_token);

    res.json({
      success: emailResponse.result === '000',
      message: emailResponse.resultExplanation,
    });
  } catch (error: any) {
    console.error('Resend email error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * Get payment analytics
 * GET /api/payments/analytics
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, currency } = req.query;

    let query = supabase
      .from('payments')
      .select('*')
      .eq('status', 'completed');

    if (startDate) {
      query = query.gte('payment_date', startDate as string);
    }
    if (endDate) {
      query = query.lte('payment_date', endDate as string);
    }
    if (currency) {
      query = query.eq('currency', currency as string);
    }

    const { data: payments, error } = await query;

    if (error) {
      throw error;
    }

    // Calculate analytics
    const analytics = {
      totalTransactions: payments.length,
      totalRevenue: payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
      netRevenue: payments.reduce((sum, p) => sum + (parseFloat(p.transaction_net_amount || p.amount)), 0),
      averageTransaction: payments.length > 0 ? payments.reduce((sum, p) => sum + parseFloat(p.amount), 0) / payments.length : 0,
      byPaymentMethod: payments.reduce((acc: any, p) => {
        const method = p.payment_method || 'unknown';
        if (!acc[method]) {
          acc[method] = { count: 0, amount: 0 };
        }
        acc[method].count++;
        acc[method].amount += parseFloat(p.amount);
        return acc;
      }, {}),
      byCurrency: payments.reduce((acc: any, p) => {
        const curr = p.currency;
        if (!acc[curr]) {
          acc[curr] = { count: 0, amount: 0 };
        }
        acc[curr].count++;
        acc[curr].amount += parseFloat(p.amount);
        return acc;
      }, {}),
    };

    res.json({ success: true, analytics });
  } catch (error: any) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * Get company mobile payment options
 * GET /api/payments/company-mobile-options
 */
router.get('/company-mobile-options', async (req: Request, res: Response) => {
  try {
    const options = await dpoPayService.getCompanyMobilePaymentOptions();

    res.json({
      success: true,
      options: options.paymentoptionsmobile?.terminalmobile || [],
    });
  } catch (error: any) {
    console.error('Get company mobile options error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * Health check for DPO Pay service
 * GET /api/payments/health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const config = dpoPayService.getConfig();

    res.json({
      success: true,
      service: 'DPO Pay',
      configured: config.isConfigured,
      apiUrl: config.apiUrl,
      paymentUrl: config.paymentUrl,
    });
  } catch (error: any) {
    console.error('Health check error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

export default router;
