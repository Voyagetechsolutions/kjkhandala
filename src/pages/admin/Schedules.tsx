import { useEffect, useState } from "react";
import {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "@/integrations/lovable/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AdminSchedules() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({
    route_id: "",
    bus_id: "",
    departure_date: "",
    departure_time: "",
    available_seats: "60",
  });

  const load = async () => {
    const data = await getSchedules();
    setSchedules(Array.isArray(data) ? data : []);
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      available_seats: Math.max(60, Number(form.available_seats || 60)),
    };
    if (editing) {
      await updateSchedule(editing.id, payload);
    } else {
      await createSchedule(payload);
    }
    setEditing(null);
    setForm({ route_id: "", bus_id: "", departure_date: "", departure_time: "", available_seats: "60" });
    load();
  };

  const onEdit = (s: any) => {
    setEditing(s);
    setForm({
      route_id: s.route_id,
      bus_id: s.bus_id,
      departure_date: s.departure_date?.slice(0,10) ?? "",
      departure_time: s.departure_time ?? "",
      available_seats: String(s.available_seats ?? 60),
    });
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete schedule?")) return;
    await deleteSchedule(id);
    load();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Schedules</h1>
          </div>
          <Button onClick={() => { setEditing(null); setForm({ route_id: "", bus_id: "", departure_date: "", departure_time: "", available_seats: "60" }); }}>Add</Button>
        </div>

        <Card className="p-4">
          <form onSubmit={submit} className="grid gap-3 grid-cols-1 md:grid-cols-4">
            <Input placeholder="Route ID" value={form.route_id} onChange={e => setForm({...form, route_id: e.target.value})} required />
            <Input placeholder="Bus ID" value={form.bus_id} onChange={e => setForm({...form, bus_id: e.target.value})} required />
            <Input type="date" value={form.departure_date} onChange={e => setForm({...form, departure_date: e.target.value})} required />
            <Input type="time" value={form.departure_time} onChange={e => setForm({...form, departure_time: e.target.value})} required />
            <Input type="number" min={60} value={form.available_seats} onChange={e => setForm({...form, available_seats: String(Math.max(60, Number(e.target.value||60)) )})} />
            <Button type="submit" className="col-span-full md:col-auto">{editing ? "Update" : "Create"}</Button>
          </form>
        </Card>

        <div className="grid gap-3">
          {schedules.map(s => (
            <Card key={s.id} className="p-4 flex justify-between items-center">
              <div>
                <div className="font-medium">{s.route_id} — {s.departure_date} {s.departure_time}</div>
                <div className="text-sm text-muted-foreground">Bus: {s.bus_id} • Seats: {s.available_seats}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onEdit(s)}>Edit</Button>
                <Button variant="destructive" onClick={() => onDelete(s.id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
