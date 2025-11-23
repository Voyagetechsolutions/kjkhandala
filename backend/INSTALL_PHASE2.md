# 🚀 PHASE 2 - QUICK INSTALLATION GUIDE

## Step 1: Install Required Packages

```bash
cd backend
npm install node-cron nodemailer twilio axios
```

## Step 2: Update Environment Variables

Add these to your `backend/.env` file:

```env
# ===== DPO PAYMENT GATEWAY =====
DPO_URL=https://secure.3gdirectpay.com
DPO_COMPANY_TOKEN=your_dpo_company_token_here
DPO_SERVICE_TYPE=3854

# ===== EMAIL CONFIGURATION =====
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM="Voyage Onboard" <noreply@voyage.com>

# ===== SMS CONFIGURATION (TWILIO) =====
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+267XXXXXXXX

# ===== FRONTEND URL =====
FRONTEND_URL=http://localhost:8080
```

## Step 3: Run Database Migration

```bash
npx prisma migrate dev --name add_business_logic
npx prisma generate
```

## Step 4: Restart Server

```bash
npm run dev
```

## Step 5: Verify Installation

You should see:
```
🚀 Server running on port 3001
📡 WebSocket server ready
🌍 Environment: development
🕐 Starting scheduled tasks...
✅ Scheduled tasks started
```

## ✅ Done!

All business logic engines are now active:
- ✅ Bookings Engine (seat holds, overbooking protection)
- ✅ Trip Engine (lifecycle, auto-transitions, delays)
- ✅ Payment Engine (DPO integration)
- ✅ Notification Engine (email, SMS, in-app)
- ✅ Reporting Engine (sales, trips, drivers)
- ✅ Scheduler (automated tasks)

## 🧪 Quick Test

Test seat hold:
```bash
curl -X POST http://localhost:3001/api/bookings/hold-seat \
  -H "Content-Type: application/json" \
  -d '{"tripId": "xxx", "seatNumber": "A1", "sessionId": "test123"}'
```

## 📚 Next Steps

1. Configure your DPO account
2. Set up Gmail app password for emails
3. Configure Twilio for SMS
4. Test payment flow
5. Test notifications

See `PHASE2_IMPLEMENTATION_COMPLETE.md` for full documentation.
