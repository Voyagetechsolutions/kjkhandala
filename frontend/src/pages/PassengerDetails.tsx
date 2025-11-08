import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Passenger {
  name: string;
  phone: string;
  email: string;
  idNumber: string;
}

export default function PassengerDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  // Get trip and form data from previous step
  const { schedule, form } = location.state || {};
  const seats = form?.seats || 1;

  // One form per passenger
  const [passengers, setPassengers] = useState<Passenger[]>(
    Array.from({ length: seats }, () => ({ name: "", phone: "", email: "", idNumber: "" }))
  );
  const [error, setError] = useState<string | null>(null);

  const handleChange = (idx: number, field: keyof Passenger, value: string) => {
    setPassengers((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    for (const p of passengers) {
      if (!p.name || !p.phone) {
        setError("Name and phone are required for all passengers.");
        return;
      }
    }
    setError(null);
    // Go to seat selection, pass all data
    navigate("/book/seats", { state: { schedule, form, passengers } });
  };

  if (!schedule || !form) {
    return <div className="text-red-500">Missing trip data. Please start your booking again.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Passenger Details</h1>
      <Card className="p-4 mb-6">
        <div className="mb-2 font-semibold">Trip: {schedule.routes.origin} → {schedule.routes.destination}</div>
        <div className="text-sm text-muted-foreground">Date: {schedule.departure_date} | Time: {schedule.departure_time}</div>
        <div className="text-sm">Seats: {form.seats}</div>
      </Card>
      <form onSubmit={handleNext} className="space-y-6">
        {passengers.map((p, idx) => (
          <Card key={idx} className="p-4">
            <div className="font-semibold mb-2">Passenger {idx + 1}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">Full Name</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={p.name}
                  onChange={e => handleChange(idx, "name", e.target.value)}
                  required
                  title="Full Name"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Phone</label>
                <input
                  type="tel"
                  className="w-full border rounded px-3 py-2"
                  value={p.phone}
                  onChange={e => handleChange(idx, "phone", e.target.value)}
                  required
                  title="Phone Number"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Email (optional)</label>
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2"
                  value={p.email}
                  onChange={e => handleChange(idx, "email", e.target.value)}
                  title="Email Address"
                  placeholder="Enter email (optional)"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">ID/Passport (optional)</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={p.idNumber}
                  onChange={e => handleChange(idx, "idNumber", e.target.value)}
                  title="ID or Passport Number"
                  placeholder="Enter ID or passport (optional)"
                />
              </div>
            </div>
          </Card>
        ))}
        {error && <div className="text-red-500 font-medium">{error}</div>}
        <Button type="submit" className="w-full">Continue to Seat Selection</Button>
      </form>
    </div>
  );
}
