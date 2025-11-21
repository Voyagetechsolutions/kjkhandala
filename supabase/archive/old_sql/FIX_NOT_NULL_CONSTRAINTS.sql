-- =====================================================
-- FIX NOT NULL CONSTRAINTS
-- Make required columns nullable so forms can save
-- =====================================================

-- 1. BUSES TABLE - Make columns nullable
ALTER TABLE buses ALTER COLUMN registration_number DROP NOT NULL;
ALTER TABLE buses ALTER COLUMN model DROP NOT NULL;
ALTER TABLE buses ALTER COLUMN capacity DROP NOT NULL;

-- 2. DRIVERS TABLE - Make columns nullable
ALTER TABLE drivers ALTER COLUMN first_name DROP NOT NULL;
ALTER TABLE drivers ALTER COLUMN last_name DROP NOT NULL;
ALTER TABLE drivers ALTER COLUMN license_number DROP NOT NULL;

-- 3. ROUTES TABLE - Make columns nullable
ALTER TABLE routes ALTER COLUMN route_code DROP NOT NULL;
ALTER TABLE routes ALTER COLUMN name DROP NOT NULL;
ALTER TABLE routes ALTER COLUMN origin DROP NOT NULL;
ALTER TABLE routes ALTER COLUMN destination DROP NOT NULL;

-- 4. Verify changes
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('buses', 'drivers', 'routes')
ORDER BY table_name, column_name;
