# 📋 STEPS 12-20 IMPLEMENTATION GUIDE

## Remaining Work: 9 Steps (~28 hours)

---

## STEP 12: HR Pages (4 hours)

### **Pages to Create:**

#### **1. Shifts Management** (`frontend/src/pages/hr/Shifts.tsx`)
```typescript
Features:
- View all driver shifts (calendar view)
- Create new shift
- Edit shift
- Check-in/check-out tracking
- Hours worked calculation
- Shift status (SCHEDULED, ACTIVE, COMPLETED)

API Endpoints:
GET    /api/hr/shifts
POST   /api/hr/shifts
PUT    /api/hr/shifts/:id
DELETE /api/hr/shifts/:id
```

#### **2. Documents Management** (`frontend/src/pages/hr/Documents.tsx`)
```typescript
Features:
- View all driver documents
- Upload new document
- Verify documents (HR only)
- Expiry alerts (30 days)
- Document types: License, PRDP, Medical, etc.
- Download documents

API Endpoints:
GET    /api/hr/documents
POST   /api/hr/documents
PUT    /api/hr/documents/:id/verify
DELETE /api/hr/documents/:id
```

#### **3. Attendance Tracking** (`frontend/src/pages/hr/Attendance.tsx`)
```typescript
Features:
- Daily attendance grid
- Mark present/absent/late
- Attendance summary
- Monthly report
- Export to CSV

API Endpoints:
GET    /api/hr/attendance
POST   /api/hr/attendance
PUT    /api/hr/attendance/:id
```

#### **4. Payroll View** (`frontend/src/pages/hr/Payroll.tsx`)
```typescript
Features:
- Monthly payroll summary
- Employee payroll details
- Hours worked breakdown
- Deductions & net pay
- Export payroll report

API Endpoints:
GET    /api/hr/payroll/:month/:year
POST   /api/hr/payroll/process
```

---

## STEP 13: Maintenance Pages (4 hours)

### **Pages to Create:**

#### **1. Breakdowns** (`frontend/src/pages/maintenance/Breakdowns.tsx`)
```typescript
Features:
- List all breakdowns
- Report new breakdown
- Update breakdown status
- View breakdown details
- Photo gallery
- Severity indicators

API Endpoints:
GET    /api/maintenance/breakdowns
POST   /api/maintenance/breakdowns
PUT    /api/maintenance/breakdowns/:id
```

#### **2. Preventive Maintenance** (`frontend/src/pages/maintenance/Preventive.tsx`)
```typescript
Features:
- Maintenance schedule calendar
- Schedule new maintenance
- Complete maintenance
- Next due dates
- Maintenance history
- Cost tracking

API Endpoints:
GET    /api/maintenance/preventive
POST   /api/maintenance/preventive
PUT    /api/maintenance/preventive/:id/complete
```

#### **3. Parts Inventory** (`frontend/src/pages/maintenance/Parts.tsx`)
```typescript
Features:
- Parts list with stock levels
- Add new part
- Use part (deduct stock)
- Reorder part
- Low stock alerts
- Inventory valuation

API Endpoints:
GET    /api/maintenance/parts
POST   /api/maintenance/parts
PUT    /api/maintenance/parts/:id/use
POST   /api/maintenance/parts/:id/reorder
```

#### **4. Work Orders** (`frontend/src/pages/maintenance/WorkOrders.tsx`)
```typescript
Features:
- Work order list
- Create work order
- Assign to mechanic
- Update status
- Complete work order
- Parts used tracking

API Endpoints:
GET    /api/maintenance/work-orders
POST   /api/maintenance/work-orders
PUT    /api/maintenance/work-orders/:id/assign
PUT    /api/maintenance/work-orders/:id/complete
```

---

## STEP 14: Finance Pages (4 hours)

### **Pages to Create:**

#### **1. Reconciliation** (`frontend/src/pages/finance/Reconciliation.tsx`)
```typescript
Features:
- Daily reconciliation dashboard
- Revenue vs expenses
- Payment method breakdown
- Net revenue calculation
- Reconcile button
- Export report

API Endpoints:
POST   /api/finance/reconcile/:date
GET    /api/finance/reconciliation
```

#### **2. Collections** (`frontend/src/pages/finance/Collections.tsx`)
```typescript
Features:
- Cash collections list
- Record new collection
- Mark as deposited
- Collector performance
- Multi-currency support
- Export to CSV

API Endpoints:
GET    /api/finance/collections
POST   /api/finance/collections
PUT    /api/finance/collections/:id/deposit
```

#### **3. Expenses** (`frontend/src/pages/finance/Expenses.tsx`)
```typescript
Features:
- Expense list (pending/approved/rejected)
- Submit new expense
- Approve/reject (manager only)
- Receipt upload
- Category breakdown
- Export report

API Endpoints:
GET    /api/finance/expenses
POST   /api/finance/expenses
PUT    /api/finance/expenses/:id/approve
PUT    /api/finance/expenses/:id/reject
```

#### **4. Commissions** (`frontend/src/pages/finance/Commissions.tsx`)
```typescript
Features:
- Commission report
- Employee commission breakdown
- Sales tracking
- Payment history
- Export report

API Endpoints:
GET    /api/finance/commissions
POST   /api/finance/commissions/pay
```

---

## STEP 15: Reports Dashboard (3 hours)

### **Pages to Create:**

#### **1. Reports Hub** (`frontend/src/pages/reports/ReportsDashboard.tsx`)
```typescript
Features:
- Report categories
- Quick access cards
- Recent reports
- Scheduled reports
- Export options

Reports Available:
- Daily Sales
- Trip Performance
- Driver Performance
- Operations Report
- Revenue Report
```

#### **2. Daily Sales** (`frontend/src/pages/reports/DailySales.tsx`)
```typescript
Features:
- Date picker
- Sales summary cards
- Revenue by route chart
- Payment method breakdown
- Hourly sales chart
- Export to CSV/PDF

API Endpoint:
GET /api/reports/daily-sales/:date
```

#### **3. Trip Performance** (`frontend/src/pages/reports/TripPerformance.tsx`)
```typescript
Features:
- Date range picker
- Occupancy rate chart
- Revenue per trip
- On-time performance
- Route comparison
- Export report

API Endpoint:
GET /api/reports/trip-performance
```

#### **4. Driver Performance** (`frontend/src/pages/reports/DriverPerformance.tsx`)
```typescript
Features:
- Driver selector
- Performance metrics
- Safety score
- Trips completed
- Incidents chart
- Export report

API Endpoint:
GET /api/reports/driver-performance/:id
```

---

## STEP 16: Settings Page (2 hours)

### **Pages to Create:**

#### **1. Settings Hub** (`frontend/src/pages/settings/Settings.tsx`)
```typescript
Features:
- Profile settings
- Company settings
- Notification preferences
- System settings
- API keys (future)
```

#### **2. Profile** (`frontend/src/pages/settings/Profile.tsx`)
```typescript
Features:
- Edit profile info
- Change password
- Upload photo
- Email preferences
- Two-factor auth (future)
```

#### **3. Company** (`frontend/src/pages/settings/Company.tsx`)
```typescript
Features:
- Company name
- Logo upload
- Contact info
- Business hours
- Currency settings
```

---

## STEP 17: PWA Support (2 hours)

### **Files to Create:**

#### **1. Service Worker** (`frontend/public/service-worker.js`)
```javascript
Features:
- Cache static assets
- Cache API responses
- Offline fallback
- Background sync
- Push notifications
```

#### **2. Manifest** (`frontend/public/manifest.json`)
```json
{
  "name": "Voyage Onboard",
  "short_name": "Voyage",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [...]
}
```

#### **3. Register Service Worker** (`frontend/src/registerSW.ts`)
```typescript
- Register service worker
- Handle updates
- Show install prompt
```

---

## STEP 18: Offline Support (3 hours)

### **Features to Add:**

#### **1. Offline Detection** (`frontend/src/hooks/useOnline.ts`)
```typescript
- Detect online/offline
- Show offline banner
- Queue failed requests
- Retry when online
```

#### **2. Request Queue** (`frontend/src/utils/requestQueue.ts`)
```typescript
- Queue failed requests
- Store in IndexedDB
- Retry on reconnect
- Show sync status
```

#### **3. Offline Banner** (`frontend/src/components/OfflineBanner.tsx`)
```typescript
- Show when offline
- Hide when online
- Sync status indicator
```

---

## STEP 19: Testing & Bug Fixes (4 hours)

### **Testing Checklist:**

#### **Backend:**
- [ ] All endpoints return correct data
- [ ] Rate limiting works
- [ ] Error handling catches errors
- [ ] Validation rejects invalid data
- [ ] Queue processors work
- [ ] WebSocket connections stable

#### **Frontend:**
- [ ] All pages load correctly
- [ ] Forms validate properly
- [ ] API calls work
- [ ] State management works
- [ ] Real-time updates work
- [ ] No console errors

#### **Integration:**
- [ ] Login/logout flow
- [ ] Booking flow
- [ ] Trip tracking
- [ ] Notifications
- [ ] Reports generation

---

## STEP 20: Documentation (2 hours)

### **Documents to Create:**

#### **1. API Documentation**
- All endpoints
- Request/response formats
- Authentication
- Error codes

#### **2. User Guide**
- How to use each dashboard
- Common workflows
- Troubleshooting

#### **3. Deployment Guide**
- Environment setup
- Database migration
- Server deployment
- Frontend deployment

#### **4. Developer Guide**
- Project structure
- Coding standards
- Adding new features
- Testing guidelines

---

## 📊 TIME BREAKDOWN

| Step | Task | Time |
|------|------|------|
| 12 | HR Pages | 4 hours |
| 13 | Maintenance Pages | 4 hours |
| 14 | Finance Pages | 4 hours |
| 15 | Reports Dashboard | 3 hours |
| 16 | Settings Page | 2 hours |
| 17 | PWA Support | 2 hours |
| 18 | Offline Support | 3 hours |
| 19 | Testing | 4 hours |
| 20 | Documentation | 2 hours |
| **Total** | **9 Steps** | **28 hours** |

**Estimated Completion:** 3-4 days of focused work

---

## 🎯 RECOMMENDED ORDER

### **Week 1 (Steps 12-15):**
Day 1: HR Pages (4h)
Day 2: Maintenance Pages (4h)
Day 3: Finance Pages (4h)
Day 4: Reports Dashboard (3h)

### **Week 2 (Steps 16-20):**
Day 5: Settings + PWA (4h)
Day 6: Offline Support (3h)
Day 7: Testing (4h)
Day 8: Documentation (2h)

---

## ✅ SUCCESS CRITERIA

- [ ] All pages functional
- [ ] No critical bugs
- [ ] All tests passing
- [ ] Documentation complete
- [ ] PWA installable
- [ ] Offline mode works
- [ ] Performance acceptable
- [ ] Security validated

---

**Current Status:** Steps 1-11 Complete (55%)
**Remaining:** Steps 12-20 (45%)
**Target:** 100% Complete System
