-- Fix job_applications table schema to match frontend expectations
-- Execute this in Supabase SQL Editor

-- First, let's check if we need to add missing columns or rename existing ones

-- Add missing columns if they don't exist
ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES job_postings(id),
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS experience TEXT;

-- Update existing data to use the new column names if needed
UPDATE job_applications 
SET job_id = job_posting_id, 
    full_name = COALESCE(applicant_name, '')
WHERE job_id IS NULL AND job_posting_id IS NOT NULL;

-- Make the new columns nullable for now to avoid breaking existing data
ALTER TABLE job_applications ALTER COLUMN job_id DROP NOT NULL;
ALTER TABLE job_applications ALTER COLUMN full_name DROP NOT NULL;

-- Keep old columns for backward compatibility but make them optional
ALTER TABLE job_applications ALTER COLUMN job_posting_id DROP NOT NULL;
ALTER TABLE job_applications ALTER COLUMN applicant_name DROP NOT NULL;

-- Fix RLS policies for the updated schema
DROP POLICY IF EXISTS "Anyone can submit applications" ON job_applications;
DROP POLICY IF EXISTS "Authenticated users can manage applications" ON job_applications;

-- Create new policies that work with the current schema
CREATE POLICY "Anyone can submit applications" ON job_applications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can manage applications" ON job_applications
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant proper permissions
GRANT ALL ON job_applications TO authenticated;
GRANT ALL ON job_applications TO anon;
