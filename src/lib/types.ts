export type Role = 'patient' | 'dentist' | 'admin';

export type AppointmentStatus = 'pending' | 'approved' | 'declined' | 'cancelled';

export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: Role;
  date_of_birth: string | null;
  created_at: string;
  updated_at: string;
}

export interface DentistProfile {
  id: string;
  specialization: string | null;
  bio: string | null;
  years_experience: number;
  qualification: string | null;
  is_active: boolean;
  image_url: string | null;
  profiles?: Profile;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number | null;
  category: string | null;
  icon_name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  dentist_id: string;
  service_id: string;
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
  notes: string | null;
  clinical_notes: string | null;
  decline_reason: string | null;
  created_at: string;
  updated_at: string;
  patient?: Profile;
  dentist?: Profile;
  service?: Service;
}

export interface DentistAvailability {
  id: string;
  dentist_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  appointment_id: string | null;
  created_at: string;
}
