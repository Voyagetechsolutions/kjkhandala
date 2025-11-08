import { useEffect, useState } from "react";
import api from "@/lib/api";
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
  registrationNumber: string;
  model: string;
  capacity: number;
  status: string;
  yearOfManufacture?: number;
  lastServiceDate?: string;
  nextServiceDate?: string;
  mileage: number;
}

export default function AdminBuses() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [formData, setFormData] = useState({
    registrationNumber: "",
    model: "",
    capacity: "",
    yearOfManufacture: "",
    status: "ACTIVE",
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
    try {
      const response = await api.get('/buses');
      setBuses(response.data.data || []);
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error.response?.data?.error || "Failed to fetch buses" 
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const busData = {
      registrationNumber: formData.registrationNumber,
      model: formData.model,
      capacity: parseInt(formData.capacity || "60", 10),
      yearOfManufacture: formData.yearOfManufacture ? parseInt(formData.yearOfManufacture) : undefined,
      status: formData.status,
      mileage: 0,
    };

    try {
      if (editingBus) {
        await api.put(`/buses/${editingBus.id}`, busData);
        toast({ title: "Bus updated successfully" });
      } else {
        await api.post('/buses', busData);
        toast({ title: "Bus created successfully" });
    }

      fetchBuses();
      setDialogOpen(false);
      setEditingBus(null);
      setFormData({ registrationNumber: "", model: "", capacity: "", yearOfManufacture: "", status: "ACTIVE" });
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error.response?.data?.error || "Failed to save bus" 
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bus?")) return;

    try {
      await api.delete(`/buses/${id}`);
      toast({ title: "Bus deleted successfully" });
      fetchBuses();
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error.response?.data?.error || "Failed to delete bus" 
      });
    }
  };

  const openEditDialog = (bus: Bus) => {
    setEditingBus(bus);
    setFormData({
      registrationNumber: bus.registrationNumber,
      model: bus.model,
      capacity: bus.capacity.toString(),
      yearOfManufacture: bus.yearOfManufacture?.toString() || "",
      status: bus.status,
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
                setFormData({ registrationNumber: "", model: "", capacity: "", yearOfManufacture: "", status: "ACTIVE" });
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
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Input
                    id="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    placeholder="e.g., ABC-123-GP"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Bus Model</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="e.g., Mercedes-Benz Sprinter"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Seating Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min={10}
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearOfManufacture">Year of Manufacture</Label>
                  <Input
                    id="yearOfManufacture"
                    type="number"
                    min={1990}
                    max={new Date().getFullYear()}
                    value={formData.yearOfManufacture}
                    onChange={(e) => setFormData({ ...formData, yearOfManufacture: e.target.value })}
                    placeholder="e.g., 2020"
                  />
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
                  <h3 className="text-lg font-semibold mb-2">{bus.registrationNumber}</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Model: {bus.model}</p>
                    <p>Capacity: {bus.capacity} seats</p>
                    <p>Status: <span className={bus.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}>{bus.status}</span></p>
                    {bus.yearOfManufacture && <p>Year: {bus.yearOfManufacture}</p>}
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
