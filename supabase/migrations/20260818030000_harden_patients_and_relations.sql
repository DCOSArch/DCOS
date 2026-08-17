-- Migration: 20260818030000_harden_patients_and_relations.sql
-- Goal:
-- 1. Add DEFAULT gen_random_uuid()::text to patients.id to prevent insert failures on client forms
-- 2. Ensure placeholder lab_profile exists for orphaned lab_id before FK creation
-- 3. Add foreign key constraint users.lab_id -> lab_profiles(id)
-- 4. Add foreign key constraint cases.patient_id -> patients(id)

-- 1. Set DEFAULT on patients.id
ALTER TABLE public.patients ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- 2. Ensure placeholder lab_profile exists for orphaned lab_id
INSERT INTO public.lab_profiles (id, name, rating, reviews_count)
VALUES ('570cc092-16bc-46d5-a9e6-cf30e904be04', 'Arshan Dental Lab', 5.0, 1)
ON CONFLICT (id) DO NOTHING;

-- 3. Add foreign key from users.lab_id -> lab_profiles(id)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_lab_id_fkey;
ALTER TABLE public.users ADD CONSTRAINT users_lab_id_fkey 
  FOREIGN KEY (lab_id) REFERENCES public.lab_profiles(id) ON DELETE SET NULL;

-- 4. Add foreign key from cases.patient_id -> patients(id)
ALTER TABLE public.cases DROP CONSTRAINT IF EXISTS cases_patient_id_fkey;
ALTER TABLE public.cases ADD CONSTRAINT cases_patient_id_fkey 
  FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE SET NULL;
