# 🔧 Quick Fix for TripForm

## **Issue:**
TripForm.tsx has mixed old/new code causing lint errors.

## **Solution:**
Copy the complete working version from TripFormUpdated.tsx

---

## **Steps:**

### **1. Open both files:**
- `frontend/src/components/trips/TripForm.tsx` (broken)
- `frontend/src/components/trips/TripFormUpdated.tsx` (working)

### **2. Copy-Paste:**
1. Select ALL content from `TripFormUpdated.tsx`
2. Copy (Ctrl+C)
3. Go to `TripForm.tsx`
4. Select ALL content (Ctrl+A)
5. Paste (Ctrl+V)
6. Save (Ctrl+S)

### **3. Verify:**
- No more lint errors
- File should start with:
```typescript
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
```

---

## **Alternative: Command Line**

```bash
cd frontend/src/components/trips
cp TripForm.tsx TripForm.backup.tsx
cp TripFormUpdated.tsx TripForm.tsx
```

---

**After fix:**
- Restart dev server
- Test trip scheduling
- Should work perfectly!
