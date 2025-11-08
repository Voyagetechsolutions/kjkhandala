import axios from "axios";

const LOVABLE_URL = import.meta.env.VITE_LOVABLE_URL;
const LOVABLE_KEY = import.meta.env.VITE_LOVABLE_KEY;

if (!LOVABLE_URL) console.warn("VITE_LOVABLE_URL not set");

const client = axios.create({
  baseURL: LOVABLE_URL,
  headers: {
    Authorization: LOVABLE_KEY ? `Bearer ${LOVABLE_KEY}` : undefined,
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

export interface SchedulePayload {
  route_id: string;
  bus_id: string;
  departure_date: string;
  departure_time: string;
  available_seats: number;
}

export async function getSchedules() {
  const r = await client.get("/schedules");
  return r.data;
}
export async function createSchedule(payload: SchedulePayload) {
  const r = await client.post("/schedules", payload);
  return r.data;
}
export async function updateSchedule(id: string, payload: SchedulePayload) {
  const r = await client.put(`/schedules/${id}`, payload);
  return r.data;
}
export async function deleteSchedule(id: string) {
  const r = await client.delete(`/schedules/${id}`);
  return r.data;
}

// Add more wrappers (routes, buses, bookings, payments) as needed
export default client;
