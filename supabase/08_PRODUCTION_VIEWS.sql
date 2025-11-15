-- ============================================================================
-- PRODUCTION SCHEMA PART 8: VIEWS
-- Dashboard Analytics and Reports
-- ============================================================================

-- ============================================================================
-- OPERATIONS DASHBOARD VIEWS
-- ============================================================================

-- Command Center Stats
CREATE OR REPLACE VIEW command_center_stats AS
SELECT
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'active') as active_trips,
  COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'active') as active_buses,
  COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'active') as active_drivers,
  COUNT(DISTINCT bk.id) FILTER (WHERE bk.created_at::date = CURRENT_DATE) as today_bookings,
  COALESCE(SUM(p.amount) FILTER (WHERE p.paid_at::date = CURRENT_DATE AND p.payment_status = 'settled'), 0) as today_revenue
FROM trips t
CROSS JOIN buses b
CROSS JOIN drivers d
CROSS JOIN bookings bk
CROSS JOIN payments p;

-- Live Bus Tracking
CREATE OR REPLACE VIEW live_bus_tracking AS
SELECT
  b.id as bus_id,
  b.name as bus_name,
  b.number_plate,
  t.id as trip_id,
  t.trip_number,
  r.origin,
  r.destination,
  d.full_name as driver_name,
  t.status as trip_status,
  gt.latitude,
  gt.longitude,
  gt.speed,
  gt.timestamp as last_update
FROM buses b
LEFT JOIN trips t ON t.bus_id = b.id AND t.status IN ('active', 'scheduled')
LEFT JOIN routes r ON t.route_id = r.id
LEFT JOIN drivers d ON t.driver_id = d.id
LEFT JOIN LATERAL (
  SELECT latitude, longitude, speed, timestamp
  FROM gps_tracking
  WHERE bus_id = b.id
  ORDER BY timestamp DESC
  LIMIT 1
) gt ON true
WHERE b.status = 'active';

-- Fleet Stats
CREATE OR REPLACE VIEW fleet_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'active') as active_buses,
  COUNT(*) FILTER (WHERE status = 'in_maintenance') as in_maintenance,
  COUNT(*) FILTER (WHERE status = 'out_of_service') as out_of_service,
  COUNT(*) as total_buses,
  AVG(total_mileage) as avg_mileage,
  COUNT(*) FILTER (WHERE next_service_date <= CURRENT_DATE + INTERVAL '7 days') as service_due_soon
FROM buses;

-- ============================================================================
-- TICKETING DASHBOARD VIEWS
-- ============================================================================

-- Ticketing Dashboard Stats
CREATE OR REPLACE VIEW ticketing_dashboard_stats AS
SELECT
  COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) as today_bookings,
  COUNT(*) FILTER (WHERE booking_status = 'confirmed') as confirmed_bookings,
  COUNT(*) FILTER (WHERE booking_status = 'pending') as pending_bookings,
  COALESCE(SUM(total_amount) FILTER (WHERE created_at::date = CURRENT_DATE), 0) as today_sales,
  COALESCE(SUM(total_amount) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)), 0) as month_sales
FROM bookings;

-- Trip Occupancy
CREATE OR REPLACE VIEW trip_occupancy AS
SELECT
  t.id,
  t.trip_number,
  r.origin,
  r.destination,
  t.departure_time,
  t.total_seats,
  t.available_seats,
  (t.total_seats - t.available_seats) as booked_seats,
  ROUND(((t.total_seats - t.available_seats)::numeric / t.total_seats::numeric) * 100, 2) as occupancy_percentage,
  t.status
FROM trips t
JOIN routes r ON t.route_id = r.id
WHERE t.departure_time >= CURRENT_DATE
ORDER BY t.departure_time;

-- Payment Summary Today
CREATE OR REPLACE VIEW payment_summary_today AS
SELECT
  payment_method,
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount
FROM payments
WHERE paid_at::date = CURRENT_DATE
  AND payment_status = 'settled'
GROUP BY payment_method;

-- Passenger Manifest
CREATE OR REPLACE VIEW passenger_manifest AS
SELECT
  t.trip_number,
  r.origin,
  r.destination,
  t.departure_time,
  b.booking_reference,
  b.passenger_name,
  b.passenger_phone,
  b.seat_number,
  b.booking_status,
  b.payment_status
FROM bookings b
JOIN trips t ON b.trip_id = t.id
JOIN routes r ON t.route_id = r.id
WHERE b.booking_status IN ('confirmed', 'checked_in', 'boarded')
ORDER BY t.departure_time, b.seat_number;

-- ============================================================================
-- FINANCE DASHBOARD VIEWS
-- ============================================================================

-- Income Summary
CREATE OR REPLACE VIEW income_summary AS
SELECT
  DATE_TRUNC('day', COALESCE(p.paid_at, ir.income_date)) as date,
  'Ticket Sales' as source,
  SUM(p.amount) FILTER (WHERE p.payment_status = 'settled') as amount
FROM payments p
FULL OUTER JOIN income_records ir ON DATE_TRUNC('day', p.paid_at) = DATE_TRUNC('day', ir.income_date)
WHERE p.paid_at >= CURRENT_DATE - INTERVAL '30 days'
   OR ir.income_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', COALESCE(p.paid_at, ir.income_date))
ORDER BY date DESC;

-- Expense Summary
CREATE OR REPLACE VIEW expense_summary AS
SELECT
  category,
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount,
  DATE_TRUNC('month', expense_date) as month
FROM expenses
WHERE expense_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY category, DATE_TRUNC('month', expense_date)
ORDER BY month DESC, total_amount DESC;

-- Fuel Analysis
CREATE OR REPLACE VIEW fuel_analysis AS
SELECT
  b.name as bus_name,
  b.number_plate,
  COUNT(fl.id) as refuel_count,
  SUM(fl.liters) as total_liters,
  SUM(fl.total_cost) as total_cost,
  AVG(fl.cost_per_liter) as avg_cost_per_liter,
  DATE_TRUNC('month', fl.filled_at) as month
FROM fuel_logs fl
JOIN buses b ON fl.bus_id = b.id
WHERE fl.filled_at >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY b.id, b.name, b.number_plate, DATE_TRUNC('month', fl.filled_at)
ORDER BY month DESC, total_cost DESC;

-- ============================================================================
-- HR DASHBOARD VIEWS
-- ============================================================================

-- Employee Summary
CREATE OR REPLACE VIEW employee_summary AS
SELECT
  employment_status,
  employment_type,
  COUNT(*) as employee_count,
  AVG(salary) as avg_salary
FROM employees
GROUP BY employment_status, employment_type;

-- Attendance Summary
CREATE OR REPLACE VIEW attendance_summary AS
SELECT
  e.full_name,
  e.department,
  COUNT(*) FILTER (WHERE a.status = 'present') as present_days,
  COUNT(*) FILTER (WHERE a.status = 'absent') as absent_days,
  COUNT(*) FILTER (WHERE a.status = 'late') as late_days,
  COUNT(*) FILTER (WHERE a.status = 'on_leave') as leave_days,
  DATE_TRUNC('month', a.date) as month
FROM attendance a
JOIN employees e ON a.employee_id = e.id
WHERE a.date >= CURRENT_DATE - INTERVAL '3 months'
GROUP BY e.id, e.full_name, e.department, DATE_TRUNC('month', a.date)
ORDER BY month DESC, e.full_name;

-- Leave Balance Summary
CREATE OR REPLACE VIEW leave_balance_summary AS
SELECT
  e.full_name,
  e.department,
  lb.leave_type,
  lb.total_days,
  lb.used_days,
  lb.remaining_days,
  lb.year
FROM leave_balances lb
JOIN employees e ON lb.employee_id = e.id
WHERE lb.year = EXTRACT(YEAR FROM CURRENT_DATE)
ORDER BY e.full_name, lb.leave_type;

-- ============================================================================
-- MAINTENANCE DASHBOARD VIEWS
-- ============================================================================

-- Work Orders Summary
CREATE OR REPLACE VIEW work_orders_summary AS
SELECT
  status,
  priority,
  COUNT(*) as order_count,
  SUM(estimated_cost) as total_estimated_cost,
  SUM(actual_cost) as total_actual_cost
FROM work_orders
WHERE created_at >= CURRENT_DATE - INTERVAL '3 months'
GROUP BY status, priority
ORDER BY priority DESC, status;

-- Maintenance Cost Analysis
CREATE OR REPLACE VIEW maintenance_cost_analysis AS
SELECT
  b.name as bus_name,
  b.number_plate,
  COUNT(wo.id) as work_order_count,
  SUM(wo.actual_cost) as total_maintenance_cost,
  AVG(wo.actual_cost) as avg_cost_per_order,
  DATE_TRUNC('month', wo.created_at) as month
FROM work_orders wo
JOIN buses b ON wo.bus_id = b.id
WHERE wo.created_at >= CURRENT_DATE - INTERVAL '12 months'
  AND wo.status = 'completed'
GROUP BY b.id, b.name, b.number_plate, DATE_TRUNC('month', wo.created_at)
ORDER BY month DESC, total_maintenance_cost DESC;

-- Overdue Services
CREATE OR REPLACE VIEW overdue_services AS
SELECT
  b.id as bus_id,
  b.name as bus_name,
  b.number_plate,
  ms.maintenance_type,
  ms.next_service_date,
  ms.next_service_mileage,
  b.total_mileage as current_mileage,
  CURRENT_DATE - ms.next_service_date as days_overdue
FROM maintenance_schedules ms
JOIN buses b ON ms.bus_id = b.id
WHERE ms.is_active = true
  AND (ms.next_service_date < CURRENT_DATE 
       OR (ms.next_service_mileage IS NOT NULL 
           AND b.total_mileage >= ms.next_service_mileage))
ORDER BY days_overdue DESC;

-- Parts Inventory Status
CREATE OR REPLACE VIEW parts_inventory_status AS
SELECT
  part_number,
  part_name,
  category,
  quantity,
  reorder_level,
  unit_price,
  quantity * unit_price as total_value,
  CASE
    WHEN quantity <= 0 THEN 'Out of Stock'
    WHEN quantity <= reorder_level THEN 'Low Stock'
    ELSE 'In Stock'
  END as stock_status
FROM spare_parts_inventory
ORDER BY 
  CASE
    WHEN quantity <= 0 THEN 1
    WHEN quantity <= reorder_level THEN 2
    ELSE 3
  END,
  part_name;
