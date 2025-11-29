# DPO Pay Payment Integration - Setup Guide

## 🎉 Implementation Complete

Your DPO Pay payment integration is now fully implemented with clean, production-ready code following all DPO Pay API v6 best practices.

## ✅ What's Been Implemented

### Backend (Node.js/TypeScript)

#### 1. **DPO Pay Service** (`backend/src/services/dpoPayService.ts`)
Complete implementation of all DPO Pay API v6 operations:

**Basic Transaction Operations:**
- ✅ `createToken` - Initialize payment transactions
- ✅ `verifyToken` - Check payment status with full verification
- ✅ `updateToken` - Modify transaction details
- ✅ `cancelToken` - Cancel unpaid transactions
- ✅ `refundToken` - Process full/partial refunds
- ✅ `emailToToken` - Resend payment links

**Payment Methods:**
- ✅ `getMobilePaymentOptions` - Get available mobile money providers
- ✅ `chargeTokenMobile` - Process mobile money payments
- ✅ `getBankTransferOptions` - Get bank transfer details
- ✅ `chargeTokenBankTransfer` - Initiate bank transfers
- ✅ `chargeTokenCreditCard` - Direct card processing (PCI compliant)
- ✅ `chargeTokenAuth` - Capture authorized transactions
- ✅ `getCompanyMobilePaymentOptions` - Company mobile terminals

**Features:**
- Clean XML request/response handling with `xml2js`
- Proper TypeScript typing for all operations
- Comprehensive error handling
- 30-second timeout protection
- Configuration validation

#### 2. **Payment Routes** (`backend/src/routes/payments.ts`)
Complete REST API with 15+ endpoints:

- `POST /api/payments/initialize` - Create payment
- `GET /api/payments/verify/:companyRef` - Verify payment
- `GET /api/payments/mobile-options/:transToken` - Mobile options
- `POST /api/payments/charge-mobile` - Mobile payment
- `GET /api/payments/bank-options/:transToken` - Bank options
- `POST /api/payments/charge-bank-transfer` - Bank transfer
- `POST /api/payments/cancel/:companyRef` - Cancel payment
- `POST /api/payments/refund/:companyRef` - Refund payment
- `POST /api/payments/resend-email/:companyRef` - Resend email
- `PUT /api/payments/update/:companyRef` - Update payment
- `GET /api/payments/booking/:bookingId` - Get booking payment
- `GET /api/payments/analytics` - Payment analytics
- `GET /api/payments/company-mobile-options` - Company options
- `POST /api/payments/webhook` - DPO webhooks
- `GET /api/payments/health` - Service health check

#### 3. **Database Schema** (`supabase/migrations/20251126_create_payments.sql`)
Complete payment tables with:
- `payments` - Main payment transactions
- `payment_attempts` - All payment attempts logging
- `payment_webhooks` - DPO webhook callbacks
- Row Level Security (RLS) policies
- Automated triggers for booking updates
- Analytics view
- Proper indexes for performance

### Frontend (React/TypeScript)

#### 1. **TypeScript Types** (`frontend/src/types/payment.ts`)
Comprehensive type definitions:
- All DPO request/response types
- Payment entities and models
- Result codes and status enums
- Analytics types
- Currency and payment method types
- Constants and labels

#### 2. **Payment Component** (`frontend/src/components/payment/DPOPayment.tsx`)
Full-featured payment UI with:
- Multi-step payment flow (select → process → complete)
- Three payment methods: Card, Mobile Money, Bank Transfer
- Mobile money provider selection with instructions
- Bank transfer with detailed instructions
- Real-time payment verification with polling
- Manual verification option
- Error handling with retry
- Loading states and feedback
- Success confirmation screen
- Responsive design with Tailwind CSS

### Documentation

#### 1. **Integration Guide** (`docs/DPO_PAY_INTEGRATION.md`)
200+ lines covering:
- Prerequisites and account setup
- Configuration instructions
- All API endpoints with examples
- Payment flow diagrams
- Payment methods supported
- Error handling and codes
- Testing guide
- Security best practices
- Monitoring guidelines
- Troubleshooting tips

#### 2. **Environment Configuration** (`.env.example`)
Updated with all DPO Pay variables and documentation

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Backend .env
DPO_COMPANY_TOKEN=your-dpo-company-token-uuid
DPO_SERVICE_TYPE=45
DPO_API_URL=https://secure.3gdirectpay.com/API/v6/
DPO_PAYMENT_URL=https://secure.3gdirectpay.com
DPO_PAYMENT_CURRENCY=BWP
FRONTEND_URL=http://localhost:5173
```

### 2. Database Migration

```bash
# Run the payment tables migration
psql -h your-db-host -U your-user -d your-db -f supabase/migrations/20251126_create_payments.sql

# Or using Supabase CLI
supabase migration up
```

### 3. Install Dependencies

```bash
# Backend
cd backend
npm install xml2js

# Frontend - dependencies already in package.json
cd frontend
npm install
```

### 4. Start Services

```bash
# Backend (Terminal 1)
cd backend
npm run dev

# Frontend (Terminal 2)
cd frontend
npm run dev
```

### 5. Test Payment Flow

```javascript
// Example: Initialize payment
const response = await axios.post('http://localhost:3001/api/payments/initialize', {
  bookingId: 'your-booking-id',
  amount: 250.00,
  currency: 'BWP',
  customerEmail: 'customer@example.com',
  customerFirstName: 'John',
  customerLastName: 'Doe',
  customerPhone: '26712345678',
  customerCountry: 'BW',
});

// Redirect to payment URL
window.location.href = response.data.paymentURL;
```

## 🎯 Key Features

### Security
- ✅ PCI compliant (no card storage)
- ✅ 3D Secure support
- ✅ Row Level Security on all tables
- ✅ Input validation and sanitization
- ✅ Secure webhook verification

### Payment Methods
- ✅ **Credit/Debit Cards** - Visa, Mastercard, Amex
- ✅ **Mobile Money** - Orange Money, Mascom MyZaka, M-Pesa
- ✅ **Bank Transfer** - EFT, Direct deposits

### User Experience
- ✅ Multi-step wizard interface
- ✅ Real-time payment verification
- ✅ Mobile-responsive design
- ✅ Clear error messages
- ✅ Payment instructions display
- ✅ Success confirmation

### Developer Experience
- ✅ Full TypeScript support
- ✅ Comprehensive error handling
- ✅ Clean, documented code
- ✅ RESTful API design
- ✅ Easy to test and debug

## 📊 Analytics & Monitoring

Access payment analytics:
```bash
GET /api/payments/analytics?startDate=2024-01-01&endDate=2024-12-31&currency=BWP
```

Returns:
- Total transactions and revenue
- Average transaction amount
- Breakdown by payment method
- Breakdown by currency
- Success/failure rates

## 🧪 Testing

### Test Credentials (Sandbox)

```bash
# Use DPO sandbox
DPO_API_URL=https://secure.sandbox.3gdirectpay.com/API/v6/
DPO_PAYMENT_URL=https://secure.sandbox.3gdirectpay.com

# Test card
Card: 4000 0000 0000 0002
Expiry: Any future date
CVV: Any 3 digits
```

### Health Check

```bash
curl http://localhost:3001/api/payments/health
```

## 📝 Next Steps

### 1. Get DPO Pay Credentials
- Sign up at https://www.dpogroup.com
- Complete KYC verification
- Get Company Token and Service Type
- Update `.env` file

### 2. Test in Sandbox
- Use test credentials
- Test all payment methods
- Verify webhooks
- Test refunds

### 3. Go Live
- Switch to production URLs
- Update Company Token
- Enable production mode
- Monitor first transactions

### 4. Additional Features (Optional)
- Implement recurring payments
- Add xPay split payments
- Integrate mVISA QR codes
- Set up automated refunds
- Create payment reports

## 📚 Resources

- **DPO Pay Documentation**: https://www.dpogroup.com/documentation/
- **Integration Guide**: `docs/DPO_PAY_INTEGRATION.md`
- **API Reference**: DPO Pay API v6
- **Support**: support@directpay.online
- **Phone**: +254 709 977 000

## 🔒 Security Checklist

Before going live:
- [ ] Changed all default secrets
- [ ] Enabled HTTPS on production
- [ ] Configured proper CORS
- [ ] Set up rate limiting
- [ ] Enabled RLS on database
- [ ] Configured webhook verification
- [ ] Set up monitoring alerts
- [ ] Tested refund process
- [ ] Documented emergency procedures
- [ ] Trained support staff

## 🐛 Troubleshooting

### "Company token does not exist"
**Solution:** Verify `DPO_COMPANY_TOKEN` in `.env` file

### "Payment Time Limit exceeded"
**Solution:** Payment link expired, generate new token

### Mobile money timeout
**Solutions:**
- Check phone number format (include country code)
- Verify mobile network operational
- Customer needs to approve on phone

### Payment not verifying
**Solutions:**
- Check webhook configuration
- Manually call verify endpoint
- Check DPO dashboard for status

## 📞 Support

For issues or questions:
1. Check `docs/DPO_PAY_INTEGRATION.md`
2. Review code comments
3. Test in sandbox first
4. Contact DPO support for API issues
5. Create issue in project repository

---

**Version:** 1.0.0  
**Last Updated:** November 28, 2024  
**Status:** ✅ Production Ready  
**Maintainer:** Voyage Tech Solutions
