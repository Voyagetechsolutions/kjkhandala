# FRONTEND FILE STRUCTURE

## Components Directory

### Root Components
- CurrencySelector.tsx - Currency selection
- ErrorBoundary.tsx - Error handling
- Footer.tsx - Footer
- Hero.tsx - Hero section
- HeroCarousel.tsx - Carousel
- Navbar.tsx - Navigation
- NotificationCenter.tsx - Notifications
- SeatMap.tsx - Seat selection

### Admin Components (admin/)
- AdminLayout.tsx
- RevenueChart.tsx
- RoutePerformance.tsx
- Statistics.tsx
- UserManagement.tsx

### Dashboard Components (dashboard/)
- AlertsPanel.tsx
- AnalyticsCharts.tsx
- DepartmentsSection.tsx
- KPIMetrics.tsx
- LiveOperationsMap.tsx
- QuickActionsToolbar.tsx
- RealTimeStatusBar.tsx
- UpcomingRenewals.tsx

### Driver Components (driver/)
- DriverLayout.tsx

### Drivers Components (drivers/)
- DriverAssignments.tsx
- DriverCard.tsx
- DriverForm.tsx
- DriverPerformance.tsx

### Finance Components (finance/)
- FinanceLayout.tsx

### Fleet Components (fleet/)
- BusCard.tsx
- BusForm.tsx
- FuelRecordForm.tsx
- FuelRecordsList.tsx
- MaintenanceAlerts.tsx

### HR Components (hr/)
- HRLayout.tsx

### Maintenance Components (maintenance/)
- MaintenanceLayout.tsx

### Operations Components (operations/)
- DriverAssignment.tsx
- OperationsLayout.tsx
- RouteOptimization.tsx
- TripManagement.tsx

### Routes Components (routes/)
- RouteCard.tsx
- RouteForm.tsx

### Ticketing Components (ticketing/)
- TicketingLayout.tsx

### Trips Components (trips/)
- TripCard.tsx
- TripForm.tsx

### UI Components (ui/) - 49 shadcn/ui components
- button.tsx, card.tsx, dialog.tsx, input.tsx, label.tsx
- select.tsx, table.tsx, tabs.tsx, toast.tsx, tooltip.tsx
- alert.tsx, badge.tsx, calendar.tsx, checkbox.tsx
- dropdown-menu.tsx, form.tsx, popover.tsx, progress.tsx
- radio-group.tsx, scroll-area.tsx, separator.tsx, sheet.tsx
- sidebar.tsx, skeleton.tsx, slider.tsx, switch.tsx
- textarea.tsx, and more...

---

## Pages Directory

### Root Pages
- Auth.tsx - Authentication
- BookingConfirmation.tsx - Booking confirmation
- BookingOffices.tsx - Booking offices
- Contact.tsx - Contact page
- ETicket.tsx - E-ticket
- Index.tsx - Home
- MyBookings.tsx - My bookings
- NotFound.tsx - 404
- OurCoaches.tsx - Coaches
- PassengerDetails.tsx - Passenger details
- Payment.tsx - Payment
- Routes.tsx - Routes
- SeatSelection.tsx - Seat selection
- TripSearch.tsx - Trip search

### Admin Pages (admin/) - 19 files
- Dashboard.tsx, Buses.tsx, Routes.tsx, Drivers.tsx
- Trips.tsx, Bookings.tsx, Users.tsx, Reports.tsx
- Settings.tsx, and more...

### Driver Pages (driver/) - 18 files
- Dashboard.tsx, MyTrips.tsx, Earnings.tsx
- Performance.tsx, Documents.tsx, CheckIn.tsx
- and more...

### Finance Pages (finance/) - 14 files
- Dashboard.tsx, Revenue.tsx, Expenses.tsx
- Payroll.tsx, Reports.tsx, and more...

### HR Pages (hr/) - 12 files
- Dashboard.tsx, Staff.tsx, Attendance.tsx
- Payroll.tsx, Recruitment.tsx, and more...

### Maintenance Pages (maintenance/) - 12 files
- Dashboard.tsx, WorkOrders.tsx, Schedules.tsx
- History.tsx, Costs.tsx, and more...

### Operations Pages (operations/) - 12 files
- Dashboard.tsx, Trips.tsx, Assignments.tsx
- Tracking.tsx, Alerts.tsx, and more...

### Reports Pages (reports/) - 3 files
- Dashboard.tsx, Analytics.tsx, Export.tsx

### Settings Pages (settings/) - 3 files
- Profile.tsx, Preferences.tsx, Security.tsx

### Ticketing Pages (ticketing/) - 8 files
- Dashboard.tsx, Sales.tsx, Inventory.tsx
- Refunds.tsx, and more...

### Tracking Pages (tracking/) - 1 file
- LiveTracking.tsx

---

## Contexts Directory

- AuthContext.tsx - Authentication state management
- CurrencyContext.tsx - Currency selection state

---

## Lib Directory

- api.ts - Axios API client with credentials
- currency.ts - Currency utilities
- notifications.ts - Notification handling
- payment.ts - Payment utilities
- queryClient.ts - React Query configuration
- utils.ts - General utilities

---

## Services Directory

- api.ts - API service
- auth.service.ts - Authentication service
- financeService.ts - Finance operations
- hrService.ts - HR operations
- maintenanceService.ts - Maintenance operations
- socket.ts - WebSocket configuration

---

## Hooks Directory

- use-mobile.tsx - Mobile detection hook
- use-toast.ts - Toast notifications hook
- useFinance.ts - Finance data hook
- useHR.ts - HR data hook
- useMaintenance.ts - Maintenance data hook
- useTrips.ts - Trips data hook
- useWebSocket.ts - WebSocket connection hook

---

## Store Directory (Zustand)

- authStore.ts - Auth state
- index.ts - Store exports
- notificationStore.ts - Notification state
- trackingStore.ts - Tracking state

---

## Routes Directory

- auth.routes.ts - Auth routes
- booking.routes.ts - Booking routes
- bus.routes.ts - Bus routes
- driver.routes.ts - Driver routes
- route.routes.ts - Route routes
- schedule.routes.ts - Schedule routes
- staff.routes.ts - Staff routes
- user.routes.ts - User routes

---

## Key Technologies

- React 18+ with TypeScript
- React Router for navigation
- React Query for data fetching
- Zustand for state management
- Axios for HTTP requests
- shadcn/ui for UI components
- TailwindCSS for styling
- Socket.io for real-time updates
- Vite for build tooling

---

## Total File Count

- Components: 92 items
- Pages: 116 items
- Contexts: 2 items
- Hooks: 7 items
- Services: 6 items
- Store: 4 items
- Routes: 8 items
- Lib: 6 items
