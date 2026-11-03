-- Keep the active optometrist's public profile aligned with the clinic brand.
-- This updates the displayed profile email, not the Supabase sign-in email.
UPDATE public.profiles AS profile
SET full_name = 'Glasses Direct',
    email = 'glassesdirect1000@gmail.com',
    updated_at = now()
WHERE profile.role = 'dentist'
  AND EXISTS (
    SELECT 1
    FROM public.dentist_profiles AS dentist
    WHERE dentist.id = profile.id
      AND dentist.is_active IS TRUE
  );
