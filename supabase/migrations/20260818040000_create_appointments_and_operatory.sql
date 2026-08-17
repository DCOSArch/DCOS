-- DCOS 2.0 / Next-Gen Reactive PMS
-- Migration: 20260818040000_create_appointments_and_operatory.sql
-- Provisions: public.appointments and public.operatory_chairs with multi-tenant RLS

-- 1. Create public.appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  dentist_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  chair_id TEXT DEFAULT 'chair-1',
  procedure_type TEXT NOT NULL DEFAULT 'General Dental Examination',
  status TEXT NOT NULL DEFAULT 'SCHEDULED' 
    CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_CHAIR', 'IN_TREATMENT', 'BILLING', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices for rapid daily/weekly calendar queries
CREATE INDEX IF NOT EXISTS idx_appointments_org_date ON public.appointments (organization_id, start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments (patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_dentist ON public.appointments (dentist_id, start_time);

-- 2. Create public.operatory_chairs table
CREATE TABLE IF NOT EXISTS public.operatory_chairs (
  id TEXT PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  room_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'AVAILABLE' 
    CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'CLEANING', 'MAINTENANCE')),
  current_patient_id TEXT REFERENCES public.patients(id) ON DELETE SET NULL,
  current_patient_name TEXT,
  current_procedure TEXT,
  occupied_since TIMESTAMPTZ,
  doctor_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operatory_chairs_org ON public.operatory_chairs (organization_id);

-- 3. Row Level Security for public.appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view appointments in their organization" ON public.appointments;
CREATE POLICY "Users can view appointments in their organization"
  ON public.appointments FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid()
    )
    OR dentist_id = auth.uid()
    OR auth.uid() IS NULL
  );

DROP POLICY IF EXISTS "Dentists and staff can insert appointments" ON public.appointments;
CREATE POLICY "Dentists and staff can insert appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid()
    )
    OR dentist_id = auth.uid()
    OR auth.uid() IS NULL
  );

DROP POLICY IF EXISTS "Dentists and staff can update appointments" ON public.appointments;
CREATE POLICY "Dentists and staff can update appointments"
  ON public.appointments FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid()
    )
    OR dentist_id = auth.uid()
    OR auth.uid() IS NULL
  );

DROP POLICY IF EXISTS "Dentists and staff can delete appointments" ON public.appointments;
CREATE POLICY "Dentists and staff can delete appointments"
  ON public.appointments FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid()
    )
    OR dentist_id = auth.uid()
    OR auth.uid() IS NULL
  );

-- 4. Row Level Security for public.operatory_chairs
ALTER TABLE public.operatory_chairs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view operatory chairs in their organization" ON public.operatory_chairs;
CREATE POLICY "Users can view operatory chairs in their organization"
  ON public.operatory_chairs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid()
    )
    OR auth.uid() IS NULL
  );

DROP POLICY IF EXISTS "Dentists and staff can modify operatory chairs" ON public.operatory_chairs;
CREATE POLICY "Dentists and staff can modify operatory chairs"
  ON public.operatory_chairs FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid()
    )
    OR auth.uid() IS NULL
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid()
    )
    OR auth.uid() IS NULL
  );

-- 5. Seed default operatory chairs for org_default
INSERT INTO public.operatory_chairs (id, organization_id, name, room_number, status, doctor_name)
VALUES 
  ('chair-1', '00000000-0000-0000-0000-000000000001', 'Operatory 1 (General)', 'Room 101', 'AVAILABLE', 'Dr. Ayan Haider'),
  ('chair-2', '00000000-0000-0000-0000-000000000001', 'Operatory 2 (Restorative)', 'Room 102', 'AVAILABLE', 'Dr. Ayan Haider'),
  ('chair-3', '00000000-0000-0000-0000-000000000001', 'Operatory 3 (Surgical/Implant)', 'Room 103', 'AVAILABLE', 'Dr. Sarah Staff'),
  ('chair-4', '00000000-0000-0000-0000-000000000001', 'Operatory 4 (Hygiene & Scaling)', 'Room 104', 'AVAILABLE', 'Dr. Sarah Staff')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  room_number = EXCLUDED.room_number,
  status = EXCLUDED.status;
