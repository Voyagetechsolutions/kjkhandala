import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Fuel, Plus, Edit, MapPin, Phone, Mail } from 'lucide-react';

export default function FuelStations() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingStation, setEditingStation] = useState<any>(null);

  // Fetch fuel stations
  const { data: fuelStations = [], isLoading } = useQuery({
    queryKey: ['fuel-stations-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_stations')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  // Add/Update fuel station mutation
  const saveFuelStationMutation = useMutation({
    mutationFn: async (formData: any) => {
      if (editingStation) {
        // Update existing station
        const { data, error } = await supabase
          .from('fuel_stations')
          .update(formData)
          .eq('id', editingStation.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        // Create new station
        const { data, error } = await supabase
          .from('fuel_stations')
          .insert([formData])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-stations-admin'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-stations'] });
      toast.success(editingStation ? 'Fuel station updated!' : 'Fuel station added!');
      setShowDialog(false);
      setEditingStation(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save fuel station');
    },
  });

  // Toggle station status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('fuel_stations')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-stations-admin'] });
      toast.success('Station status updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update status');
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const stationData = {
      name: formData.get('name') as string,
      location: formData.get('location') as string,
      contact_person: formData.get('contact_person') as string,
      contact_phone: formData.get('contact_phone') as string,
      contact_email: formData.get('contact_email') as string,
      is_active: true,
    };

    saveFuelStationMutation.mutate(stationData);
  };

  const handleEdit = (station: any) => {
    setEditingStation(station);
    setShowDialog(true);
  };

  const handleAdd = () => {
    setEditingStation(null);
    setShowDialog(false);
    setTimeout(() => setShowDialog(true), 0);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Fuel className="h-8 w-8" />
              Fuel Stations Management
            </h1>
            <p className="text-muted-foreground">Manage approved fuel stations for drivers</p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Fuel Station
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Stations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{fuelStations.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active Stations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {fuelStations.filter((s: any) => s.is_active).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Inactive Stations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-400">
                {fuelStations.filter((s: any) => !s.is_active).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fuel Stations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Fuel Stations</CardTitle>
            <CardDescription>Manage and monitor approved fuel stations</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : fuelStations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Fuel className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No fuel stations yet. Add your first station!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Station Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fuelStations.map((station: any) => (
                    <TableRow key={station.id}>
                      <TableCell className="font-medium">{station.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {station.location}
                        </div>
                      </TableCell>
                      <TableCell>{station.contact_person || '-'}</TableCell>
                      <TableCell>
                        {station.contact_phone ? (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {station.contact_phone}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {station.contact_email ? (
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {station.contact_email}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={station.is_active}
                            onCheckedChange={(checked) =>
                              toggleStatusMutation.mutate({ id: station.id, is_active: checked })
                            }
                          />
                          <Badge variant={station.is_active ? 'default' : 'secondary'}>
                            {station.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(station)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingStation ? 'Edit Fuel Station' : 'Add Fuel Station'}</DialogTitle>
            <DialogDescription>
              {editingStation ? 'Update fuel station details' : 'Add a new approved fuel station'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="name">Station Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Shell Gaborone Main"
                  defaultValue={editingStation?.name}
                  required
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="e.g., Main Mall, Gaborone"
                  defaultValue={editingStation?.location}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  name="contact_person"
                  placeholder="John Doe"
                  defaultValue={editingStation?.contact_person}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  name="contact_phone"
                  type="tel"
                  placeholder="+267 1234 5678"
                  defaultValue={editingStation?.contact_phone}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  name="contact_email"
                  type="email"
                  placeholder="station@example.com"
                  defaultValue={editingStation?.contact_email}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveFuelStationMutation.isPending}>
                {saveFuelStationMutation.isPending ? 'Saving...' : editingStation ? 'Update Station' : 'Add Station'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
