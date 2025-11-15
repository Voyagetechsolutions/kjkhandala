-- =====================================================
-- HELPER FUNCTION: Get Enum Values
-- =====================================================
-- This function returns all possible values for a given enum type
-- Useful for dynamically populating dropdowns in the frontend
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_enum_values(enum_name text)
RETURNS TABLE(enum_value text) AS $$
BEGIN
  RETURN QUERY
  SELECT unnest(enum_range(NULL::public.maintenance_type))::text
  WHERE enum_name = 'maintenance_type'
  
  UNION ALL
  
  SELECT unnest(enum_range(NULL::public.bus_status))::text
  WHERE enum_name = 'bus_status'
  
  UNION ALL
  
  SELECT unnest(enum_range(NULL::public.driver_status))::text
  WHERE enum_name = 'driver_status'
  
  UNION ALL
  
  SELECT unnest(enum_range(NULL::public.route_type))::text
  WHERE enum_name = 'route_type'
  
  UNION ALL
  
  SELECT unnest(enum_range(NULL::public.trip_status))::text
  WHERE enum_name = 'trip_status'
  
  UNION ALL
  
  SELECT unnest(enum_range(NULL::public.booking_status))::text
  WHERE enum_name = 'booking_status'
  
  UNION ALL
  
  SELECT unnest(enum_range(NULL::public.payment_status))::text
  WHERE enum_name = 'payment_status'
  
  UNION ALL
  
  SELECT unnest(enum_range(NULL::public.payment_method))::text
  WHERE enum_name = 'payment_method';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_enum_values(text) TO authenticated;

-- =====================================================
-- USAGE EXAMPLES:
-- =====================================================

-- Get all maintenance types
-- SELECT * FROM get_enum_values('maintenance_type');

-- Get all bus statuses
-- SELECT * FROM get_enum_values('bus_status');

-- Get all trip statuses
-- SELECT * FROM get_enum_values('trip_status');

-- Get all payment methods
-- SELECT * FROM get_enum_values('payment_method');
