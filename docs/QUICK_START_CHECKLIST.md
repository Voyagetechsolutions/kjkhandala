# ⚡ QUICK START CHECKLIST

## 🎯 Fresh Supabase Project Setup

### **Phase 1: Supabase Setup (10 minutes)**

- [ ] **1.1** Create new Supabase project
- [ ] **1.2** Save database password
- [ ] **1.3** Copy Project URL
- [ ] **1.4** Copy Anon Key
- [ ] **1.5** Copy Service Role Key
- [ ] **1.6** Turn OFF email confirmation (Auth → Providers → Email)

---

### **Phase 2: Environment Setup (2 minutes)**

- [ ] **2.1** Update `frontend/.env`:
  ```env
  VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key
  VITE_API_URL=http://localhost:3000/api
  ```

- [ ] **2.2** Update `backend/.env`:
  ```env
  SUPABASE_URL=https://YOUR-PROJECT.supabase.co
  SUPABASE_ANON_KEY=your-anon-key
  SUPABASE_SERVICE_ROLE=your-service-role-key
  PORT=3000
  ```

---

### **Phase 3: Database Setup (5 minutes)**

Run these in Supabase SQL Editor **IN ORDER**:

- [ ] **3.1** ✅ `COMPLETE_01_core_tables.sql`
- [ ] **3.2** ✅ `COMPLETE_02_operations_tables.sql`
- [ ] **3.3** ✅ `COMPLETE_03_finance_tables.sql`
- [ ] **3.4** ✅ `COMPLETE_04_hr_tables.sql`
- [ ] **3.5** ✅ `COMPLETE_05_maintenance_tables.sql`
- [ ] **3.6** ✅ `COMPLETE_06_rls_policies.sql`
- [ ] **3.7** ✅ `COMPLETE_07_functions_views.sql`
- [ ] **3.8** ✅ `COMPLETE_08_triggers.sql`

---

### **Phase 4: Verification (2 minutes)**

- [ ] **4.1** Check Table Editor shows 48 tables
- [ ] **4.2** Create test user in Auth → Users
- [ ] **4.3** Verify `profiles` table has 1 row
- [ ] **4.4** Verify `user_roles` table has 1 row (PASSENGER)

---

### **Phase 5: Backend Test (2 minutes)**

```bash
cd backend
npm install
npm run dev
```

- [ ] **5.1** Server starts without errors
- [ ] **5.2** Test: `curl http://localhost:3000/api/health`
- [ ] **5.3** Response shows `"status": "ok"`

---

### **Phase 6: Frontend Test (2 minutes)**

```bash
cd frontend
npm install
npm run dev
```

- [ ] **6.1** Vite starts on http://localhost:5173
- [ ] **6.2** Open browser to http://localhost:5173
- [ ] **6.3** No console errors

---

### **Phase 7: End-to-End Test (3 minutes)**

- [ ] **7.1** Go to /register
- [ ] **7.2** Create new user
- [ ] **7.3** Check Supabase Auth → Users (should have 2 users)
- [ ] **7.4** Login with new user
- [ ] **7.5** Dashboard loads successfully

---

## ✅ SUCCESS!

If all checkboxes are checked, your system is:
- ✅ Fully configured
- ✅ Database ready
- ✅ Backend running
- ✅ Frontend running
- ✅ Authentication working

**Total Time:** ~25 minutes

---

## 🚨 If Something Fails

### **SQL Error?**
- Make sure you run files in order (01 → 08)
- Copy the ENTIRE file content
- Check error message for specific issue

### **Backend Won't Start?**
- Check `.env` file
- Run `npm install` again
- Make sure port 3000 is free

### **Frontend Won't Load?**
- Check `frontend/.env`
- Make sure backend is running
- Clear browser cache

### **Signup Fails?**
- Turn OFF email confirmation in Supabase
- Check browser console
- Verify triggers created (Phase 4.4)

---

## 📞 Need Help?

Share the specific error message and which phase you're on.
