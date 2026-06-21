-- ==========================================
-- 20260621000003_storage_and_scan_url.sql
-- Storage bucket for scans and scan_url column
-- ==========================================

-- 1. Add scan_url to public.cases
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS scan_url text;

-- 2. Create the storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('scans', 'scans', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies
-- Note: Supabase storage policies apply to storage.objects

-- Allow authenticated users to upload to the "scans" bucket
CREATE POLICY "Authenticated users can upload scans"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'scans');

-- Allow authenticated users to read from the "scans" bucket
CREATE POLICY "Authenticated users can view scans"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'scans');

-- Allow users to update their own uploads if needed
CREATE POLICY "Users can update their own scans"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'scans' AND owner = auth.uid());
