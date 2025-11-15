import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bus, Calendar, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface AssignBusModalProps {
  driver: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function AssignBusModal({ driver, isOpen, onClose }: AssignBusModalProps) {
  const [selectedTrip, setSelectedTrip] = useState('');
  const queryClient = useQueryClient();

  const { data: availableTrips, isLoading } = useQuery({
    queryKey: ['available-trips-for-assignment'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          route:routes(origin, destination),
          bus:buses(bus_number)
        `)
        .gte('scheduled_departure', today)
        .in('status', ['SCHEDULED', 'BOARDING'])
        .is('driver_id', null)
        .order('scheduled_departure');

      if (error) throw error;
      return data || [];
    },
    enabled: isOpen,
  });

  const assignDriverMutation = useMutation({
    mutationFn: async (tripId: string) => {
      const { error } = await supabase
        .from('trips')
        .update({ driver_id: driver.id })
        .eq('id', tripId);

      if (error) throw error;

      const { error: driverError } = await supabase
        .from('drivers')
        .update({ status: 'active' })
        .eq('id', driver.id);

      if (driverError) throw driverError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-management'] });
      queryClient.invalidateQueries({ queryKey: ['available-trips-for-assignment'] });
      toast.success(`Driver ${driver.full_name} assigned successfully`);
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign driver');
    },
  });

  const handleAssign = () => {
    if (!selectedTrip) {
      toast.error('Please select a trip');
      return;
    }
    assignDriverMutation.mutate(selectedTrip);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bus className="h-5 w-5" />
            Assign Bus to {driver.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Trip</Label>
            <Select value={selectedTrip} onValueChange={setSelectedTrip}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an available trip" />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Loading available trips...
                  </div>
                ) : availableTrips && availableTrips.length > 0 ? (
                  availableTrips.map((trip: any) => {
                    const route = Array.isArray(trip.route) ? trip.route[0] : trip.route;
                    const bus = Array.isArray(trip.bus) ? trip.bus[0] : trip.bus;
                    
                    return (
                      <SelectItem key={trip.id} value={trip.id}>
                        <div className="flex items-center gap-2">
                          <Bus className="h-4 w-4" />
                          <span className="font-medium">{bus?.bus_number}</span>
                          <span className="text-muted-foreground">•</span>
                          <span>{route?.origin} → {route?.destination}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm">
                            {format(new Date(trip.scheduled_departure), 'MMM dd, HH:mm')}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No available trips found
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedTrip && availableTrips && (
            <div className="p-4 border rounded-lg bg-muted/50">
              {(() => {
                const trip = availableTrips.find((t: any) => t.id === selectedTrip);
                if (!trip) return null;
                
                const route = Array.isArray(trip.route) ? trip.route[0] : trip.route;
                const bus = Array.isArray(trip.bus) ? trip.bus[0] : trip.bus;

                return (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Trip Details</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Bus</p>
                        <p className="font-medium flex items-center gap-1">
                          <Bus className="h-3 w-3" />
                          {bus?.bus_number}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Route</p>
                        <p className="font-medium flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {route?.origin} → {route?.destination}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Departure</p>
                        <p className="font-medium flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(trip.scheduled_departure), 'PPp')}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <p className="font-medium">{trip.status}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Assigning this driver will automatically set their status to "On Duty" 
              and link them to the selected trip.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign}
            disabled={!selectedTrip || assignDriverMutation.isPending}
          >
            {assignDriverMutation.isPending ? 'Assigning...' : 'Assign Driver'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
