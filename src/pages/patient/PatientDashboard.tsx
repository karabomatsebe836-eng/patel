import { useEffect, useState, useCallback } from 'react';
import {
  Calendar, Clock, CheckCircle, XCircle, AlertCircle, Plus, Bell,
  ChevronRight, User, Stethoscope, LogOut, LayoutDashboard,
  X, ChevronLeft
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from '../../contexts/RouterContext';
import { CLINIC } from '../../lib/siteData';
import { useAppointmentRealtime } from '../../hooks/useAppointmentRealtime';
import type { Appointment, Service, Profile, Notification } from '../../lib/types';

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  pending:   { bg: 'bg-amber-50 border-amber-200',  text: 'text-amber-700',  icon: <AlertCircle size={14} /> },
  approved:  { bg: 'bg-green-50 border-green-200',  text: 'text-green-700',  icon: <CheckCircle size={14} /> },
  declined:  { bg: 'bg-red-50 border-red-200',      text: 'text-red-700',    icon: <XCircle size={14} /> },
  cancelled: { bg: 'bg-gray-50 border-gray-200',    text: 'text-gray-500',   icon: <X size={14} /> },
};

type Tab = 'overview' | 'book' | 'appointments' | 'notifications';

function generateTimeSlots(startTime: string, endTime: string, durationMins: number): string[] {
  const slots: string[] = [];
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  let mins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  while (mins + durationMins <= endMins) {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    slots.push(`${h}:${m}`);
    mins += durationMins;
  }
  return slots;
}

export default function PatientDashboard() {
  const { profile, signOut } = useAuth();
  const { navigate } = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Book appointment state
  const [services, setServices] = useState<Service[]>([]);
  const [dentists, setDentists] = useState<Profile[]>([]);
  const [dentistsLoading, setDentistsLoading] = useState(false);
  const [dentistsError, setDentistsError] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDentist, setSelectedDentist] = useState<Profile | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const fetchAppointments = useCallback(async () => {
    if (!profile) return;
    const { data, error } = await supabase
      .from('appointments')
      .select(`*, service:services(*), dentist:profiles!appointments_dentist_id_fkey(*)`)
      .eq('patient_id', profile.id)
      .order('appointment_date', { ascending: false });
    if (error) {
      console.error('Failed to load patient appointments:', error);
      return;
    }
    if (data) setAppointments(data as Appointment[]);
  }, [profile]);

  const fetchNotifications = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    }
  }, [profile]);

  const refreshAppointmentData = useCallback(async () => {
    await Promise.all([fetchAppointments(), fetchNotifications()]);
  }, [fetchAppointments, fetchNotifications]);

  const realtimeStatus = useAppointmentRealtime(profile?.id, 'patient_id', refreshAppointmentData);

  const fetchDentists = useCallback(async () => {
    setDentistsLoading(true);
    setDentistsError('');

    try {
      const { data: activeDentists, error: activeDentistsError } = await supabase
        .from('dentist_profiles')
        .select('id')
        .eq('is_active', true);

      if (activeDentistsError) {
        setDentists([]);
        setDentistsError(activeDentistsError.message);
        return;
      }

      const dentistIds = (activeDentists ?? []).map((dentist) => dentist.id);
      if (dentistIds.length === 0) {
        setDentists([]);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', dentistIds);

      if (error) {
        setDentists([]);
        setDentistsError(error.message);
        return;
      }

      if (!data?.length) {
        setDentists([]);
        setDentistsError(
          'An active optometrist exists, but the database is not allowing patients to view the dentist profile. Apply the authenticated_select_dentist_profiles policy in Supabase.'
        );
        return;
      }

      setDentists(data.map((dentist) => ({
        ...dentist,
        full_name: CLINIC.name,
        email: CLINIC.email,
      })));
    } catch (error) {
      setDentists([]);
      setDentistsError(error instanceof Error ? error.message : 'An unexpected error occurred.');
    } finally {
      setDentistsLoading(false);
    }
  }, []);

  const openBooking = () => {
    void fetchDentists();
    setTab('book');
  };

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    Promise.all([fetchAppointments(), fetchNotifications()]).finally(() => setLoading(false));

    supabase.from('services').select('*').eq('is_active', true).then(({ data }) => {
      if (data) setServices(data);
    });
    void fetchDentists();
  }, [profile, fetchAppointments, fetchNotifications, fetchDentists]);

  useEffect(() => {
    if (!selectedDentist || !selectedDate || !selectedService) {
      setAvailableSlots([]);
      return;
    }
    const dayOfWeek = new Date(selectedDate + 'T00:00:00').getDay();
    supabase
      .from('dentist_availability')
      .select('*')
      .eq('dentist_id', selectedDentist.id)
      .eq('day_of_week', dayOfWeek)
      .eq('is_available', true)
      .maybeSingle()
      .then(async ({ data: avail }) => {
        if (!avail) { setAvailableSlots([]); return; }
        const slots = generateTimeSlots(avail.start_time, avail.end_time, selectedService.duration_minutes);
        // Filter out already-booked slots
        const { data: booked } = await supabase
          .from('appointments')
          .select('appointment_time')
          .eq('dentist_id', selectedDentist.id)
          .eq('appointment_date', selectedDate)
          .in('status', ['pending', 'approved']);
        const bookedTimes = new Set((booked || []).map((b) => b.appointment_time.slice(0, 5)));
        setAvailableSlots(slots.filter((s) => !bookedTimes.has(s)));
      });
  }, [selectedDentist, selectedDate, selectedService]);

  const handleBook = async () => {
    if (!profile || !selectedService || !selectedDentist || !selectedDate || !selectedTime) return;
    setBookingLoading(true);
    setBookingError('');
    const { error } = await supabase.from('appointments').insert({
      patient_id: profile.id,
      dentist_id: selectedDentist.id,
      service_id: selectedService.id,
      appointment_date: selectedDate,
      appointment_time: selectedTime,
      notes,
      status: 'pending',
    });
    if (error) {
      setBookingError(error.message);
    } else {
      setBookingSuccess(true);
      await fetchAppointments();
      await fetchNotifications();
      setTimeout(() => {
        setBookingSuccess(false);
        setSelectedService(null);
        setSelectedDentist(null);
        setSelectedDate('');
        setSelectedTime('');
        setNotes('');
        setBookingStep(1);
        setTab('appointments');
      }, 2000);
    }
    setBookingLoading(false);
  };

  const handleCancelAppointment = async (id: string) => {
    await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id);
    await fetchAppointments();
  };

  const markAllRead = async () => {
    if (!profile) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.id);
    await fetchNotifications();
  };

  const upcoming = appointments.filter((a) => ['pending', 'approved'].includes(a.status));
  const today = new Date().toISOString().split('T')[0];
  const minDate = today;

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview',       label: 'Overview',       icon: <LayoutDashboard size={16} /> },
    { key: 'book',           label: 'Book',            icon: <Plus size={16} /> },
    { key: 'appointments',   label: 'Appointments',    icon: <Calendar size={16} /> },
    { key: 'notifications',  label: 'Notifications',   icon: <Bell size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar (desktop) + Header (mobile) */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white border-r border-gray-100 fixed left-0 top-0 z-40">
          <div className="p-6 border-b border-gray-100">
            <button onClick={() => navigate('/')} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2C8 2 6 5 6 8c0 2 .5 3.5 1 5 .5 1.5 1 3 1 5 0 1 .5 2 2 2h4c1.5 0 2-1 2-2 0-2 .5-3.5 1-5 .5-1.5 1-3 1-5 0-3-2-6-6-6z"/>
                </svg>
              </div>
              <span className="font-bold text-gray-900 text-sm">Glasses Direct</span>
            </button>
          </div>

          <div className="flex-1 p-4 space-y-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => (t.key === 'book' ? openBooking() : setTab(t.key))}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  tab === t.key
                    ? 'bg-blue-700 text-white shadow-md shadow-blue-700/20'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {t.icon}
                {t.label}
                {t.key === 'notifications' && unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-3 px-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                {profile?.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800 truncate">{profile?.full_name}</div>
                <div className="text-xs text-gray-500">Patient</div>
              </div>
            </div>
            <button
              onClick={async () => { await signOut(); navigate('/'); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:ml-64">
          {/* Mobile top nav */}
          <div className="lg:hidden bg-white border-b border-gray-100 sticky top-0 z-30">
            <div className="flex items-center justify-between px-4 py-3">
              <button onClick={() => navigate('/')} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-700 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C8 2 6 5 6 8c0 2 .5 3.5 1 5 .5 1.5 1 3 1 5 0 1 .5 2 2 2h4c1.5 0 2-1 2-2 0-2 .5-3.5 1-5 .5-1.5 1-3 1-5 0-3-2-6-6-6z"/>
                  </svg>
                </div>
                <span className="font-bold text-gray-900 text-sm">Patient Portal</span>
              </button>
              <button onClick={() => setTab('notifications')} className="relative p-2">
                <Bell size={20} className="text-gray-600" />
                {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
              </button>
            </div>
            {/* Mobile tab bar */}
            <div className="flex border-t border-gray-100 overflow-x-auto">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 min-w-[72px] flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors ${
                    tab === t.key ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-500'
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div
              role="status"
              aria-live="polite"
              className={`mb-4 text-xs ${realtimeStatus === 'connected' ? 'text-green-700' : realtimeStatus === 'connecting' ? 'text-gray-500' : 'text-amber-700'}`}
            >
              {realtimeStatus === 'connected'
                ? 'Live connection active; syncing every 5 seconds as backup'
                : realtimeStatus === 'connecting'
                  ? 'Connecting to live appointment updates…'
                  : 'Live updates unavailable; checking for changes every 5 seconds'}
            </div>
            {/* ── OVERVIEW ── */}
            {tab === 'overview' && (
              <div>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {profile?.full_name.split(' ')[0]}!
                  </h1>
                  <p className="text-gray-500 text-sm mt-1">Here's your eye-care overview.</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Total Bookings', value: appointments.length, color: 'bg-blue-700', icon: <Calendar size={18} /> },
                    { label: 'Upcoming', value: upcoming.length, color: 'bg-teal-600', icon: <Clock size={18} /> },
                    { label: 'Approved', value: appointments.filter(a => a.status === 'approved').length, color: 'bg-green-600', icon: <CheckCircle size={18} /> },
                    { label: 'Notifications', value: unreadCount, color: 'bg-amber-500', icon: <Bell size={18} /> },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                      <div className={`w-9 h-9 rounded-xl ${stat.color} text-white flex items-center justify-center mb-3`}>
                        {stat.icon}
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Upcoming appointments */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-gray-900">Upcoming Appointments</h2>
                    <button onClick={() => setTab('appointments')} className="text-blue-700 text-sm font-medium hover:underline flex items-center gap-1">
                      View all <ChevronRight size={14} />
                    </button>
                  </div>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
                    </div>
                  ) : upcoming.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar size={32} className="text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">No upcoming appointments</p>
                      <button onClick={openBooking} className="mt-3 text-blue-700 text-sm font-medium hover:underline flex items-center gap-1 mx-auto">
                        <Plus size={14} /> Book an appointment
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcoming.slice(0, 3).map((apt) => (
                        <AppointmentCard key={apt.id} apt={apt} onCancel={handleCancelAppointment} />
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={openBooking}
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-700/20"
                >
                  <Plus size={18} /> Book New Appointment
                </button>
              </div>
            )}

            {/* ── BOOK ── */}
            {tab === 'book' && (
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Book Appointment</h1>

                {bookingSuccess ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={32} className="text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Appointment Requested!</h2>
                    <p className="text-gray-500 text-sm">Your appointment is pending optometrist approval. You'll be notified once confirmed.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                    {/* Step indicators */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                      {['Service', 'Optometrist', 'Date & Time', 'Confirm'].map((label, i) => (
                        <div key={label} className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                            i + 1 < bookingStep ? 'bg-teal-600 text-white' :
                            i + 1 === bookingStep ? 'bg-blue-700 text-white' :
                            'bg-gray-200 text-gray-500'
                          }`}>
                            {i + 1 < bookingStep ? '✓' : i + 1}
                          </div>
                          <span className={`text-xs font-medium hidden sm:block ${i + 1 === bookingStep ? 'text-gray-900' : 'text-gray-400'}`}>
                            {label}
                          </span>
                          {i < 3 && <div className={`w-6 sm:w-10 h-px ${i + 1 < bookingStep ? 'bg-teal-600' : 'bg-gray-200'}`} />}
                        </div>
                      ))}
                    </div>

                    <div className="p-6">
                      {bookingError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
                          {bookingError}
                        </div>
                      )}

                      {/* Step 1: Select service */}
                      {bookingStep === 1 && (
                        <div>
                          <h2 className="font-semibold text-gray-900 mb-1">Select a Service</h2>
                          <p className="text-gray-500 text-sm mb-4">Choose the eye-care service you need.</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {services.map((s) => (
                              <button
                                key={s.id}
                                onClick={() => { setSelectedService(s); setBookingStep(2); }}
                                className="text-left p-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                              >
                                <div className="font-semibold text-sm text-gray-900 group-hover:text-blue-700">{s.name}</div>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={11} />{s.duration_minutes}min</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Step 2: Select dentist */}
                      {bookingStep === 2 && (
                        <div>
                          <h2 className="font-semibold text-gray-900 mb-1">Choose an Optometrist</h2>
                          <p className="text-gray-500 text-sm mb-4">
                            Service: <span className="font-medium text-blue-700">{selectedService?.name}</span>
                          </p>
                          {dentistsLoading ? (
                            <div className="text-center py-8 text-gray-400">
                              <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-700 rounded-full animate-spin mx-auto mb-2" />
                              <p className="text-sm">Loading optometrists...</p>
                            </div>
                          ) : dentistsError ? (
                            <div className="text-center py-8">
                              <p className="text-sm text-red-600">Could not load optometrists: {dentistsError}</p>
                              <button
                                onClick={() => void fetchDentists()}
                                className="mt-3 text-sm text-blue-700 font-medium hover:underline"
                              >
                                Try again
                              </button>
                            </div>
                          ) : dentists.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                              <Stethoscope size={32} className="mx-auto mb-2" />
                              <p className="text-sm">No optometrists available at the moment.</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {dentists.map((d) => (
                                <button
                                  key={d.id}
                                  onClick={() => { setSelectedDentist(d); setBookingStep(3); }}
                                  className="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold">
                                      {d.full_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="font-semibold text-sm text-gray-900 group-hover:text-blue-700">{d.full_name}</div>
                                      <div className="text-xs text-gray-400">{d.email}</div>
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                          <button
                            onClick={() => setBookingStep(1)}
                            className="mt-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            <ChevronLeft size={16} /> Back
                          </button>
                        </div>
                      )}

                      {/* Step 3: Date & Time */}
                      {bookingStep === 3 && (
                        <div>
                          <h2 className="font-semibold text-gray-900 mb-1">Select Date & Time</h2>
                          <p className="text-gray-500 text-sm mb-4">
                            With <span className="font-medium text-blue-700">{selectedDentist?.full_name}</span>
                          </p>
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Appointment Date</label>
                            <input
                              type="date"
                              value={selectedDate}
                              min={minDate}
                              onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); }}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          </div>
                          {selectedDate && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Available Time Slots</label>
                              {availableSlots.length === 0 ? (
                                <div className="text-sm text-gray-400 bg-gray-50 rounded-xl p-4 text-center">
                                  No available slots for this date. Please choose another day.
                                </div>
                              ) : (
                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                  {availableSlots.map((slot) => (
                                    <button
                                      key={slot}
                                      onClick={() => setSelectedTime(slot)}
                                      className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                                        selectedTime === slot
                                          ? 'bg-blue-700 text-white border-blue-700'
                                          : 'border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-700'
                                      }`}
                                    >
                                      {slot}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optional)</label>
                            <textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              rows={2}
                              placeholder="Any relevant information for the optometrist..."
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                            />
                          </div>
                          <div className="flex gap-3 mt-4">
                            <button onClick={() => setBookingStep(2)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                              <ChevronLeft size={16} /> Back
                            </button>
                            <button
                              onClick={() => { if (selectedDate && selectedTime) setBookingStep(4); }}
                              disabled={!selectedDate || !selectedTime}
                              className="ml-auto bg-blue-700 hover:bg-blue-800 disabled:bg-gray-300 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                            >
                              Continue
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Step 4: Confirm */}
                      {bookingStep === 4 && (
                        <div>
                          <h2 className="font-semibold text-gray-900 mb-4">Confirm Your Appointment</h2>
                          <div className="bg-blue-50 rounded-xl p-5 space-y-3 mb-6">
                            {[
                              { label: 'Service', value: selectedService?.name },
                              { label: 'Optometrist', value: selectedDentist?.full_name },
                              { label: 'Date', value: selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '' },
                              { label: 'Time', value: selectedTime },
                              { label: 'Duration', value: `${selectedService?.duration_minutes} minutes` },
                                                          ].map((row) => (
                              <div key={row.label} className="flex items-start justify-between gap-4 text-sm">
                                <span className="text-gray-500">{row.label}</span>
                                <span className="font-semibold text-gray-900 text-right">{row.value}</span>
                              </div>
                            ))}
                            {notes && (
                              <div className="pt-2 border-t border-blue-200">
                                <span className="text-gray-500 text-sm">Notes: </span>
                                <span className="text-gray-700 text-sm">{notes}</span>
                              </div>
                            )}
                          </div>
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-xs text-amber-800">
                            Your appointment request will be submitted for optometrist approval. You'll receive a notification once confirmed.
                          </div>
                          <div className="flex gap-3">
                            <button onClick={() => setBookingStep(3)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                              <ChevronLeft size={16} /> Back
                            </button>
                            <button
                              onClick={handleBook}
                              disabled={bookingLoading}
                              className="ml-auto flex items-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-700/20"
                            >
                              {bookingLoading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <><CheckCircle size={16} /> Confirm Booking</>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── APPOINTMENTS ── */}
            {tab === 'appointments' && (
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-6">My Appointments</h1>
                {loading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <Calendar size={40} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No appointments yet</p>
                    <button onClick={openBooking} className="mt-3 text-blue-700 text-sm font-medium hover:underline">Book your first appointment</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {appointments.map((apt) => (
                      <AppointmentCard key={apt.id} apt={apt} onCancel={handleCancelAppointment} showDetails />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── NOTIFICATIONS ── */}
            {tab === 'notifications' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-sm text-blue-700 font-medium hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <Bell size={40} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No notifications yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((n) => (
                      <div key={n.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${!n.is_read ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!n.is_read ? 'bg-blue-500' : 'bg-gray-300'}`} />
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">{n.title}</div>
                              <div className="text-gray-600 text-sm mt-0.5">{n.message}</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 shrink-0">
                            {new Date(n.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function AppointmentCard({
  apt,
  onCancel,
  showDetails,
}: {
  apt: Appointment;
  onCancel: (id: string) => void;
  showDetails?: boolean;
}) {
  const s = STATUS_STYLES[apt.status] || STATUS_STYLES.pending;
  const canCancel = ['pending', 'approved'].includes(apt.status);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">
              {(apt.service as Service)?.name || 'Appointment'}
            </span>
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold border px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
              {s.icon}
              {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1 flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {new Date(apt.appointment_date + 'T00:00:00').toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {apt.appointment_time?.slice(0, 5)}
            </span>
            <span className="flex items-center gap-1">
              <User size={11} />
              {(apt.dentist as Profile)?.full_name || 'Optometrist'}
            </span>
          </div>
          {showDetails && apt.status === 'declined' && apt.decline_reason && (
            <div className="mt-2 text-xs bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg">
              Decline reason: {apt.decline_reason}
            </div>
          )}
          {showDetails && apt.status === 'approved' && apt.clinical_notes?.trim() && (
            <div className="mt-2 text-xs text-gray-600 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
              <span className="font-semibold text-teal-800">Clinical Notes:</span>{' '}
              {apt.clinical_notes}
            </div>
          )}
        </div>
        {canCancel && (
          <button
            onClick={() => onCancel(apt.id)}
            className="text-xs text-red-500 hover:text-red-700 font-medium shrink-0 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
