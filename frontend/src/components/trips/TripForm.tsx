import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Bus, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface TripFormProps {
  trip?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TripForm({ trip, onClose, onSuccess }: TripFormProps) {
  const queryClient = useQueryClient();

  // Fetch routes
  const { data: routes, isLoading: routesLoading } = useQuery({
    queryKey: ['routes-form'],
    queryFn: async () => {
      const { data, error } = await supabase.from('routes').select('*').order('origin');
      if (error) throw error;
      return data;
    },
  });

  // Fetch buses
  const { data: buses, isLoading: busesLoading } = useQuery({
    queryKey: ['buses-form'],
    queryFn: async () => {
      const { data, error } = await supabase.from('buses').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch drivers
  const { data: drivers } = useQuery({
    queryKey: ['drivers-form'],
    queryFn: async () => {
      const { data, error } = await supabase.from('drivers').select('*').eq('status', 'active');
      if (error) throw error;
      return data;
    },
  });

  // Schedule trip mutation
  const scheduleTripMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { error } = await supabase.from('schedules').insert([formData]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Trip scheduled successfully!');
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to schedule trip');
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    scheduleTripMutation.mutate({
      route_id: formData.get('route_id'),
      bus_id: formData.get('bus_id'),
      departure_date: formData.get('departure_date'),
      departure_time: formData.get('departure_time'),
      available_seats: parseInt(formData.get('available_seats') as string),
    });
  };

  if (routesLoading || busesLoading) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Loading form data...</p>
      </div>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{trip ? 'Edit Trip' : 'Schedule New Trip'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="route_id" className="flex items-center gap-2">
                <Bus className="h-4 w-4" />
                Route
              </Label>
              <select 
                id="route_id" 
                name="route_id" 
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Select a route</option>
                {routes?.map((route: any) => (
                  <option key={route.id} value={route.id}>
                    {route.origin} → {route.destination} ({route.distance}km, P{route.price})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bus_id">Bus</Label>
              <select 
                id="bus_id" 
                name="bus_id" 
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Select a bus</option>
                {buses?.map((bus: any) => (
                  <option key={bus.id} value={bus.id}>
                    {bus.name} - {bus.number_plate} (Capacity: {bus.seating_capacity})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departure_date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Departure Date
                </Label>
                <Input 
                  id="departure_date" 
                  name="departure_date" 
                  type="date" 
                  min={new Date().toISOString().split('T')[0]}
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="departure_time" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Departure Time
                </Label>
                <Input 
                  id="departure_time" 
                  name="departure_time" 
                  type="time" 
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="available_seats">Available Seats</Label>
              <Input 
                id="available_seats" 
                name="available_seats" 
                type="number" 
                min="1"
                placeholder="e.g., 40" 
                required 
              />
              <p className="text-xs text-muted-foreground">
                Enter the number of seats available for booking
              </p>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={scheduleTripMutation.isPending}>
              {scheduleTripMutation.isPending ? 'Scheduling...' : 'Schedule Trip'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
