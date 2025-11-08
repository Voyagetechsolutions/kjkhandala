import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface RouteFormProps {
  route?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RouteForm({ route, onClose, onSuccess }: RouteFormProps) {
  const [formData, setFormData] = useState({
    origin: route?.origin || '',
    destination: route?.destination || '',
    distance_km: route?.distance_km || '',
    duration_hours: route?.duration_hours || '',
    price: route?.price || '',
    route_type: route?.route_type || 'local',
    description: route?.description || '',
    active: route?.active ?? true,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const routeData = {
        ...data,
        distance_km: data.distance_km ? parseFloat(data.distance_km) : null,
        duration_hours: parseFloat(data.duration_hours),
        price: parseFloat(data.price),
      };

      if (route) {
        const { error } = await supabase
          .from('routes')
          .update(routeData)
          .eq('id', route.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('routes')
          .insert([routeData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(route ? 'Route updated successfully' : 'Route created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save route');
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{route ? 'Edit Route' : 'Add New Route'}</DialogTitle>
          <DialogDescription>
            {route ? 'Update route information' : 'Create a new route for your fleet'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origin">Origin *</Label>
              <Input
                id="origin"
                value={formData.origin}
                onChange={(e) => handleChange('origin', e.target.value)}
                placeholder="e.g., Gaborone"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">Destination *</Label>
              <Input
                id="destination"
                value={formData.destination}
                onChange={(e) => handleChange('destination', e.target.value)}
                placeholder="e.g., Francistown"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="distance_km">Distance (km)</Label>
              <Input
                id="distance_km"
                type="number"
                step="0.1"
                value={formData.distance_km}
                onChange={(e) => handleChange('distance_km', e.target.value)}
                placeholder="e.g., 450"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_hours">Duration (hours) *</Label>
              <Input
                id="duration_hours"
                type="number"
                step="0.5"
                value={formData.duration_hours}
                onChange={(e) => handleChange('duration_hours', e.target.value)}
                placeholder="e.g., 5.5"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Fare (P) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                placeholder="e.g., 150.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="route_type">Route Type *</Label>
              <Select value={formData.route_type} onValueChange={(value) => handleChange('route_type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local Route</SelectItem>
                  <SelectItem value="cross_border">Cross-Border Route</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description / Notes</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Additional route information..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="active" className="text-base">Active Status</Label>
              <p className="text-sm text-muted-foreground">Enable this route for scheduling</p>
            </div>
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => handleChange('active', checked)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : route ? 'Update Route' : 'Create Route'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
