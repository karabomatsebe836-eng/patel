
/*
# Pacific Dental Solutions — Full Schema

Creates all tables first, then the helper function, RLS, triggers, and seed data.

## New Tables
1. profiles — user profiles (patient | dentist | admin)
2. dentist_profiles — extra dentist info
3. services — dental service catalogue
4. appointments — booking records
5. dentist_availability — per-weekday working hours
6. notifications — in-app notifications

## Security
RLS enabled on all tables. is_admin() helper uses SECURITY DEFINER to avoid
recursion when checking role inside policies on other tables.

## Seed Data
10 standard dental services inserted.
*/

-- ─── 1. profiles ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id             uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name      text NOT NULL DEFAULT '',
  email          text,
  phone          text,
  role           text NOT NULL DEFAULT 'patient'
                 CHECK (role IN ('patient','dentist','admin')),
  date_of_birth  date,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- ─── 2. dentist_profiles ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dentist_profiles (
  id               uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  specialization   text,
  bio              text,
  years_experience integer DEFAULT 0,
  qualification    text,
  is_active        boolean DEFAULT true,
  image_url        text
);

-- ─── 3. services ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.services (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  description      text,
  duration_minutes integer DEFAULT 30,
  price            numeric(10,2),
  category         text,
  icon_name        text DEFAULT 'tooth',
  is_active        boolean DEFAULT true,
  created_at       timestamptz DEFAULT now()
);

-- ─── 4. appointments ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.appointments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dentist_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id       uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  status           text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','declined','cancelled')),
  notes            text,
  decline_reason   text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS appointments_patient_idx ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS appointments_dentist_idx ON public.appointments(dentist_id);
CREATE INDEX IF NOT EXISTS appointments_date_idx    ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS appointments_status_idx  ON public.appointments(status);

-- ─── 5. dentist_availability ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dentist_availability (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dentist_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week  integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time   time NOT NULL DEFAULT '08:00',
  end_time     time NOT NULL DEFAULT '17:00',
  is_available boolean DEFAULT true,
  UNIQUE (dentist_id, day_of_week)
);

-- ─── 6. notifications ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title          text NOT NULL,
  message        text NOT NULL,
  is_read        boolean DEFAULT false,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications(user_id);

-- ─── Helper function (created AFTER profiles table exists) ────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ─── Auto-create profile on sign-up ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'patient')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── RLS: profiles ────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_dentist_profiles"         ON public.profiles;
DROP POLICY IF EXISTS "auth_select_all_profiles"             ON public.profiles;
DROP POLICY IF EXISTS "auth_insert_own_profile"              ON public.profiles;
DROP POLICY IF EXISTS "auth_update_own_or_admin_profile"     ON public.profiles;
DROP POLICY IF EXISTS "admin_delete_profile"                 ON public.profiles;

CREATE POLICY "anon_select_dentist_profiles" ON public.profiles
  FOR SELECT TO anon USING (role IN ('dentist','admin'));

CREATE POLICY "auth_select_all_profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_insert_own_profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "auth_update_own_or_admin_profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING  (auth.uid() = id OR is_admin())
  WITH CHECK (auth.uid() = id OR is_admin());

CREATE POLICY "admin_delete_profile" ON public.profiles
  FOR DELETE TO authenticated USING (is_admin());

-- ─── RLS: dentist_profiles ────────────────────────────────────────────────────
ALTER TABLE public.dentist_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_dentist_ext"       ON public.dentist_profiles;
DROP POLICY IF EXISTS "dentist_or_admin_insert_ext"     ON public.dentist_profiles;
DROP POLICY IF EXISTS "dentist_or_admin_update_ext"     ON public.dentist_profiles;
DROP POLICY IF EXISTS "admin_delete_dentist_ext"        ON public.dentist_profiles;

CREATE POLICY "public_select_dentist_ext" ON public.dentist_profiles
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "dentist_or_admin_insert_ext" ON public.dentist_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id OR is_admin());

CREATE POLICY "dentist_or_admin_update_ext" ON public.dentist_profiles
  FOR UPDATE TO authenticated
  USING  (auth.uid() = id OR is_admin())
  WITH CHECK (auth.uid() = id OR is_admin());

CREATE POLICY "admin_delete_dentist_ext" ON public.dentist_profiles
  FOR DELETE TO authenticated USING (is_admin());

-- ─── RLS: services ────────────────────────────────────────────────────────────
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_services"  ON public.services;
DROP POLICY IF EXISTS "admin_insert_services"   ON public.services;
DROP POLICY IF EXISTS "admin_update_services"   ON public.services;
DROP POLICY IF EXISTS "admin_delete_services"   ON public.services;

CREATE POLICY "public_select_services" ON public.services
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "admin_insert_services" ON public.services
  FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "admin_update_services" ON public.services
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "admin_delete_services" ON public.services
  FOR DELETE TO authenticated USING (is_admin());

-- ─── RLS: appointments ────────────────────────────────────────────────────────
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scoped_select_appointments"   ON public.appointments;
DROP POLICY IF EXISTS "patient_insert_appointment"   ON public.appointments;
DROP POLICY IF EXISTS "manage_appointment_update"    ON public.appointments;
DROP POLICY IF EXISTS "admin_delete_appointment"     ON public.appointments;

CREATE POLICY "scoped_select_appointments" ON public.appointments
  FOR SELECT TO authenticated
  USING (auth.uid() = patient_id OR auth.uid() = dentist_id OR is_admin());

CREATE POLICY "patient_insert_appointment" ON public.appointments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "manage_appointment_update" ON public.appointments
  FOR UPDATE TO authenticated
  USING  (auth.uid() = dentist_id OR auth.uid() = patient_id OR is_admin())
  WITH CHECK (auth.uid() = dentist_id OR auth.uid() = patient_id OR is_admin());

CREATE POLICY "admin_delete_appointment" ON public.appointments
  FOR DELETE TO authenticated USING (is_admin());

-- ─── RLS: dentist_availability ────────────────────────────────────────────────
ALTER TABLE public.dentist_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_avail"          ON public.dentist_availability;
DROP POLICY IF EXISTS "dentist_or_admin_insert_avail" ON public.dentist_availability;
DROP POLICY IF EXISTS "dentist_or_admin_update_avail" ON public.dentist_availability;
DROP POLICY IF EXISTS "dentist_or_admin_delete_avail" ON public.dentist_availability;

CREATE POLICY "public_select_avail" ON public.dentist_availability
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "dentist_or_admin_insert_avail" ON public.dentist_availability
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = dentist_id OR is_admin());

CREATE POLICY "dentist_or_admin_update_avail" ON public.dentist_availability
  FOR UPDATE TO authenticated
  USING  (auth.uid() = dentist_id OR is_admin())
  WITH CHECK (auth.uid() = dentist_id OR is_admin());

CREATE POLICY "dentist_or_admin_delete_avail" ON public.dentist_availability
  FOR DELETE TO authenticated USING (auth.uid() = dentist_id OR is_admin());

-- ─── RLS: notifications ───────────────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_select_own_notifs"   ON public.notifications;
DROP POLICY IF EXISTS "auth_insert_notif"        ON public.notifications;
DROP POLICY IF EXISTS "user_update_own_notif"    ON public.notifications;
DROP POLICY IF EXISTS "user_delete_own_notif"    ON public.notifications;

CREATE POLICY "user_select_own_notifs" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "auth_insert_notif" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "user_update_own_notif" ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_delete_own_notif" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ─── Seed: dental services ────────────────────────────────────────────────────
INSERT INTO public.services (name, description, duration_minutes, price, category, icon_name, is_active)
VALUES
  ('Dental Check-up & Consultation', 'Comprehensive oral examination including X-rays and a personalised treatment plan.', 30, 350.00, 'Preventive', 'stethoscope', true),
  ('Teeth Cleaning & Polishing',     'Professional scaling and polishing to remove plaque, tartar, and surface stains.', 45, 450.00, 'Preventive', 'sparkles', true),
  ('Teeth Whitening',                'In-chair professional whitening treatment for a brighter, whiter smile.', 60, 1800.00, 'Cosmetic', 'sun', true),
  ('Dental Fillings',                'Tooth-coloured composite fillings to restore decayed or damaged teeth.', 45, 650.00, 'Restorative', 'shield', true),
  ('Tooth Extraction',               'Simple or surgical removal of a tooth performed under local anaesthetic.', 45, 800.00, 'Oral Surgery', 'scissors', true),
  ('Root Canal Treatment',           'Removal of infected pulp tissue to save a severely damaged tooth.', 90, 3500.00, 'Endodontic', 'activity', true),
  ('Dental Implants',                'Permanent titanium implant to replace a missing tooth with a natural-looking crown.', 120, 15000.00, 'Implantology', 'anchor', true),
  ('Orthodontic Consultation',       'Assessment and treatment planning for braces or clear aligner therapy.', 60, 500.00, 'Orthodontics', 'align-center', true),
  ('Cosmetic Dentistry',             'Veneers, bonding, and smile makeover procedures for an enhanced appearance.', 90, 5000.00, 'Cosmetic', 'star', true),
  ('Emergency Dental Care',          'Urgent treatment for toothache, broken teeth, and other dental emergencies.', 60, 600.00, 'Emergency', 'zap', true)
ON CONFLICT DO NOTHING;
