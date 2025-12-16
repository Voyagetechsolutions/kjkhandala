import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, MapPin, Clock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface RouteStopsManagerProps {
  routeId: string;
  routeName: string;
}

export default function RouteStopsManager({ routeId, routeName }: RouteStopsManagerProps) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingStop, setEditingStop] = useState<any>(null);
  const [formData, setFormData] = useState({
    city_name: '',
    stop_order: 1,
    arrival_offset_minutes: 0,
    departure_offset_minutes: 0,
  });

  // Fetch route stops
  const { data: stops = [], isLoading } = useQuery({
    queryKey: ['route-stops', routeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('route_stops')
        .select('*')
        .eq('route_id', routeId)
        .order('stop_order');
      
      if (error) {
        console.error('Error fetching stops:', error);
        return [];
      }
      return data || [];
    },
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const stopData = {
        ...data,
        route_id: routeId,
      };

      if (editingStop) {
        const { error } = await supabase
          .from('route_stops')
          .update(stopData)
          .eq('id', editingStop.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('route_stops')
          .insert([stopData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route-stops', routeId] });
      toast.success(editingStop ? 'Stop updated' : 'Stop added');
      handleCloseDialog();
    },
    onError: (error: any) => {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save stop');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('route_stops')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route-stops', routeId] });
      toast.success('Stop deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete stop');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleEdit = (stop: any) => {
    setEditingStop(stop);
    setFormData({
      city_name: stop.city_name,
      stop_order: stop.stop_order,
      arrival_offset_minutes: stop.arrival_offset_minutes,
      departure_offset_minutes: stop.departure_offset_minutes,
    });
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingStop(null);
    setFormData({
      city_name: '',
      stop_order: stops.length + 1,
      arrival_offset_minutes: 0,
      departure_offset_minutes: 0,
    });
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Via Route Stops</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {routeName} - Add intermediate stops for this route
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingStop(null);
              setFormData({
                city_name: '',
                stop_order: stops.length + 1,
                arrival_offset_minutes: 0,
                departure_offset_minutes: 0,
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Stop
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingStop ? 'Edit Stop' : 'Add Via Stop'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Stop Order</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.stop_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, stop_order: parseInt(e.target.value) }))}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Order of this stop in the route (1 = first stop)
                </p>
              </div>

              <div className="space-y-2">
                <Label>City Name *</Label>
                <Input
                  value={formData.city_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, city_name: e.target.value }))}
                  placeholder="e.g., Palapye"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Arrival Time (minutes from start)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.arrival_offset_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, arrival_offset_minutes: parseInt(e.target.value) }))}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Example: 180 = 3 hours after departure
                </p>
              </div>

              <div className="space-y-2">
                <Label>Departure Time (minutes from start)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.departure_offset_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, departure_offset_minutes: parseInt(e.target.value) }))}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Example: 195 = 3 hours 15 minutes after departure (15 min stop)
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : editingStop ? 'Update' : 'Add'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading stops...</div>
        ) : stops.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Route with {stops.length} intermediate stop{stops.length !== 1 ? 's' : ''}</span>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Arrival</TableHead>
                  <TableHead>Departure</TableHead>
                  <TableHead>Stop Duration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stops.map((stop: any) => (
                  <TableRow key={stop.id}>
                    <TableCell>
                      <Badge variant="outline">{stop.stop_order}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{stop.city_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">+{formatTime(stop.arrival_offset_minutes)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">+{formatTime(stop.departure_offset_minutes)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {stop.departure_offset_minutes - stop.arrival_offset_minutes} min
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(stop)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm('Delete this stop?')) {
                              deleteMutation.mutate(stop.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No via stops configured</p>
            <p className="text-sm">Add intermediate stops for this route</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
