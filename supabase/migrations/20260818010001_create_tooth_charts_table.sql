-- Migration: 20260818010001_create_tooth_charts_table.sql
-- Goal: Transition Odontogram tooth charts from browser localStorage into Postgres with multi-tenant RLS.

CREATE TABLE IF NOT EXISTS public.tooth_charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  chart_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tooth_charts_patient_id_key UNIQUE (patient_id)
);

ALTER TABLE public.tooth_charts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tooth charts for accessible patients"
ON public.tooth_charts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = tooth_charts.patient_id
      AND (
        p.dentist_id = auth.uid()
        OR p.organization_id IN (
          SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid()
        )
      )
  )
);

CREATE POLICY "Users can insert/update tooth charts for accessible patients"
ON public.tooth_charts FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = tooth_charts.patient_id
      AND (
        p.dentist_id = auth.uid()
        OR p.organization_id IN (
          SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid()
        )
      )
  )
);
