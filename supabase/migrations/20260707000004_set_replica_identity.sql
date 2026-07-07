-- Set replica identity to FULL for cases and timeline_events to allow real-time RLS routing of update payloads
ALTER TABLE public.cases REPLICA IDENTITY FULL;
ALTER TABLE public.timeline_events REPLICA IDENTITY FULL;
