/*
# Replace dental service catalogue with optometry services

1. Plain-English purpose
- Retires the old dental service catalogue from patient-facing availability.
- Adds the optometry services used by Mohamed Patel Optometrist.
- Keeps existing appointment records intact because existing service rows are deactivated, not deleted.

2. Modified data
- Existing rows in `public.services`: set `is_active` to false for the former dental catalogue.
- New rows in `public.services`: optometry service names, descriptions, durations, categories, and icon names.
- New optometry services intentionally have no prices because the practice requested that sunglasses prices not be displayed.

3. Security
- No new tables or policies are introduced.
- Existing RLS and grants on `public.services` remain in effect.

4. Important notes
- Appointment records and foreign-key references are preserved.
- The patient booking screen will now read these active optometry services from the database.
- The migration is safe to re-run because inserts are guarded by service name checks.
*/

UPDATE public.services
SET is_active = false
WHERE name IN (
  'Dental Check-up & Consultation',
  'Teeth Cleaning & Polishing',
  'Teeth Whitening',
  'Dental Fillings',
  'Tooth Extraction',
  'Root Canal Treatment',
  'Dental Implants',
  'Orthodontic Consultation',
  'Cosmetic Dentistry',
  'Emergency Dental Care'
);

INSERT INTO public.services (name, description, duration_minutes, price, category, icon_name, is_active)
SELECT name, description, duration_minutes, NULL, category, icon_name, true
FROM (VALUES
  ('Comprehensive Eye Examination', 'Thorough vision checks to help you see clearly and keep your eyes healthy.', 45, 'Eye Care', 'eye'),
  ('Prescription Frames & Lenses', 'Find comfortable, stylish frames with lenses matched to your prescription and lifestyle.', 30, 'Eyewear', 'glasses'),
  ('Single Vision Glasses', 'Reliable single-vision solutions for everyday distance or reading needs.', 30, 'Prescriptions', 'focus'),
  ('Prescription Sunglasses', 'Protect your eyes from the Kimberley sun with prescription lenses and selected frames.', 30, 'Sunglasses', 'sun'),
  ('Contact Lenses', 'Practical contact-lens guidance and fitting for a comfortable alternative to glasses.', 45, 'Contact Lenses', 'circle'),
  ('Medical Aid Eye Care', 'We accept Bonitas, GEMS, Polmed, SAMWUMED, Discovery and other contracted medical aids.', 30, 'Medical Aid', 'shield')
) AS new_services(name, description, duration_minutes, category, icon_name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.services existing WHERE existing.name = new_services.name
);
