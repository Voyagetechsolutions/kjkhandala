# ✅ Recruitment Page - Undefined Error Fixed

## Error
```
Uncaught TypeError: Cannot read properties of undefined (reading 'applications')
at Recruitment (Recruitment.tsx:65:41)
```

## Root Cause
The `useQuery` hook was returning an object with nested `applications` property, but the object could be `undefined` during loading, causing the error when trying to access `applicationsData.applications`.

Additionally, there were duplicate property definitions in the `summary` object.

## What Was Wrong

**Before:**
```typescript
// ❌ Returns nested object that can be undefined
const { data: applicationsData, isLoading } = useQuery({
  queryKey: ['applications'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('job_applications')
      .select('*')
      .order('applied_date', { ascending: false });
    if (error) throw error;
    return { applications: data || [] };  // ❌ Nested object
  },
});

const summary = {
  activeJobs: jobPostings.filter((j: any) => j.status === 'active').length,
  totalApplications: applicationsData.applications.length,  // ❌ undefined.applications
  scheduled: applicationsData.applications.filter(...),     // ❌ undefined.applications
  hired: applicationsData.applications.filter(...),         // ❌ undefined.applications
  scheduled: applications.filter(...),  // ❌ Duplicate property
  hired: applications.filter(...),      // ❌ Duplicate property
};
```

**Problems:**
1. `applicationsData` is `undefined` during loading
2. Trying to access `.applications` on `undefined` throws error
3. Duplicate `scheduled` and `hired` properties
4. Reference to undefined `applications` variable

## Fix Applied

**After:**
```typescript
// ✅ Returns array directly with default value
const { data: applications = [], isLoading } = useQuery({
  queryKey: ['applications'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('job_applications')
      .select('*')
      .order('applied_date', { ascending: false });
    if (error) throw error;
    return data || [];  // ✅ Returns array directly
  },
});

const summary = {
  activeJobs: jobPostings.filter((j: any) => j.status === 'active').length,
  totalApplications: applications.length,  // ✅ Safe - defaults to []
  scheduled: applications.filter((a: any) => a.status === 'interview').length,
  hired: applications.filter((a: any) => a.status === 'hired').length,
  // ✅ No duplicates
};
```

**Benefits:**
1. ✅ `applications` defaults to `[]` - never undefined
2. ✅ Direct array access - no nested object
3. ✅ No duplicate properties
4. ✅ Cleaner, simpler code

## Pattern to Follow

**Always provide default values for useQuery data:**

```typescript
// ✅ GOOD - Array with default
const { data: items = [] } = useQuery({ ... });

// ✅ GOOD - Object with default
const { data: user = null } = useQuery({ ... });

// ❌ BAD - No default, can be undefined
const { data: items } = useQuery({ ... });
```

## Result

✅ **Recruitment page now works correctly**
- No more undefined errors
- Safe array operations
- Clean summary calculations
- Proper loading states

## Testing

1. Navigate to `/admin/hr/recruitment` or `/hr/recruitment`
2. Page loads without errors
3. Summary cards display correctly
4. Job postings and applications load properly

## Related Files

- ✅ `frontend/src/pages/hr/Recruitment.tsx` - Fixed

## Key Takeaway

**Always provide default values when destructuring useQuery data:**
- Arrays: `= []`
- Objects: `= null` or `= {}`
- Primitives: `= 0`, `= ''`, etc.

This prevents "Cannot read properties of undefined" errors during loading states.

**Status:** 🟢 **FIXED**

**Last Updated:** November 13, 2025 - 8:15 AM
