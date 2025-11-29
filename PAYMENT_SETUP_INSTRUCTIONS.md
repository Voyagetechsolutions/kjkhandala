# DPO Pay Integration - Setup Instructions

## Quick Start Guide

Follow these steps to set up the DPO Pay payment gateway integration.

---

## 1. Install Dependencies

### Backend Dependencies

```bash
cd backend
npm install xml2js axios
npm install --save-dev @types/xml2js
```

**Required packages:**
- `xml2js` - XML parsing and building for DPO API
- `axios` - HTTP client for API requests

### Frontend Dependencies

```bash
cd frontend
npm install axios
```

---

## 2. Database Setup

### Run Migration

Execute the payment migration in Supabase:

```bash
# Option 1: Using Supabase CLI
supabase db push

# Option 2: In Supabase Dashboard
# Go to SQL Editor → New Query
# Copy contents of supabase/migrations/20251126_create_payments.sql
# Run the query
```

### Verify Tables Created

Check that these tables exist:
- `payments`
- `payment_attempts`
- `payment_webhooks`

---

## 3. Get DPO Pay Credentials

### Sign Up for DPO Pay

1. Visit https://directpay.online
2. Sign up for an account
3. Complete merchant verification
4. Get your Company Token from the dashboard

### Test vs Production

**Sandbox (Testing):**
- API URL: `https://secure.3gdirectpay.com/API/v6/`
- Use test company token
- Use test cards for payments

**Production:**
- Same API URL
- Use production company token
- Real payments processed

---

## 4. Configure Environment Variables

### Backend (.env)

Create or update `backend/.env`:

```env
# DPO Pay Configuration
DPO_API_URL=https://secure.3gdirectpay.com/API/v6/
DPO_COMPANY_TOKEN=your-company-token-from-dpo-dashboard

# Application URLs
FRONTEND_URL=http://localhost:5173
API_URL=http://localhost:3000

# Database (if not already set)
DATABASE_URL=your-supabase-connection-string
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Frontend (.env)

Create or update `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

---

## 5. Update Backend Routes

### Add Payment Routes to Express App

In `backend/src/index.ts` or `backend/src/app.ts`:

```typescript
import paymentRoutes from './routes/payments';

// Add this line with other routes
app.use('/api/payments', paymentRoutes);
```

---

## 6. Update Frontend Routes

### Add Payment Pages to Router

In `frontend/src/App.tsx`, add these routes:

```typescript
import PaymentSuccess from './pages/booking/PaymentSuccess';
import PaymentCancel from './pages/booking/PaymentCancel';

// Inside <Routes>
<Route path="/booking/payment-success" element={<PaymentSuccess />} />
<Route path="/booking/payment-cancel" element={<PaymentCancel />} />
```

---

## 7. Integrate Payment Component

### In Your Booking Flow

```typescript
import DPOPayment from '@/components/payment/DPOPayment';

function PaymentPage() {
  const handlePaymentSuccess = (paymentData) => {
    console.log('Payment successful:', paymentData);
    // Navigate to confirmation page
    navigate('/booking-confirmation');
  };

  return (
    <DPOPayment
      bookingId={bookingId}
      amount={totalAmount}
      currency="BWP"
      customerEmail={customerEmail}
      customerFirstName={firstName}
      customerLastName={lastName}
      customerPhone={phone}
      onSuccess={handlePaymentSuccess}
      onCancel={() => navigate('/booking')}
    />
  );
}
```

---

## 8. Configure DPO Webhook (Optional but Recommended)

### Set Up Webhook Endpoint

1. Deploy your backend to production
2. Note your webhook URL: `https://yourdomain.com/api/payments/webhook`
3. Log into DPO Dashboard
4. Go to Settings → Webhooks
5. Add webhook URL
6. Select events: Payment Success, Payment Failed
7. Save

### Test Webhook Locally

Use ngrok or similar tool:

```bash
ngrok http 3000
# Use the ngrok URL for webhook testing
```

---

## 9. Testing

### Test Card Payments

**Successful Payment:**
```
Card: 4111111111111111
Expiry: 12/25
CVV: 123
Name: Test User
```

**Failed Payment:**
```
Card: 4000000000000002
Expiry: 12/25
CVV: 123
Name: Test User
```

### Test Mobile Money

1. Initialize payment with mobile method
2. Use test phone numbers provided by DPO
3. Complete payment on test mobile interface

### Test Flow

1. Create a booking
2. Go to payment page
3. Select payment method
4. Complete payment
5. Verify redirect to success page
6. Check booking status updated
7. Verify payment record created

---

## 10. Production Deployment

### Pre-Deployment Checklist

- [ ] All environment variables set
- [ ] Database migrations run
- [ ] DPO production token configured
- [ ] Webhook URL configured in DPO
- [ ] Test payments working in sandbox
- [ ] Email notifications configured
- [ ] Error logging set up
- [ ] SSL certificate installed

### Deploy Steps

1. **Deploy Database Changes**
   ```bash
   # Run migration in production Supabase
   ```

2. **Deploy Backend**
   ```bash
   cd backend
   npm run build
   # Deploy to your hosting (Heroku, AWS, etc.)
   ```

3. **Deploy Frontend**
   ```bash
   cd frontend
   npm run build
   # Deploy to your hosting (Vercel, Netlify, etc.)
   ```

4. **Verify Production**
   - Test a small payment
   - Check webhook delivery
   - Verify booking confirmation
   - Test refund process

---

## 11. Monitoring Setup

### Set Up Alerts

Monitor these metrics:
- Payment success rate (should be >95%)
- Failed payments
- Webhook delivery failures
- Refund requests
- Fraud alerts

### Logging

Ensure these are logged:
- All payment initializations
- Payment verifications
- Failed payments with reasons
- Refund requests
- Webhook deliveries

---

## 12. Common Issues & Solutions

### Issue: "Company token does not exist"

**Solution:**
- Verify DPO_COMPANY_TOKEN in .env
- Check token is for correct environment (sandbox/production)
- Ensure no extra spaces in token

### Issue: Payment not verifying

**Solution:**
- Check payment hasn't expired (PTL)
- Verify company reference is correct
- Check DPO dashboard for transaction status
- Retry verification after 30 seconds

### Issue: Mobile payment not received

**Solution:**
- Verify phone number format (+267XXXXXXXXX)
- Check mobile network is supported
- Ensure customer has sufficient balance
- Check DPO dashboard for request status

### Issue: Webhook not received

**Solution:**
- Verify webhook URL is accessible
- Check SSL certificate is valid
- Test webhook with ngrok locally
- Check DPO dashboard webhook logs

---

## 13. Security Best Practices

### Do's ✅

- Always use HTTPS in production
- Store DPO token in environment variables
- Validate all payment amounts server-side
- Log all payment transactions
- Implement rate limiting on payment endpoints
- Use RLS policies for payment data
- Verify webhook signatures (if DPO provides)

### Don'ts ❌

- Never store full card numbers
- Don't expose DPO token in frontend
- Don't trust payment amounts from frontend
- Don't skip payment verification
- Don't process refunds without authorization
- Don't log sensitive payment data

---

## 14. Support Resources

### DPO Pay
- Dashboard: https://secure.3gdirectpay.com
- Documentation: https://directpay.online/docs
- Support: support@directpay.online

### Your Application
- Backend API: Check `/api/payments` endpoints
- Database: Check Supabase dashboard
- Logs: Check application logs for errors

---

## 15. Next Steps

After setup is complete:

1. **Test Thoroughly**
   - Test all payment methods
   - Test success and failure scenarios
   - Test refund process
   - Test webhook delivery

2. **Monitor Performance**
   - Set up payment analytics dashboard
   - Monitor success rates
   - Track average payment time
   - Monitor refund rates

3. **Optimize**
   - Reduce payment friction
   - Improve mobile money UX
   - Add more payment methods
   - Implement saved cards (if needed)

4. **Scale**
   - Handle high transaction volumes
   - Implement payment queuing
   - Add payment retry logic
   - Optimize database queries

---

## Quick Reference

### Key Files

**Backend:**
- `backend/src/services/dpoPayService.ts` - DPO API integration
- `backend/src/routes/payments.ts` - Payment endpoints
- `supabase/migrations/20251126_create_payments.sql` - Database schema

**Frontend:**
- `frontend/src/components/payment/DPOPayment.tsx` - Payment component
- `frontend/src/pages/booking/PaymentSuccess.tsx` - Success page
- `frontend/src/pages/booking/PaymentCancel.tsx` - Cancel page

### Key Endpoints

- `POST /api/payments/initialize` - Start payment
- `GET /api/payments/verify/:ref` - Check status
- `POST /api/payments/charge-mobile` - Mobile payment
- `POST /api/payments/refund/:ref` - Process refund
- `POST /api/payments/webhook` - Receive callbacks

### Environment Variables

```env
# Backend
DPO_API_URL=https://secure.3gdirectpay.com/API/v6/
DPO_COMPANY_TOKEN=your-token
FRONTEND_URL=http://localhost:5173

# Frontend
VITE_API_URL=http://localhost:3000/api
```

---

## Support

For integration support:
1. Check DPO_PAYMENT_INTEGRATION.md for detailed documentation
2. Review code comments in implementation files
3. Check DPO Pay documentation
4. Contact DPO support for API issues

---

**You're all set! 🎉**

Your DPO Pay payment gateway integration is ready to process payments securely and efficiently.
