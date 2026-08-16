-- Run this AFTER schema.sql to confirm everything is set up correctly.
-- SQL Editor → New query → Run

SELECT 'app_state' AS table_name, COUNT(*) AS rows FROM public.app_state
UNION ALL
SELECT 'change_log', COUNT(*) FROM public.change_log;

-- Should show app_state with 1 row (main), change_log with 0+ rows

SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('app_state', 'change_log');

-- rowsecurity should be true for both

SELECT policyname, tablename, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('app_state', 'change_log');

-- Should show hmc_app_state_all and hmc_change_log_all for anon/authenticated
