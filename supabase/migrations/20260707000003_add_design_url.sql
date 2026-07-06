-- Migration to add design_url column for CAD/CAM designs and create storage bucket
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS design_url text;

-- Create the storage bucket for final designs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('designs', 'designs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for "designs" bucket
CREATE POLICY "Authenticated users can view designs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'designs');

CREATE POLICY "Lab administrators can upload designs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'designs');
