-- Add Supabase Storage bucket for STL/PLY scans

INSERT INTO storage.buckets (id, name, public) 
VALUES ('scans', 'scans', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for the scans bucket
-- For Phase 1 (mocking), we allow public/anon uploads so we don't have to fully wire up Supabase Auth to React just yet.
-- In production, this should be restricted to authenticated users (e.g. DENTIST role).

CREATE POLICY "Allow public uploads to scans bucket" 
ON storage.objects FOR INSERT 
TO public
WITH CHECK (bucket_id = 'scans');

CREATE POLICY "Allow public selection from scans bucket" 
ON storage.objects FOR SELECT 
TO public
USING (bucket_id = 'scans');

CREATE POLICY "Allow public updates to scans bucket" 
ON storage.objects FOR UPDATE 
TO public
USING (bucket_id = 'scans');

CREATE POLICY "Allow public deletion from scans bucket" 
ON storage.objects FOR DELETE 
TO public
USING (bucket_id = 'scans');
