-- Migration: 20260818000000_fix_lab_patient_rls.sql
-- Fix: Lab staff RLS policy for viewing patients linked to their lab's cases
-- Reason: cases.lab_id references lab_profiles(id), not users(id). We must join via users.lab_id.

DROP POLICY IF EXISTS "Lab staff can view patients for their cases" ON public.patients;

CREATE POLICY "Lab staff can view patients for their cases"
ON public.patients FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.cases c
    JOIN public.users u ON u.lab_id = c.lab_id
    WHERE c.patient_id = patients.id
      AND u.id = auth.uid()
  )
);
