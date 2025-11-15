import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Route {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distance: number;
  duration: number;
  isActive: boolean;
}

export default function AdminRoutes() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    origin: "",
    destination: "",
    distance: "",
    duration: "",
  });

  const fetchRoutes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .order('name');
      if (error) throw error;
      setRoutes(data || []);
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error.response?.data?.error || "Failed to fetch routes" 
      });
    }
  }, [toast]);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/");
      return;
    }
    if (isAdmin) {
      fetchRoutes();
    }
  }, [user, isAdmin, loading, navigate, fetchRoutes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const routeData = {
      name: formData.name,
      origin: formData.origin,
      destination: formData.destination,
      distance: parseFloat(formData.distance),
      duration: parseInt(formData.duration),
    };

    try {
      if (editingRoute) {
        const { error } = await supabase
          .from('routes')
          .update(routeData)
          .eq('id', editingRoute.id);
        if (error) throw error;
        toast({ title: "Route updated successfully" });
      } else {
        const { error } = await supabase
          .from('routes')
          .insert([routeData]);
        if (error) throw error;
        toast({ title: "Route created successfully" });
      }

      // Refresh the routes data
      window.location.reload(); // Simple refresh for now
      setDialogOpen(false);
      setEditingRoute(null);
      setFormData({ name: "", origin: "", destination: "", distance: "", duration: "" });
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error.response?.data?.error || "Failed to save route" 
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this route?")) return;

    try {
      const { error } = await supabase
        .from('routes')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: "Route deleted successfully" });
      fetchRoutes();
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error.response?.data?.error || "Failed to delete route" 
      });
    }
  };

  const openEditDialog = (route: Route) => {
    setEditingRoute(route);
    setFormData({
      name: route.name,
      origin: route.origin,
      destination: route.destination,
      distance: route.distance.toString(),
      duration: route.duration.toString(),
    });
    setDialogOpen(true);
  };

  if (loading) return <div>Loading...</div>;
  if (!isAdmin) return null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Routes Management</h1>
            <p className="text-muted-foreground">Manage your bus routes</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingRoute(null);
                setFormData({ name: "", origin: "", destination: "", distance: "", duration: "" });
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Route
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingRoute ? "Edit Route" : "Add New Route"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Route Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Gaborone - Francistown"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="origin">Origin</Label>
                  <Input
                    id="origin"
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    placeholder="e.g., Gaborone"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    placeholder="e.g., Francistown"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="distance">Distance (km)</Label>
                  <Input
                    id="distance"
                    type="number"
                    step="0.1"
                    value={formData.distance || ''}
                    onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration || ''}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingRoute ? "Update Route" : "Create Route"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {routes.map((route) => (
            <Card key={route.id} className="p-6">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">
                    {route.name}
                  </h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>{route.origin} → {route.destination}</p>
                    <p>Distance: {route.distance}km • Duration: {Math.floor(route.duration / 60)}h {route.duration % 60}m</p>
                    <p>Status: <span className={route.isActive ? 'text-green-600' : 'text-red-600'}>{route.isActive ? 'Active' : 'Inactive'}</span></p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(route)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(route.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
