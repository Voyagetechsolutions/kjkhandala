import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  useAddMaintenanceRecord, 
  useMaintenanceTypes, 
  useActiveBuses, 
  useMaintenanceStaff 
} from '@/hooks/useMaintenanceOperations';

interface MaintenanceRecordFormData {
  bus_id: string;
  type: string;
  date: string;
  description: string;
  work_performed?: string;
  cost?: number;
  odometer_reading?: number;
  next_service_km?: number;
  next_service_date?: string;
  performed_by?: string;
  vendor?: string;
  downtime_hours?: number;
  notes?: string;
}

export default function MaintenanceRecordForm({ onSuccess }: { onSuccess?: () => void }) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<MaintenanceRecordFormData>();
  const [selectedBus, setSelectedBus] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  
  const addRecord = useAddMaintenanceRecord();
  const { data: maintenanceTypes, isLoading: typesLoading } = useMaintenanceTypes();
  const { data: buses, isLoading: busesLoading } = useActiveBuses();
  const { data: staff, isLoading: staffLoading } = useMaintenanceStaff();

  const onSubmit = async (data: MaintenanceRecordFormData) => {
    try {
      await addRecord.mutateAsync({
        ...data,
        bus_id: selectedBus,
        type: selectedType,
        performed_by: selectedStaff || undefined,
        cost: data.cost ? Number(data.cost) : undefined,
        odometer_reading: data.odometer_reading ? Number(data.odometer_reading) : undefined,
        next_service_km: data.next_service_km ? Number(data.next_service_km) : undefined,
        downtime_hours: data.downtime_hours ? Number(data.downtime_hours) : undefined,
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Maintenance Record</CardTitle>
        <CardDescription>Record a new maintenance or service activity</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Bus Selection */}
          <div className="space-y-2">
            <Label htmlFor="bus_id">Bus *</Label>
            <Select value={selectedBus} onValueChange={setSelectedBus}>
              <SelectTrigger>
                <SelectValue placeholder="Select bus" />
              </SelectTrigger>
              <SelectContent>
                {busesLoading ? (
                  <SelectItem value="loading" disabled>Loading buses...</SelectItem>
                ) : (
                  buses?.map((bus) => (
                    <SelectItem key={bus.id} value={bus.id}>
                      {bus.registration_number} - {bus.make} {bus.model}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {!selectedBus && <p className="text-sm text-red-500">Bus is required</p>}
          </div>

          {/* Maintenance Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Maintenance Type *</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {typesLoading ? (
                  <SelectItem value="loading" disabled>Loading types...</SelectItem>
                ) : (
                  maintenanceTypes?.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ')}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {!selectedType && <p className="text-sm text-red-500">Type is required</p>}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Service Date *</Label>
            <Input
              id="date"
              type="date"
              {...register('date', { required: 'Date is required' })}
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register('description', { required: 'Description is required' })}
              placeholder="Brief description of the issue or service"
              rows={3}
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
          </div>

          {/* Work Performed */}
          <div className="space-y-2">
            <Label htmlFor="work_performed">Work Performed</Label>
            <Textarea
              id="work_performed"
              {...register('work_performed')}
              placeholder="Detailed work performed"
              rows={3}
            />
          </div>

          {/* Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost">Cost (P)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                {...register('cost')}
                placeholder="0.00"
              />
            </div>

            {/* Downtime Hours */}
            <div className="space-y-2">
              <Label htmlFor="downtime_hours">Downtime (hours)</Label>
              <Input
                id="downtime_hours"
                type="number"
                {...register('downtime_hours')}
                placeholder="0"
              />
            </div>
          </div>

          {/* Odometer Reading */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="odometer_reading">Current Odometer (km)</Label>
              <Input
                id="odometer_reading"
                type="number"
                {...register('odometer_reading')}
                placeholder="0"
              />
            </div>

            {/* Next Service KM */}
            <div className="space-y-2">
              <Label htmlFor="next_service_km">Next Service (km)</Label>
              <Input
                id="next_service_km"
                type="number"
                {...register('next_service_km')}
                placeholder="0"
              />
            </div>
          </div>

          {/* Next Service Date */}
          <div className="space-y-2">
            <Label htmlFor="next_service_date">Next Service Date</Label>
            <Input
              id="next_service_date"
              type="date"
              {...register('next_service_date')}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Performed By */}
          <div className="space-y-2">
            <Label htmlFor="performed_by">Performed By</Label>
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {staffLoading ? (
                  <SelectItem value="loading" disabled>Loading staff...</SelectItem>
                ) : (
                  staff?.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.full_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Vendor */}
          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor/Service Provider</Label>
            <Input
              id="vendor"
              {...register('vendor')}
              placeholder="e.g., Super Auto Services"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Any additional information"
              rows={2}
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={addRecord.isPending || !selectedBus || !selectedType}
              className="flex-1"
            >
              {addRecord.isPending ? 'Saving...' : 'Save Maintenance Record'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
