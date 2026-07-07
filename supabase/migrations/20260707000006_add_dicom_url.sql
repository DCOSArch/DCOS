-- Add dicom_url text column to cases table to support surgical guide CBCT files
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS dicom_url TEXT;
