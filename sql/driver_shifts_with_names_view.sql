-- Driver Shifts with Names View
-- This view joins driver_shifts with related tables to provide all necessary data in one query
-- Eliminates the need for separate queries and manual joins in the frontend

CREATE OR REPLACE VIEW driver_shifts_with_names AS
SELECT 
    ds.id,
    ds.shift_date,
    ds.shift_start_time,
    ds.shift_end_time,
    ds.start_time,
    ds.end_time,
    ds.status,
    ds.auto_generated,
    ds.notes,
    ds.shift_type,

    -- Driver information
    ds.driver_id,
    COALESCE(d.full_name, 'Unassigned') AS driver_name,
    d.phone AS driver_phone,
    d.license_number AS driver_license,

    -- Bus information
    ds.bus_id,
    b.registration_number AS bus_number,
    b.model AS bus_model,

    -- Route information
    ds.route_id,
    r.origin,
    r.destination,
    CONCAT(r.origin, ' → ', r.destination) AS route_display,

    -- Timestamps
    ds.created_at,
    ds.updated_at

FROM driver_shifts ds
LEFT JOIN drivers d ON d.id = ds.driver_id
LEFT JOIN buses b ON b.id = ds.bus_id
LEFT JOIN routes r ON r.id = ds.route_id;

-- Grant permissions
GRANT SELECT ON driver_shifts_with_names TO authenticated;

-- Add helpful comment
COMMENT ON VIEW driver_shifts_with_names IS 'Driver shifts with all related information (driver names, bus details, route info) joined for easy querying';
