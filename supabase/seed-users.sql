-- =============================================================================
-- HMC — Default login accounts (run AFTER auth.sql)
-- Safe to re-run — updates passwords if accounts already exist
-- =============================================================================
-- Admin:    admin@gmail.com    / admin2026
-- Labeling: labeling@gmail.com / labeling2026
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.seed_auth_user(
  p_email     TEXT,
  p_password  TEXT,
  p_role      TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id     UUID;
  v_instance_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = lower(p_email);

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    SELECT instance_id INTO v_instance_id FROM auth.users LIMIT 1;
    IF v_instance_id IS NULL THEN
      v_instance_id := '00000000-0000-0000-0000-000000000000';
    END IF;

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      is_super_admin,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      v_instance_id,
      v_user_id,
      'authenticated',
      'authenticated',
      lower(p_email),
      crypt(p_password, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('role', p_role),
      NOW(),
      NOW(),
      false,
      '',
      '',
      '',
      ''
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', lower(p_email),
        'email_verified', true
      ),
      'email',
      v_user_id::text,
      NOW(),
      NOW(),
      NOW()
    );
  ELSE
    UPDATE auth.users
    SET
      encrypted_password = crypt(p_password, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', p_role)
    WHERE id = v_user_id;
  END IF;

  INSERT INTO public.profiles (id, email, role)
  VALUES (v_user_id, lower(p_email), p_role)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        role  = EXCLUDED.role;

  RETURN v_user_id;
END;
$$;

-- Create / update accounts
SELECT public.seed_auth_user('admin@gmail.com', 'admin2026', 'admin');
SELECT public.seed_auth_user('labeling@gmail.com', 'labeling2026', 'user');

-- Labeling staff → access to Labeling Storage workbook
INSERT INTO public.workbook_access (user_id, module_id)
SELECT p.id, 'mod_labeling'
FROM public.profiles p
WHERE lower(p.email) = 'labeling@gmail.com'
ON CONFLICT (user_id, module_id) DO NOTHING;

-- Turn on staff login for the labeling workbook
UPDATE public.app_state
SET data = jsonb_set(
  data,
  '{modules}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN elem->>'id' = 'mod_labeling'
          THEN elem || '{"userAccessEnabled": true}'::jsonb
        ELSE elem
      END
    )
    FROM jsonb_array_elements(data->'modules') AS elem
  )
)
WHERE id = 'main'
  AND jsonb_typeof(data->'modules') = 'array';

-- =============================================================================
-- DONE — sign in at the app:
--   admin@gmail.com / admin2026     (full access)
--   labeling@gmail.com / labeling2026 (take-out only)
-- =============================================================================
