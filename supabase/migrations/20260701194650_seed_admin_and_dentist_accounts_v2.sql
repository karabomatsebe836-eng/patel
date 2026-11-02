
/*
# Seed pre-configured Admin and Dentist accounts (v2)

Fixed auth.identities insert — id column is uuid, not text.

The seeded accounts receive random, undisclosed passwords. Set their passwords
through Supabase Auth before signing in.
*/

DO $$
DECLARE
  v_admin_id   uuid;
  v_dentist_id uuid;
BEGIN

  -- ── Admin ──────────────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'pacific66@adminsolutions.com') THEN
    v_admin_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_admin_id, 'authenticated', 'authenticated',
      'pacific66@adminsolutions.com',
      crypt(gen_random_uuid()::text, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Pacific Admin","role":"admin"}',
      FALSE, NOW(), NOW(), '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      v_admin_id::text,
      v_admin_id,
      jsonb_build_object('sub', v_admin_id::text, 'email', 'pacific66@adminsolutions.com'),
      'email',
      NOW(), NOW(), NOW()
    );
  END IF;

  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'pacific66@adminsolutions.com';

  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (v_admin_id, 'Pacific Admin', 'pacific66@adminsolutions.com', 'admin')
  ON CONFLICT (id) DO UPDATE
    SET role = 'admin',
        full_name = COALESCE(NULLIF(public.profiles.full_name, ''), 'Pacific Admin'),
        updated_at = NOW();

  -- ── Dentist ────────────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'doctor@pacificdentistsolutions.com') THEN
    v_dentist_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_dentist_id, 'authenticated', 'authenticated',
      'doctor@pacificdentistsolutions.com',
      crypt(gen_random_uuid()::text, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Dr. Pacific Dentist","role":"dentist"}',
      FALSE, NOW(), NOW(), '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      v_dentist_id::text,
      v_dentist_id,
      jsonb_build_object('sub', v_dentist_id::text, 'email', 'doctor@pacificdentistsolutions.com'),
      'email',
      NOW(), NOW(), NOW()
    );
  END IF;

  SELECT id INTO v_dentist_id FROM auth.users WHERE email = 'doctor@pacificdentistsolutions.com';

  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (v_dentist_id, 'Dr. Pacific Dentist', 'doctor@pacificdentistsolutions.com', 'dentist')
  ON CONFLICT (id) DO UPDATE
    SET role = 'dentist',
        full_name = COALESCE(NULLIF(public.profiles.full_name, ''), 'Dr. Pacific Dentist'),
        updated_at = NOW();

  INSERT INTO public.dentist_profiles (id)
  VALUES (v_dentist_id)
  ON CONFLICT (id) DO NOTHING;

END $$;
