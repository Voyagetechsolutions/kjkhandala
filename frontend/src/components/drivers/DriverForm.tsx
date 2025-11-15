import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface DriverFormProps {
  driver?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DriverForm({ driver, onClose, onSuccess }: DriverFormProps) {
  const [formData, setFormData] = useState({
    full_name: driver?.full_name || '',
    phone: driver?.phone || '',
    license_number: driver?.license_number || '',
    license_expiry: driver?.license_expiry || '',
    status: driver?.status || 'ACTIVE',
    notes: driver?.notes || '',
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (driver) {
        const { error } = await supabase
          .from('drivers')
          .update(data)
          .eq('id', driver.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('drivers')
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(driver ? 'Driver updated successfully' : 'Driver added successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save driver');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure status is UPPERCASE for enum compatibility
    const payload = {
      ...formData,
      status: formData.status.toUpperCase(),
    };
    saveMutation.mutate(payload);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{driver ? 'Edit Driver' : 'Add New Driver'}</DialogTitle>
          <DialogDescription>
            {driver ? 'Update driver information' : 'Add a new driver to your fleet'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                placeholder="e.g., John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="e.g., +26771234567"
                required
              />
            </div>


            <div className="space-y-2">
              <Label htmlFor="license_number">License Number *</Label>
              <Input
                id="license_number"
                value={formData.license_number}
                onChange={(e) => handleChange('license_number', e.target.value)}
                placeholder="Driver's License"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="license_expiry">License Expiry *</Label>
              <Input
                id="license_expiry"
                type="date"
                value={formData.license_expiry}
                onChange={(e) => handleChange('license_expiry', e.target.value)}
                required
              />
            </div>


            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : driver ? 'Update Driver' : 'Add Driver'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
