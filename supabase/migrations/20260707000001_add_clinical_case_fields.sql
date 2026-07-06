-- Migration to add shade, selected_teeth, and instructions to cases table
ALTER TABLE public.cases 
ADD COLUMN IF NOT EXISTS shade text,
ADD COLUMN IF NOT EXISTS selected_teeth integer[],
ADD COLUMN IF NOT EXISTS instructions text;
