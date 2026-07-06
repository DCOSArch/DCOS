-- Migration to add DRAFT status to cases table check constraint
ALTER TABLE public.cases DROP CONSTRAINT IF EXISTS cases_status_check;
ALTER TABLE public.cases ADD CONSTRAINT cases_status_check CHECK (status = ANY (ARRAY['DRAFT'::text, 'PENDING'::text, 'IN_PROGRESS'::text, 'QUALITY_CHECK'::text, 'DISPATCHED'::text, 'DELIVERED'::text]));
