# 🚀 HOW TO ACCESS ALL DASHBOARDS

## ✅ APP IS RUNNING

**Frontend:** http://localhost:8080
**Backend:** http://localhost:3001
**Prisma Studio:** http://localhost:5555

---

## 📊 **ACCESSING OPERATIONS MANAGER DASHBOARD**

### **Step 1: Create an Operations Manager User**

**Option A: Using Prisma Studio**
1. Go to http://localhost:5555
2. Click on `users` table
3. Click "Add record"
4. Fill in:
   - `email`: operations@kjkhandala.com
   - `password`: Operations@123 (will be hashed by backend)
   - `fullName`: Operations Manager
   - `phone`: +267 1234567
   - `createdAt`: Now
5. Save

6. Go to `user_roles` table
7. Click "Add record"
8. Fill in:
   - `userId`: (select the user you just created)
   - `role`: OPERATIONS_MANAGER
   - `roleLevel`: 2
9. Save

**Option B: Using API (curl)**
```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "operations@kjkhandala.com",
    "password": "Operations@123",
    "fullName": "Operations Manager",
    "phone": "+267 1234567"
  }'

# Then assign role in Prisma Studio
```

### **Step 2: Login**
1. Go to http://localhost:8080
2. Click "Sign In"
3. Enter:
   - Email: `operations@kjkhandala.com`
   - Password: `Operations@123`
4. Click "Sign In"

### **Step 3: Access Operations Dashboard**
1. After login, you'll see navbar
2. Look for **"Operations Dashboard"** tab (highlighted in primary color)
3. Click it
4. You'll see the Operations Dashboard with sidebar!

---

## 🎯 **OPERATIONS DASHBOARD FEATURES**

### **Sidebar Navigation**
```
KJ Khandala
Operations

├── Control Center (current page)
├── Route Management
├── Trip Scheduling
├── Driver Assignment
├── Operations Reports
├── Alerts & Incidents
├── Analytics & Optimization
└── Communication Hub

Sign Out
```

### **Control Center Page**
- Welcome message
- 4 KPI Cards:
  - Active Buses
  - Trips in Progress
  - Drivers on Duty
  - Operational Efficiency
- Module navigation guide

---

## 🔑 **TEST CREDENTIALS**

### **Operations Manager**
```
Email: operations@kjkhandala.com
Password: Operations@123
Role: OPERATIONS_MANAGER
```

### **Other Roles (to create)**
```
Finance Manager:
Email: finance@kjkhandala.com
Password: Finance@123
Role: FINANCE_MANAGER

HR Manager:
Email: hr@kjkhandala.com
Password: HR@123
Role: HR_MANAGER

Maintenance Manager:
Email: maintenance@kjkhandala.com
Password: Maintenance@123
Role: MAINTENANCE_MANAGER

Driver:
Email: driver@kjkhandala.com
Password: Driver@123
Role: DRIVER

Admin:
Email: admin@kjkhandala.com
Password: Admin@123
Role: SUPER_ADMIN
```

---

## 📱 **WHAT YOU'LL SEE**

### **After Login**
```
Navbar:
[KJ Khandala] [Home] [Routes] [Our Coaches] [Booking Offices] [Contact] [My Bookings] 
[Operations Dashboard] [Sign Out]
                      ↑ This appears when logged in as Operations Manager
```

### **Operations Dashboard**
```
┌─────────────────────────────────────────────────────────┐
│ KJ Khandala                                             │
│ Operations                                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ├─ Control Center (highlighted)                        │
│ ├─ Route Management                                    │
│ ├─ Trip Scheduling                                    │
│ ├─ Driver Assignment                                  │
│ ├─ Operations Reports                                 │
│ ├─ Alerts & Incidents                                │
│ ├─ Analytics & Optimization                          │
│ ├─ Communication Hub                                 │
│ │                                                     │
│ └─ Sign Out                                          │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │ Control Center                                  │ │
│  │ Real-time operations monitoring and management  │ │
│  │                                                 │ │
│  │ [Active Buses] [Trips] [Drivers] [Efficiency]  │ │
│  │                                                 │ │
│  │ Welcome to Operations Dashboard                │ │
│  │ Use the sidebar to navigate to different       │ │
│  │ modules                                        │ │
│  │                                                 │ │
│  │ • Route Management - Manage and optimize...   │ │
│  │ • Trip Scheduling - Create and manage...      │ │
│  │ • Driver Assignment - Assign drivers...       │ │
│  │ • Operations Reports - Generate reports...    │ │
│  │ • Alerts & Incidents - Handle issues...       │ │
│  │ • Analytics & Optimization - Analyze trends..│ │
│  │ • Communication Hub - Communicate...          │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 **QUICK START CHECKLIST**

- [ ] App is running (Frontend on 8080, Backend on 3001)
- [ ] Created Operations Manager user in Prisma Studio
- [ ] Assigned OPERATIONS_MANAGER role
- [ ] Logged in with Operations Manager credentials
- [ ] See "Operations Dashboard" tab in navbar
- [ ] Clicked Operations Dashboard
- [ ] See sidebar with 8 modules
- [ ] Control Center page displays

---

## ❌ **TROUBLESHOOTING**

### **"Operations Dashboard" tab not showing**
- Make sure you're logged in
- Check that user has OPERATIONS_MANAGER role
- Refresh the page (Ctrl+R)
- Check browser console for errors

### **Can't see sidebar**
- Make sure you're on `/operations` route
- Check that OperationsLayout is being used
- Refresh the page

### **Getting 404 errors**
- Make sure backend is running on port 3001
- Check API endpoints in browser Network tab
- Verify database connection

### **Can't create user in Prisma Studio**
- Make sure Prisma Studio is running (http://localhost:5555)
- Check that database connection is working
- Verify user table exists

---

## 🚀 **NEXT STEPS**

1. **Create test users** for all roles
2. **Login as each role** to see their dashboard
3. **Explore sidebar navigation**
4. **Test module routes** (they'll show placeholder pages)
5. **Implement each module** with real features

---

## 📞 **URLS REFERENCE**

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8080 |
| Backend API | http://localhost:3001/api |
| Backend Health | http://localhost:3001/health |
| Prisma Studio | http://localhost:5555 |
| Operations Dashboard | http://localhost:8080/operations |
| Admin Dashboard | http://localhost:8080/admin |

---

## 💡 **IMPORTANT NOTES**

1. **All dashboards follow the same sidebar structure**
   - Admin Dashboard (14 modules)
   - Operations Dashboard (8 modules)
   - Finance Dashboard (coming soon)
   - HR Dashboard (coming soon)
   - Maintenance Dashboard (coming soon)
   - Driver Dashboard (coming soon)

2. **Each dashboard is role-protected**
   - Only users with correct role can access
   - Unauthorized users redirected to home

3. **Sidebar navigation is consistent**
   - Same styling across all dashboards
   - Same active state highlighting
   - Same sign out functionality

---

## 🎊 **YOU'RE ALL SET!**

Follow the steps above to see the Operations Manager Dashboard in action!

**Happy exploring!** 🚌
