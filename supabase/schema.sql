-- =============================================================================
-- HMC LABELING STORAGE — Supabase database setup
-- =============================================================================
-- How to run:
--   1. Open your Supabase project
--   2. Go to SQL Editor → New query
--   3. Paste ALL of this file → Run
-- =============================================================================

-- Extensions (UUID + timestamps)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- TABLES
-- =============================================================================

-- Live inventory: all sheets, items, locations, checkout log
CREATE TABLE IF NOT EXISTS public.app_state (
  id          TEXT        PRIMARY KEY DEFAULT 'main',
  data        JSONB       NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.app_state IS 'Current HMC inventory snapshot (categories, locations, checkoutLog)';
COMMENT ON COLUMN public.app_state.data IS 'JSON snapshot — ALL live app data in one object:
  categories[]  → sheets (tabs), columns, rows/items (width, meters, qty, notes, location, material)
  locations[]   → warehouse / aisle / custom locations
  checkoutLog[] → recent stock take-out activity
  lang          → "en" or "ar"';

-- Full backup on every save — use Dashboard → Backup History to restore
CREATE TABLE IF NOT EXISTS public.change_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.change_log IS 'Historical JSON snapshots for restore / audit';

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS change_log_created_at_idx
  ON public.change_log (created_at DESC);

CREATE INDEX IF NOT EXISTS app_state_updated_at_idx
  ON public.app_state (updated_at DESC);

-- =============================================================================
-- AUTO-UPDATE updated_at on app_state
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS app_state_updated_at ON public.app_state;

CREATE TRIGGER app_state_updated_at
  BEFORE UPDATE ON public.app_state
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_log ENABLE ROW LEVEL SECURITY;

-- Drop old policies if re-running this script
DROP POLICY IF EXISTS "hmc_app_state_all" ON public.app_state;
DROP POLICY IF EXISTS "hmc_change_log_all" ON public.change_log;
DROP POLICY IF EXISTS "Allow public read write app_state" ON public.app_state;
DROP POLICY IF EXISTS "Allow public read write change_log" ON public.change_log;

-- Allow the app (anon key) to read and write
CREATE POLICY "hmc_app_state_all"
  ON public.app_state
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "hmc_change_log_all"
  ON public.change_log
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- PERMISSIONS (required for Supabase API)
-- =============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_state TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.change_log TO anon, authenticated;

-- =============================================================================
-- OPTIONAL: seed empty row so first load works cleanly
-- =============================================================================

INSERT INTO public.app_state (id, data)
VALUES ('main', '{"categories":[],"locations":[],"checkoutLog":[]}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- DONE — verify with:
--   SELECT * FROM app_state;
--   SELECT * FROM change_log LIMIT 5;
-- =============================================================================
