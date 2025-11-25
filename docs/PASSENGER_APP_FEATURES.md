# 👥 Passenger/Customer App - Complete Feature List

## Overview
Complete production-ready passenger app for Voyage Onboard bus booking system.

---

## ✅ Core Features (15 Features)

### 1. App Home Screen
**Purpose:** Quick access to all key functions.

**Displays:**
- Search widget (Origin, Destination, Date)
- Recently searched routes (cards)
- Quick "My Trips" button
- Promotions/discount banners (carousel)
- Announcements section:
  - Delays
  - Road closures
  - Weather alerts
  - Service updates
- Emergency contacts (quick dial)
- Support/Help button

**Technical:**
- Auto-refresh announcements
- Cached recent searches
- Push notification badges

---

### 2. Trip Search (Core Feature)
**Purpose:** Find available trips.

**Search Form:**
- Origin (dropdown from cities table)
- Destination (dropdown from cities table)
- Departure date (calendar picker)
- Return date (optional, calendar picker)
- Number of passengers (stepper)
- Promo code input (optional)

**Search Results Show:**
- Bus company logo
- Departure time → Arrival time
- Duration (e.g., "4h 30m")
- Bus type badge (Luxury, Semi-Luxury, Sprinter)
- Seat configuration (2x2, 2x1)
- Price per seat
- Seats available (e.g., "12 seats left")
- Trip rating (stars)
- Amenities icons:
  - WiFi
  - Charging ports
  - AC
  - Onboard movies
  - GPS tracking
  - Reclining seats
  - Refreshments

**Actions:**
- Sort by: Price, Time, Duration, Rating
- Filter by: Bus type, Amenities, Price range
- Select trip → Seat selection

**Technical:**
- Real-time seat availability
- Price calculation with promo codes
- Caching for offline viewing

---

### 3. Seat Selection
**Purpose:** Interactive seat picking.

**Displays:**
- Real bus seat layout (from seat_config table)
- Seat legend:
  - Available (green)
  - Taken (grey)
  - Selected (blue)
  - VIP (gold)
  - Driver/Reserved (red)
- Seat numbers
- Pricing per seat (VIP premium)
- Selected seats summary
- Total price

**Actions:**
- Tap to select/deselect seat
- Multi-seat selection (for passengers)
- VIP seat upgrade option
- Continue to passenger details

**Validation:**
- Must select seats = number of passengers
- Cannot select taken seats
- VIP seats show price difference

**Technical:**
- Real-time seat updates via Supabase Realtime
- Seat hold timer (5 minutes)

---

### 4. Passenger Details
**Purpose:** Collect information for each passenger.

**Per Seat Form:**
- Full name (required)
- Phone number (required)
- ID/Passport number (required)
- Gender (dropdown: Male/Female/Other)
- Next of kin (optional)
  - Name
  - Phone
  - Relationship
- Luggage option (checkbox + cost)
  - Small bag (free)
  - Medium bag (+P50)
  - Large bag (+P100)
- Add infant (toggle)
  - Free or small fee
  - Infant name
  - Infant age

**Features:**
- Save passenger details for future bookings
- Load from saved passengers
- Copy details to all passengers
- Form validation

**Technical:**
- Saves to `saved_passengers` table
- Auto-fill from profile

---

### 5. Payment Screen
**Purpose:** Secure payment processing.

**Payment Methods:**

**Botswana:**
1. Orange Money
2. Mascom MyZaka
3. Smega Wallet
4. Bank Transfer
5. Visa/Mastercard
6. Cash at station (reservation)

**South Africa:**
1. Capitec Pay
2. Ozow
3. EFT
4. Card Payment
5. Cash at station

**Payment Screen Shows:**
- Fare breakdown:
  - Base fare × passengers
  - Luggage fees
  - VIP seat premium
  - Discount/voucher (-amount)
  - Total payable
- Payment timer (10 minutes)
- Secure payment form
- Terms & conditions checkbox

**Features:**
- Save payment method
- Apply promo code
- Split payment (optional)
- Payment confirmation

**Technical:**
- PCI-DSS compliant
- 3D Secure for cards
- Webhook confirmations
- Receipt generation

---

### 6. Booking Summary
**Purpose:** Ticket confirmation and access.

**After Payment Shows:**
- Booking reference (e.g., BK-2025-001)
- Ticket numbers (per passenger)
- Passenger names & seats
- Trip details:
  - Route
  - Date & time
  - Bus reg number
  - Departure point
  - Arrival point
- QR codes (one per passenger)
- Payment receipt

**Actions:**
- Download ticket as PDF
- Add to Google/Apple calendar
- Share ticket (WhatsApp, Email, SMS)
- View on map
- Contact support

**Technical:**
- PDF generation
- QR code format: `VOYAGE-{booking_id}-{ticket_number}`
- Calendar event creation

---

### 7. My Trips
**Purpose:** Manage all bookings.

**Tabs:**
- Upcoming trips
- Past trips
- Cancelled trips

**Trip Card Shows:**
- Booking reference
- Route
- Date & time
- Seats
- Status badge
- Actions menu

**Actions:**
- View details
- Download ticket
- Track bus (if live)
- Check-in online
- Add luggage
- Cancel/refund
- Reschedule
- Rate trip (after completion)

**Features:**
- Search bookings
- Filter by status
- Sort by date

**Technical:**
- Real-time status updates
- Push notifications for changes

---

### 8. Live Bus Tracking
**Purpose:** Real-time bus location.

**When Bus is Running Shows:**
- Real-time location (map pin)
- Route line
- ETA at pickup point
- Status: On-time / Delayed (X minutes)
- Driver name & photo
- Bus registration number
- Next station
- Current speed
- Distance remaining

**Features:**
- Auto-refresh every 30 seconds
- Notifications when bus is near
- Share location with others
- Call driver (if enabled)

**Technical:**
- Connects to driver app GPS
- Uses `trip_tracking` table
- Google Maps integration

---

### 9. QR Code Check-In
**Purpose:** Digital ticket scanning.

**Features:**
- Open QR ticket from My Trips
- Full-screen QR code
- Brightness auto-increase
- Offline QR code (cached)
- Scan at station kiosk
- Scan on bus (driver device)

**System Updates:**
- Manifest (passenger boarded)
- Booking status (checked-in)
- Notification to passenger

**Technical:**
- QR format: `VOYAGE-{booking_id}-{ticket_number}`
- Works offline
- Encrypted data

---

### 10. Refund & Reschedule
**Purpose:** Self-service booking changes.

**Refund Flow:**
1. Select booking
2. Choose refund reason (dropdown)
3. System calculates refund amount based on rules:
   - >24 hours: 90% refund
   - 12-24 hours: 50% refund
   - <12 hours: No refund
4. Submit request
5. Finance approval queue
6. Refund processed to original payment method

**Reschedule Flow:**
1. Select booking
2. Choose new date/time
3. Check availability
4. Calculate fare difference
5. Pay difference (if higher)
6. Receive refund (if lower)
7. New ticket issued

**Features:**
- Refund policy display
- Fare difference calculator
- Instant reschedule (if seats available)

**Technical:**
- Saves to `refund_requests` table
- Approval workflow
- Payment integration

---

### 11. Customer Profile
**Purpose:** Manage account and preferences.

**Profile Sections:**

**Personal Info:**
- Full name
- Phone & email
- ID/Passport number
- Date of birth
- Profile photo

**Saved Data:**
- Saved passengers (frequent travelers)
- Saved payment methods
- Favorite routes
- Recent searches

**Preferences:**
- Language (English/Setswana)
- Currency (Pula/Rand/USD)
- Notification settings
- Dark mode

**Actions:**
- Edit profile
- Change password
- Delete account
- Logout

**Technical:**
- Updates `profiles` table
- Secure password change
- GDPR compliance

---

### 12. Notifications System
**Purpose:** Keep customers informed.

**Push Notifications For:**
- Booking confirmation
- Payment success/failure
- Refund status updates
- Trip reminders:
  - 3 hours before
  - 1 hour before
  - 30 minutes before
- Departure changes/cancellations
- Bus arrival at pickup point
- Promo discounts
- Lost & found
- Delays or emergencies
- Check-in reminders

**In-App Notifications:**
- Notification center
- Unread count badge
- Mark as read
- Delete notifications

**Technical:**
- Expo Notifications
- Supabase Realtime
- FCM/APNs

---

### 13. Promotions & Discounts
**Purpose:** Show available offers.

**Displays:**
- Active discount codes
- Current sales/offers
- Vouchers
- Loyalty points balance
- Referral rewards
- Seasonal promotions

**Promo Card Shows:**
- Promo code
- Discount amount/percentage
- Valid until date
- Terms & conditions
- Apply button

**Actions:**
- Copy promo code
- Apply to booking
- Share with friends
- View history

**Technical:**
- Saves to `promotions` table
- Auto-apply best discount
- Expiry validation

---

### 14. Support & Help Centre
**Purpose:** Customer assistance.

**Contact Methods:**
- WhatsApp support (direct link)
- Call center button (tel: link)
- Email support (mailto: link)
- In-app chat (optional)

**Help Sections:**
- Frequently Asked Questions
- How to book
- Payment methods
- Refund policy
- Luggage rules
- Safety guidelines
- Terms & conditions
- Privacy policy

**Features:**
- Search FAQs
- Category filtering
- Contact form
- Ticket tracking

**Technical:**
- Saves to `support_tickets` table
- Real-time chat (optional)

---

### 15. Onboard Entertainment
**Purpose:** Local media server on bus WiFi.

**Features:**
- Auto-detect bus WiFi
- Local movies list
- Watch movies offline (no data)
- Local music library
- Bus announcements
- Real-time trip progress
- Next stop alerts

**Movie Player:**
- Streaming from local server
- Pause/resume
- Subtitles
- Quality selection

**Technical:**
- WiFi detection
- Local network streaming
- Media server API
- Offline caching

---

## ⭐ Premium Features (Phase 2)

### 1. Real-Time Chat Support
- Live chat with support agents
- Chat history
- File attachments
- Quick replies

### 2. Multi-Currency Support
- Pula (BWP)
- Rand (ZAR)
- USD
- Auto-conversion
- Exchange rate display

### 3. In-App Wallet
- Stored value
- Top-up
- Pay with wallet balance
- Transaction history
- Cashback

### 4. Loyalty Program
- Points per trip
- Tier levels (Bronze, Silver, Gold)
- Rewards catalog
- Redeem points
- Birthday bonus

### 5. Family/Group Profiles
- Add family members
- Quick booking for group
- Shared payment
- Group discounts

### 6. Pickup Point Maps
- Interactive map view
- Pickup point markers
- Directions
- Street view
- Nearby landmarks

### 7. Price Calendar
- View prices across dates
- Cheapest day highlighting
- Flexible date search
- Price trends

---

## 📊 Technical Stack

**Framework:** Expo SDK 54 + TypeScript
**Backend:** Supabase
**Maps:** Google Maps API
**Payments:** Multiple SDKs
**Notifications:** Expo Notifications
**State:** React Query + Context
**PDF:** react-native-pdf
**Calendar:** expo-calendar

---

## 🗄️ Database Tables

1. `users` - User accounts
2. `profiles` - Customer profiles
3. `trips` - Available trips
4. `routes` - Route information
5. `buses` - Bus details
6. `bookings` - Customer bookings
7. `payments` - Payment records
8. `saved_passengers` - Frequent travelers
9. `promotions` - Discount codes
10. `notifications` - Push notifications
11. `support_tickets` - Customer support
12. `loyalty_points` - Rewards
13. `media_content` - Entertainment

---

**Ready to implement!** 🚀
