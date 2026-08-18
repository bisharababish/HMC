-- =============================================================================
-- HMC — Admin & user login (run AFTER schema.sql)
-- =============================================================================
-- Simple email + password login only — NO verification emails.
-- New accounts are auto-confirmed in the database (see handle_new_user).
-- Optional: Supabase → Authentication → Settings → turn OFF "Confirm email"
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- PROFILES (linked to Supabase Auth users)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT        NOT NULL,
  role         TEXT        NOT NULL CHECK (role IN ('admin', 'user')),
  display_name TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (lower(email));

COMMENT ON TABLE public.profiles IS 'App roles: admin = company owner, user = labeling checkout only';

-- =============================================================================
-- WORKBOOK ACCESS (labeling workbooks only)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.workbook_access (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id  TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, module_id)
);

CREATE INDEX IF NOT EXISTS workbook_access_module_idx ON public.workbook_access (module_id);
CREATE INDEX IF NOT EXISTS workbook_access_user_idx ON public.workbook_access (user_id);

COMMENT ON TABLE public.workbook_access IS 'Which labeling workbook(s) a user can access for take-out only';

-- =============================================================================
-- HELPERS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Auto-create profile + auto-confirm email (no verification step)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
  WHERE id = NEW.id;

  INSERT INTO public.profiles (id, email, role, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'user'),
    NULLIF(NEW.raw_user_meta_data->>'display_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workbook_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_delete" ON public.profiles;

CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_admin_insert"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "profiles_admin_update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "profiles_admin_delete"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "workbook_access_select_own_or_admin" ON public.workbook_access;
DROP POLICY IF EXISTS "workbook_access_admin_write" ON public.workbook_access;
DROP POLICY IF EXISTS "workbook_access_admin_delete" ON public.workbook_access;

CREATE POLICY "workbook_access_select_own_or_admin"
  ON public.workbook_access FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "workbook_access_admin_write"
  ON public.workbook_access FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "workbook_access_admin_delete"
  ON public.workbook_access FOR DELETE
  TO authenticated
  USING (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.workbook_access TO authenticated;

-- Require login for inventory data (remove anonymous access)
DROP POLICY IF EXISTS "hmc_app_state_all" ON public.app_state;
DROP POLICY IF EXISTS "hmc_app_state_authenticated" ON public.app_state;
DROP POLICY IF EXISTS "hmc_change_log_all" ON public.change_log;
DROP POLICY IF EXISTS "hmc_change_log_authenticated" ON public.change_log;

CREATE POLICY "hmc_app_state_authenticated"
  ON public.app_state FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "hmc_change_log_authenticated"
  ON public.change_log FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

REVOKE ALL ON public.app_state FROM anon;
REVOKE ALL ON public.change_log FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_state TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.change_log TO authenticated;

-- =============================================================================
-- DEFAULT LOGINS — run seed-users.sql after this file:
--   admin@gmail.com / admin2026      (owner — full access)
--   labeling@gmail.com / labeling2026 (staff — take-out only)
-- =============================================================================

-- Confirm all existing users immediately (safe to re-run) — no email verification
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;
