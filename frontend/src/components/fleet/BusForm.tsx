import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface BusFormProps {
  bus?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BusForm({ bus, onClose, onSuccess }: BusFormProps) {
  const [formData, setFormData] = useState({
    name: bus?.name || '',
    number_plate: bus?.number_plate || '',
    model: bus?.model || '',
    year: bus?.year || new Date().getFullYear(),
    seating_capacity: bus?.seating_capacity || 40,
    layout_rows: bus?.layout_rows || 10,
    layout_columns: bus?.layout_columns || 4,
    status: bus?.status || 'active',
    gps_device_id: bus?.gps_device_id || '',
    total_mileage: bus?.total_mileage || 0,
    last_service_date: bus?.last_service_date || '',
    next_service_date: bus?.next_service_date || '',
    insurance_expiry: bus?.insurance_expiry || '',
    license_expiry: bus?.license_expiry || '',
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (bus) {
        const { error } = await supabase
          .from('buses')
          .update(data)
          .eq('id', bus.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('buses')
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(bus ? 'Bus updated successfully' : 'Bus added successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save bus');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{bus ? 'Edit Bus' : 'Add New Bus'}</DialogTitle>
          <DialogDescription>
            {bus ? 'Update bus information' : 'Add a new bus to your fleet'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Bus Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., KJ Express 1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="number_plate">Number Plate *</Label>
              <Input
                id="number_plate"
                value={formData.number_plate}
                onChange={(e) => handleChange('number_plate', e.target.value.toUpperCase())}
                placeholder="e.g., B123ABC"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleChange('model', e.target.value)}
                placeholder="e.g., Scania Touring"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => handleChange('year', parseInt(e.target.value))}
                min="1990"
                max={new Date().getFullYear() + 1}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seating_capacity">Seating Capacity *</Label>
              <Input
                id="seating_capacity"
                type="number"
                value={formData.seating_capacity}
                onChange={(e) => handleChange('seating_capacity', parseInt(e.target.value))}
                min="1"
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="out_of_service">Out of Service</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gps_device_id">GPS Device ID</Label>
              <Input
                id="gps_device_id"
                value={formData.gps_device_id}
                onChange={(e) => handleChange('gps_device_id', e.target.value)}
                placeholder="GPS tracker ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_mileage">Total Mileage (km)</Label>
              <Input
                id="total_mileage"
                type="number"
                step="0.01"
                value={formData.total_mileage}
                onChange={(e) => handleChange('total_mileage', parseFloat(e.target.value))}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_service_date">Last Service Date</Label>
              <Input
                id="last_service_date"
                type="date"
                value={formData.last_service_date}
                onChange={(e) => handleChange('last_service_date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="next_service_date">Next Service Date</Label>
              <Input
                id="next_service_date"
                type="date"
                value={formData.next_service_date}
                onChange={(e) => handleChange('next_service_date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="insurance_expiry">Insurance Expiry</Label>
              <Input
                id="insurance_expiry"
                type="date"
                value={formData.insurance_expiry}
                onChange={(e) => handleChange('insurance_expiry', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="license_expiry">License Expiry</Label>
              <Input
                id="license_expiry"
                type="date"
                value={formData.license_expiry}
                onChange={(e) => handleChange('license_expiry', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : bus ? 'Update Bus' : 'Add Bus'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
