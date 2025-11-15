-- Enable RLS on core tables and define policies per role

-- Helper: current user id via auth.uid()
-- Note: In Supabase SQL editor, auth.uid() resolves to the authenticated user's UUID

alter table profiles enable row level security;
alter table user_roles enable row level security;
alter table trips enable row level security;
alter table bookings enable row level security;
alter table notifications enable row level security;

-- Profiles: user can read/update own profile; admins can read all
create policy "profiles_self_select" on profiles
  for select using (id = auth.uid());
create policy "profiles_self_update" on profiles
  for update using (id = auth.uid());
-- Admins (assumes a function/claim mapping to roles). For simplicity, allow service role to bypass.
-- In production, add a secure function checks.

-- User roles: user can read own roles
create policy "user_roles_self" on user_roles
  for select using (user_id = auth.uid());

-- Trips: everyone can select; modifications by managers via service role only
create policy "trips_select_all" on trips for select using (true);

-- Bookings: user can select own bookings; managers can select all via service role
create policy "bookings_self_select" on bookings
  for select using (passenger_id = auth.uid());

-- Notifications: user can select own notifications
create policy "notifications_self_select" on notifications
  for select using (user_id = auth.uid());
