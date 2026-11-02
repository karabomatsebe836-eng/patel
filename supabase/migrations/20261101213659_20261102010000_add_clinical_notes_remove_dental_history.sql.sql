/*
# Add clinical notes column + remove old dental appointment history

## Why
1. The optometrist needs to record clinical notes and treatment summaries
   directly on approved appointments so both doctor and patient can review
   them later. This adds a dedicated column for that purpose.
2. The database still holds two leftover dental appointments
   ("Teeth Cleaning & Polishing") from before the rebrand. Removing them
   prevents confusing users with irrelevant history.

## Changes

### 1. New column on `appointments`
- `clinical_notes` (text, nullable) — free-form clinical notes / treatment
  summary written by the optometrist after an appointment is approved.
  Updated in place; never destroyed by re-approval.

### 2. Data cleanup
- Delete appointments whose service is now inactive (the deactivated dental
  services). This removes the two "Teeth Cleaning & Polishing" rows.
- Delete any notifications pointing at those removed appointments.

### 3. RLS / grants
- No structural policy changes. The existing UPDATE policy already allows
  the assigned dentist to update their own appointment rows, which now
  covers the new `clinical_notes` column.
- The column-restricted UPDATE grant on `profiles` (from a prior
  migration) is unaffected; appointments has a table-level UPDATE grant.
*/

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS clinical_notes text;

-- Remove leftover dental appointments (services that are now deactivated)
DELETE FROM public.notifications
WHERE appointment_id IN (
  SELECT a.id FROM public.appointments a
  JOIN public.services s ON a.service_id = s.id
  WHERE s.is_active = false
);

DELETE FROM public.appointments
WHERE service_id IN (
  SELECT id FROM public.services WHERE is_active = false
);
