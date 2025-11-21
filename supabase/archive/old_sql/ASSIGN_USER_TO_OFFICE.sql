-- =====================================================
-- ASSIGN USER TO BOOKING OFFICE
-- =====================================================

-- User ID: 7929a885-a6fb-4e08-b296-a16f685c42a6

-- Step 1: Check if booking_offices table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'booking_offices';

-- Step 2: Check current booking offices
SELECT id, name, location, manager_id, status
FROM booking_offices;

-- Step 3: Option A - Create a new booking office with this user as manager
INSERT INTO booking_offices (
  name,
  location,
  operating_hours,
  contact_number,
  manager_id,
  status
) VALUES (
  'Main Booking Office',           -- Change this name
  'City Center',                    -- Change this location
  '08:00 - 18:00',                 -- Operating hours
  '+1234567890',                   -- Contact number
  '7929a885-a6fb-4e08-b296-a16f685c42a6',  -- User ID as manager
  'active'
);

-- Step 4: Option B - Update existing office to assign this user as manager
-- UPDATE booking_offices
-- SET manager_id = '7929a885-a6fb-4e08-b296-a16f685c42a6'
-- WHERE id = 'existing-office-uuid-here';

-- Step 5: Verify the assignment
SELECT 
  bo.id,
  bo.name,
  bo.location,
  bo.manager_id,
  u.email as manager_email,
  bo.status
FROM booking_offices bo
LEFT JOIN auth.users u ON bo.manager_id = u.id
WHERE bo.manager_id = '7929a885-a6fb-4e08-b296-a16f685c42a6';

-- =====================================================
-- ALTERNATIVE: If you need a user_office mapping table
-- =====================================================

-- If you want users to be assigned to offices (not just managers),
-- you might need a junction table:

CREATE TABLE IF NOT EXISTS public.user_offices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  office_id UUID NOT NULL REFERENCES booking_offices(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'staff', -- 'manager', 'staff', 'cashier', etc.
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, office_id)
);

-- Enable RLS
ALTER TABLE public.user_offices ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Allow all for authenticated users" 
ON public.user_offices 
FOR ALL 
TO authenticated 
USING (true);

-- Assign user to office
INSERT INTO user_offices (user_id, office_id, role)
VALUES (
  '7929a885-a6fb-4e08-b296-a16f685c42a6',
  (SELECT id FROM booking_offices LIMIT 1), -- Or specify office ID
  'manager'
);

-- Verify assignment
SELECT 
  uo.id,
  uo.user_id,
  u.email,
  bo.name as office_name,
  bo.location,
  uo.role,
  uo.assigned_at
FROM user_offices uo
JOIN auth.users u ON uo.user_id = u.id
JOIN booking_offices bo ON uo.office_id = bo.id
WHERE uo.user_id = '7929a885-a6fb-4e08-b296-a16f685c42a6';

-- =====================================================
-- DONE!
-- =====================================================
