import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface TripFormProps {
  trip?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TripForm({ trip, onClose, onSuccess }: TripFormProps) {
  const [formData, setFormData] = useState({
    route_id: trip?.route_id || '',
    bus_id: trip?.bus_id || '',
    driver_id: trip?.driver_id || '',
    scheduled_departure: trip?.scheduled_departure || '',
    scheduled_arrival: trip?.scheduled_arrival || '',
    fare: trip?.fare || '',
    status: trip?.status || 'scheduled',
  });

  // Fetch routes
  const { data: routes, isLoading: routesLoading } = useQuery({
    queryKey: ['routes-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('is_active', true)
        .order('origin');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch buses
  const { data: buses, isLoading: busesLoading } = useQuery({
    queryKey: ['buses-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buses')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('name');
      if (error) {
        console.error('Error fetching buses:', error);
        throw error;
      }
      return data || [];
    },
  });

  // Fetch drivers
  const { data: drivers, isLoading: driversLoading } = useQuery({
    queryKey: ['drivers-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('full_name');
      if (error) {
        console.error('Error fetching drivers:', error);
        throw error;
      }
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        fare: data.fare ? parseFloat(data.fare) : null,
      };

      if (trip) {
        const { error } = await supabase
          .from('trips')
          .update(payload)
          .eq('id', trip.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('trips')
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(trip ? 'Trip updated successfully' : 'Trip scheduled successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save trip');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isLoading = routesLoading || busesLoading || driversLoading;

  if (isLoading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent>
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Loading form data...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{trip ? 'Edit Trip' : 'Schedule New Trip'}</DialogTitle>
          <DialogDescription>
            {trip ? 'Update trip information' : 'Schedule a new trip for your fleet'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="route_id">Route *</Label>
              <Select 
                value={formData.route_id} 
                onValueChange={(value) => handleChange('route_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent>
                  {routes?.map((route: any) => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.origin} → {route.destination}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bus_id">Bus *</Label>
              <Select 
                value={formData.bus_id} 
                onValueChange={(value) => handleChange('bus_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bus" />
                </SelectTrigger>
                <SelectContent>
                  {buses?.map((bus: any) => (
                    <SelectItem key={bus.id} value={bus.id}>
                      {bus.name || bus.number_plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="driver_id">Driver</Label>
              <Select 
                value={formData.driver_id} 
                onValueChange={(value) => handleChange('driver_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers?.map((driver: any) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_departure">Scheduled Departure *</Label>
              <Input
                id="scheduled_departure"
                type="datetime-local"
                value={formData.scheduled_departure}
                onChange={(e) => handleChange('scheduled_departure', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_arrival">Scheduled Arrival</Label>
              <Input
                id="scheduled_arrival"
                type="datetime-local"
                value={formData.scheduled_arrival}
                onChange={(e) => handleChange('scheduled_arrival', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fare">Fare</Label>
              <Input
                id="fare"
                type="number"
                step="0.01"
                value={formData.fare}
                onChange={(e) => handleChange('fare', e.target.value)}
                placeholder="e.g., 150.00"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : trip ? 'Update Trip' : 'Schedule Trip'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
