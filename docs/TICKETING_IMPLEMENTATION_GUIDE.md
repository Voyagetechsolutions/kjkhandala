# ✅ IN-OFFICE TICKETING DASHBOARD - IMPLEMENTATION GUIDE

## **Overview**

Complete implementation of a professional in-office bus ticket booking system with all 14 required features.

---

## **1. DATABASE SCHEMA** ✅

**File Created:** `supabase/TICKETING_DASHBOARD_SCHEMA.sql`

### **Tables Created:**

1. **terminals** - Booking offices/terminals
2. **ticketing_agents** - Staff members
3. **agent_shifts** - Cash-up and shift management
4. **passengers** - Customer database with loyalty tracking
5. **bookings** - Main booking records with PNR
6. **booking_seats** - Individual seat assignments
7. **booking_payments** - Payment transactions (cash, card, mobile, etc.)
8. **booking_refunds** - Refund requests and approvals
9. **booking_logs** - Complete audit trail
10. **discount_rules** - Discount management
11. **vouchers** - Voucher/coupon system

### **Views Created:**

1. **ticketing_daily_stats** - Daily dashboard KPIs
2. **upcoming_trips_availability** - Trip seat availability
3. **popular_routes_today** - Top selling routes
4. **pending_refunds_view** - Refunds awaiting approval
5. **outstanding_balances** - Unpaid/partial payments
6. **agent_performance_today** - Agent sales tracking

### **Functions:**

- `generate_booking_reference()` - Auto PNR generation (BK-YYYYMMDD-XXXX)
- `generate_payment_reference()` - Payment reference (PAY-YYYYMMDD-XXXXXX)
- `generate_refund_reference()` - Refund reference (REF-YYYYMMDD-XXXXXX)
- `calculate_booking_balance()` - Auto-calculate payment status
- `update_passenger_stats()` - Track frequent travelers
- `update_booking_payment()` - Update booking when payment received

### **Triggers:**

- Auto-generate booking references
- Auto-calculate balances
- Auto-log all changes
- Update passenger loyalty status

---

## **2. FRONTEND PAGES TO CREATE**

### **Main Dashboard** ✅ (Updated)
**File:** `frontend/src/pages/ticketing/TicketingDashboard.tsx`

**Features:**
- Daily stats (tickets sold, revenue, customers, avg price)
- Quick action buttons for all 14 features
- Upcoming trips with seat availability
- Popular routes today
- Pending refunds
- Outstanding balances
- Realtime updates via Supabase subscriptions

---

### **Feature Pages to Create:**

#### **1. Search Trips** 🔨
**File:** `frontend/src/pages/ticketing/SearchTrips.tsx`

**Features:**
- Origin/destination dropdowns
- Travel date picker
- Return date (optional)
- Number of passengers
- Trip type (one-way/return)
- Search results table showing:
  - Departure/arrival times
  - Duration
  - Bus type
  - Available seats
  - Price
  - Route code
- Click to select trip → proceed to seat selection

---

#### **2. Seat Selection** 🔨
**File:** `frontend/src/pages/ticketing/SeatSelection.tsx`

**Features:**
- Interactive 60-seat layout (2x2 configuration)
- Color-coded seats:
  - Green = Available
  - Yellow = Reserved
  - Red = Sold
  - Grey = Blocked
- Click to select/deselect seats
- Multi-seat selection for groups
- Seat price display (extra for front/window/VIP)
- Selected seats summary
- Auto-assign best seats option
- Proceed to passenger details

---

#### **3. Passenger Details** 🔨
**File:** `frontend/src/pages/ticketing/PassengerDetails.tsx`

**Features:**
- Form for each passenger:
  - Full name (required)
  - Phone (required)
  - Email (optional)
  - ID/Passport (required)
  - Gender (optional)
  - Nationality (optional)
  - Next of kin (optional)
  - Special notes (disability, infant, etc.)
- Add more passengers button
- Duplicate/auto-fill for groups
- Customer lookup by phone/ID
- Save to passenger database
- Proceed to payment

---

#### **4. Payment** 🔨
**File:** `frontend/src/pages/ticketing/Payment.tsx`

**Features:**
- Payment method selection:
  - Cash
  - Card (POS)
  - Bank Transfer
  - Mobile Money (Orange, Mascom, BTC)
  - Voucher/Coupon
  - Company Invoice
  - Complimentary
- Part-payment support
- Discount application (with supervisor approval)
- Auto-calculate balance
- Payment reference generation
- Receipt preview
- Print receipt button
- Proceed to booking summary

---

#### **5. Booking Summary** 🔨
**File:** `frontend/src/pages/ticketing/BookingSummary.tsx`

**Features:**
- Complete booking details:
  - Trip & date
  - Bus & route
  - Seat numbers
  - Passenger details
  - Price breakdown
  - Taxes/levies
  - Insurance
  - Total cost
  - Amount paid
  - Balance
  - Booking reference (PNR)
- Confirm booking button
- Edit buttons for each section
- Print summary

---

#### **6. Issue Ticket** 🔨
**File:** `frontend/src/pages/ticketing/IssueTicket.tsx`

**Features:**
- Generate ticket with:
  - Booking reference (PNR)
  - Passenger details
  - Trip details
  - Seat numbers
  - QR code
  - Barcode
- Print ticket button
- Email ticket
- WhatsApp ticket (optional)
- Reprint option
- Ticket template design

---

#### **7. Modify Booking** 🔨
**File:** `frontend/src/pages/ticketing/ModifyBooking.tsx`

**Features:**
- Search booking by:
  - Booking reference
  - Phone number
  - ID number
  - Passenger name
- Modification options:
  - Change travel date
  - Change seat
  - Upgrade/downgrade bus type
  - Add passenger
  - Edit passenger details
  - Cancel booking
  - Reprint ticket
- Audit log of changes
- Require supervisor approval for major changes

---

#### **8. Cancel/Refund** 🔨
**File:** `frontend/src/pages/ticketing/CancelRefund.tsx`

**Features:**
- Search booking
- Cancellation form:
  - Cancellation reason (required)
  - Refund amount calculation
  - Cancellation charge (based on policy)
  - Net refund amount
  - Refund method (cash, bank, wallet)
- Approval workflow:
  - Pending → Approved → Processed
  - Supervisor approval required
  - Rejection option with reason
- Refund status tracking
- Print refund receipt

---

#### **9. Customer Lookup** 🔨
**File:** `frontend/src/pages/ticketing/CustomerLookup.tsx`

**Features:**
- Search by:
  - ID number
  - Phone number
  - Booking reference
  - Passenger name
- Customer profile showing:
  - Personal details
  - Previous trips
  - Total trips count
  - Frequent passenger badge
  - Wallet balance
  - Loyalty points
  - Outstanding balances
- Quick actions:
  - Book new ticket
  - View booking history
  - Add to wallet
  - Update details

---

#### **10. Trip Management** 🔨
**File:** `frontend/src/pages/ticketing/TripManagement.tsx`

**Features:**
- Today's trips list
- Future trips calendar
- Trip details:
  - Trip time
  - Bus
  - Driver
  - Conductor
  - Total seats
  - Booked seats
  - Available seats
  - Trip status (on-time, delayed, cancelled)
- Filters:
  - Date range
  - Route
  - Status
- Actions:
  - View manifest
  - Check-in passengers
  - Mark as departed
  - Delay/cancel trip

---

#### **11. Office Admin Controls** 🔨
**File:** `frontend/src/pages/ticketing/OfficeAdmin.tsx`

**Features:**
- Walk-in passenger registration
- Reprint lost ticket
- Generate manual invoice
- Discount rules management
- Override seat availability (admin only)
- Cash-up report (end-of-day)
- POS settlement
- Agent shift management:
  - Open shift
  - Close shift
  - Cash reconciliation
  - Variance tracking
- Terminal settings

---

#### **12. Check-In** (Already exists, update)
**File:** `frontend/src/pages/ticketing/CheckIn.tsx`

**Features:**
- Search booking by:
  - Booking reference
  - Phone number
  - Seat number
- Passenger verification
- Check-in confirmation
- Print boarding pass
- Update booking status
- Manifest update

---

## **3. ROUTING**

Update `frontend/src/App.tsx`:

```typescript
// Ticketing Routes
<Route path="/ticketing" element={<TicketingDashboard />} />
<Route path="/ticketing/search-trips" element={<SearchTrips />} />
<Route path="/ticketing/seat-selection" element={<SeatSelection />} />
<Route path="/ticketing/passenger-details" element={<PassengerDetails />} />
<Route path="/ticketing/payment" element={<Payment />} />
<Route path="/ticketing/booking-summary" element={<BookingSummary />} />
<Route path="/ticketing/issue-ticket" element={<IssueTicket />} />
<Route path="/ticketing/modify-booking" element={<ModifyBooking />} />
<Route path="/ticketing/cancel-refund" element={<CancelRefund />} />
<Route path="/ticketing/customer-lookup" element={<CustomerLookup />} />
<Route path="/ticketing/trip-management" element={<TripManagement />} />
<Route path="/ticketing/office-admin" element={<OfficeAdmin />} />
<Route path="/ticketing/check-in" element={<CheckIn />} />
```

---

## **4. DEPLOYMENT STEPS**

### **Step 1: Deploy Database Schema**

```bash
# Run in Supabase SQL Editor
supabase/TICKETING_DASHBOARD_SCHEMA.sql
```

### **Step 2: Create Frontend Pages**

Create all 12 pages listed above.

### **Step 3: Update Routing**

Add routes to `App.tsx`.

### **Step 4: Test Each Feature**

1. Search trips
2. Select seats
3. Enter passenger details
4. Process payment
5. Issue ticket
6. Modify booking
7. Cancel/refund
8. Customer lookup
9. Trip management
10. Office admin
11. Check-in

---

## **5. SECURITY & AUDIT**

### **RLS Policies:**
- Only ticketing agents can access
- All actions logged to `booking_logs`
- Supervisor approval for refunds/discounts
- IP address and user agent tracking

### **Audit Trail:**
- Every booking change logged
- Who, what, when, why
- Before/after values
- Cannot be deleted

---

## **6. PAYMENT METHODS**

Supported:
1. **Cash** - Direct payment
2. **Card** - POS terminal integration
3. **Bank Transfer** - Manual entry
4. **Mobile Money** - Orange, Mascom, BTC
5. **Voucher** - Coupon codes
6. **Invoice** - Company accounts
7. **Complimentary** - Free tickets

---

## **7. REPORTING**

### **Daily Reports:**
- Tickets sold
- Revenue by payment method
- Agent performance
- Popular routes
- Cancellations/refunds
- Outstanding balances

### **Shift Reports:**
- Opening cash
- Closing cash
- Expected vs actual
- Variance
- Transaction summary

---

## **8. NEXT STEPS**

1. ✅ Database schema created
2. ✅ Main dashboard updated
3. 🔨 Create 11 feature pages
4. 🔨 Update routing
5. 🔨 Test all features
6. 🔨 Deploy to production

---

**All 14 required features will be fully implemented!** 🎉
