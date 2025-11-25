# 🚍 Driver App - Complete Feature List (Production Level)

## Overview
Complete production-ready driver app for Voyage Onboard bus management system.

---

## ✅ Core Features (13 Features)

### 1. Driver Home Screen
**Purpose:** Central dashboard showing everything the driver needs immediately.

**Displays:**
- Today's assigned trip
- Next trip preview
- Bus allocated (registration number)
- Time to departure countdown
- Route overview (Origin → Destination)
- Check-in progress (e.g., 24/48 passengers)
- Alerts section:
  - Breakdown warnings
  - Maintenance due
  - Fuel due
  - New messages
- "Start Trip" button (prominent CTA)

**Technical:**
- Real-time data from Supabase
- Auto-refresh every 30 seconds
- Push notifications for alerts

---

### 2. Trip Assignments
**Purpose:** View and manage all assigned trips.

**Trip Card Shows:**
- Trip number (e.g., #TR-2025-001)
- Route (Origin → Destination)
- Date & departure time
- Bus registration number
- Total passengers booked
- Trip status badge:
  - Not Started (gray)
  - En Route (blue)
  - Arrived (green)
  - Completed (success)
- Conductor assigned (name + photo)

**Actions:**
- Accept trip (confirms assignment)
- Reject trip (with reason dropdown)
- View trip details (full screen)
- Mark "Start Trip" (changes status)
- Mark "Trip Completed" (ends trip)

**Filters:**
- Today
- This Week
- All Trips
- By Status

---

### 3. Passenger Manifest
**Purpose:** Full passenger list for a trip with check-in management.

**Displays:**
- Full passenger list (scrollable)
- Per passenger:
  - Seat number
  - Full name
  - Phone number
  - Ticket number
  - Payment status badge (Paid/Pending)
  - Luggage status (Yes/No + count)
  - Check-in status:
    - ✓ Boarded (green)
    - ✗ Not Boarded (gray)
    - ⚠ No-show (red)

**Actions:**
- Scan ticket QR (opens camera)
- Manual check-in (tap to toggle)
- Mark no-show (with confirmation)
- Add notes to passenger
- Luggage check (if tracking enabled)

**Summary Stats:**
- Total passengers: 48
- Checked in: 42
- Pending: 6
- No-shows: 0

---

### 4. QR Code Check-In
**Purpose:** Fast passenger boarding via QR code scanning.

**Flow:**
1. Tap "Scan QR" button
2. Camera opens
3. Scan passenger's QR code
4. Instant validation
5. Show passenger details:
   - Name
   - Seat number
   - Ticket number
6. Vibration + sound confirmation
7. Auto-update manifest
8. Return to manifest screen

**Features:**
- Torch/flashlight toggle
- Manual entry fallback
- Duplicate scan prevention
- Offline mode support

**Technical:**
- Uses `expo-camera`
- QR format: `VOYAGE-{booking_id}-{ticket_number}`

---

### 5. Pre-Trip Inspection (Mandatory)
**Purpose:** Ensure bus is safe before departure.

**Checklist Sections:**

**A. Exterior:**
- Tyres (condition dropdown: Good/Fair/Poor)
- Lights (all working: Yes/No)
- Mirrors (condition: Good/Damaged)
- Body damage (text + photos)
- Windows (condition: Good/Cracked/Broken)

**B. Engine & Fluids:**
- Engine temperature (Normal/High/Low)
- Oil level (Full/Low/Critical)
- Water coolant (Full/Low/Critical)
- Battery (Good/Weak/Dead)

**C. Interior:**
- Seats (Good/Damaged)
- Seat belts (all working: Yes/No)
- AC/Ventilation (working: Yes/No)
- Floor condition (Clean/Dirty/Damaged)
- Cleanliness rating (1-5 stars)

**D. Safety Equipment:**
- Fire extinguisher (Present: Yes/No + Expiry date)
- First aid kit (Present: Yes/No)
- Emergency exit (Working: Yes/No)
- Warning triangle (Present: Yes/No)

**Actions:**
- Add defect (description + photos)
- Mark as critical (red flag)
- Submit inspection
- **Block trip start if critical failures exist**

**Technical:**
- Saves to `trip_inspections` table
- Photos uploaded to Supabase Storage
- Odometer reading + fuel level captured

---

### 6. Post-Trip Inspection
**Purpose:** Report trip completion and bus condition.

**Form Fields:**
- Note issues (text area)
- Rate bus condition (1-5 stars)
- Report passenger behavior (text)
- Add fuel consumption (litres)
- Submit maintenance request (optional)

**Technical:**
- Saves to `trip_inspections` table
- Links to trip record
- Triggers maintenance alerts if needed

---

### 7. Fuel Logs
**Purpose:** Track fuel consumption and costs.

**Fuel Log Form:**
- Fuel station (text input)
- Litres (number)
- Price per litre (currency)
- Total cost (auto-calculated)
- Odometer reading (number)
- Trip link (auto-populated)
- Upload fuel receipt photo
- Payment method (dropdown):
  - Company card
  - Cash
  - Account
- Comments (text area)

**Workflow:**
1. Driver submits fuel log
2. Sends to Finance for approval
3. Updates fuel variance automatically
4. Updates route fuel efficiency

**Technical:**
- Saves to `fuel_logs` table
- Status: Pending → Approved/Rejected
- Receipt stored in Supabase Storage

---

### 8. Breakdown / Incident Reporting
**Purpose:** Quick incident reporting with auto-alerts.

**Incident Types:**
- Breakdown
- Accident
- Delays
- Medical emergency
- Passenger misconduct
- Roadblock
- Police stop
- Weather issues
- Other

**Report Form:**
- Incident type (dropdown)
- Severity (Low/Medium/High/Critical)
- Description (text area)
- Location (auto-captured GPS)
- Photos/Videos (upload)
- Need assistance? (Yes/No)
- Assistance type (Tow/Mechanic/Medical/Police)
- Timestamps (auto-recorded)

**Auto-Alerts:**
- Dispatch (always)
- Maintenance (if breakdown)
- Management (if critical)

**Technical:**
- Saves to `incidents` table
- GPS coordinates captured
- Real-time notifications via Supabase Realtime

---

### 9. Live GPS Tracking
**Purpose:** Real-time bus location tracking.

**Driver View:**
- Current location (map pin)
- Route progress (line on map)
- ETA to destination
- Stops (markers)
- Delay alerts (if behind schedule)
- Speed (current)
- Distance remaining (km)

**Background Service:**
- Sends GPS data to Supabase every 30 seconds
- Continues when app is backgrounded
- Battery-optimized

**Technical:**
- Uses `expo-location`
- Saves to `trip_tracking` table
- Updates `trips.current_location`

---

### 10. Messaging & Announcements
**Purpose:** In-app communication with dispatch.

**Features:**
- Receive dispatch messages
- Reply to messages
- View company announcements
- Receive trip updates
- Receive schedule changes
- Unread count badge
- Push notifications

**Message Types:**
- General
- Trip Update
- Schedule Change
- Announcement
- Alert
- Urgent

**Technical:**
- Saves to `driver_messages` table
- Real-time via Supabase Realtime
- Push notifications via `expo-notifications`

---

### 11. Trip Timeline Updates
**Purpose:** Track trip progress with event updates.

**Events:**
- Depart depot (button)
- Arrived at first pickup (button)
- Departed pickup (button)
- Arrived final destination (button)
- Trip completed (button)

**Each Event Captures:**
- GPS location
- Timestamp
- Delay calculation (vs scheduled)
- Photos (optional)

**Updates:**
- Customer app (live tracking)
- Admin dashboard (real-time)
- Manifest (status)
- Analytics (performance)

**Technical:**
- Saves to `trip_timeline` table
- Triggers real-time updates

---

### 12. Driver Wallet & Allowances
**Purpose:** Track earnings and payments.

**Displays:**
- Current balance
- Daily allowances
- Fuel allowance
- Completed trips earnings
- Pending payments
- Trip bonuses
- All transactions (history)

**Transaction Types:**
- Daily Allowance
- Fuel Allowance
- Trip Earning
- Bonus
- Deduction
- Advance
- Refund

**Actions:**
- Filter by type
- Filter by date range
- Download payslip (PDF)

**Technical:**
- Saves to `driver_wallet` table
- Status: Pending → Approved → Paid
- PDF generation via `react-native-pdf`

---

### 13. Profile & Settings
**Purpose:** Manage driver profile and app settings.

**Profile:**
- Profile picture (upload)
- Contact details (phone, email)
- License number
- License expiry date (with alerts)
- Emergency contact
- Performance stats:
  - Total trips
  - Rating
  - On-time percentage

**Settings:**
- Change password
- Dark mode toggle
- Language options (English/Setswana)
- Notification preferences
- Help & support
- Terms & privacy
- Logout

**Technical:**
- Updates `drivers` table
- Profile photo in Supabase Storage

---

## ⭐ Premium Features (Phase 2)

### 1. Offline Mode
- Check in passengers without internet
- Sync when connection restored
- Cached trip data

### 2. In-App Navigation
- Turn-by-turn directions
- Road warnings
- Traffic alerts
- Alternative routes

### 3. Driver Performance Score
- On-time percentage
- Fuel efficiency
- Safety score
- Customer ratings
- Overall score (0-100)

### 4. Speed Monitoring Alerts
- Speed limit warnings
- Overspeed alerts
- Harsh braking detection

### 5. Onboard Camera Integration
- Front camera recording
- Incident capture
- Passenger safety

### 6. Digital Logbook
- Automatic trip logging
- Hours of service tracking
- Rest period reminders

### 7. Audio Announcements
- Auto-play next stop
- Arrival announcements
- Safety reminders

---

## 📊 Technical Stack

**Framework:** Expo SDK 54 + TypeScript
**Backend:** Supabase (PostgreSQL + Realtime)
**Maps:** Google Maps API
**Camera:** expo-camera
**Location:** expo-location
**Storage:** Supabase Storage
**Notifications:** expo-notifications
**State:** React Query + Context API

---

## 🗄️ Database Tables

1. `drivers` - Driver profiles
2. `trips` - Trip records
3. `trip_inspections` - Pre/post inspections
4. `fuel_logs` - Fuel consumption
5. `incidents` - Incident reports
6. `trip_timeline` - Trip events
7. `driver_messages` - Messaging
8. `driver_wallet` - Earnings
9. `passenger_checkins` - QR check-ins
10. `driver_performance` - Performance metrics

---

**Ready to implement!** 🚀
