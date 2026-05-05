-- Nightly cleanup of expired voterinfo_cache rows.
-- Complements the opportunistic inline cleanup in proxy-voterinfo so the
-- cache stays small even if traffic goes quiet between elections.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Unschedule any prior job with the same name so repeated migration runs
-- (e.g., branch rebuilds) don't accumulate duplicate schedules.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'voterinfo-cache-cleanup'
  ) THEN
    PERFORM cron.unschedule('voterinfo-cache-cleanup');
  END IF;
END $$;

SELECT cron.schedule(
  'voterinfo-cache-cleanup',
  '7 3 * * *',
  $$DELETE FROM public.voterinfo_cache WHERE expires_at < now()$$
);
