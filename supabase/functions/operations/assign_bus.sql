-- =====================================================
-- ASSIGN BUS FUNCTION
-- =====================================================
-- Finds the least-used available bus for trip assignment
-- Returns bus with lowest trip count and longest idle time
-- =====================================================

CREATE OR REPLACE FUNCTION assign_bus()
RETURNS TABLE (
    bus_id uuid,
    registration text,
    last_trip_date date,
    total_trips bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.registration,
        MAX(t.trip_date) AS last_trip_date,
        COUNT(t.id) AS total_trips
    FROM buses b
    LEFT JOIN trips t ON t.bus_id = b.id
    WHERE b.status = 'active'
      AND b.is_in_maintenance = false
      AND b.is_available = true
    GROUP BY b.id
    ORDER BY COUNT(t.id) ASC, MAX(t.trip_date) NULLS FIRST
    LIMIT 1;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION assign_bus() TO authenticated;
GRANT EXECUTE ON FUNCTION assign_bus() TO service_role;

-- Add helpful comment
COMMENT ON FUNCTION assign_bus() IS 'Returns the least-used available bus for optimal fleet utilization. Prioritizes buses with fewer trips and longer idle times.';
