# 🚀 Quick Start: Maintenance Dashboard

Get the Maintenance Dashboard up and running in minutes!

## ⚡ One-Command Setup

```bash
cd backend
npm run maintenance:setup
```

This single command will:
- ✅ Generate Prisma client
- ✅ Seed maintenance data
- ✅ Verify database tables

## 📋 Step-by-Step Setup

### 1. Database Setup

**Option A: Automatic (Recommended)**
```bash
cd backend
npm run maintenance:seed
```

**Option B: Manual SQL**
```bash
# Import SQL file into your database
mysql -u your_user -p your_database < backend/prisma/migrations/maintenance_dashboard.sql
```

### 2. Verify Installation

```bash
npm run maintenance:verify
```

Expected output:
```
✅ Database connection successful
✅ Work Orders: X records
✅ Maintenance Schedules: X records
✅ Inspections: X records
✅ Repairs: X records
✅ Inventory Items: X records
✅ Maintenance Costs: X records
```

### 3. Start Backend Server

```bash
npm run dev
```

Server runs on: `http://localhost:5000`

### 4. Start Frontend (New Terminal)

```bash
cd frontend
npm run dev
```

Frontend runs on: `http://localhost:5173`

### 5. Access Dashboard

Navigate to: **http://localhost:5173/maintenance**

## 🧪 Test API Endpoints

```bash
npm run maintenance:test
```

This will test all maintenance API endpoints and show success/failure status.

## 📊 What You Get

After setup, you'll have:

- ✅ **12 Work Orders** (various statuses: pending, in-progress, completed)
- ✅ **10 Maintenance Schedules** (upcoming services)
- ✅ **8 Vehicle Inspections** (with different statuses)
- ✅ **6 Repair Records** (with costs and details)
- ✅ **12 Inventory Items** (some flagged as low stock)
- ✅ **30+ Cost Records** (parts, labor, external services)
- ✅ **8 Maintenance Records** (historical data)

## 🎯 Key Features Available

1. **Dashboard Overview** - See all metrics at a glance
2. **Work Orders** - Create, assign, and track maintenance tasks
3. **Scheduling** - Schedule preventive maintenance
4. **Inspections** - Log vehicle inspections
5. **Repairs** - Track repairs and costs
6. **Inventory** - Manage spare parts (with low stock alerts)
7. **Cost Tracking** - Monitor maintenance expenses
8. **Reports** - Generate analytics
9. **Settings** - Configure maintenance parameters

## 🔧 Quick Commands Reference

```bash
# Seed maintenance data
npm run maintenance:seed

# Verify database setup
npm run maintenance:verify

# Test API endpoints
npm run maintenance:test

# Open Prisma Studio (visual database editor)
npm run db:studio

# Run migrations
npm run migrate

# Start development server
npm run dev
```

## 🐛 Troubleshooting

### Issue: "Cannot connect to database"
```bash
# Check your .env file has correct DATABASE_URL
# Example: DATABASE_URL="mysql://user:password@localhost:3306/dbname"
```

### Issue: "Empty tables"
```bash
# Run seed script
npm run maintenance:seed
```

### Issue: "API returns 404"
```bash
# Ensure backend is running
npm run dev

# Check if routes are registered in server.js
```

### Issue: Frontend shows CORS errors
```bash
# Check backend CORS settings
# Verify frontend .env has correct API_URL
```

## 📱 Mobile Access

The dashboard is responsive and works on:
- 📱 Mobile devices
- 💻 Tablets
- 🖥️ Desktops

## 🔐 Default Test Credentials

If you need to login (check with your setup):
```
Email: admin@voyage.com
Password: admin123
```

**Note:** Change these in production!

## 📚 Next Steps

1. ✅ Complete quick setup above
2. 📖 Read [MAINTENANCE_SETUP.md](./MAINTENANCE_SETUP.md) for detailed documentation
3. 🔍 Explore the dashboard features
4. ⚙️ Customize settings to match your needs
5. 📊 Generate reports and track maintenance

## 🆘 Need Help?

1. Check [MAINTENANCE_SETUP.md](./MAINTENANCE_SETUP.md) for detailed docs
2. Review API endpoints in backend routes
3. Check browser console for frontend errors
4. Review backend logs for API errors

## ✅ Success Checklist

- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 5173
- [ ] Database seeded with sample data
- [ ] Can access http://localhost:5173/maintenance
- [ ] Dashboard shows metrics and data
- [ ] Can create/view work orders
- [ ] Inventory shows items with stock levels

## 🎉 You're Ready!

If all checks pass, your maintenance dashboard is fully operational and ready to use!

---

**Developed by Voyage Tech Solutions**
