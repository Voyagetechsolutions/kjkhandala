import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface FuelRecordFormProps {
  bus: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FuelRecordForm({ bus, onClose, onSuccess }: FuelRecordFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    quantity_liters: '',
    cost_per_liter: '',
    station_name: '',
    odometer_reading: bus.total_mileage || '',
    receipt_number: '',
    notes: '',
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const totalCost = parseFloat(data.quantity_liters) * parseFloat(data.cost_per_liter);
      
      // Insert fuel record
      const { error: fuelError } = await supabase
        .from('fuel_records')
        .insert([{
          bus_id: bus.id,
          date: data.date,
          quantity_liters: parseFloat(data.quantity_liters),
          cost_per_liter: parseFloat(data.cost_per_liter),
          total_cost: totalCost,
          odometer_reading: data.odometer_reading ? parseFloat(data.odometer_reading) : null,
          station_name: data.station_name || null,
          receipt_number: data.receipt_number || null,
          notes: data.notes || null,
        }]);

      if (fuelError) throw fuelError;

      // Update bus mileage if provided
      if (data.odometer_reading) {
        const { error: busError } = await supabase
          .from('buses')
          .update({ total_mileage: parseFloat(data.odometer_reading) })
          .eq('id', bus.id);

        if (busError) throw busError;
      }

      // Record as expense
      const { error: expenseError } = await supabase
        .from('expenses')
        .insert([{
          category: 'fuel',
          amount: totalCost,
          date: data.date,
          description: `Fuel for ${bus.name} (${bus.number_plate}) - ${data.quantity_liters}L`,
          bus_id: bus.id,
          receipt_number: data.receipt_number || null,
        }]);

      if (expenseError) throw expenseError;
    },
    onSuccess: () => {
      toast.success('Fuel record added successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add fuel record');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.quantity_liters || !formData.cost_per_liter) {
      toast.error('Please fill in required fields');
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const totalCost = formData.quantity_liters && formData.cost_per_liter
    ? (parseFloat(formData.quantity_liters) * parseFloat(formData.cost_per_liter)).toFixed(2)
    : '0.00';

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Fuel Record</DialogTitle>
          <DialogDescription>
            Record fuel purchase for {bus.name} ({bus.number_plate})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity_liters">Quantity (Liters) *</Label>
              <Input
                id="quantity_liters"
                type="number"
                step="0.01"
                value={formData.quantity_liters}
                onChange={(e) => handleChange('quantity_liters', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost_per_liter">Cost per Liter (P) *</Label>
              <Input
                id="cost_per_liter"
                type="number"
                step="0.01"
                value={formData.cost_per_liter}
                onChange={(e) => handleChange('cost_per_liter', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="p-3 bg-primary/5 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Cost</p>
            <p className="text-2xl font-bold text-primary">P {totalCost}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="station_name">Fuel Station</Label>
            <Input
              id="station_name"
              value={formData.station_name}
              onChange={(e) => handleChange('station_name', e.target.value)}
              placeholder="e.g., Engen Gaborone"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="odometer_reading">Odometer Reading (km)</Label>
            <Input
              id="odometer_reading"
              type="number"
              step="0.01"
              value={formData.odometer_reading}
              onChange={(e) => handleChange('odometer_reading', e.target.value)}
              placeholder="Current mileage"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="receipt_number">Receipt Number</Label>
            <Input
              id="receipt_number"
              value={formData.receipt_number}
              onChange={(e) => handleChange('receipt_number', e.target.value)}
              placeholder="Receipt/Invoice number"
            />
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
              {saveMutation.isPending ? 'Saving...' : 'Add Record'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
