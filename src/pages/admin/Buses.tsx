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

interface Bus {
  id: string;
  name: string;
  number_plate: string;
  seating_capacity: number;
  layout_rows: number;
  layout_columns: number;
}

export default function AdminBuses() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    number_plate: "",
    seating_capacity: "",
    layout_rows: "10",
    layout_columns: "4",
  });

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/");
      return;
    }
    
    if (isAdmin) {
      fetchBuses();
    }
  }, [user, isAdmin, loading]);

  const fetchBuses = async () => {
    const { data, error } = await supabase
      .from("buses")
      .select("*")
      .order("name");

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }

    setBuses(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const busData = {
      name: formData.name,
      number_plate: formData.number_plate,
      seating_capacity: parseInt(formData.seating_capacity),
      layout_rows: parseInt(formData.layout_rows),
      layout_columns: parseInt(formData.layout_columns),
    };

    if (editingBus) {
      const { error } = await supabase
        .from("buses")
        .update(busData)
        .eq("id", editingBus.id);

      if (error) {
        toast({ variant: "destructive", title: "Error", description: error.message });
        return;
      }

      toast({ title: "Bus updated successfully" });
    } else {
      const { error } = await supabase.from("buses").insert(busData);

      if (error) {
        toast({ variant: "destructive", title: "Error", description: error.message });
        return;
      }

      toast({ title: "Bus created successfully" });
    }

    setDialogOpen(false);
    setEditingBus(null);
    setFormData({ name: "", number_plate: "", seating_capacity: "", layout_rows: "10", layout_columns: "4" });
    fetchBuses();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bus?")) return;

    const { error } = await supabase.from("buses").delete().eq("id", id);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }

    toast({ title: "Bus deleted successfully" });
    fetchBuses();
  };

  const openEditDialog = (bus: Bus) => {
    setEditingBus(bus);
    setFormData({
      name: bus.name,
      number_plate: bus.number_plate,
      seating_capacity: bus.seating_capacity.toString(),
      layout_rows: bus.layout_rows.toString(),
      layout_columns: bus.layout_columns.toString(),
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
            <h1 className="text-3xl font-bold">Bus Management</h1>
            <p className="text-muted-foreground">Manage your bus fleet</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingBus(null);
                setFormData({ name: "", number_plate: "", seating_capacity: "", layout_rows: "10", layout_columns: "4" });
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Bus
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingBus ? "Edit Bus" : "Add New Bus"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Bus Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number_plate">Number Plate</Label>
                  <Input
                    id="number_plate"
                    value={formData.number_plate}
                    onChange={(e) => setFormData({ ...formData, number_plate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Seating Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.seating_capacity}
                    onChange={(e) => setFormData({ ...formData, seating_capacity: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rows">Layout Rows</Label>
                    <Input
                      id="rows"
                      type="number"
                      value={formData.layout_rows}
                      onChange={(e) => setFormData({ ...formData, layout_rows: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="columns">Layout Columns</Label>
                    <Input
                      id="columns"
                      type="number"
                      value={formData.layout_columns}
                      onChange={(e) => setFormData({ ...formData, layout_columns: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  {editingBus ? "Update Bus" : "Create Bus"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {buses.map((bus) => (
            <Card key={bus.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{bus.name}</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Number Plate: {bus.number_plate}</p>
                    <p>Capacity: {bus.seating_capacity} seats</p>
                    <p>Layout: {bus.layout_rows}x{bus.layout_columns}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(bus)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(bus.id)}
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