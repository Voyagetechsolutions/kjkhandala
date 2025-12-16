import { useState, useEffect } from "react";
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function FleetManagement() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);

  // FORM STATE
  const [form, setForm] = useState({
    name: "",
    number_plate: "",
    model: "",
    year: "",
    seating_capacity: "",
    bus_type: "",
    fuel_type: "",
    status: "",
    gps_device_id: "",
    total_mileage: "",
    last_service_date: "",
    next_service_date: "",
    insurance_expiry: "",
    license_expiry: "",
    gps_tat_number: "",
  });

  // FETCH ALL BUSES
  const fetchBuses = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("buses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) toast.error(error.message);
    else setBuses(data);

    setLoading(false);
  };

  useEffect(() => {
    fetchBuses();
  }, []);

  // HANDLE FORM CHANGE
  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ADD NEW BUS
  const addBus = async () => {
    const { data, error } = await supabase.from("buses").insert([
      {
        name: form.name,
        number_plate: form.number_plate,
        model: form.model,
        year: form.year ? Number(form.year) : null,
        seating_capacity: form.seating_capacity
          ? Number(form.seating_capacity)
          : null,
        bus_type: form.bus_type || null,
        fuel_type: form.fuel_type || null,
        status: form.status || "active",
        gps_device_id: form.gps_device_id || null,
        total_mileage: form.total_mileage
          ? Number(form.total_mileage)
          : null,
        last_service_date: form.last_service_date || null,
        next_service_date: form.next_service_date || null,
        insurance_expiry: form.insurance_expiry || null,
        license_expiry: form.license_expiry || null,
        gps_tat_number: form.gps_tat_number || null,
      },
    ]);

    if (error) {
      toast.error("Insert error: " + error.message);
      return;
    }

    toast.success("Bus added!");
    setForm({
      name: "",
      number_plate: "",
      model: "",
      year: "",
      seating_capacity: "",
      bus_type: "",
      fuel_type: "",
      status: "",
      gps_device_id: "",
      total_mileage: "",
      last_service_date: "",
      next_service_date: "",
      insurance_expiry: "",
      license_expiry: "",
      gps_tat_number: "",
    });

    fetchBuses();
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Fleet Management</h1>

      {/* ADD BUS FORM */}
      <Card>
        <CardContent className="grid grid-cols-2 gap-4 p-6">

          {/** Text Inputs */}
          {[
            "name",
            "number_plate",
            "model",
            "gps_device_id",
            "gps_tat_number",
          ].map((field) => (
            <div key={field}>
              <Label>{field.replace("_", " ").toUpperCase()}</Label>
              <Input
                name={field}
                value={(form as any)[field]}
                onChange={handleChange}
              />
            </div>
          ))}

          {/** Number Inputs */}
          {[
            "year",
            "seating_capacity",
            "total_mileage",
          ].map((field) => (
            <div key={field}>
              <Label>{field.replace("_", " ").toUpperCase()}</Label>
              <Input
                type="number"
                name={field}
                value={(form as any)[field]}
                onChange={handleChange}
              />
            </div>
          ))}

          {/** Dates */}
          {[
            "last_service_date",
            "next_service_date",
            "insurance_expiry",
            "license_expiry",
          ].map((field) => (
            <div key={field}>
              <Label>{field.replace("_", " ").toUpperCase()}</Label>
              <Input
                type="date"
                name={field}
                value={(form as any)[field]}
                onChange={handleChange}
              />
            </div>
          ))}

          {/** Dropdowns */}
          <div>
            <Label>BUS TYPE</Label>
            <select
              name="bus_type"
              className="border p-2 rounded w-full"
              value={form.bus_type}
              onChange={handleChange}
            >
              <option value="">Select Type</option>
              <option value="coach">Coach</option>
              <option value="minibus">Minibus</option>
            </select>
          </div>

          <div>
            <Label>FUEL TYPE</Label>
            <select
              name="fuel_type"
              className="border p-2 rounded w-full"
              value={form.fuel_type}
              onChange={handleChange}
            >
              <option value="">Select Fuel</option>
              <option value="diesel">Diesel</option>
              <option value="petrol">Petrol</option>
            </select>
          </div>

          <div>
            <Label>STATUS</Label>
            <select
              name="status"
              className="border p-2 rounded w-full"
              value={form.status}
              onChange={handleChange}
            >
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="col-span-2">
            <Button onClick={addBus} className="w-full">
              Add Bus
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* BUS LIST */}
      <div className="grid grid-cols-3 gap-4">
        {loading ? (
          <p>Loading...</p>
        ) : buses.length === 0 ? (
          <p>No buses added yet.</p>
        ) : (
          buses.map((bus: any) => (
            <Card key={bus.id}>
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold">{bus.name}</h2>
                <p>Plate: {bus.number_plate}</p>
                <p>Model: {bus.model}</p>
                <p>Year: {bus.year}</p>
                <p>Status: {bus.status}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
