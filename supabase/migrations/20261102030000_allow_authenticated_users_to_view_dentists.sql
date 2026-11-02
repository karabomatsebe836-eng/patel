DROP POLICY IF EXISTS "authenticated_select_dentist_profiles" ON public.profiles;

CREATE POLICY "authenticated_select_dentist_profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (role = 'dentist');
