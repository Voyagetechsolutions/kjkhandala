# 📋 Form Standardization Plan

## **Goal:** Update all dashboard forms to match the standardized pattern

## **Standard Form Pattern (Based on BusForm, DriverForm, RouteForm):**

### **✅ Required Features:**

1. **State Management**
   - Use `useState` for form data
   - Initialize with default values or existing data
   - Use controlled inputs

2. **React Query Integration**
   - Use `useMutation` for save operations
   - Use `useQuery` for fetching dropdown data
   - Use `useQueryClient` for cache invalidation

3. **Supabase Direct Integration**
   - Import from `@/lib/supabase` (NOT `@/integrations/supabase/client`)
   - Use `supabase.from()` for all operations
   - Proper error handling

4. **UI Components**
   - Use shadcn/ui components (Dialog, Input, Select, Label, Button, Textarea)
   - Consistent spacing and layout (grid grid-cols-2 gap-4)
   - Proper form structure with sections

5. **Validation**
   - Required fields marked with `*`
   - HTML5 validation (required attribute)
   - Type conversions (parseInt, parseFloat) before submission

6. **User Feedback**
   - Toast notifications on success/error
   - Loading states during mutations
   - Disabled buttons during submission

7. **Enum Values**
   - ALL enum values must be lowercase
   - Match database enum exactly
   - Use Select component with lowercase values

8. **Field Names**
   - Match database column names exactly
   - Use snake_case (not camelCase) for database fields
   - Only send fields that exist in the table

---

## **Forms to Update:**

### **✅ Already Standardized:**
1. ✅ BusForm.tsx
2. ✅ DriverForm.tsx
3. ✅ RouteForm.tsx

### **⚠️ Needs Update:**
4. ❌ TripForm.tsx - Uses FormData, native selects
5. ❌ FuelRecordForm.tsx - Check pattern
6. ❌ Any inline forms in pages

---

## **Common Issues to Fix:**

### **1. Enum Case Sensitivity**
```typescript
// ❌ WRONG
status: 'ACTIVE'
status: 'Active'

// ✅ CORRECT
status: 'active'
```

### **2. Non-Existent Fields**
```typescript
// ❌ WRONG - Field doesn't exist
next_maintenance_date: '2025-12-01'

// ✅ CORRECT - Only send existing fields
next_service_date: '2025-12-01'
```

### **3. Field Name Mismatches**
```typescript
// ❌ WRONG - Using wrong column name
registrationNumber: 'ABC123'

// ✅ CORRECT - Match database
registration_number: 'ABC123'
```

### **4. NOT NULL Constraints**
```typescript
// ❌ WRONG - Missing required field
{ name: 'Bus 1' }  // But capacity is NOT NULL

// ✅ CORRECT - Include or make column nullable
{ name: 'Bus 1', capacity: 40 }
```

---

## **Standard Form Template:**

```typescript
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface FormProps {
  item?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function Form({ item, onClose, onSuccess }: FormProps) {
  // 1. State management
  const [formData, setFormData] = useState({
    field1: item?.field1 || '',
    field2: item?.field2 || 'default_value',
    status: item?.status || 'active',  // LOWERCASE
  });

  // 2. Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      // Type conversions
      const payload = {
        ...data,
        numeric_field: parseFloat(data.numeric_field) || 0,
      };

      if (item) {
        const { error } = await supabase
          .from('table_name')
          .update(payload)
          .eq('id', item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('table_name')
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(item ? 'Updated successfully' : 'Added successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save');
    },
  });

  // 3. Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  // 4. Change handler
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 5. Render form
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit' : 'Add New'}</DialogTitle>
          <DialogDescription>Description here</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Input fields */}
            <div className="space-y-2">
              <Label htmlFor="field1">Field 1 *</Label>
              <Input
                id="field1"
                value={formData.field1}
                onChange={(e) => handleChange('field1', e.target.value)}
                required
              />
            </div>

            {/* Select fields - LOWERCASE values */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : item ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## **Implementation Steps:**

1. **Update TripForm.tsx** - Rewrite to standard pattern
2. **Update FuelRecordForm.tsx** - Verify and fix
3. **Check all page components** for inline forms
4. **Update any forms** in hr/, finance/, maintenance/ pages
5. **Test all forms** after updates

---

## **Testing Checklist:**

For each form:
- [ ] Saves successfully
- [ ] Updates successfully
- [ ] Shows success toast
- [ ] Shows error toast on failure
- [ ] Loading state works
- [ ] Required fields validated
- [ ] Enum values are lowercase
- [ ] No 400/404 errors in console
- [ ] No non-existent fields sent

---

**Next: Systematically update each form to this standard.**
