import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Schedule {
  id: string;
  departure_date: string;
  departure_time: string;
  available_seats: number;
  routes: {
    origin: string;
    destination: string;
    price: number;
    duration_hours: number;
    route_type: 'local' | 'cross_border';
  };
  buses: {
    name: string;
    number_plate: string;
  };
}

export default function TripSearch() {
  const [locations, setLocations] = useState<string[]>([]);
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    date: "",
    seats: 1,
  });
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch unique origins and destinations
    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from("routes")
        .select("origin, destination")
        .eq("active", true);
      if (!error && data) {
        const locs = [
          ...new Set([
            ...data.map((r: { origin: string; destination: string }) => r.origin),
            ...data.map((r: { origin: string; destination: string }) => r.destination),
          ]),
        ];
        setLocations(locs.filter(Boolean));
      }
    };
    fetchLocations();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let query = supabase
        .from("schedules")
        .select(`*, routes (origin, destination, price, duration_hours, route_type), buses (name, number_plate)`)
        .eq("routes.origin", form.origin)
        .eq("routes.destination", form.destination)
        .gte("available_seats", form.seats);
      if (form.date) {
        query = query.eq("departure_date", form.date);
      }
      const { data, error } = await query;
      if (error) throw error;
      setSchedules(data || []);
      if (!data || data.length === 0) {
        toast({ title: "No trips found", description: "No trips match your criteria." });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTrip = (schedule: Schedule) => {
    // Pass selected trip and form data to next step (passenger details)
    navigate("/book/passengers", { state: { schedule, form } });
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Search for Trips</h1>
      <form onSubmit={handleSearch} className="bg-white rounded shadow p-4 mb-6 space-y-4">
        <div>
          <label htmlFor="origin" className="block mb-1 font-medium">Pick Up Location</label>
          <select
            id="origin"
            className="w-full border rounded px-3 py-2"
            value={form.origin}
            onChange={e => setForm(f => ({ ...f, origin: e.target.value }))}
            required
          >
            <option value="">Select Origin</option>
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="destination" className="block mb-1 font-medium">Drop Off Location</label>
          <select
            id="destination"
            className="w-full border rounded px-3 py-2"
            value={form.destination}
            onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
            required
          >
            <option value="">Select Destination</option>
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="date" className="block mb-1 font-medium">Date of Travel</label>
          <input
            id="date"
            type="date"
            className="w-full border rounded px-3 py-2"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>
        <div>
          <label htmlFor="seats" className="block mb-1 font-medium">Number of Seats</label>
          <input
            id="seats"
            type="number"
            min={1}
            max={10}
            className="w-full border rounded px-3 py-2"
            value={form.seats}
            onChange={e => setForm(f => ({ ...f, seats: Number(e.target.value) }))}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Searching..." : "Search"}</Button>
      </form>
      <div className="space-y-4">
        {schedules.map(schedule => (
          <Card key={schedule.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-semibold text-lg">{schedule.routes.origin} → {schedule.routes.destination}</div>
              <div className="text-sm text-muted-foreground">Date: {schedule.departure_date} | Time: {schedule.departure_time}</div>
              <div className="text-sm">Bus: {schedule.buses.name} ({schedule.buses.number_plate})</div>
              <div className="text-sm">Price: P{schedule.routes.price} | Duration: {schedule.routes.duration_hours}h</div>
              <div className="text-sm">Available Seats: {schedule.available_seats}</div>
            </div>
            <Button className="mt-4 md:mt-0" onClick={() => handleSelectTrip(schedule)}>
              Select Trip
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
