# 🚀 KJ Khandala Driver App - Automations Guide

This document outlines all 24 automated features implemented in the driver app.

## 📱 How to Use Automations

### Starting Trip Automations

```typescript
import { useTripAutomations } from './hooks/useTripAutomations';

function TripScreen() {
  const { startAutomations, stopAutomations, isActive } = useTripAutomations({
    tripId: 'trip-123',
    driverId: 'driver-456',
    departureTime: '2025-11-21T08:00:00Z',
    route: { /* route data */ },
    stops: [ /* stops array */ ],
    destination: { /* destination coords */ }
  });

  // Start when trip begins
  useEffect(() => {
    startAutomations();
    return () => stopAutomations();
  }, []);
}
```

## ✅ Implemented Automations

### 1. **Auto-Start Trip When Driver Arrives at Depot**
- **Trigger**: GPS detects driver within 100m of departure point
- **Actions**:
  - Updates trip timeline: "Driver arrived at depot"
  - Notifies dispatcher
  - Notifies passengers: "Your bus is preparing for departure"
- **Service**: `automationService.checkDepotArrival()`

### 2. **Auto-Check In Passengers with QR**
- **Trigger**: Driver scans passenger QR code
- **Actions**:
  - Marks passenger as boarded
  - Updates seat status
  - Updates manifest in real-time
  - Notifies ticketing dashboard
  - Updates customer app
- **Service**: `automationService.autoCheckInPassenger()`
- **Implementation**: `QRScannerScreen.tsx`

### 3. **Auto-No Show**
- **Trigger**: 5 minutes after scheduled departure
- **Actions**:
  - Marks unchecked passengers as "No Show"
  - Updates manifest
  - Notifies dispatch
  - Releases seats for last-minute bookings
- **Service**: `automationService.autoMarkNoShows()`

### 4. **Auto-Trip Event Timeline**
- **Trigger**: GPS + geofencing
- **Actions**:
  - "Arrived at stop" when bus stops at pickup point
  - "Departed stop" when bus leaves
  - "Trip nearing completion" at destination
  - Flags delays (stopped 10+ minutes)
- **Service**: `automationService.autoDetectTripEvents()`
- **No manual button tapping required!**

### 5. **Auto-Sync Pre-Trip Inspection**
- **Trigger**: Driver attempts to start trip
- **Actions**:
  - Blocks trip start if inspection not completed
  - Notifies maintenance team
  - Marks bus as "pending inspection"
  - Prevents trip start if critical issues found
- **Service**: `automationService.validatePreTripInspection()`

### 6. **Auto-Breakdown Detection (Advanced)**
- **Trigger**: Bus stopped 15+ minutes, engine on, not at station
- **Actions**:
  - Prompts driver: "Are you experiencing a breakdown?"
  - Auto-notifies dispatch + maintenance
  - Logs breakdown location
- **Service**: `automationService.detectBreakdown()`

### 7. **Auto-Generate Maintenance Request**
- **Trigger**: Driver submits fault/issue
- **Actions**:
  - Creates maintenance request automatically
  - Assigns priority level based on severity
  - Flags bus as unavailable if critical
  - Notifies maintenance dashboard
- **Service**: `automationService.autoCreateMaintenanceRequest()`

### 8. **Auto-Fuel Log Validation**
- **Trigger**: Driver submits fuel log
- **Actions**:
  - Compares with average fuel prices
  - Detects unrealistic litre amounts
  - Alerts finance if variance is suspicious
  - Auto-calculates fuel efficiency
  - Updates bus fuel statistics
- **Service**: `automationService.validateFuelLog()`

### 9. **Auto-Calculate Driver Allowances**
- **Trigger**: Trip completion
- **Actions**:
  - Base trip allowance
  - Distance bonus (P0.50/km)
  - Overnight trip bonus (P200)
  - Punctuality bonus (P50)
  - Safety bonus (P50 if no incidents)
  - Automatically adds to driver wallet
- **Service**: `automationService.calculateDriverAllowances()`

### 10. **Auto-Upload GPS Tracking**
- **Trigger**: Every 10 seconds automatically
- **Actions**:
  - Uploads location, speed, heading
  - Updates customer live tracking
  - Updates dispatch screen
  - No manual action required
- **Service**: `automationService.startAutoGPSTracking()`

### 11. **Auto-Delay Detection**
- **Trigger**: Driver is 10+ minutes behind schedule
- **Actions**:
  - System detects delay automatically
  - Notifies passengers with updated ETA
  - Notifies dispatch
  - Adjusts arrival time estimates
- **Service**: `automationService.detectDelay()`

### 12. **Auto-Departure Reminder**
- **Trigger**: 30 minutes before departure
- **Actions**:
  - Driver gets reminder notification
  - Checklist reminder
  - Fuel check reminder
  - Passengers get "Driver arriving soon" alert
- **Service**: `automationService.sendDepartureReminder()`

### 13. **Auto-Speeding Alerts**
- **Trigger**: GPS detects speed > 120 km/h
- **Actions**:
  - Driver gets immediate alert
  - System logs speeding incident
  - Dispatch gets notification
  - Added to driver performance score
- **Service**: `automationService.checkSpeed()`

### 14. **Auto-Rest Requirement**
- **Status**: Requires implementation
- **Trigger**: Driver completes long-distance trip
- **Actions**:
  - Checks driver hours
  - Forces rest period
  - Blocks new assignments until rest complete

### 15. **Auto-Conductor Assignment**
- **Status**: Requires implementation
- **Trigger**: Conductor availability
- **Actions**:
  - Pairs driver + conductor
  - Sends notifications to both
  - Updates trip roster

### 16. **Auto-Offline Sync**
- **Trigger**: Internet connection restored
- **Actions**:
  - Stores all logs offline
  - Stores manifest changes
  - Stores QR scans
  - Syncs automatically when online
- **Service**: `automationService.saveOfflineData()` / `syncOfflineData()`

### 17. **Auto-Trip Completion**
- **Trigger**: Driver reaches destination geofence
- **Actions**:
  - Marks trip as completed
  - Updates statistics
  - Push notification to customers
  - Triggers post-trip inspection
  - Calculates driver allowances
  - Generates trip report
- **Service**: `automationService.autoCompleteTripAtDestination()`

### 18. **Auto-Cleaning Request**
- **Status**: Requires implementation
- **Trigger**: Trip ends
- **Actions**:
  - Auto-generates cleaning ticket
  - Assigns cleaning team
  - Marks bus as unavailable

### 19. **Auto-Generate End-of-Trip Report**
- **Trigger**: Trip completion
- **Actions**:
  - Fuel consumed
  - Distance traveled
  - Check-in rate
  - Incidents count
  - Speed warnings
  - Time performance
  - Passenger count
  - No manual writing required!
- **Service**: `automationService.generateTripReport()`

### 20. **Auto-Luggage Count**
- **Status**: Requires luggage scanning implementation
- **Trigger**: Luggage scan
- **Actions**:
  - Auto-assigns luggage to passengers
  - Updates luggage manifest
  - Prevents lost luggage

### 21. **Auto-Trip Rating Collection**
- **Status**: Requires implementation
- **Trigger**: Trip ends
- **Actions**:
  - Passenger app asks for rating
  - Score added to driver
  - Score added to bus
  - Score added to route performance

### 22. **Auto-GPS Error Handling**
- **Status**: Built into location service
- **Trigger**: GPS turns off or permissions revoked
- **Actions**:
  - App alerts driver
  - Attempts reconnection
  - Logs location errors

### 23. **Auto-Sync With Ticketing Dashboard**
- **Trigger**: Every driver action
- **Actions**:
  - Updates seat availability
  - Updates manifest
  - Updates trip status
  - Updates dispatch board
  - Updates customer app live tracking
- **Service**: `automationService.syncWithDashboard()`

### 24. **Auto-Detect Wrong Route**
- **Trigger**: Bus deviates >1km from expected path
- **Actions**:
  - System triggers alarm
  - Driver gets alert
  - Dispatch monitors trip
  - Detects route fraud or wrong turns
- **Service**: `automationService.detectRouteDeviation()`

## 🔧 Configuration

### Automation Constants

```typescript
const GEOFENCE_RADIUS = 100; // meters
const BREAKDOWN_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const NO_SHOW_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const SPEED_LIMIT = 120; // km/h
const DELAY_THRESHOLD = 10; // minutes
const GPS_UPDATE_INTERVAL = 10000; // 10 seconds
const AUTOMATION_CHECK_INTERVAL = 30000; // 30 seconds
```

### Adjusting Settings

Edit `automationService.ts` to modify thresholds and intervals.

## 📊 Database Tables Used

### Core Tables
- `trips` - Trip data and status
- `trip_timeline` - Event tracking
- `bookings` - Passenger bookings
- `passenger_checkins` - Check-in records
- `trip_inspections` - Pre/post trip inspections
- `fuel_logs` - Fuel records
- `incidents` - Incident reports
- `wallet_transactions` - Driver earnings
- `gps_tracking` - Location history
- `speed_violations` - Speeding incidents
- `route_deviations` - Route deviation logs
- `trip_reports` - Auto-generated reports
- `maintenance_requests` - Auto-generated maintenance

## 🎯 Performance Impact

- **Battery**: GPS tracking runs every 10 seconds
- **Data Usage**: ~1-2 MB per hour of tracking
- **CPU**: Minimal, checks run every 30 seconds
- **Storage**: Offline queue stored in AsyncStorage

## 🛠️ Troubleshooting

### Automations Not Running
1. Check GPS permissions
2. Verify trip data is loaded
3. Check `isActive` status
4. Review console logs

### GPS Not Updating
1. Check location permissions
2. Verify GPS is enabled
3. Check network connectivity
4. Review `lastLocation` state

### Offline Sync Issues
1. Check AsyncStorage capacity
2. Verify network connectivity
3. Review offline queue
4. Check Supabase connection

## 📝 Future Enhancements

- [ ] Add driver rest period enforcement
- [ ] Implement conductor auto-assignment
- [ ] Add luggage tracking system
- [ ] Implement auto-rating collection
- [ ] Add cleaning request automation
- [ ] Enhance GPS error recovery
- [ ] Add predictive maintenance alerts
- [ ] Implement route optimization suggestions

## 🔐 Security Considerations

- All automations respect user permissions
- GPS data is encrypted in transit
- Offline data is stored securely
- Notifications respect privacy settings
- Speed violations are logged securely

## 📞 Support

For automation issues, contact:
- Technical Support: support@kjkhandala.com
- Emergency: +267 123 4567
