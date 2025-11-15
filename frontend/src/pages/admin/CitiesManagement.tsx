import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import OperationsLayout from '@/components/operations/OperationsLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { useCities, useAddCity, useUpdateCity, useDeleteCity } from '@/hooks/useCities';

export default function CitiesManagement() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isOperationsRoute = location.pathname.startsWith('/operations');
  const Layout = isOperationsRoute ? OperationsLayout : AdminLayout;
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [editCity, setEditCity] = useState<{ id: string; name: string } | null>(null);
  const [deleteCity, setDeleteCity] = useState<{ id: string; name: string } | null>(null);

  const { data: cities, isLoading } = useCities();
  const addCity = useAddCity();
  const updateCity = useUpdateCity();
  const deleteCityMutation = useDeleteCity();

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/');
    }
  }, [authLoading, isAdmin, navigate]);

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  const handleAddCity = async () => {
    if (!newCityName.trim()) return;
    await addCity.mutateAsync(newCityName);
    setNewCityName('');
    setAddDialogOpen(false);
  };

  const handleUpdateCity = async () => {
    if (!editCity || !editCity.name.trim()) return;
    await updateCity.mutateAsync({ id: editCity.id, name: editCity.name });
    setEditCity(null);
    setEditDialogOpen(false);
  };

  const handleDeleteCity = async () => {
    if (!deleteCity) return;
    await deleteCityMutation.mutateAsync(deleteCity.id);
    setDeleteCity(null);
    setDeleteDialogOpen(false);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Cities Management</h1>
            <p className="text-muted-foreground">Manage cities for routes and bookings</p>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add City
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Cities</CardTitle>
            <CardDescription>List of all cities in the system</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading cities...</div>
            ) : cities && cities.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>City Name</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cities.map((city) => (
                    <TableRow key={city.id}>
                      <TableCell className="font-medium">{city.name}</TableCell>
                      <TableCell>{new Date(city.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditCity({ id: city.id, name: city.name });
                              setEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setDeleteCity({ id: city.id, name: city.name });
                              setDeleteDialogOpen(true);
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
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No cities found. Add your first city to get started.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add City Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New City</DialogTitle>
              <DialogDescription>Enter the name of the city to add</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cityName">City Name</Label>
                <Input
                  id="cityName"
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  placeholder="e.g., Gaborone"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCity()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCity} disabled={!newCityName.trim() || addCity.isPending}>
                {addCity.isPending ? 'Adding...' : 'Add City'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit City Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit City</DialogTitle>
              <DialogDescription>Update the city name</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editCityName">City Name</Label>
                <Input
                  id="editCityName"
                  value={editCity?.name || ''}
                  onChange={(e) => setEditCity(editCity ? { ...editCity, name: e.target.value } : null)}
                  placeholder="e.g., Gaborone"
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdateCity()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateCity} disabled={!editCity?.name.trim() || updateCity.isPending}>
                {updateCity.isPending ? 'Updating...' : 'Update City'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete City Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete City</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deleteCity?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteCity} disabled={deleteCityMutation.isPending}>
                {deleteCityMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
