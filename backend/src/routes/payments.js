const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const dpoPayService = require('../services/dpoPayService');
const { format } = require('date-fns');

const router = express.Router();

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Initialize payment for a booking
 * POST /api/payments/initialize
 */
router.post('/initialize', async (req, res) => {
  try {
    const {
      bookingId,
      amount,
      currency = 'BWP',
      customerEmail,
      customerFirstName,
      customerLastName,
      customerPhone,
      customerCountry = 'BW',
    } = req.body;

    // Validate required fields
    if (!bookingId || !amount || !customerEmail || !customerFirstName || !customerLastName || !customerPhone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        booking_id: bookingId, // This must be a real UUID from bookings table
        amount: parseFloat(amount),
        payment_method: 'card', // Fixed: use 'card' (valid enum value)
        payment_status: 'pending', // Fixed: use payment_status (correct column name)
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment creation error:', paymentError);
      console.error('Error details:', JSON.stringify(paymentError, null, 2));
      console.error('Request data:', { bookingId, amount, currency, customerEmail, customerFirstName, customerLastName, customerPhone, customerCountry });
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment record',
        error: paymentError.message,
      });
    }

    // Create payment attempt
    const { error: attemptError } = await supabase
      .from('payment_attempts')
      .insert({
        payment_id: payment.id,
        booking_id: bookingId,
        attempt_number: 1,
        payment_method: 'online',
        amount: parseFloat(amount),
        status: 'initiated',
      });

    if (attemptError) {
      console.error('Payment attempt error:', attemptError);
    }

    // Generate unique company reference
    const companyRef = `BK${Date.now().toString().slice(-8)}`;

    // Initialize payment with DPO
    const dpoResponse = await dpoPayService.createToken({
      companyToken: process.env.DPO_COMPANY_TOKEN,
      amount: parseFloat(amount),
      currency,
      customerEmail,
      customerFirstName,
      customerLastName,
      customerPhone,
      customerCountry,
      companyRef,
      redirectURL: `${process.env.FRONTEND_URL}/booking/payment-success`,
      backURL: `${process.env.FRONTEND_URL}/booking/payment-cancel`,
    });

    if (!dpoResponse.success) {
      // Update payment status to failed
      await supabase
        .from('payments')
        .update({ payment_status: 'failed' }) // Fixed: use payment_status
        .eq('id', payment.id);

      return res.status(500).json({
        success: false,
        message: dpoResponse.message || 'Failed to initialize payment',
      });
    }

    // Update payment with DPO details
    await supabase
      .from('payments')
      .update({
        dpo_trans_token: dpoResponse.transToken,
        dpo_trans_ref: dpoResponse.transRef,
        dpo_company_ref: companyRef,
      })
      .eq('id', payment.id);

    res.json({
      success: true,
      paymentId: payment.id,
      transToken: dpoResponse.transToken,
      transRef: dpoResponse.transRef,
      companyRef: companyRef,
      paymentURL: dpoResponse.paymentURL,
    });
  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * Verify payment status
 * GET /api/payments/verify/:companyRef
 */
router.get('/verify/:companyRef', async (req, res) => {
  try {
    const { companyRef } = req.params;

    // Find payment by company reference
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('dpo_company_ref', companyRef)
      .single();

    if (paymentError || !payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Verify payment with DPO
    const dpoResponse = await dpoPayService.verifyToken({
      companyToken: process.env.DPO_COMPANY_TOKEN,
      transToken: payment.dpo_trans_token,
    });

    if (!dpoResponse.success) {
      return res.status(500).json({
        success: false,
        message: dpoResponse.message || 'Failed to verify payment',
      });
    }

    // Update payment status based on DPO response
    const status = dpoResponse.resultCode === '000' || dpoResponse.resultCode === '001' 
      ? 'completed' 
      : dpoResponse.resultCode === '904' 
      ? 'cancelled' 
      : 'failed';

    await supabase
      .from('payments')
      .update({
        payment_status: status, // Fixed: use payment_status
        dpo_result_code: dpoResponse.resultCode,
        dpo_result_message: dpoResponse.resultMessage,
        dpo_approval_code: dpoResponse.approvalCode,
        dpo_transaction_date: dpoResponse.transactionDate,
        dpo_settlement_date: dpoResponse.settlementDate,
        dpo_net_amount: dpoResponse.netAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    // Update booking payment status if payment is completed
    if (status === 'completed') {
      await supabase
        .from('bookings')
        .update({
          payment_status: 'paid',
          booking_status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.booking_id);
    }

    res.json({
      success: true,
      status,
      payment: {
        ...payment,
        status,
        dpo_result_code: dpoResponse.resultCode,
        dpo_result_message: dpoResponse.resultMessage,
      },
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * Get mobile payment options
 * GET /api/payments/mobile-options/:transToken
 */
router.get('/mobile-options/:transToken', async (req, res) => {
  try {
    const { transToken } = req.params;

    const response = await dpoPayService.getMobilePaymentOptions({
      companyToken: process.env.DPO_COMPANY_TOKEN,
      transToken,
    });

    if (!response.success) {
      return res.status(500).json({
        success: false,
        message: response.message || 'Failed to get mobile options',
      });
    }

    res.json({
      success: true,
      options: response.options,
    });
  } catch (error) {
    console.error('Mobile options error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * Charge mobile payment
 * POST /api/payments/charge-mobile
 */
router.post('/charge-mobile', async (req, res) => {
  try {
    const { transToken, phoneNumber, mno, mnoCountry } = req.body;

    if (!transToken || !phoneNumber || !mno) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const response = await dpoPayService.chargeTokenMobile({
      companyToken: process.env.DPO_COMPANY_TOKEN,
      transToken,
      phoneNumber,
      mno,
      mnoCountry,
    });

    if (!response.success) {
      return res.status(500).json({
        success: false,
        message: response.message || 'Failed to charge mobile payment',
      });
    }

    res.json({
      success: true,
      instructions: response.instructions,
      reference: response.reference,
    });
  } catch (error) {
    console.error('Mobile charge error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * Cancel payment
 * POST /api/payments/cancel/:companyRef
 */
router.post('/cancel/:companyRef', async (req, res) => {
  try {
    const { companyRef } = req.params;

    // Find payment by company reference
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('dpo_company_ref', companyRef)
      .single();

    if (paymentError || !payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Cancel payment with DPO
    const dpoResponse = await dpoPayService.cancelToken({
      companyToken: process.env.DPO_COMPANY_TOKEN,
      transToken: payment.dpo_trans_token,
    });

    if (!dpoResponse.success) {
      return res.status(500).json({
        success: false,
        message: dpoResponse.message || 'Failed to cancel payment',
      });
    }

    // Update payment status
    await supabase
      .from('payments')
      .update({
        status: 'cancelled',
        dpo_result_code: dpoResponse.resultCode,
        dpo_result_message: dpoResponse.resultMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    res.json({
      success: true,
      message: 'Payment cancelled successfully',
    });
  } catch (error) {
    console.error('Payment cancellation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * Refund payment
 * POST /api/payments/refund/:companyRef
 */
router.post('/refund/:companyRef', async (req, res) => {
  try {
    const { companyRef } = req.params;
    const { refundAmount, refundReason, userId } = req.body;

    if (!refundAmount || !refundReason || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Find payment by company reference
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('dpo_company_ref', companyRef)
      .single();

    if (paymentError || !payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Check if payment is completed
    if (payment.payment_status !== 'completed') { // Fixed: use payment_status
      return res.status(400).json({
        success: false,
        message: 'Only completed payments can be refunded',
      });
    }

    // Process refund with DPO
    const dpoResponse = await dpoPayService.refundToken({
      companyToken: process.env.DPO_COMPANY_TOKEN,
      transToken: payment.dpo_trans_token,
      refundAmount: parseFloat(refundAmount),
      refundReason,
    });

    if (!dpoResponse.success) {
      return res.status(500).json({
        success: false,
        message: dpoResponse.message || 'Failed to process refund',
      });
    }

    // Update payment with refund details
    await supabase
      .from('payments')
      .update({
        payment_status: parseFloat(refundAmount) === payment.amount ? 'refunded' : 'partially_refunded', // Fixed: use payment_status
        refund_amount: parseFloat(refundAmount),
        refund_reason: refundReason,
        refund_date: new Date().toISOString(),
        refund_processed_by: userId,
        dpo_result_code: dpoResponse.resultCode,
        dpo_result_message: dpoResponse.resultMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    res.json({
      success: true,
      message: 'Refund processed successfully',
      refundAmount: parseFloat(refundAmount),
    });
  } catch (error) {
    console.error('Refund processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * Webhook handler for DPO callbacks
 * POST /api/payments/webhook
 */
router.post('/webhook', async (req, res) => {
  try {
    const webhookData = req.body;

    // Store webhook data
    await supabase
      .from('payment_webhooks')
      .insert({
        dpo_trans_token: webhookData.transToken,
        webhook_type: webhookData.type || 'payment_update',
        raw_payload: webhookData,
        processed: false,
      });

    // Respond immediately to DPO
    res.status(200).json({ status: 'received' });

    // Process webhook asynchronously
    setTimeout(async () => {
      try {
        // Find payment by transaction token
        const { data: payment } = await supabase
          .from('payments')
          .select('*')
          .eq('dpo_trans_token', webhookData.transToken)
          .single();

        if (payment) {
          // Verify payment status
          const dpoResponse = await dpoPayService.verifyToken({
            companyToken: process.env.DPO_COMPANY_TOKEN,
            transToken: webhookData.transToken,
          });

          if (dpoResponse.success) {
            const status = dpoResponse.resultCode === '000' || dpoResponse.resultCode === '001' 
              ? 'completed' 
              : dpoResponse.resultCode === '904' 
              ? 'cancelled' 
              : 'failed';

            await supabase
              .from('payments')
              .update({
                payment_status: status, // Fixed: use payment_status
                dpo_result_code: dpoResponse.resultCode,
                dpo_result_message: dpoResponse.resultMessage,
                updated_at: new Date().toISOString(),
              })
              .eq('id', payment.id);

            // Update booking if payment is completed
            if (status === 'completed') {
              await supabase
                .from('bookings')
                .update({
                  payment_status: 'paid',
                  booking_status: 'confirmed',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', payment.booking_id);
            }
          }

          // Mark webhook as processed
          await supabase
            .from('payment_webhooks')
            .update({ processed: true })
            .eq('dpo_trans_token', webhookData.transToken);
        }
      } catch (error) {
        console.error('Webhook processing error:', error);
      }
    }, 1000);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ status: 'error' });
  }
});

/**
 * Get payment by booking ID
 * GET /api/payments/booking/:bookingId
 */
router.get('/booking/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;

    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('booking_id', bookingId)
      .single();

    if (error || !payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found for this booking',
      });
    }

    res.json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

module.exports = router;
