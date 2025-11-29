-- Quick fix for job_postings status check constraint
-- Execute this in Supabase SQL Editor

-- Drop the problematic check constraint
ALTER TABLE job_postings DROP CONSTRAINT IF EXISTS job_postings_status_check;

-- Create a new check constraint that allows all valid status values
ALTER TABLE job_postings 
ADD CONSTRAINT job_postings_status_check 
CHECK (status IN ('active', 'closed', 'draft', 'inactive', 'archived', 'pending', 'reviewing', 'interview', 'accepted', 'rejected'));

-- Enable RLS if not already enabled
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can view active jobs" ON job_postings;
DROP POLICY IF EXISTS "Authenticated users can manage job_postings" ON job_postings;

-- Create proper policies
CREATE POLICY "Public can view active jobs" ON job_postings
    FOR SELECT USING (status = 'active');

CREATE POLICY "Authenticated users can manage job_postings" ON job_postings
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON job_postings TO authenticated;
GRANT SELECT ON job_postings TO anon;
