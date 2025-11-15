# 🔧 Maintenance Dashboard Setup Guide

Complete setup guide for the Fleet Maintenance Management System.

## 📋 Overview

The Maintenance Dashboard provides comprehensive fleet maintenance management including:
- **Work Orders Management** - Track and assign maintenance tasks
- **Maintenance Scheduling** - Schedule preventive maintenance
- **Vehicle Inspections** - Record and track inspections
- **Repairs & Parts** - Manage repairs and part replacements
- **Inventory Management** - Track spare parts and supplies
- **Cost Management** - Monitor maintenance expenses
- **Reports & Analytics** - Generate maintenance insights
- **Settings** - Configure maintenance parameters

## 🗄️ Database Setup

### Option 1: Using Prisma (Recommended)

1. **Run Prisma Migration**
   ```bash
   cd backend
   npx prisma migrate dev --name maintenance_dashboard
   ```

2. **Seed Sample Data**
   ```bash
   node prisma/seed-maintenance.js
   ```

   Or use the convenience script:
   ```bash
   node scripts/run-maintenance-seed.js
   ```

### Option 2: Using Raw SQL

If you prefer to use the SQL file directly:

```bash
# MySQL/MariaDB
mysql -u your_user -p your_database < backend/prisma/migrations/maintenance_dashboard.sql

# Or using a GUI tool like MySQL Workbench, phpMyAdmin, etc.
# Import the file: backend/prisma/migrations/maintenance_dashboard.sql
```

## 🔌 Backend API Endpoints

All maintenance endpoints are available under `/api/maintenance/`:

### Work Orders
- `GET /api/maintenance/work-orders` - List all work orders
- `POST /api/maintenance/work-orders` - Create new work order
- `PUT /api/maintenance/work-orders/:id` - Update work order
- `DELETE /api/maintenance/work-orders/:id` - Delete work order
- `POST /api/maintenance/work-orders/:id/assign` - Assign mechanic

### Maintenance Schedules
- `GET /api/maintenance/maintenance-schedules` - List schedules
- `POST /api/maintenance/maintenance-schedules` - Create schedule
- `PUT /api/maintenance/maintenance-schedules/:id` - Update schedule
- `DELETE /api/maintenance/maintenance-schedules/:id` - Delete schedule
- `POST /api/maintenance/maintenance-schedules/:id/complete` - Mark completed

### Inspections
- `GET /api/maintenance/inspections` - List inspections
- `POST /api/maintenance/inspections` - Create inspection
- `PUT /api/maintenance/inspections/:id` - Update inspection
- `DELETE /api/maintenance/inspections/:id` - Delete inspection

### Repairs
- `GET /api/maintenance/repairs` - List repairs
- `POST /api/maintenance/repairs` - Create repair
- `PUT /api/maintenance/repairs/:id` - Update repair
- `DELETE /api/maintenance/repairs/:id` - Delete repair

### Inventory
- `GET /api/maintenance/inventory` - List inventory items
- `POST /api/maintenance/inventory` - Create inventory item
- `PUT /api/maintenance/inventory/:id` - Update item
- `DELETE /api/maintenance/inventory/:id` - Delete item
- `PUT /api/maintenance/inventory/:id/stock` - Update stock quantity

### Maintenance Costs
- `GET /api/maintenance/maintenance-costs` - List costs
- `POST /api/maintenance/maintenance-costs` - Create cost record
- `PUT /api/maintenance/maintenance-costs/:id` - Update cost
- `DELETE /api/maintenance/maintenance-costs/:id` - Delete cost
- `GET /api/maintenance/maintenance-costs/breakdown/:period` - Cost breakdown

### Settings
- `GET /api/maintenance/settings` - Get settings
- `POST /api/maintenance/settings` - Save settings

## 🎨 Frontend Pages

All maintenance pages are located in `frontend/src/pages/maintenance/`:

1. **MaintenanceDashboard.tsx** - Overview with key metrics
2. **WorkOrders.tsx** - Work order management
3. **Schedule.tsx** - Maintenance scheduling
4. **Inspections.tsx** - Vehicle inspections
5. **Repairs.tsx** - Repair tracking
6. **Inventory.tsx** - Spare parts inventory
7. **Costs.tsx** - Cost management
8. **MaintenanceReports.tsx** - Reports and analytics
9. **MaintenanceSettings.tsx** - Configuration

## 🚀 Getting Started

### 1. Start Backend Server

```bash
cd backend
npm install
npm run dev
```

The backend will run on `http://localhost:5000`

### 2. Start Frontend Server

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

### 3. Access Maintenance Dashboard

Navigate to: `http://localhost:5173/maintenance`

## 📊 Database Schema

### Core Tables

```
work_orders              - Maintenance work orders
maintenance_schedules    - Scheduled maintenance
inspections             - Vehicle inspections
repairs                 - Repair records
inventory_items         - Spare parts inventory
stock_movements         - Inventory transactions
maintenance_records     - General maintenance logs
maintenance_costs       - Cost tracking
```

### Views

```
v_maintenance_summary      - Bus maintenance summary
v_low_stock_items         - Low inventory alerts
v_upcoming_maintenance    - Scheduled services
v_monthly_maintenance_costs - Cost analysis
```

### Stored Procedures

```
sp_get_maintenance_dashboard_stats() - Get dashboard statistics
sp_update_inventory_stock()          - Update inventory with logging
sp_complete_work_order()             - Complete work order
```

## 🔐 Permissions

Required user roles for maintenance access:
- `SUPER_ADMIN` - Full access to all features
- `MAINTENANCE_MANAGER` - Manage maintenance operations
- `MECHANIC` - View and update assigned work orders

## 📦 Sample Data

The seed script creates:
- ✅ 10+ Maintenance schedules
- ✅ 12 Inventory items (some low stock for testing)
- ✅ 8 Vehicle inspections
- ✅ 6 Repair records
- ✅ 30+ Maintenance cost entries
- ✅ 12 Work orders (various statuses)
- ✅ 8 Maintenance records

## 🧪 Testing

### Test API Endpoints

```bash
# Get work orders
curl http://localhost:5000/api/maintenance/work-orders

# Get low stock items
curl http://localhost:5000/api/maintenance/inventory?lowStock=true

# Get upcoming schedules
curl http://localhost:5000/api/maintenance/maintenance-schedules?status=scheduled
```

### Test Frontend

1. Navigate to maintenance dashboard
2. Verify all metrics display correctly
3. Test CRUD operations on each page
4. Check filtering and search functionality
5. Verify form validations

## 🐛 Troubleshooting

### Issue: Backend returns empty data

**Solution:** Run the seed script
```bash
node backend/prisma/seed-maintenance.js
```

### Issue: Frontend shows connection errors

**Solution:** 
1. Verify backend is running on port 5000
2. Check CORS settings in backend
3. Verify API base URL in frontend `.env`

### Issue: Database migration errors

**Solution:**
1. Check database connection in `.env`
2. Ensure database exists
3. Run Prisma generate: `npx prisma generate`
4. Run migration: `npx prisma migrate dev`

### Issue: Permission denied errors

**Solution:**
1. Verify user has correct role
2. Check authentication token
3. Review backend authorization middleware

## 📈 Performance Tips

1. **Database Indexes** - Already created on frequently queried columns
2. **Pagination** - Implement for large datasets
3. **Caching** - Consider Redis for frequently accessed data
4. **Query Optimization** - Use the provided views for complex queries

## 🔄 Data Maintenance

### Regular Tasks

```bash
# Backup database
mysqldump -u user -p database > maintenance_backup.sql

# Clean old records (example for 2+ years old)
DELETE FROM maintenance_costs WHERE date < DATE_SUB(NOW(), INTERVAL 2 YEAR);

# Update overdue schedules
UPDATE maintenance_schedules 
SET status = 'overdue' 
WHERE next_service_date < NOW() AND status = 'scheduled';
```

## 📚 Additional Resources

- Prisma Documentation: https://www.prisma.io/docs
- React Query: https://tanstack.com/query/latest
- Tailwind CSS: https://tailwindcss.com/docs

## 🆘 Support

For issues or questions:
1. Check existing GitHub issues
2. Review API documentation
3. Contact development team

## 📝 License

Proprietary - Voyage Tech Solutions
