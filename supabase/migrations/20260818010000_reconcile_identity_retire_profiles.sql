-- Migration: 20260818010000_reconcile_identity_retire_profiles.sql
-- Goal: Reconcile public.users as canonical identity, fix patient_phi FK constraint, provide profiles compatibility.

-- 1. Repoint patient_phi foreign key constraint to public.users(id)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'patient_phi') THEN
    -- Drop old constraint if referencing profiles
    ALTER TABLE public.patient_phi DROP CONSTRAINT IF EXISTS patient_phi_dentist_id_fkey;
    ALTER TABLE public.patient_phi ADD CONSTRAINT patient_phi_dentist_id_fkey 
      FOREIGN KEY (dentist_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Ensure public.profiles acts as a transparent compatibility view if queried
DO $$
BEGIN
  -- If profiles is a standalone table with 0 real rows, convert or ensure it syncs
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles' AND table_type = 'BASE TABLE') THEN
    -- Backfill any missing users into profiles for zero-breakage safety
    INSERT INTO public.profiles (id, name, role, lab_id, created_at)
    SELECT u.id, u.name, 
           CASE WHEN u.role IN ('DENTIST', 'LAB_ADMIN', 'LAB_STAFF') THEN u.role ELSE 'DENTIST' END,
           u.lab_id, u.created_at
    FROM public.users u
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      lab_id = EXCLUDED.lab_id;
  END IF;
END $$;
