/*
# Lock new sign-ups to patient role + rebrand seeded staff accounts

## Why
The app's registration form only ever sets role to 'patient', but the
`handle_new_user` trigger copies the role straight from user-supplied
signup metadata. Anyone calling the Supabase auth API directly could pass
`role: 'dentist'` or `'admin'` in raw_user_meta_data and create a staff
account. This migration closes that server-side gap so only the 'patient'
role can be self-registered; staff accounts must be provisioned by an
admin/owner out-of-band.

It also updates the display names of the two seeded staff accounts that
still carry the old dental branding, so the optometrist and practice
manager show up correctly across the dashboards.

## Changes
1. `public.handle_new_user()` — rewritten to always insert role = 'patient'
   regardless of raw_user_meta_data. The `full_name` is still pulled from
   metadata (it is purely cosmetic), but role is no longer trusted from
   the client.
2. `public.profiles` — update the seeded admin and dentist rows:
   - dentist (doctor@pacificdentistsolutions.com): full_name -> 'Dr. Mohamed Patel'
   - admin (pacific66@adminsolutions.com): full_name -> 'Practice Manager'

## Security
- No new tables. No policy or grant changes.
- The trigger now denies client-controlled role escalation at insert time.
- Existing staff rows are updated in place; no data is lost.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    'patient'  -- self-registration is always patient; staff are provisioned out-of-band
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

UPDATE public.profiles
SET full_name = 'Dr. Mohamed Patel', updated_at = now()
WHERE email = 'doctor@pacificdentistsolutions.com' AND role = 'dentist';

UPDATE public.profiles
SET full_name = 'Practice Manager', updated_at = now()
WHERE email = 'pacific66@adminsolutions.com' AND role = 'admin';
