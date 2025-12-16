/**
 * Public API - Payments Endpoints
 * Handle payment initiation and webhooks for external websites
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../../config/supabase');
const crypto = require('crypto');

/**
 * POST /api/v1/payments/initiate
 * Initiate payment for a booking
 */
router.post('/initiate', async (req, res) => {
  try {
    const { company } = req;
    const { booking_reference, payment_method, return_url, cancel_url } = req.body;

    if (!booking_reference) {
      return res.status(400).json({
        success: false,
        error: 'Missing booking reference',
        code: 'MISSING_BOOKING_REF',
      });
    }

    const baseReference = booking_reference.split('-').slice(0, 3).join('-');

    // Find bookings
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, total_amount, payment_status, booking_status')
      .eq('company_id', company.id)
      .ilike('booking_reference', `${baseReference}%`);

    if (error) throw error;

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        code: 'BOOKING_NOT_FOUND',
      });
    }

    // Check if already paid
    if (bookings[0].payment_status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Booking already paid',
        code: 'ALREADY_PAID',
      });
    }

    // Check if booking is still valid
    if (bookings[0].booking_status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Booking has been cancelled',
        code: 'BOOKING_CANCELLED',
      });
    }

    const totalAmount = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const currency = company.settings?.currency || 'USD';

    // Generate payment reference
    const paymentReference = `PAY-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        company_id: company.id,
        booking_id: bookings[0].id,
        amount: totalAmount,
        payment_method: payment_method || 'card',
        payment_status: 'pending',
        transaction_reference: paymentReference,
        metadata: {
          booking_reference: baseReference,
          return_url,
          cancel_url,
          initiated_via: 'public_api',
        },
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    // In a real implementation, you would integrate with a payment gateway here
    // For now, we return a mock payment URL
    const paymentUrl = `${process.env.PAYMENT_GATEWAY_URL || 'https://pay.example.com'}/checkout?ref=${paymentReference}&amount=${totalAmount}&currency=${currency}`;

    res.json({
      success: true,
      data: {
        payment_id: payment.id,
        payment_reference: paymentReference,
        booking_reference: baseReference,
        amount: totalAmount,
        currency,
        payment_method: payment_method || 'card',
        payment_url: paymentUrl,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        return_url,
        cancel_url,
      },
      message: 'Payment initiated. Redirect user to payment_url to complete payment.',
    });
  } catch (error) {
    console.error('Error initiating payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate payment',
      code: 'PAYMENT_INIT_ERROR',
    });
  }
});

/**
 * POST /api/v1/payments/webhook
 * Handle payment gateway webhooks
 */
router.post('/webhook', async (req, res) => {
  try {
    const { company } = req;
    const { 
      payment_reference, 
      status, 
      gateway_reference,
      amount,
      signature 
    } = req.body;

    // Verify webhook signature (if company has webhook_secret configured)
    // In production, you would verify the signature from the payment gateway
    
    if (!payment_reference || !status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        code: 'MISSING_FIELDS',
      });
    }

    // Find payment
    const { data: payment, error } = await supabase
      .from('payments')
      .select('id, booking_id, amount, payment_status')
      .eq('transaction_reference', payment_reference)
      .eq('company_id', company.id)
      .single();

    if (error || !payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
        code: 'PAYMENT_NOT_FOUND',
      });
    }

    // Map gateway status to our status
    const statusMap = {
      'success': 'completed',
      'completed': 'completed',
      'paid': 'completed',
      'failed': 'failed',
      'cancelled': 'failed',
      'pending': 'pending',
    };

    const newStatus = statusMap[status.toLowerCase()] || 'pending';

    // Update payment
    await supabase
      .from('payments')
      .update({
        payment_status: newStatus,
        paid_at: newStatus === 'completed' ? new Date().toISOString() : null,
        metadata: supabase.sql`metadata || ${JSON.stringify({ gateway_reference, webhook_received_at: new Date().toISOString() })}::jsonb`,
      })
      .eq('id', payment.id);

    // If payment completed, update booking status
    if (newStatus === 'completed') {
      // Get all bookings with same base reference
      const { data: booking } = await supabase
        .from('bookings')
        .select('booking_reference')
        .eq('id', payment.booking_id)
        .single();

      if (booking) {
        const baseReference = booking.booking_reference.split('-').slice(0, 3).join('-');
        
        await supabase
          .from('bookings')
          .update({
            payment_status: 'completed',
            booking_status: 'confirmed',
            amount_paid: payment.amount,
          })
          .eq('company_id', company.id)
          .ilike('booking_reference', `${baseReference}%`);

        // Trigger webhook to company if configured
        if (company.webhook?.url && company.webhook?.events?.includes('payment.completed')) {
          triggerWebhook(company, 'payment.completed', {
            booking_reference: baseReference,
            payment_reference,
            amount: payment.amount,
            status: 'completed',
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        payment_reference,
        status: newStatus,
        processed_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process webhook',
      code: 'WEBHOOK_ERROR',
    });
  }
});

/**
 * GET /api/v1/payments/:reference/status
 * Check payment status
 */
router.get('/:reference/status', async (req, res) => {
  try {
    const { company } = req;
    const { reference } = req.params;

    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        id,
        transaction_reference,
        amount,
        payment_method,
        payment_status,
        paid_at,
        created_at,
        bookings (
          booking_reference,
          booking_status
        )
      `)
      .eq('transaction_reference', reference)
      .eq('company_id', company.id)
      .single();

    if (error || !payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
        code: 'PAYMENT_NOT_FOUND',
      });
    }

    res.json({
      success: true,
      data: {
        payment_reference: payment.transaction_reference,
        booking_reference: payment.bookings?.booking_reference,
        amount: payment.amount,
        currency: company.settings?.currency || 'USD',
        payment_method: payment.payment_method,
        status: payment.payment_status,
        booking_status: payment.bookings?.booking_status,
        paid_at: payment.paid_at,
        created_at: payment.created_at,
      },
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment status',
      code: 'PAYMENT_STATUS_ERROR',
    });
  }
});

/**
 * Trigger webhook to company
 */
async function triggerWebhook(company, eventType, payload) {
  if (!company.webhook?.url) return;

  try {
    // Log webhook attempt
    const { data: log } = await supabase
      .from('webhook_logs')
      .insert({
        company_id: company.id,
        event_type: eventType,
        payload,
        status: 'pending',
      })
      .select()
      .single();

    // Send webhook (async)
    const response = await fetch(company.webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Event': eventType,
        'X-Webhook-Signature': generateWebhookSignature(payload, company.webhook_secret),
      },
      body: JSON.stringify({
        event: eventType,
        data: payload,
        timestamp: new Date().toISOString(),
      }),
    });

    // Update log
    await supabase
      .from('webhook_logs')
      .update({
        status: response.ok ? 'delivered' : 'failed',
        response_status: response.status,
        last_attempt_at: new Date().toISOString(),
        attempts: 1,
      })
      .eq('id', log.id);
  } catch (error) {
    console.error('Webhook delivery failed:', error);
  }
}

/**
 * Generate webhook signature
 */
function generateWebhookSignature(payload, secret) {
  if (!secret) return '';
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex');
}

module.exports = router;
