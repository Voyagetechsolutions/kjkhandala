# Supabase Storage Buckets Setup

## Required Storage Buckets

### 1. Resumes Bucket
**Name:** `resumes`
**Purpose:** Store job applicant resumes and CVs

**Settings:**
- Public: `false` (private bucket)
- File size limit: 5MB
- Allowed MIME types: 
  - `application/pdf`
  - `application/msword`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

**RLS Policies:**
```sql
-- Allow authenticated users to upload resumes
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'resumes');

-- Allow authenticated users to read their own uploads
CREATE POLICY "Allow authenticated reads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'resumes');

-- Allow HR and Admin to read all resumes
CREATE POLICY "Allow HR/Admin to read all"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'hr')
  )
);
```

## Setup Instructions

1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Name: `resumes`
4. Set as Private
5. Click "Create bucket"
6. Go to bucket → Policies
7. Add the RLS policies above

## Usage in Application

The Careers page (`/careers`) allows public users to:
- Browse active job postings
- Submit applications with resume upload
- Resumes are stored securely in the `resumes` bucket

HR and Admin dashboards (`/hr/recruitment` and `/admin/hr/recruitment`) allow:
- Creating/editing job postings
- Viewing applications
- Downloading applicant resumes
- Managing recruitment pipeline
