-- S-15: Rate limiting infrastructure.
-- Fixed-window counter per (user, endpoint, window_start). Cheap reads/writes
-- via the composite PK; old windows reaped nightly by pg_cron.

-- ============================================================
-- 1. rate_limit_buckets table
-- ============================================================
CREATE TABLE rate_limit_buckets (
  user_id       UUID NOT NULL,
  endpoint      TEXT NOT NULL,
  window_start  TIMESTAMPTZ NOT NULL,
  count         INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, endpoint, window_start)
);

CREATE INDEX idx_rate_limit_buckets_window ON rate_limit_buckets(window_start);

ALTER TABLE rate_limit_buckets ENABLE ROW LEVEL SECURITY;
-- No policies = RLS denies by default. Only service_role touches this table.

-- ============================================================
-- 2. check_rate_limit(p_user, p_endpoint, p_limit, p_window_seconds)
--    Atomically increments the current window and returns TRUE when the
--    caller is within budget. p_window_seconds is a fixed aligned window
--    (e.g., 60s buckets align to every minute boundary).
-- ============================================================
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user UUID,
  p_endpoint TEXT,
  p_limit INT,
  p_window_seconds INT
)
RETURNS TABLE (
  allowed BOOLEAN,
  current_count INT,
  retry_after_seconds INT
) AS $$
DECLARE
  now_epoch BIGINT := EXTRACT(EPOCH FROM now())::BIGINT;
  window_epoch BIGINT := (now_epoch / p_window_seconds) * p_window_seconds;
  current_window TIMESTAMPTZ := to_timestamp(window_epoch);
  next_window TIMESTAMPTZ := to_timestamp(window_epoch + p_window_seconds);
  new_count INT;
BEGIN
  INSERT INTO rate_limit_buckets (user_id, endpoint, window_start, count)
  VALUES (p_user, p_endpoint, current_window, 1)
  ON CONFLICT (user_id, endpoint, window_start)
  DO UPDATE SET count = rate_limit_buckets.count + 1
  RETURNING count INTO new_count;

  allowed := new_count <= p_limit;
  current_count := new_count;
  retry_after_seconds := CASE
    WHEN allowed THEN 0
    ELSE GREATEST(1, EXTRACT(EPOCH FROM (next_window - now()))::INT)
  END;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- Only service_role may invoke this RPC.
REVOKE EXECUTE ON FUNCTION check_rate_limit(UUID, TEXT, INT, INT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION check_rate_limit(UUID, TEXT, INT, INT) FROM anon, authenticated;

-- ============================================================
-- 3. Nightly cleanup of old windows (older than 1 day)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'rate-limit-buckets-cleanup'
  ) THEN
    PERFORM cron.unschedule('rate-limit-buckets-cleanup');
  END IF;
END $$;

SELECT cron.schedule(
  'rate-limit-buckets-cleanup',
  '17 3 * * *',
  $$DELETE FROM public.rate_limit_buckets WHERE window_start < now() - interval '1 day'$$
);
