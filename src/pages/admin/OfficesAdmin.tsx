import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function AdminBookingOffices() {
  const [offices, setOffices] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({
    name: "",
    location: "",
    operating_hours: "",
    contact_number: "",
  });
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase.from("booking_offices").select("*").order("name");
    setOffices(data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await supabase.from("booking_offices").update(form).eq("id", editing.id);
        toast({ title: "Office updated successfully" });
      } else {
        await supabase.from("booking_offices").insert(form);
        toast({ title: "Office created successfully" });
      }
      setEditing(null);
      setForm({ name: "", location: "", operating_hours: "", contact_number: "" });
      load();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const onEdit = (o: any) => {
    setEditing(o);
    setForm({
      name: o.name,
      location: o.location,
      operating_hours: o.operating_hours,
      contact_number: o.contact_number,
    });
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this office?")) return;
    await supabase.from("booking_offices").delete().eq("id", id);
    toast({ title: "Office deleted successfully" });
    load();
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
              setForm({ name: "", location: "", operating_hours: "", contact_number: "" });
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
              value={form.operating_hours}
              onChange={(e) => setForm({ ...form, operating_hours: e.target.value })}
              required
            />
            <Input
              placeholder="Contact Number"
              value={form.contact_number}
              onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
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
                  {o.location} • {o.operating_hours} • {o.contact_number}
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
