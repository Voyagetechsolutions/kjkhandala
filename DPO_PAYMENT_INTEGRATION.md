# DPO Pay Payment Gateway Integration

## Overview
Complete integration of DPO Pay (Direct Pay Online) payment gateway for processing bus ticket bookings. Supports card payments, mobile money, and bank transfers.

---

## 1. Backend Implementation

### A. DPO Pay Service (`backend/src/services/dpoPayService.ts`)

**Purpose:** Core service for interacting with DPO Pay API

**Key Methods:**
- `createToken()` - Initialize payment transaction
- `verifyToken()` - Verify payment status
- `cancelToken()` - Cancel pending payment
- `refundToken()` - Process refund
- `getMobilePaymentOptions()` - Get available mobile payment providers
- `chargeTokenMobile()` - Process mobile money payment
- `getPaymentURL()` - Generate payment redirect URL

**Configuration:**
```env
DPO_API_URL=https://secure.3gdirectpay.com/API/v6/
DPO_COMPANY_TOKEN=your-company-token-here
FRONTEND_URL=http://localhost:5173
```

### B. Payment Routes (`backend/src/routes/payments.ts`)

**Endpoints:**

1. **POST /api/payments/initialize**
   - Initialize payment for a booking
   - Creates payment record and DPO token
   - Returns payment URL for redirect

2. **GET /api/payments/verify/:companyRef**
   - Verify payment status with DPO
   - Updates booking and payment records
   - Returns payment details

3. **GET /api/payments/mobile-options/:transToken**
   - Get available mobile money providers
   - Returns list with logos and instructions

4. **POST /api/payments/charge-mobile**
   - Process mobile money payment
   - Sends payment request to customer's phone
   - Returns instructions

5. **POST /api/payments/cancel/:companyRef**
   - Cancel pending payment
   - Updates payment status

6. **POST /api/payments/refund/:companyRef**
   - Process refund for completed payment
   - Supports full and partial refunds

7. **POST /api/payments/webhook**
   - Receive DPO Pay callbacks
   - Stores webhook data for processing

8. **GET /api/payments/booking/:bookingId**
   - Get payment details for a booking

---

## 2. Database Schema

### Migration: `20251126_create_payments.sql`

**Tables Created:**

#### `payments`
Main payment transactions table
- `id` - UUID primary key
- `booking_id` - Reference to booking
- `dpo_trans_token` - DPO transaction token
- `dpo_trans_ref` - DPO transaction reference
- `dpo_company_ref` - Unique company reference
- `amount` - Payment amount
- `currency` - Currency code (BWP, USD, etc.)
- `payment_method` - card, mobile_money, bank_transfer, cash
- `status` - pending, processing, completed, failed, cancelled, refunded
- Customer details (name, email, phone, address)
- Card details (last 4 digits, type)
- Transaction details (approval, net amount, settlement date)
- Fraud detection (alert, explanation)
- Mobile money details (network, number, instructions)
- Refund information (amount, reason, date)
- Timestamps and audit fields

#### `payment_attempts`
Tracks all payment attempts including failures
- `id` - UUID primary key
- `payment_id` - Reference to payment
- `booking_id` - Reference to booking
- `attempt_number` - Sequential attempt number
- `payment_method` - Method used
- `amount` - Amount attempted
- `dpo_trans_token` - DPO token
- `dpo_result_code` - Result code from DPO
- `status` - initiated, success, failed, cancelled
- `error_message` - Error details
- Timestamps and metadata

#### `payment_webhooks`
Stores DPO webhook callbacks
- `id` - UUID primary key
- `dpo_trans_token` - Transaction token
- `webhook_type` - payment_success, payment_failed, refund
- `raw_payload` - Full webhook data (JSONB)
- `processed` - Processing status
- `processing_error` - Error if processing failed
- Timestamps

**Triggers:**
- `update_booking_payment_status()` - Auto-updates booking when payment status changes
- `update_payments_updated_at()` - Updates timestamp on changes

**Functions:**
- `generate_company_ref()` - Generates unique 8-character reference

**Views:**
- `payment_analytics` - Daily payment statistics and revenue tracking

---

## 3. Frontend Components

### A. DPO Payment Component (`frontend/src/components/payment/DPOPayment.tsx`)

**Purpose:** Main payment interface component

**Features:**
- Payment method selection (Card, Mobile Money, Bank Transfer)
- Payment summary display
- Mobile money provider selection
- Phone number input for mobile payments
- Real-time payment verification
- Loading and verification states
- Security notices

**Props:**
```typescript
interface DPOPaymentProps {
  bookingId: string;
  amount: number;
  currency?: string;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  onSuccess: (paymentData: any) => void;
  onCancel?: () => void;
}
```

**Usage:**
```tsx
<DPOPayment
  bookingId="booking-uuid"
  amount={450.00}
  currency="BWP"
  customerEmail="customer@example.com"
  customerFirstName="John"
  customerLastName="Doe"
  customerPhone="+267123456789"
  onSuccess={(data) => console.log('Payment successful', data)}
  onCancel={() => console.log('Payment cancelled')}
/>
```

### B. Payment Success Page (`frontend/src/pages/booking/PaymentSuccess.tsx`)

**Purpose:** Confirmation page after successful payment

**Features:**
- Payment verification on load
- Payment details display
- Booking information
- Download ticket button
- Important travel information
- Email confirmation notice

**Route:** `/booking/payment-success?ref=COMPANY_REF`

### C. Payment Cancel Page (`frontend/src/pages/booking/PaymentCancel.tsx`)

**Purpose:** Page shown when payment is cancelled

**Features:**
- Cancellation confirmation
- Explanation of what happened
- Retry payment option
- Support contact information

**Route:** `/booking/payment-cancel?ref=COMPANY_REF`

---

## 4. Payment Flow

### Card Payment Flow

1. **Initialize Payment**
   ```
   User clicks "Pay with Card"
   → POST /api/payments/initialize
   → Creates payment record
   → Calls DPO createToken
   → Returns payment URL
   ```

2. **Redirect to DPO**
   ```
   User redirected to DPO payment page
   → Enters card details on DPO secure page
   → DPO processes payment
   → Redirects back to success/cancel URL
   ```

3. **Verify Payment**
   ```
   User lands on /booking/payment-success
   → GET /api/payments/verify/:companyRef
   → DPO verifyToken called
   → Payment status updated
   → Booking confirmed
   → Ticket generated
   ```

### Mobile Money Flow

1. **Initialize Payment**
   ```
   User clicks "Pay with Mobile Money"
   → POST /api/payments/initialize
   → Creates payment record
   → Returns transaction token
   ```

2. **Select Provider**
   ```
   GET /api/payments/mobile-options/:transToken
   → Returns available providers (Airtel, Orange, MTN, etc.)
   → User selects provider
   → Enters phone number
   ```

3. **Process Payment**
   ```
   POST /api/payments/charge-mobile
   → Sends payment request to phone
   → Returns instructions
   → User completes on phone
   ```

4. **Verify Payment**
   ```
   Frontend polls every 5 seconds
   → GET /api/payments/verify/:companyRef
   → Checks payment status
   → Updates when completed
   ```

---

## 5. Payment Status Codes

### DPO Result Codes

| Code | Status | Description |
|------|--------|-------------|
| 000 | Success | Transaction paid/created |
| 001 | Authorized | Transaction authorized |
| 900 | Pending | Transaction not paid yet |
| 901 | Failed | Transaction declined |
| 904 | Cancelled | Transaction cancelled |
| 801 | Error | Missing company token |
| 802 | Error | Invalid company token |
| 950 | Error | Missing mandatory fields |

### Internal Payment Status

| Status | Description |
|--------|-------------|
| pending | Payment initialized, awaiting completion |
| processing | Payment in progress with DPO |
| completed | Payment successful |
| failed | Payment failed or declined |
| cancelled | Payment cancelled by user |
| refunded | Full refund processed |
| partially_refunded | Partial refund processed |

---

## 6. Security Features

### Data Protection
- Card details never stored on our servers
- Only last 4 digits stored for reference
- All sensitive data handled by DPO
- PCI DSS compliant through DPO

### Fraud Detection
- DPO fraud alerts captured
- Fraud scores stored
- Suspicious transactions flagged
- Manual review for high-risk transactions

### RLS Policies
- Users can only view their own payments
- Staff can view all payments
- Finance managers can process refunds
- Webhook data restricted to admins

---

## 7. Testing

### Test Cards (DPO Sandbox)

**Successful Payment:**
```
Card Number: 4111111111111111
Expiry: 12/25
CVV: 123
```

**Failed Payment:**
```
Card Number: 4000000000000002
Expiry: 12/25
CVV: 123
```

### Test Mobile Money

Use test phone numbers provided by DPO for each mobile network operator.

### Testing Checklist

- [ ] Initialize card payment
- [ ] Complete card payment successfully
- [ ] Cancel card payment
- [ ] Initialize mobile money payment
- [ ] Complete mobile money payment
- [ ] Payment verification works
- [ ] Booking status updates correctly
- [ ] Email notifications sent
- [ ] Refund processing works
- [ ] Webhook handling works
- [ ] Payment analytics accurate

---

## 8. Environment Variables

### Backend (.env)
```env
# DPO Pay Configuration
DPO_API_URL=https://secure.3gdirectpay.com/API/v6/
DPO_COMPANY_TOKEN=your-company-token-here

# URLs
FRONTEND_URL=http://localhost:5173
API_URL=http://localhost:3000

# Database
DATABASE_URL=your-supabase-connection-string
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api
VITE_DPO_COMPANY_TOKEN=your-company-token-here
```

---

## 9. API Integration Examples

### Initialize Payment
```typescript
const response = await axios.post('/api/payments/initialize', {
  bookingId: 'booking-uuid',
  amount: 450.00,
  currency: 'BWP',
  customerEmail: 'customer@example.com',
  customerFirstName: 'John',
  customerLastName: 'Doe',
  customerPhone: '+267123456789',
  customerCountry: 'BW'
});

// Redirect to payment URL
window.location.href = response.data.paymentURL;
```

### Verify Payment
```typescript
const response = await axios.get(`/api/payments/verify/${companyRef}`);

if (response.data.success && response.data.status === 'completed') {
  // Payment successful
  console.log('Payment completed:', response.data.payment);
}
```

### Process Refund
```typescript
const response = await axios.post(`/api/payments/refund/${companyRef}`, {
  refundAmount: 450.00,
  refundReason: 'Customer requested cancellation',
  userId: 'user-uuid'
});

if (response.data.success) {
  console.log('Refund processed');
}
```

---

## 10. Supported Payment Methods

### Credit/Debit Cards
- Visa
- Mastercard
- American Express
- Diners Club

### Mobile Money (Botswana)
- Orange Money
- Mascom MyZaka (when available)

### Mobile Money (Regional)
- M-Pesa (Kenya, Tanzania)
- Airtel Money (Multiple countries)
- MTN Mobile Money (Multiple countries)
- Tigo Pesa (Tanzania)
- Vodacom M-Pesa (Tanzania)

### Bank Transfer
- DTB Kenya (USD & KES)
- AIB Ireland
- Bank of Ireland

---

## 11. Webhook Configuration

### DPO Webhook Setup

1. Log into DPO Dashboard
2. Navigate to Settings → Webhooks
3. Add webhook URL: `https://yourdomain.com/api/payments/webhook`
4. Select events: Payment Success, Payment Failed
5. Save configuration

### Webhook Processing

Webhooks are stored in `payment_webhooks` table and can be processed asynchronously:

```typescript
// Process webhook
const webhook = await supabase
  .from('payment_webhooks')
  .select('*')
  .eq('processed', false)
  .single();

// Verify payment
const payment = await verifyPayment(webhook.dpo_trans_token);

// Mark as processed
await supabase
  .from('payment_webhooks')
  .update({ processed: true, processed_at: new Date() })
  .eq('id', webhook.id);
```

---

## 12. Error Handling

### Common Errors

**Payment Initialization Failed**
- Check DPO_COMPANY_TOKEN is valid
- Verify booking exists
- Ensure amount is positive

**Payment Verification Failed**
- Transaction may still be processing
- Check DPO dashboard for status
- Retry verification after delay

**Mobile Payment Not Received**
- Verify phone number format
- Check mobile network is supported
- Ensure customer has sufficient balance

**Refund Failed**
- Payment must be completed
- Refund amount cannot exceed payment
- Check DPO account has refund capability

---

## 13. Monitoring & Analytics

### Payment Analytics View

```sql
SELECT * FROM payment_analytics
WHERE payment_day >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY payment_day DESC;
```

**Metrics Available:**
- Total transactions per day
- Successful vs failed transactions
- Total revenue
- Net revenue (after fees)
- Total refunds
- Average transaction value
- Breakdown by payment method
- Breakdown by currency

### Key Metrics to Monitor

- Payment success rate
- Average payment time
- Failed payment reasons
- Refund rate
- Fraud alert frequency
- Mobile money vs card usage
- Peak payment times

---

## 14. Deployment Checklist

### Pre-Deployment

- [ ] Run database migrations
- [ ] Set environment variables
- [ ] Configure DPO company token
- [ ] Test payment flow in sandbox
- [ ] Set up webhook endpoint
- [ ] Configure email notifications
- [ ] Test refund process

### Post-Deployment

- [ ] Verify production payments work
- [ ] Monitor webhook deliveries
- [ ] Check payment analytics
- [ ] Test mobile money payments
- [ ] Verify email notifications
- [ ] Monitor error logs
- [ ] Set up payment alerts

---

## 15. Support & Troubleshooting

### DPO Support
- Email: support@directpay.online
- Phone: Check DPO dashboard for regional numbers
- Documentation: https://directpay.online/docs

### Common Issues

**"Transaction not found"**
- Payment may have expired (PTL exceeded)
- Check company reference is correct
- Verify in DPO dashboard

**"Insufficient funds"**
- Customer's account/card has insufficient balance
- Advise customer to use different payment method

**"3D Secure failed"**
- Customer didn't complete 3D Secure verification
- Advise to retry and complete verification

---

## Summary

This integration provides a complete, production-ready payment solution with:

✅ Multiple payment methods (Card, Mobile Money, Bank Transfer)
✅ Secure payment processing through DPO Pay
✅ Real-time payment verification
✅ Automatic booking confirmation
✅ Refund processing
✅ Payment analytics and reporting
✅ Webhook support for async updates
✅ Mobile-responsive UI
✅ Comprehensive error handling
✅ PCI DSS compliance through DPO

The system is ready for production use with proper testing and configuration.
