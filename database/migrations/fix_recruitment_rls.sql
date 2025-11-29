-- Fix RLS policies for recruitment tables

-- First, ensure RLS is enabled
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "job_postings_select_policy" ON job_postings;
DROP POLICY IF EXISTS "job_postings_insert_policy" ON job_postings;
DROP POLICY IF EXISTS "job_postings_update_policy" ON job_postings;
DROP POLICY IF EXISTS "job_postings_delete_policy" ON job_postings;

DROP POLICY IF EXISTS "job_applications_select_policy" ON job_applications;
DROP POLICY IF EXISTS "job_applications_insert_policy" ON job_applications;
DROP POLICY IF EXISTS "job_applications_update_policy" ON job_applications;
DROP POLICY IF EXISTS "job_applications_delete_policy" ON job_applications;

-- Job Postings Policies

-- Allow public users to view active job postings
CREATE POLICY "job_postings_public_select_active" ON job_postings
    FOR SELECT USING (status = 'active');

-- Allow authenticated users with admin/hr roles to manage job postings
CREATE POLICY "job_postings_admin_select" ON job_postings
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM auth.users u
            JOIN user_roles ur ON u.id = ur.user_id
            WHERE u.id = auth.uid() 
            AND ur.is_active = true
            AND ur.role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR_STAFF')
        )
    );

CREATE POLICY "job_postings_admin_insert" ON job_postings
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM auth.users u
            JOIN user_roles ur ON u.id = ur.user_id
            WHERE u.id = auth.uid() 
            AND ur.is_active = true
            AND ur.role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR_STAFF')
        )
    );

CREATE POLICY "job_postings_admin_update" ON job_postings
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM auth.users u
            JOIN user_roles ur ON u.id = ur.user_id
            WHERE u.id = auth.uid() 
            AND ur.is_active = true
            AND ur.role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR_STAFF')
        )
    );

CREATE POLICY "job_postings_admin_delete" ON job_postings
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM auth.users u
            JOIN user_roles ur ON u.id = ur.user_id
            WHERE u.id = auth.uid() 
            AND ur.is_active = true
            AND ur.role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR_STAFF')
        )
    );

-- Job Applications Policies

-- Allow authenticated users with admin/hr roles to view all applications
CREATE POLICY "job_applications_admin_select" ON job_applications
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM auth.users u
            JOIN user_roles ur ON u.id = ur.user_id
            WHERE u.id = auth.uid() 
            AND ur.is_active = true
            AND ur.role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR_STAFF')
        )
    );

-- Allow anyone (including anonymous) to submit job applications
CREATE POLICY "job_applications_public_insert" ON job_applications
    FOR INSERT WITH CHECK (true);

-- Allow authenticated users with admin/hr roles to update applications
CREATE POLICY "job_applications_admin_update" ON job_applications
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM auth.users u
            JOIN user_roles ur ON u.id = ur.user_id
            WHERE u.id = auth.uid() 
            AND ur.is_active = true
            AND ur.role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR_STAFF')
        )
    );

-- Allow authenticated users with admin/hr roles to delete applications
CREATE POLICY "job_applications_admin_delete" ON job_applications
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM auth.users u
            JOIN user_roles ur ON u.id = ur.user_id
            WHERE u.id = auth.uid() 
            AND ur.is_active = true
            AND ur.role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR_STAFF')
        )
    );

-- Grant necessary permissions
GRANT SELECT ON job_postings TO anon;
GRANT SELECT ON job_postings TO authenticated;
GRANT INSERT ON job_postings TO authenticated;
GRANT UPDATE ON job_postings TO authenticated;
GRANT DELETE ON job_postings TO authenticated;

GRANT SELECT ON job_applications TO anon;
GRANT SELECT ON job_applications TO authenticated;
GRANT INSERT ON job_applications TO anon;
GRANT INSERT ON job_applications TO authenticated;
GRANT UPDATE ON job_applications TO authenticated;
GRANT DELETE ON job_applications TO authenticated;

-- Create storage policy for resume uploads if not exists
INSERT INTO storage.policies (id, name, definition, created_at)
SELECT 
    uuid_generate_v4(),
    'resumes_public_upload',
    '{
        "bucket_id": "resumes",
        "allowed_mime_types": ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        "allowed_headers": ["*"],
        "max_size": 5242880
    }',
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM storage.policies WHERE name = 'resumes_public_upload'
);

-- Enable public access to resumes bucket for uploads
CREATE POLICY "resumes_public_upload_policy" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'resumes' AND
        (storage.extension(name)[1] = 'pdf' OR 
         storage.extension(name)[1] = 'doc' OR 
         storage.extension(name)[1] = 'docx')
    );

-- Allow public access to resume files for viewing
CREATE POLICY "resumes_public_select_policy" ON storage.objects
    FOR SELECT USING (bucket_id = 'resumes');

GRANT ALL ON storage.objects TO anon;
GRANT ALL ON storage.objects TO authenticated;
