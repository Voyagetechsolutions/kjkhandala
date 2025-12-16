import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from '@/lib/supabase';
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AdminBookingOffices() {
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({
    name: "",
    location: "",
    operatingHours: "",
    contactNumber: "",
  });
  const queryClient = useQueryClient();

  const { data: offices = [] } = useQuery({
    queryKey: ['booking-offices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('booking_offices')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('booking_offices')
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Office created successfully');
      queryClient.invalidateQueries({ queryKey: ['booking-offices'] });
      setForm({ name: "", location: "", operatingHours: "", contactNumber: "" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('booking_offices')
        .update(data)
        .eq('id', editing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Office updated successfully');
      queryClient.invalidateQueries({ queryKey: ['booking-offices'] });
      setEditing(null);
      setForm({ name: "", location: "", operatingHours: "", contactNumber: "" });
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        updateMutation.mutate(form);
      } else {
        createMutation.mutate(form);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error saving office');
    }
  };

  const onEdit = (o: any) => {
    setEditing(o);
    setForm({
      name: o.name,
      location: o.location,
      operatingHours: o.operatingHours || o.operating_hours || '',
      contactNumber: o.contactNumber || o.contact_number || '',
    });
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('booking_offices')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Office deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['booking-offices'] });
    },
  });

  const onDelete = async (id: string) => {
    if (!confirm("Delete this office?")) return;
    deleteMutation.mutate(id);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Booking Offices</h1>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setForm({ name: "", location: "", operatingHours: "", contactNumber: "" });
            }}
          >
            Add Office
          </Button>
        </div>

        <Card className="p-4">
          <form onSubmit={submit} className="grid gap-3">
            <Input
              placeholder="Office Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              placeholder="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              required
            />
            <Input
              placeholder="Operating Hours (e.g., Mon-Fri 8am-5pm)"
              value={form.operatingHours}
              onChange={(e) => setForm({ ...form, operatingHours: e.target.value })}
              required
            />
            <Input
              placeholder="Contact Number"
              value={form.contactNumber}
              onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
              required
            />
            <Button type="submit">{editing ? "Update" : "Create"}</Button>
          </form>
        </Card>

        <div className="grid gap-3">
          {offices.map((o) => (
            <Card key={o.id} className="p-4 flex justify-between items-center">
              <div>
                <div className="font-medium">{o.name}</div>
                <div className="text-sm text-muted-foreground">
                  {o.location} • {o.operatingHours || o.operating_hours} • {o.contactNumber || o.contact_number}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onEdit(o)}>
                  Edit
                </Button>
                <Button variant="destructive" onClick={() => onDelete(o.id)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
