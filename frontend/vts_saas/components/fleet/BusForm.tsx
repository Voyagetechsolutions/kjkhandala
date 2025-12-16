import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
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
    year: bus?.year?.toString() || new Date().getFullYear().toString(),
    seating_capacity: bus?.seating_capacity?.toString() || '40',
    bus_type: bus?.bus_type || 'STANDARD',
    fuel_type: bus?.fuel_type || 'DIESEL',
    status: bus?.status || 'ACTIVE',
    gps_device_id: bus?.gps_device_id || '',
    total_mileage: bus?.total_mileage?.toString() || '0',
    last_service_date: bus?.last_service_date || '',
    next_service_date: bus?.next_service_date || '',
    insurance_expiry: bus?.insurance_expiry || '',
    license_expiry: bus?.license_expiry || '',
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      let result;
      if (bus) {
        // @ts-ignore - Supabase query chain works correctly despite TypeScript inference issue
        result = await supabase
          .from('buses')
          .update(data)
          .eq('id', bus.id);
      } else {
        result = await supabase
          .from('buses')
          .insert([data]);
      }
      
      if (result.error) {
        throw result.error;
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
    
    // Convert string values to numbers for database
    const payload = {
      ...formData,
      status: formData.status.toUpperCase(), // Ensure UPPERCASE enum value
      year: parseInt(formData.year) || new Date().getFullYear(),
      seating_capacity: parseInt(formData.seating_capacity) || 40,
      total_mileage: parseFloat(formData.total_mileage) || 0,
      // Remove empty strings for optional fields
      gps_device_id: formData.gps_device_id || null,
      last_service_date: formData.last_service_date || null,
      next_service_date: formData.next_service_date || null,
      insurance_expiry: formData.insurance_expiry || null,
      license_expiry: formData.license_expiry || null,
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
                value={formData.year || ""}
                onChange={(e) => handleChange('year', e.target.value)}
                min="1990"
                max={new Date().getFullYear() + 1}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seating_capacity">Seating Capacity *</Label>
              <Input
                id="seating_capacity"
                type="number"
                value={formData.seating_capacity || ""}
                onChange={(e) => handleChange('seating_capacity', e.target.value)}
                min="1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bus_type">Bus Type</Label>
              <Select value={formData.bus_type} onValueChange={(value) => handleChange('bus_type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                  <SelectItem value="LUXURY">Luxury</SelectItem>
                  <SelectItem value="DOUBLE_DECKER">Double Decker</SelectItem>
                  <SelectItem value="SLEEPER">Sleeper</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuel_type">Fuel Type</Label>
              <Select value={formData.fuel_type} onValueChange={(value) => handleChange('fuel_type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIESEL">Diesel</SelectItem>
                  <SelectItem value="PETROL">Petrol</SelectItem>
                  <SelectItem value="ELECTRIC">Electric</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="OUT_OF_SERVICE">Out of Service</SelectItem>
                  <SelectItem value="RETIRED">Retired</SelectItem>
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
                value={formData.total_mileage || ""}
                onChange={(e) => handleChange('total_mileage', e.target.value)}
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
