-- ============================================================================
-- FIX MISSING VIEWS AND TABLES
-- Addresses 404 errors from frontend queries
-- ============================================================================

-- Create revenue_summary view
CREATE OR REPLACE VIEW revenue_summary AS
SELECT
  DATE_TRUNC('day', COALESCE(p.paid_at, b.created_at))::date as date,
  COALESCE(SUM(p.amount) FILTER (WHERE p.payment_status = 'settled'), 0) as total_revenue,
  COALESCE(SUM(e.amount), 0) as total_expenses,
  COALESCE(SUM(p.amount) FILTER (WHERE p.payment_status = 'settled'), 0) - COALESCE(SUM(e.amount), 0) as net_profit
FROM bookings b
LEFT JOIN payments p ON b.id = p.booking_id
LEFT JOIN expenses e ON DATE_TRUNC('day', e.expense_date) = DATE_TRUNC('day', COALESCE(p.paid_at, b.created_at))
WHERE COALESCE(p.paid_at, b.created_at) >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', COALESCE(p.paid_at, b.created_at))
ORDER BY date DESC;

-- Grant access to revenue_summary
GRANT SELECT ON revenue_summary TO authenticated;
GRANT SELECT ON revenue_summary TO anon;

-- Note: trip_tracking table doesn't exist in schema
-- Frontend should query 'trips' table directly with proper joins
-- The live_bus_tracking view already provides this functionality
