-- Migration: Add Profile Images Support
-- Date: 2025-10-17
-- Purpose: Add profile_image_url field to sales_reps table and setup storage

-- Add profile_image_url column to sales_reps
ALTER TABLE sales_reps
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Create storage bucket for sales rep profile images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('sales-rep-avatars', 'sales-rep-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies first (to avoid errors on re-run)
DROP POLICY IF EXISTS "Authenticated users can upload sales rep avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view sales rep avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update sales rep avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete sales rep avatars" ON storage.objects;

-- Storage policy: Authenticated users can upload sales rep avatars
CREATE POLICY "Authenticated users can upload sales rep avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'sales-rep-avatars');

-- Storage policy: Anyone can view sales rep avatars
CREATE POLICY "Anyone can view sales rep avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'sales-rep-avatars');

-- Storage policy: Authenticated users can update sales rep avatars
CREATE POLICY "Authenticated users can update sales rep avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'sales-rep-avatars')
  WITH CHECK (bucket_id = 'sales-rep-avatars');

-- Storage policy: Authenticated users can delete sales rep avatars
CREATE POLICY "Authenticated users can delete sales rep avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'sales-rep-avatars');

-- Add comment to column
COMMENT ON COLUMN sales_reps.profile_image_url IS 'URL to profile image in Supabase Storage (sales-rep-avatars bucket)';
