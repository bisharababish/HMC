-- Clear all backup snapshots (change_log) — run in Supabase SQL Editor
-- Does NOT change your current inventory in app_state

DELETE FROM public.change_log;

-- Optional: also clear recent activity in live data
-- UPDATE public.app_state
-- SET data = jsonb_set(data, '{checkoutLog}', '[]'::jsonb),
--     updated_at = NOW()
-- WHERE id = 'main';
