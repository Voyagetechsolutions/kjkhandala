-- Quick fix for recruitment tables RLS policies
-- Execute this in Supabase SQL Editor

-- Enable RLS if not already enabled
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable insert for all users" ON job_postings;
DROP POLICY IF EXISTS "Enable select for all users" ON job_postings;
DROP POLICY IF EXISTS "Enable update for all users" ON job_postings;
DROP POLICY IF EXISTS "Enable delete for all users" ON job_postings;

DROP POLICY IF EXISTS "Enable insert for all users" ON job_applications;
DROP POLICY IF EXISTS "Enable select for all users" ON job_applications;
DROP POLICY IF EXISTS "Enable update for all users" ON job_applications;
DROP POLICY IF EXISTS "Enable delete for all users" ON job_applications;

-- Job Postings Policies - Public can see active jobs
CREATE POLICY "Public can view active jobs" ON job_postings
    FOR SELECT USING (status = 'active');

-- Authenticated users can manage job postings
CREATE POLICY "Authenticated users can manage job postings" ON job_postings
    FOR ALL USING (auth.role() = 'authenticated');

-- Job Applications Policies - Anyone can submit applications
CREATE POLICY "Anyone can submit applications" ON job_applications
    FOR INSERT WITH CHECK (true);

-- Authenticated users can view and manage applications
CREATE POLICY "Authenticated users can manage applications" ON job_applications
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON job_postings TO authenticated;
GRANT ALL ON job_postings TO anon;
GRANT ALL ON job_applications TO authenticated;
GRANT ALL ON job_applications TO anon;

-- Storage policies for resumes
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public uploads to resumes bucket
CREATE POLICY "Allow public uploads" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'resumes');

-- Allow public access to resume files
CREATE POLICY "Allow public access to resumes" ON storage.objects
    FOR SELECT USING (bucket_id = 'resumes');

GRANT ALL ON storage.objects TO anon;
GRANT ALL ON storage.objects TO authenticated;
