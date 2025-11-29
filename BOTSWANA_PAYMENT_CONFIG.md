# Botswana Payment Configuration

## Payment Methods for Botswana Market

### Primary Payment Methods

#### 1. Pay at Office (Recommended)
- **Description**: Reserve tickets now, pay at any of our offices
- **Best for**: Customers who prefer cash payments or need assistance
- **Locations**:
  - Gaborone Main Office: Plot 123, Main Mall | +267 123 4567
  - Francistown Branch: Blue Jacket Street | +267 234 5678
  - Maun Office: Tsheko Tsheko Road | +267 345 6789
- **Currency**: Botswana Pula (BWP)
- **Fees**: No additional fees

#### 2. Online Payment via DPO Pay
- **Description**: Instant online payment with card or mobile money
- **Card Options**: Visa, Mastercard, American Express
- **Mobile Money**: Orange Money, Mascom MyZaka (when available)
- **Currency**: Botswana Pula (BWP)
- **Processing**: Instant confirmation
- **Fees**: No additional fees for customers

### Mobile Money Providers in Botswana

#### Orange Money
- **Provider**: Orange Botswana
- **Prefix**: +267 71, +267 72, +267 73
- **Coverage**: Nationwide
- **Status**: ✅ Available

#### Mascom MyZaka
- **Provider**: Mascom
- **Prefix**: +267 74, +267 75, +267 76
- **Coverage**: Nationwide
- **Status**: ✅ Available

#### BTC Mobile
- **Provider**: Botswana Telecommunications Corporation
- **Prefix**: +267 77, +267 78, +267 79
- **Coverage**: Nationwide
- **Status**: 🔄 Coming Soon

### Card Payments

#### Accepted Cards
- **Visa**: All Visa debit and credit cards
- **Mastercard**: All Mastercard debit and credit cards
- **American Express**: Amex cards (subject to availability)
- **Diners Club**: Limited acceptance

#### Processing
- **Currency**: BWP (Botswana Pula)
- **Security**: 3D Secure authentication
- **Processing Time**: Instant
- **Confirmation**: Immediate booking confirmation

### Currency Configuration

#### Primary Currency
- **Code**: BWP
- **Symbol**: P
- **Decimal Places**: 2
- **Format**: P 123.45

#### Exchange Rate Support
- **USD**: Supported for international cards
- **ZAR**: Supported for South African cards
- **EUR**: Limited support

### Payment Processing Flow

#### Online Payment Flow
1. **Customer selects "Online Payment"**
2. **Redirect to DPO Pay secure page**
3. **Select payment method (Card/Mobile Money)**
4. **Complete payment**
5. **Instant booking confirmation**
6. **Email/SMS confirmation sent**

#### Office Payment Flow
1. **Customer selects "Pay at Office"**
2. **Reservation created (2-hour expiry)**
3. **Customer visits any office**
4. **Payment in cash/card**
5. **Booking confirmed**
6. **Ticket issued immediately

### Security Features

#### PCI DSS Compliance
- All card processing handled by DPO Pay
- No card details stored on our servers
- 3D Secure authentication for cards
- Fraud detection and prevention

#### Mobile Money Security
- Phone number verification
- Transaction limits
- One-time passwords (OTP)
- Real-time fraud monitoring

### Integration Details

#### DPO Pay Configuration
- **API URL**: https://secure.3gdirectpay.com/API/v6/
- **Company Token**: Configured in environment
- **Country**: Botswana (BW)
- **Currency**: BWP
- **Language**: English

#### Webhook Configuration
- **URL**: https://yourdomain.com/api/payments/webhook
- **Events**: Payment Success, Payment Failed
- **Security**: Signed webhook requests
- **Retry Logic**: 3 attempts with exponential backoff

### Error Handling

#### Common Issues
1. **Invalid Phone Number**
   - Must be Botswana number (+267 prefix)
   - Format: +26771234567 or 26771234567
   - Validation: Real-time format checking

2. **Payment Declined**
   - Insufficient funds
   - Invalid card details
   - 3D Secure failure
   - Solution: Try different payment method

3. **Mobile Money Not Available**
   - Network issues
   - Provider downtime
   - Solution: Use card payment or pay at office

### Customer Support

#### Payment Support Channels
- **Phone**: +267 1234 5678
- **WhatsApp**: +267 7234 5678
- **Email**: payments@kjkhandala.com
- **Hours**: 8:00 AM - 6:00 PM (Mon-Sat)

#### Support Information
- **Languages**: English, Setswana
- **Response Time**: < 2 hours during business hours
- **Emergency Support**: Available for urgent booking issues

### Reporting and Analytics

#### Payment Metrics
- **Success Rate**: Track payment completion rates
- **Method Breakdown**: Card vs Mobile Money vs Office
- **Transaction Volume**: Daily/weekly/monthly totals
- **Failed Payments**: Reasons and trends

#### Botswana-Specific Reports
- **Regional Payment Preferences**: By city/town
- **Mobile Money Usage**: Provider breakdown
- **Peak Payment Times**: Local business hours
- **Currency Analysis**: BWP vs foreign card usage

### Compliance and Regulation

#### Bank of Botswana Compliance
- **Payment Systems Act 2018**: Compliant
- **Anti-Money Laundering**: KYC procedures
- **Data Protection**: Customer data privacy
- **Transaction Limits**: As per regulatory requirements

#### Tax Compliance
- **VAT**: 12% on payment processing fees
- **Withholding Tax**: Applicable for international cards
- **Reporting**: Monthly transaction reporting

### Future Enhancements

#### Planned Features
1. **BTC Mobile Integration**: Q2 2024
2. **Bank Transfer Integration**: Q3 2024
3. **USSD Payment**: Q4 2024
4. **QR Code Payments**: Q1 2025

#### Technology Roadmap
- **Biometric Authentication**: Fingerprint/face ID
- **Digital Wallets**: Apple Pay, Google Pay
- **Cryptocurrency**: Bitcoin, Ethereum (exploratory)
- **Cross-border Payments**: Regional integration

### Testing Configuration

#### Test Environment
- **Sandbox URL**: https://secure.3gdirectpay.com/API/v6/
- **Test Cards**: Provided by DPO Pay
- **Test Mobile Numbers**: Botswana test numbers
- **Test Currency**: BWP

#### Test Scenarios
1. **Successful Card Payment**
2. **Failed Card Payment**
3. **Mobile Money Success**
4. **Mobile Money Failure**
5. **Webhook Processing**
6. **Refund Processing**

### Deployment Checklist

#### Pre-Deployment
- [ ] DPO Pay production account configured
- [ ] Botswana company token verified
- [ ] Mobile money providers tested
- [ ] Webhook endpoints accessible
- [ ] SSL certificates installed
- [ ] Payment analytics configured

#### Post-Deployment
- [ ] Monitor transaction success rates
- [ ] Test all payment methods
- [ ] Verify webhook delivery
- [ ] Check customer notifications
- [ ] Monitor for fraud alerts
- [ ] Update support documentation

---

## Quick Reference

### Environment Variables
```env
DPO_API_URL=https://secure.3gdirectpay.com/API/v6/
DPO_COMPANY_TOKEN=your-botswana-company-token
FRONTEND_URL=https://your-bus-website.com
```

### Botswana Phone Validation
```javascript
const botswanaPhoneRegex = /^(\+267|267)?[0-9]{8}$/;
```

### Supported Payment Methods
1. Pay at Office (Recommended)
2. Online Card Payment
3. Mobile Money (Orange, Mascom)

### Currency Format
- **Display**: P 123.45
- **Database**: BWP
- **API**: BWP

### Support Contacts
- **Phone**: +267 1234 5678
- **WhatsApp**: +267 7234 5678
- **Email**: payments@kjkhandala.com

---

This configuration ensures optimal payment experience for Botswana customers while maintaining security and compliance with local regulations.
