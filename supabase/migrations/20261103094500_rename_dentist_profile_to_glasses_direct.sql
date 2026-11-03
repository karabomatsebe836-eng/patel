UPDATE public.profiles
SET full_name = 'Glasses Direct',
    updated_at = now()
WHERE role = 'dentist'
  AND full_name = 'Dr. Mohamed Patel';
