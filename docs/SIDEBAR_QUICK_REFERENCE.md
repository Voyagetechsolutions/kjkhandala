# Admin Sidebar - Quick Reference Guide

## Navigation Structure

### 🎯 Operations (11 items)
| Item | Route | Description |
|------|-------|-------------|
| Command Center | `/admin` | Main dashboard overview |
| Trip Management | `/admin/trips` | Schedule and manage trips |
| Fleet Management | `/admin/fleet` | Manage buses and vehicles |
| Driver Management | `/admin/drivers` | Manage driver profiles |
| Live Tracking | `/admin/tracking` | Real-time vehicle tracking |
| City Management | `/admin/cities` | Manage cities and locations |
| Route Management | `/admin/route-management` | Define and manage routes |
| Incident Management | `/operations/incidents` | Log and track incidents |
| Delay Management | `/operations/delays` | Monitor and manage delays |
| Reports and Analytics | `/admin/reports` | Operational reports |
| Terminal Operations | `/operations/terminal` | Terminal management |

### 💰 Finance and Accounting (9 items)
| Item | Route | Description |
|------|-------|-------------|
| Finance Home | `/finance` | Finance dashboard |
| Income Management | `/finance/income` | Track revenue and income |
| Expense Management | `/finance/expenses` | Manage expenses |
| Payroll Management | `/finance/payroll` | Process payroll |
| Fuel and Allowance | `/finance/fuel-allowance` | Fuel costs and allowances |
| Invoice and Billing | `/finance/invoices` | Generate invoices |
| Refunds and Adjustments | `/finance/refunds` | Process refunds |
| Reports and Analytics | `/finance/reports` | Financial reports |
| Accounts and Reconciliations | `/finance/accounts` | Account reconciliation |

### 🎫 Ticketing (7 items)
| Item | Route | Description |
|------|-------|-------------|
| Control Panel | `/ticketing` | Ticketing dashboard |
| Sell Ticket | `/ticketing/sell` | Sell new tickets |
| Find or Modify Ticket | `/ticketing/find` | Search and modify tickets |
| Check-in | `/ticketing/check-in` | Passenger check-in |
| Payment and Cash Register | `/ticketing/payments` | Process payments |
| Passenger Manifest | `/admin/manifest` | View passenger lists |
| Reports and Audit | `/ticketing/reports` | Ticketing reports |

### 👥 HR Management (10 items)
| Item | Route | Description |
|------|-------|-------------|
| HR Home | `/hr` | HR dashboard |
| Employee Management | `/hr/employees` | Manage employee records |
| Recruitment and Onboarding | `/hr/recruitment` | Hiring and onboarding |
| Attendance and Shifts | `/hr/attendance` | Track attendance |
| Payroll Management | `/hr/payroll` | HR payroll processing |
| Performance Evaluation | `/hr/performance` | Employee reviews |
| Compliance and Certificates | `/hr/compliance` | Certifications and compliance |
| Leave and Time Off | `/hr/leave` | Manage leave requests |
| Reports and Analytics | `/hr/reports` | HR reports |
| **User Management** | `/admin/users` | Manage system users |

### 🔧 Maintenance (8 items)
| Item | Route | Description |
|------|-------|-------------|
| Overview | `/maintenance` | Maintenance dashboard |
| Work Orders | `/maintenance/work-orders` | Create and track work orders |
| Maintenance Schedule | `/maintenance/schedule` | Schedule maintenance |
| Vehicle Inspections | `/maintenance/inspections` | Inspection records |
| Repairs and Parts | `/maintenance/repairs` | Track repairs |
| Inventory and Spare Parts | `/maintenance/inventory` | Parts inventory |
| Cost Management | `/maintenance/costs` | Maintenance costs |
| Reports and Analytics | `/maintenance/reports` | Maintenance reports |

### ⚙️ System
| Item | Route | Description |
|------|-------|-------------|
| System Settings | `/admin/settings` | System configuration |

## Key Changes from Previous Version

### ✅ What Changed
1. **Removed**: Top-level Command Center (was redundant)
2. **Moved**: User Management from standalone → HR Management section
3. **Kept**: System Settings as standalone link

### 📊 Statistics
- **Total Sections**: 5 collapsible
- **Total Menu Items**: 45
- **Default Open**: Operations section
- **Default Collapsed**: Finance, Ticketing, HR, Maintenance

## Usage Tips

### For Administrators
- **Command Center** is now the first item under Operations
- **User Management** is now under HR Management (last item)
- Click section headers to expand/collapse
- Active page is highlighted in primary color

### For Developers
- Menu structure defined in `AdminLayout.tsx`
- State managed with React `useState`
- Uses shadcn/ui Collapsible component
- All routes verified against `App.tsx`

## Quick Access Shortcuts

### Most Used Pages
1. Command Center: `/admin`
2. Trip Management: `/admin/trips`
3. Sell Ticket: `/ticketing/sell`
4. Finance Home: `/finance`
5. Employee Management: `/hr/employees`

### Dashboard Pages
- Operations: `/admin`
- Finance: `/finance`
- Ticketing: `/ticketing`
- HR: `/hr`
- Maintenance: `/maintenance`

## Troubleshooting

### Page Not Loading?
- Check if route exists in `App.tsx`
- Verify component import
- Check browser console for errors

### Sidebar Not Collapsing?
- Ensure Collapsible component is imported
- Check state management in `AdminLayout.tsx`

### Link Not Active?
- Verify `location.pathname` matches route
- Check active state styling

## Development Server
- **URL**: http://localhost:8081
- **HMR**: Enabled (auto-refresh on changes)
- **Status**: ✅ Running

---

**Last Updated**: November 12, 2025
**Version**: 2.0 (Final Restructure)
