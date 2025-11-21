-- ============================================================================
-- PRODUCTION SCHEMA PART 7: TRIGGERS
-- ============================================================================

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_buses_updated_at ON buses;
DROP TRIGGER IF EXISTS update_routes_updated_at ON routes;
DROP TRIGGER IF EXISTS update_drivers_updated_at ON drivers;
DROP TRIGGER IF EXISTS update_trips_updated_at ON trips;
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
DROP TRIGGER IF EXISTS update_income_records_updated_at ON income_records;
DROP TRIGGER IF EXISTS update_bank_accounts_updated_at ON bank_accounts;
DROP TRIGGER IF EXISTS update_work_orders_updated_at ON work_orders;
DROP TRIGGER IF EXISTS update_maintenance_schedules_updated_at ON maintenance_schedules;
DROP TRIGGER IF EXISTS update_spare_parts_inventory_updated_at ON spare_parts_inventory;
DROP TRIGGER IF EXISTS update_payroll_updated_at ON payroll;
DROP TRIGGER IF EXISTS generate_trip_number_trigger ON trips;
DROP TRIGGER IF EXISTS generate_booking_reference_trigger ON bookings;
DROP TRIGGER IF EXISTS populate_trip_seats_trigger ON trips;
DROP TRIGGER IF EXISTS update_trip_seats_trigger ON bookings;

-- ============================================================================
-- AUTH TRIGGERS
-- ============================================================================

-- Auto-create profile and role on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buses_updated_at
  BEFORE UPDATE ON buses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at
  BEFORE UPDATE ON routes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_income_records_updated_at
  BEFORE UPDATE ON income_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON bank_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_orders_updated_at
  BEFORE UPDATE ON work_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_schedules_updated_at
  BEFORE UPDATE ON maintenance_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spare_parts_inventory_updated_at
  BEFORE UPDATE ON spare_parts_inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_updated_at
  BEFORE UPDATE ON payroll
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- BUSINESS LOGIC TRIGGERS
-- ============================================================================

-- Auto-generate trip number
CREATE TRIGGER generate_trip_number_trigger
  BEFORE INSERT ON trips
  FOR EACH ROW EXECUTE FUNCTION generate_trip_number();

-- Auto-generate booking reference
CREATE TRIGGER generate_booking_reference_trigger
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION generate_booking_reference();

-- Auto-populate trip seats from bus
CREATE TRIGGER populate_trip_seats_trigger
  BEFORE INSERT ON trips
  FOR EACH ROW EXECUTE FUNCTION populate_trip_seats();

-- Update trip available seats on booking
CREATE TRIGGER update_trip_seats_trigger
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_trip_seats();
