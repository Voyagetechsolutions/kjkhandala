-- =====================================================
-- COMPLETE DASHBOARD VIEWS & FUNCTIONS
-- Based on comprehensive guide for all dashboards
-- =====================================================

-- =====================================================
-- 1. COMMAND CENTER / QUICK STATS VIEW
-- =====================================================

DROP VIEW IF EXISTS command_center_stats CASCADE;

CREATE VIEW command_center_stats AS
SELECT
  -- Fleet Stats
  (SELECT COUNT(*) FROM buses) AS total_buses,
  (SELECT COUNT(*) FROM buses WHERE status = 'active') AS active_buses,
  (SELECT COUNT(*) FROM buses WHERE status = 'maintenance') AS maintenance_buses,
  (SELECT COUNT(*) FROM buses WHERE status = 'out_of_service') AS out_of_service_buses,
  
  -- Trip Stats
  (SELECT COUNT(*) FROM trips WHERE DATE(scheduled_departure) = CURRENT_DATE) AS trips_today,
  (SELECT COUNT(*) FROM trips WHERE status = 'IN_PROGRESS') AS active_trips,
  (SELECT COUNT(*) FROM trips WHERE DATE(scheduled_departure) = CURRENT_DATE AND status = 'COMPLETED') AS completed_trips_today,
  
  -- Performance
  (SELECT ROUND(
    100.0 * COUNT(*) FILTER (WHERE actual_departure <= scheduled_departure) / NULLIF(COUNT(*),0), 2
  ) FROM trips WHERE DATE(scheduled_departure) = CURRENT_DATE AND actual_departure IS NOT NULL) AS on_time_performance,
  
  -- Passenger Stats
  (SELECT COUNT(*) FROM bookings 
   WHERE schedule_id IN (SELECT id FROM trips WHERE DATE(scheduled_departure) = CURRENT_DATE)) AS passengers_today,
  
  -- Financial Stats
  (SELECT COALESCE(SUM(amount),0) FROM income WHERE DATE(created_at) = CURRENT_DATE) AS revenue_today,
  (SELECT COALESCE(SUM(amount),0) FROM income 
   WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)) AS revenue_month,
  (SELECT COALESCE(SUM(amount),0) FROM expenses 
   WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)) AS expenses_month,
  
  -- Profit Margin
  ROUND(
    100.0 * (
      (SELECT COALESCE(SUM(amount),0) FROM income WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE))
      - (SELECT COALESCE(SUM(amount),0) FROM expenses WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE))
    ) / NULLIF((SELECT COALESCE(SUM(amount),0) FROM income WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)),0), 2
  ) AS profit_margin;

-- =====================================================
-- 2. LIVE TRACKING VIEW
-- =====================================================

DROP VIEW IF EXISTS live_bus_tracking CASCADE;

CREATE VIEW live_bus_tracking AS
SELECT 
  b.id,
  b.name,
  b.number_plate,
  b.status AS bus_status,
  gt.latitude AS gps_latitude,
  gt.longitude AS gps_longitude,
  gt.speed,
  gt.heading,
  gt.timestamp AS last_reported_at,
  t.id AS current_trip_id,
  r.origin,
  r.destination
FROM buses b
LEFT JOIN LATERAL (
  SELECT latitude, longitude, speed, heading, timestamp
  FROM gps_tracking
  WHERE bus_id = b.id
  ORDER BY timestamp DESC
  LIMIT 1
) gt ON true
LEFT JOIN trips t ON t.bus_id = b.id AND t.status = 'IN_PROGRESS'
LEFT JOIN routes r ON t.route_id = r.id
WHERE gt.latitude IS NOT NULL AND gt.longitude IS NOT NULL;

-- =====================================================
-- 3. FLEET MANAGEMENT STATS VIEW
-- =====================================================

DROP VIEW IF EXISTS fleet_stats CASCADE;

CREATE VIEW fleet_stats AS
SELECT
  COUNT(*) AS total_buses,
  COUNT(*) FILTER (WHERE status = 'active') AS active_buses,
  COUNT(*) FILTER (WHERE status = 'maintenance') AS maintenance_buses,
  COUNT(*) FILTER (WHERE status = 'out_of_service') AS out_of_service_buses,
  COUNT(*) FILTER (WHERE status = 'retired') AS retired_buses,
  COALESCE(SUM(total_mileage), 0) AS total_mileage,
  ROUND(AVG(total_mileage), 2) AS avg_mileage_per_bus
FROM buses;

-- =====================================================
-- 4. DRIVER MANAGEMENT STATS VIEW
-- =====================================================

DROP VIEW IF EXISTS driver_stats CASCADE;

CREATE VIEW driver_stats AS
SELECT
  COUNT(*) AS total_drivers,
  COUNT(*) FILTER (WHERE status = 'active') AS active_drivers,
  COUNT(*) FILTER (WHERE status = 'on_leave') AS on_leave_drivers,
  COUNT(*) FILTER (WHERE status = 'suspended') AS suspended_drivers,
  COUNT(*) FILTER (WHERE status = 'inactive') AS inactive_drivers,
  ROUND(AVG(rating), 1) AS avg_rating,
  COALESCE(SUM(total_trips), 0) AS total_trips_completed,
  COALESCE(SUM(total_distance_km), 0) AS total_distance_driven
FROM drivers;

-- =====================================================
-- 5. ROUTE MANAGEMENT STATS VIEW
-- =====================================================

DROP VIEW IF EXISTS route_stats CASCADE;

CREATE VIEW route_stats AS
SELECT
  COUNT(*) AS total_routes,
  COUNT(*) FILTER (WHERE active = TRUE) AS active_routes,
  ROUND(AVG(distance_km), 1) AS avg_distance,
  ROUND(AVG(duration_hours), 1) AS avg_duration,
  ROUND(AVG(price), 2) AS avg_fare
FROM routes;

-- =====================================================
-- 6. REVENUE SUMMARY VIEW (Fixed)
-- =====================================================

DROP VIEW IF EXISTS revenue_summary CASCADE;

CREATE VIEW revenue_summary AS
SELECT 
  DATE(created_at) as date,
  SUM(amount) as total_revenue,
  COUNT(*) as transaction_count
FROM income
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- =====================================================
-- 7. EXPENSE BREAKDOWN VIEW
-- =====================================================

DROP VIEW IF EXISTS expense_breakdown CASCADE;

CREATE VIEW expense_breakdown AS
SELECT 
  category,
  COALESCE(SUM(amount), 0) AS total_amount,
  COUNT(*) AS transaction_count,
  ROUND(
    100.0 * SUM(amount) / NULLIF((SELECT SUM(amount) FROM expenses), 0), 2
  ) AS percent_of_total
FROM expenses
GROUP BY category
ORDER BY total_amount DESC;

-- =====================================================
-- 8. TOP ROUTES BY REVENUE VIEW
-- =====================================================

DROP VIEW IF EXISTS top_routes_by_revenue CASCADE;

CREATE VIEW top_routes_by_revenue AS
SELECT 
  r.id,
  r.route_code,
  r.origin,
  r.destination,
  COUNT(t.id) AS trip_count,
  COALESCE(SUM(i.amount), 0) AS total_revenue,
  ROUND(AVG(i.amount), 2) AS avg_revenue_per_trip
FROM routes r
LEFT JOIN trips t ON t.route_id = r.id
LEFT JOIN income i ON i.trip_id = t.id
GROUP BY r.id, r.route_code, r.origin, r.destination
ORDER BY total_revenue DESC;

-- =====================================================
-- 9. MAINTENANCE ALERTS VIEW
-- =====================================================

DROP VIEW IF EXISTS active_maintenance_alerts CASCADE;

CREATE VIEW active_maintenance_alerts AS
SELECT 
  ma.*,
  b.name AS bus_name,
  b.number_plate
FROM maintenance_reminders ma
JOIN buses b ON ma.bus_id = b.id
WHERE ma.completed_at IS NULL
  AND ma.due_date <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY ma.due_date ASC;

-- =====================================================
-- 10. UPCOMING RENEWALS VIEW
-- =====================================================

DROP VIEW IF EXISTS upcoming_renewals CASCADE;

CREATE VIEW upcoming_renewals AS
SELECT 
  id,
  name,
  number_plate,
  license_expiry,
  insurance_expiry,
  CASE 
    WHEN license_expiry BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '45 days' THEN 'license'
    WHEN insurance_expiry BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '45 days' THEN 'insurance'
    ELSE NULL
  END AS renewal_type,
  CASE 
    WHEN license_expiry < CURRENT_DATE THEN 'expired'
    WHEN license_expiry <= CURRENT_DATE + INTERVAL '15 days' THEN 'urgent'
    WHEN license_expiry <= CURRENT_DATE + INTERVAL '45 days' THEN 'upcoming'
    WHEN insurance_expiry < CURRENT_DATE THEN 'expired'
    WHEN insurance_expiry <= CURRENT_DATE + INTERVAL '15 days' THEN 'urgent'
    WHEN insurance_expiry <= CURRENT_DATE + INTERVAL '45 days' THEN 'upcoming'
    ELSE 'ok'
  END AS priority
FROM buses
WHERE license_expiry BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '45 days'
   OR insurance_expiry BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '45 days'
ORDER BY 
  CASE priority
    WHEN 'expired' THEN 1
    WHEN 'urgent' THEN 2
    WHEN 'upcoming' THEN 3
    ELSE 4
  END;

-- =====================================================
-- 11. TRIP MANIFEST VIEW
-- =====================================================

DROP VIEW IF EXISTS trip_manifest CASCADE;

CREATE VIEW trip_manifest AS
SELECT 
  t.id AS trip_id,
  t.scheduled_departure,
  t.scheduled_arrival,
  t.status AS trip_status,
  r.route_code,
  r.origin,
  r.destination,
  b.name AS bus_name,
  b.number_plate,
  d.full_name AS driver_name,
  COUNT(bk.id) AS total_bookings,
  COALESCE(SUM(bk.total_amount), 0) AS total_booking_amount
FROM trips t
LEFT JOIN routes r ON t.route_id = r.id
LEFT JOIN buses b ON t.bus_id = b.id
LEFT JOIN drivers d ON t.driver_id = d.id
LEFT JOIN bookings bk ON bk.schedule_id = t.id
GROUP BY t.id, t.scheduled_departure, t.scheduled_arrival, t.status,
         r.route_code, r.origin, r.destination, b.name, b.number_plate, d.full_name
ORDER BY t.scheduled_departure DESC;

-- =====================================================
-- 12. FINANCIAL SUMMARY VIEW
-- =====================================================

DROP VIEW IF EXISTS financial_summary CASCADE;

CREATE VIEW financial_summary AS
SELECT
  (SELECT COALESCE(SUM(amount), 0) FROM income) AS total_income,
  (SELECT COALESCE(SUM(amount), 0) FROM expenses) AS total_expenses,
  (SELECT COALESCE(SUM(amount), 0) FROM income) - (SELECT COALESCE(SUM(amount), 0) FROM expenses) AS net_profit,
  ROUND(
    100.0 * (
      (SELECT COALESCE(SUM(amount), 0) FROM income) - (SELECT COALESCE(SUM(amount), 0) FROM expenses)
    ) / NULLIF((SELECT COALESCE(SUM(amount), 0) FROM income), 0), 2
  ) AS profit_margin,
  (SELECT COALESCE(SUM(amount), 0) FROM income WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)) AS income_this_month,
  (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)) AS expenses_this_month;

-- =====================================================
-- 13. REVENUE TREND (LAST 30 DAYS)
-- =====================================================

DROP VIEW IF EXISTS revenue_trend_30_days CASCADE;

CREATE VIEW revenue_trend_30_days AS
SELECT 
  DATE(created_at) AS date,
  COALESCE(SUM(amount), 0) AS revenue
FROM income
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date ASC;

-- =====================================================
-- 14. HR STATS VIEW
-- =====================================================

DROP VIEW IF EXISTS hr_stats CASCADE;

CREATE VIEW hr_stats AS
SELECT
  COUNT(*) AS total_staff,
  COUNT(*) FILTER (WHERE role = 'driver') AS total_drivers,
  COUNT(*) FILTER (WHERE role = 'admin') AS total_admins,
  COUNT(*) FILTER (WHERE role = 'office_staff') AS office_staff
FROM profiles;

-- =====================================================
-- 15. MAINTENANCE STATS VIEW
-- =====================================================

DROP VIEW IF EXISTS maintenance_stats CASCADE;

CREATE VIEW maintenance_stats AS
SELECT
  COUNT(*) AS total_records,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed,
  COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
  COUNT(*) FILTER (WHERE status = 'scheduled') AS scheduled,
  COUNT(*) FILTER (WHERE scheduled_date < CURRENT_DATE AND status <> 'completed') AS overdue,
  COALESCE(SUM(cost) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)), 0) AS this_month_cost
FROM maintenance_records;

-- =====================================================
-- DONE! All dashboard views created.
-- =====================================================

-- Verify all views were created
SELECT 
  schemaname,
  viewname,
  viewowner
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN (
    'command_center_stats',
    'live_bus_tracking',
    'fleet_stats',
    'driver_stats',
    'route_stats',
    'revenue_summary',
    'expense_breakdown',
    'top_routes_by_revenue',
    'active_maintenance_alerts',
    'upcoming_renewals',
    'trip_manifest',
    'financial_summary',
    'revenue_trend_30_days',
    'hr_stats',
    'maintenance_stats'
  )
ORDER BY viewname;
