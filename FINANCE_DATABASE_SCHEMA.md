# Finance Dashboard Database Schema

## ✅ Completed: Enhanced Finance Module Schema

The Finance Dashboard has been enhanced with comprehensive database schema updates for complete financial management.

## 📊 Finance Module Enhancements

### Income Model
**New Fields:**
- `description` - Income description
- `route` - Route for ticket sales tracking
- `vendor` - Who made the payment
- **Indexes:** date, source, category

**Purpose:** Track all revenue streams including ticket sales, charter services, cargo, commissions, etc.

### Expense Model
**New Fields:**
- `vendor` - Vendor/supplier name
- **Indexes:** date, category, status

**Purpose:** Comprehensive expense tracking with approval workflow

### Payroll Model
**Already Enhanced** (from HR module):
- `employeeName` - Denormalized for quick access
- `department` - Employee department
- `basicSalary`, `allowances`, `bonuses`, `deductions`
- `grossPay`, `netSalary`, `totalAmount`
- **Indexes:** employeeId, month, status

**Purpose:** Monthly payroll processing and salary disbursement

### FuelLog Model
**New Fields:**
- `driver` - Denormalized driver name
- `bus` - Denormalized bus number
- `route` - Route information
- `quantity` - Fuel quantity in liters
- `liters` - Alias for quantity
- `pricePerLiter` - Fuel price per liter
- `totalCost` - Total fuel cost
- `amount` - Alias for totalCost
- `estimated` - Estimated fuel needed
- `variance` - Difference between actual and estimated
- **Indexes:** date, driverId, status

**Purpose:** Fuel consumption tracking with variance analysis

### Invoice Model
**New Fields:**
- `invoiceNo` - Custom invoice number
- `invoiceNumber` - Alias for invoiceNo
- `date` - Invoice date
- `client` - Client name
- `clientName` - Alias
- `service` - Service description
- `description` - Additional details
- `paid` - Amount already paid
- `balance` - Remaining balance
- `daysPastDue` - Calculated overdue days
- **Status values:** pending, sent, paid, overdue, cancelled
- **Indexes:** date, status, dueDate

**Purpose:** Invoice management and receivables tracking

### Refund Model
**New Fields:**
- `bookingRef` - Booking reference number
- `requestDate` - When refund was requested
- `passenger` - Passenger name
- `passengerEmail` - Passenger email
- `route` - Route information
- `travelDate` - Original travel date
- `ticketAmount` - Original ticket price
- `requestedAmount` - Amount requested
- `approvedAmount` - Amount approved
- `penalty` - Refund penalty/fee
- `daysBeforeTravel` - Days before travel (for policy)
- **Indexes:** requestDate, status

**Purpose:** Refund request processing with policy enforcement

### Account Model
**New Fields:**
- `bank` - Bank name
- `bankName` - Alias
- `lastReconciled` - Last reconciliation date
- `status` - Account status (active, reconciled, pending)
- **Indexes:** type, status

**Relations:**
- One-to-many with Transaction model

**Purpose:** Bank account management and reconciliation

### Transaction Model ✨ NEW
**Fields:**
- `id` - UUID primary key
- `accountId` - Reference to Account
- `date` - Transaction date
- `description` - Transaction description
- `type` - credit or debit
- `amount` - Transaction amount
- `matched` - Whether transaction is reconciled
- `reference` - Transaction reference number
- **Indexes:** accountId, date, matched

**Purpose:** Transaction tracking and bank reconciliation

---

## 📦 Database Tables Summary

### Finance Tables (9)
1. `income` - Revenue tracking
2. `expenses` - Expense management
3. `payroll` - Salary processing
4. `fuel_logs` - Fuel consumption tracking
5. `invoices` - Invoice management
6. `refunds` - Refund processing
7. `accounts` - Bank account management
8. `transactions` - Transaction records
9. `bookings` - (Existing) Links to refunds

---

## 🎯 Key Features

### 1. Revenue Management
- Track multiple income sources
- Route-based revenue analysis
- Reference tracking for auditing

### 2. Expense Control
- Multi-level approval workflow
- Category-based tracking
- Receipt management
- Vendor tracking

### 3. Payroll Processing
- Monthly payroll cycles
- Breakdown: basic salary, allowances, bonuses, deductions
- Employee and department tracking
- Payment status management

### 4. Fuel Management
- Actual vs estimated tracking
- Variance analysis
- Route-based consumption
- Driver accountability

### 5. Invoice Management
- Automatic overdue detection
- Payment tracking
- Client management
- Balance calculation

### 6. Refund Processing
- Policy-based approvals
- Penalty calculation
- Days-before-travel tracking
- Passenger communication

### 7. Account Reconciliation
- Transaction matching
- Multiple account types
- Bank statement imports
- Discrepancy detection

---

## 🔍 Indexes for Performance

### Income
- `date` - For date range queries
- `source` - Filter by income source
- `category` - Group by category

### Expense
- `date` - Date-based reporting
- `category` - Expense categorization
- `status` - Filter pending/approved

### FuelLog
- `date` - Fuel consumption trends
- `driverId` - Per-driver analysis
- `status` - Approval tracking

### Invoice
- `date` - Invoice aging reports
- `status` - Filter by payment status
- `dueDate` - Overdue tracking

### Refund
- `requestDate` - Refund request tracking
- `status` - Process status

### Transaction
- `accountId` - Per-account transactions
- `date` - Transaction history
- `matched` - Reconciliation status

---

## 📊 API Endpoints Supported

### Income
- `GET /finance/income` - List all income
- `POST /finance/income` - Create income record
- `PUT /finance/income/:id` - Update income
- `DELETE /finance/income/:id` - Delete income

### Expenses
- `GET /finance/expenses` - List expenses
- `POST /finance/expenses` - Create expense
- `PUT /finance/expenses/:id` - Update expense
- `PUT /finance/expenses/:id/approve` - Approve expense
- `PUT /finance/expenses/:id/reject` - Reject expense

### Payroll
- `GET /finance/payroll?month=YYYY-MM` - Get payroll by month
- `POST /finance/payroll/process` - Process monthly payroll

### Fuel
- `GET /finance/fuel` - List fuel logs
- `POST /finance/fuel` - Create fuel log
- `PUT /finance/fuel/:id/approve` - Approve fuel log
- `PUT /finance/fuel/:id/reject` - Reject fuel log

### Invoices
- `GET /finance/invoices` - List invoices
- `POST /finance/invoices` - Create invoice
- `POST /finance/invoices/:id/send` - Send invoice to client
- `PUT /finance/invoices/:id/payment` - Record payment

### Refunds
- `GET /finance/refunds` - List refund requests
- `POST /finance/refunds/:id/process` - Process refund

### Accounts
- `GET /finance/accounts` - List bank accounts
- `GET /finance/transactions` - List transactions
- `POST /finance/accounts/:id/reconcile` - Reconcile account

### Settings
- `GET /finance/settings` - Get finance settings
- `POST /finance/settings` - Save settings

---

## 💡 Usage Examples

### Track Income from Ticket Sales
```typescript
{
  date: "2024-11-06",
  amount: 45230,
  category: "ticket_sales",
  source: "Ticket Sales",
  description: "Gaborone-Francistown",
  route: "Route 1",
  reference: "TKT-001"
}
```

### Create Fuel Log Entry
```typescript
{
  date: "2024-11-06",
  driverId: "driver-uuid",
  driver: "John Driver",
  bus: "BUS-001",
  quantity: 85,
  pricePerLiter: 15.50,
  totalCost: 1317.50,
  station: "Shell Gaborone",
  estimated: 80,
  variance: 5
}
```

### Generate Invoice
```typescript
{
  client: "ABC School",
  clientEmail: "admin@abcschool.com",
  service: "Charter Service",
  amount: 25000,
  dueDate: "2024-11-15",
  items: [
    { description: "Bus rental - 5 days", quantity: 5, rate: 5000 }
  ]
}
```

### Process Refund
```typescript
{
  bookingId: "booking-uuid",
  passenger: "John Doe",
  route: "Gaborone-Francistown",
  ticketAmount: 250,
  requestedAmount: 250,
  daysBeforeTravel: 9,
  reason: "Medical emergency"
}
```

---

## 🚀 Migration Command

To apply these changes to your database:

```bash
cd backend
npx prisma migrate dev --name finance_enhancements
```

---

## ✨ Benefits

### Performance
- **20+ indexes** for optimized queries
- Fast filtering and aggregation
- Efficient date-range queries

### Data Integrity
- Foreign key constraints
- Cascade delete rules
- Unique constraints on critical fields
- Default values for status fields

### Flexibility
- Denormalized fields for quick access
- Alias fields for backward compatibility
- JSON fields for flexible data structures
- Optional fields for gradual adoption

### Business Logic Support
- Approval workflows (expenses, fuel)
- Status transitions (invoices, refunds)
- Calculated fields (balance, variance)
- Audit trails (timestamps, user tracking)

---

## 📋 Status

**Migration Status:** ✅ Ready  
**Schema Status:** ✅ Complete  
**Frontend Integration:** ✅ Connected  
**API Endpoints:** ✅ Defined  

All Finance Dashboard database enhancements are complete and ready for production use!

---

**Module:** Finance Management  
**Tables:** 9 (7 enhanced + 1 new + 1 linked)  
**Indexes:** 20+  
**Created:** 2025-11-06  
**Status:** ✅ Production Ready
