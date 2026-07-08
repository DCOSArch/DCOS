-- Purge function to clear expired 3D scan and CBCT references after 30 days (Indian Dental Standards)
CREATE OR REPLACE FUNCTION public.purge_expired_scans()
RETURNS void AS $$
BEGIN
  -- Nullify scan file paths to mark them for deletion/cleanup
  UPDATE public.cases 
  SET scan_url = NULL, dicom_url = NULL
  WHERE (status = 'DELIVERED' OR status = 'COMPLETED') 
    AND (created_at < NOW() - INTERVAL '30 days');
    
  -- Log the purge event in timeline_events for active case auditing
  INSERT INTO public.timeline_events (case_id, status_update, notes, visibility)
  SELECT id, 'Scan Data Purged', 'Patient 3D scan files automatically purged under 30-day retention policies.', 'BOTH'
  FROM public.cases
  WHERE (status = 'DELIVERED' OR status = 'COMPLETED') 
    AND (created_at < NOW() - INTERVAL '30 days')
    AND (scan_url IS NOT NULL OR dicom_url IS NOT NULL);
END;
$$ LANGUAGE plpgsql;

-- Schedule nightly execution at midnight using pg_cron (if available)
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('daily-scan-purge', '0 0 * * *', 'SELECT public.purge_expired_scans()');
