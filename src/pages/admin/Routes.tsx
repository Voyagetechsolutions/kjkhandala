import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  origin: string;
  destination: string;
  price: number;
  duration_hours: number;
  active: boolean;
}

export default function AdminRoutes() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    price: "",
    duration_hours: "",
  });

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/");
      return;
    }
    
    if (isAdmin) {
      fetchRoutes();
    }
  }, [user, isAdmin, loading]);

  const fetchRoutes = async () => {
    const { data, error } = await supabase
      .from("routes")
      .select("*")
      .order("origin");

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }

    setRoutes(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const routeData = {
      origin: formData.origin,
      destination: formData.destination,
      price: parseFloat(formData.price),
      duration_hours: parseFloat(formData.duration_hours),
      active: true,
    };

    if (editingRoute) {
      const { error } = await supabase
        .from("routes")
        .update(routeData)
        .eq("id", editingRoute.id);

      if (error) {
        toast({ variant: "destructive", title: "Error", description: error.message });
        return;
      }

      toast({ title: "Route updated successfully" });
    } else {
      const { error } = await supabase.from("routes").insert(routeData);

      if (error) {
        toast({ variant: "destructive", title: "Error", description: error.message });
        return;
      }

      toast({ title: "Route created successfully" });
    }

    setDialogOpen(false);
    setEditingRoute(null);
    setFormData({ origin: "", destination: "", price: "", duration_hours: "" });
    fetchRoutes();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this route?")) return;

    const { error } = await supabase.from("routes").delete().eq("id", id);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }

    toast({ title: "Route deleted successfully" });
    fetchRoutes();
  };

  const openEditDialog = (route: Route) => {
    setEditingRoute(route);
    setFormData({
      origin: route.origin,
      destination: route.destination,
      price: route.price.toString(),
      duration_hours: route.duration_hours.toString(),
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
                setFormData({ origin: "", destination: "", price: "", duration_hours: "" });
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
                  <Label htmlFor="origin">Origin</Label>
                  <Input
                    id="origin"
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (BWP)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (hours)</Label>
                  <Input
                    id="duration"
                    type="number"
                    step="0.5"
                    value={formData.duration_hours}
                    onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
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
                    {route.origin} → {route.destination}
                  </h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Price: P{route.price}</p>
                    <p>Duration: {route.duration_hours} hours</p>
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