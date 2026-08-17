-- Migration: 20260818020000_remediate_identity_phi_and_catalog.sql
-- Goal: 
-- 1. Repoint legacy foreign keys from profiles -> users / lab_profiles
-- 2. Retire physical profiles table and convert to a transparent Postgres VIEW
-- 3. Harden patient_phi with FORCE ROW LEVEL SECURITY and create phi_access_logs audit table

-- Step A: Repoint spatial_annotations.author_id to public.users(id)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'spatial_annotations') THEN
    ALTER TABLE public.spatial_annotations DROP CONSTRAINT IF EXISTS spatial_annotations_author_id_fkey;
    ALTER TABLE public.spatial_annotations ADD CONSTRAINT spatial_annotations_author_id_fkey 
      FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step B: Repoint lab_services.lab_id to public.lab_profiles(id)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lab_services') THEN
    ALTER TABLE public.lab_services DROP CONSTRAINT IF EXISTS lab_services_lab_id_fkey;
    ALTER TABLE public.lab_services ADD CONSTRAINT lab_services_lab_id_fkey 
      FOREIGN KEY (lab_id) REFERENCES public.lab_profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step C: Drop physical profiles table (if table) and convert to transparent compatibility VIEW
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles' AND table_type = 'BASE TABLE') THEN
    DROP TABLE public.profiles CASCADE;
  END IF;
END $$;

CREATE OR REPLACE VIEW public.profiles AS
SELECT 
  id,
  name,
  role,
  lab_id,
  avatar_url,
  created_at
FROM public.users;

-- Step D: Harden patient_phi with FORCE ROW LEVEL SECURITY
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'patient_phi') THEN
    ALTER TABLE public.patient_phi FORCE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Step E: Create PHI Access Audit Ledger (HIPAA/GDPR Compliance)
CREATE TABLE IF NOT EXISTS public.phi_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_phi_id UUID REFERENCES public.patient_phi(id) ON DELETE CASCADE,
  accessed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('READ', 'WRITE', 'EXPORT')),
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.phi_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phi_access_logs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Dentists can view their own PHI access logs" ON public.phi_access_logs;
CREATE POLICY "Dentists can view their own PHI access logs"
ON public.phi_access_logs FOR SELECT
TO authenticated
USING (accessed_by = auth.uid());
