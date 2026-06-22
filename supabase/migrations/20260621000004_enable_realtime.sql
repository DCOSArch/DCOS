-- Enable Realtime for chat_messages and timeline_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.timeline_events;
