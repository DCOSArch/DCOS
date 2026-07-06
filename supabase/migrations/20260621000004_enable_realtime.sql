-- Enable Realtime for chat_messages, timeline_events, and cases
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.timeline_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cases;
