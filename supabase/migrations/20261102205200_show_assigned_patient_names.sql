CREATE POLICY "dentist_select_assigned_patient_profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR is_admin()
    OR (
      role = 'patient'
      AND EXISTS (
        SELECT 1
        FROM public.appointments
        WHERE appointments.patient_id = profiles.id
          AND appointments.dentist_id = auth.uid()
      )
    )
  );
