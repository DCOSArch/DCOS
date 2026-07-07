-- Add denormalized participant columns to timeline_events to bypass Supabase Realtime subquery RLS limitations
ALTER TABLE public.timeline_events ADD COLUMN IF NOT EXISTS dentist_id UUID REFERENCES public.users(id);
ALTER TABLE public.timeline_events ADD COLUMN IF NOT EXISTS lab_id UUID REFERENCES public.lab_profiles(id);

-- Populate existing events
UPDATE public.timeline_events t
SET dentist_id = c.dentist_id, lab_id = c.lab_id
FROM public.cases c
WHERE t.case_id = c.id;

-- Automated trigger to populate participant IDs on insert
CREATE OR REPLACE FUNCTION public.populate_timeline_event_participants()
RETURNS TRIGGER AS $$
BEGIN
    SELECT dentist_id, lab_id INTO NEW.dentist_id, NEW.lab_id
    FROM public.cases
    WHERE id = NEW.case_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_populate_timeline_event_participants
BEFORE INSERT ON public.timeline_events
FOR EACH ROW
EXECUTE FUNCTION public.populate_timeline_event_participants();

-- Recreate RLS policies with direct column checks
DROP POLICY IF EXISTS "Dentists see external timeline" ON public.timeline_events;
CREATE POLICY "Dentists see external timeline"
ON public.timeline_events FOR SELECT
USING (
    visibility IN ('EXTERNAL', 'BOTH') 
    AND 
    dentist_id = auth.uid()
);

DROP POLICY IF EXISTS "Labs see full internal timeline" ON public.timeline_events;
CREATE POLICY "Labs see full internal timeline"
ON public.timeline_events FOR SELECT
USING (
    lab_id = (SELECT lab_id FROM public.users WHERE id = auth.uid())
);
