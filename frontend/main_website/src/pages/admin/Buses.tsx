import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
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
  registration_number: string;
  model: string;
  capacity: number;
  status: string;
  year_of_manufacture?: number;
  last_service_date?: string;
  next_service_date?: string;
  mileage: number;
}

export default function AdminBuses() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [formData, setFormData] = useState({
    registration_number: "",
    model: "",
    capacity: "",
    year_of_manufacture: "",
    status: "ACTIVE",
  });

  const { data: busesData, isLoading } = useQuery({
    queryKey: ['buses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buses')
        .select('*')
        .order('registration_number');
      if (error) throw error;
      return { buses: data || [] };
    },
  });

  const createBusMutation = useMutation({
    mutationFn: async (newBus: any) => {
      const { data, error } = await supabase
        .from('buses')
        .insert([newBus])
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      toast.success('Bus created successfully');
      setDialogOpen(false);
      setEditingBus(null);
      setFormData({ registration_number: "", model: "", capacity: "", year_of_manufacture: "", status: "ACTIVE" });
    },
    onError: (error: any) => {
      toast.error('Failed to create bus');
    },
  });

  const updateBusMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { data: result, error } = await supabase
        .from('buses')
        .update(data)
        .eq('id', id)
        .select();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      toast.success('Bus updated successfully');
      setDialogOpen(false);
      setEditingBus(null);
      setFormData({ registration_number: "", model: "", capacity: "", year_of_manufacture: "", status: "ACTIVE" });
    },
    onError: (error: any) => {
      toast.error('Failed to update bus');
    },
  });

  const deleteBusMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('buses')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      toast.success('Bus deleted successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to delete bus');
    },
  });

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/");
      return;
    }
  }, [user, isAdmin, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const busData = {
      registration_number: formData.registration_number,
      model: formData.model,
      capacity: parseInt(formData.capacity || "60", 10),
      year_of_manufacture: formData.year_of_manufacture ? parseInt(formData.year_of_manufacture) : null,
      status: formData.status,
      mileage: 0,
    };

    if (editingBus) {
      updateBusMutation.mutate({ id: editingBus.id, data: busData });
    } else {
      createBusMutation.mutate(busData);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bus?")) return;
    deleteBusMutation.mutate(id);
  };

  const openEditDialog = (bus: Bus) => {
    setEditingBus(bus);
    setFormData({
      registration_number: bus.registration_number,
      model: bus.model,
      capacity: bus.capacity.toString(),
      year_of_manufacture: bus.year_of_manufacture?.toString() || "",
      status: bus.status,
    });
    setDialogOpen(true);
  };

  const buses = busesData?.buses || [];

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
                setFormData({ registration_number: "", model: "", capacity: "", year_of_manufacture: "", status: "ACTIVE" });
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
                  <Label htmlFor="registration_number">Registration Number</Label>
                  <Input
                    id="registration_number"
                    value={formData.registration_number}
                    onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
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
                  <Label htmlFor="year_of_manufacture">Year of Manufacture</Label>
                  <Input
                    id="year_of_manufacture"
                    type="number"
                    min={1990}
                    max={new Date().getFullYear()}
                    value={formData.year_of_manufacture}
                    onChange={(e) => setFormData({ ...formData, year_of_manufacture: e.target.value })}
                    placeholder="e.g., 2020"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createBusMutation.isPending || updateBusMutation.isPending}
                >
                  {createBusMutation.isPending || updateBusMutation.isPending 
                    ? 'Saving...' 
                    : editingBus ? "Update Bus" : "Create Bus"
                  }
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading buses...</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {buses.map((bus) => (
              <Card key={bus.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{bus.registration_number}</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Model: {bus.model}</p>
                      <p>Capacity: {bus.capacity} seats</p>
                      <p>Status: <span className={bus.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}>{bus.status}</span></p>
                      {bus.year_of_manufacture && <p>Year: {bus.year_of_manufacture}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(bus)}
                      disabled={updateBusMutation.isPending}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(bus.id)}
                      disabled={deleteBusMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
