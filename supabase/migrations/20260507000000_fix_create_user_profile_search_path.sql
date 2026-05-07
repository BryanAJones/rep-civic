-- Fix: GoTrue cannot save new users.
--
-- create_user_profile() fires AFTER INSERT on auth.users. It's
-- SECURITY DEFINER (runs as postgres), but search_path is resolved
-- against the caller's session, not the function owner. The
-- supabase_auth_admin role — which is the role GoTrue connects as
-- when creating users — has rolconfig `search_path=auth`. So the
-- unqualified `INSERT INTO user_profiles` resolves to
-- `auth.user_profiles`, which doesn't exist, and the whole auth.users
-- INSERT rolls back. GoTrue surfaces this as
-- "Database error saving new user" / 500 unexpected_failure.
--
-- Two-fix-for-defense:
--   1. Schema-qualify the target table (public.user_profiles).
--   2. SET search_path on the function so any future unqualified
--      reference still resolves correctly.

CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, handle, is_anonymous)
  VALUES (
    NEW.id,
    '@voter_' || LEFT(NEW.id::text, 8),
    NEW.is_anonymous
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;
