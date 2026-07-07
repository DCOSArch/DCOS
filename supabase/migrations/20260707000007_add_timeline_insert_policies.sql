-- Add INSERT policies for timeline_events table to support RLS inserts by dentists and labs
CREATE POLICY "Dentists can insert timeline events" ON public.timeline_events
  FOR INSERT WITH CHECK (
    dentist_id = auth.uid()
  );

CREATE POLICY "Labs can insert timeline events" ON public.timeline_events
  FOR INSERT WITH CHECK (
    lab_id = (SELECT lab_id FROM public.users WHERE id = auth.uid())
  );
