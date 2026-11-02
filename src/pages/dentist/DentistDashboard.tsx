import { useEffect, useState, useCallback } from 'react';
import {
  Calendar, Clock, CheckCircle, XCircle, AlertCircle, Bell,
  User, LogOut, LayoutDashboard, Settings, ChevronRight, X,
  FileText, Save
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from '../../contexts/RouterContext';
import type { Appointment, Profile, Service, DentistAvailability } from '../../lib/types';

type Tab = 'overview' | 'requests' | 'availability' | 'history';

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  pending:   { bg: 'bg-amber-50 border-amber-200',  text: 'text-amber-700',  icon: <AlertCircle size={14} /> },
  approved:  { bg: 'bg-green-50 border-green-200',  text: 'text-green-700',  icon: <CheckCircle size={14} /> },
  declined:  { bg: 'bg-red-50 border-red-200',      text: 'text-red-700',    icon: <XCircle size={14} /> },
  cancelled: { bg: 'bg-gray-50 border-gray-200',    text: 'text-gray-500',   icon: <X size={14} /> },
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface DeclineModal {
  appointmentId: string;
  reason: string;
}

interface NotesEditor {
  appointmentId: string;
  value: string;
}

export default function DentistDashboard() {
  const { profile, signOut } = useAuth();
  const { navigate } = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availability, setAvailability] = useState<DentistAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [declineModal, setDeclineModal] = useState<DeclineModal | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notesEditor, setNotesEditor] = useState<NotesEditor | null>(null);
  const [notesSaving, setNotesSaving] = useState(false);

  const fetchAppointments = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('appointments')
      .select(`*, service:services(*), patient:profiles!appointments_patient_id_fkey(*)`)
      .eq('dentist_id', profile.id)
      .order('appointment_date', { ascending: true });
    if (data) setAppointments(data as Appointment[]);
  }, [profile]);

  const fetchAvailability = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('dentist_availability')
      .select('*')
      .eq('dentist_id', profile.id)
      .order('day_of_week');
    if (data) setAvailability(data);
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    Promise.all([fetchAppointments(), fetchAvailability()]).finally(() => setLoading(false));
  }, [profile, fetchAppointments, fetchAvailability]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    await supabase.from('appointments').update({ status: 'approved', updated_at: new Date().toISOString() }).eq('id', id);
    // Notify patient
    const apt = appointments.find(a => a.id === id);
    if (apt) {
      await supabase.from('notifications').insert({
        user_id: apt.patient_id,
        title: 'Appointment Approved',
        message: `Your appointment on ${apt.appointment_date} at ${apt.appointment_time?.slice(0,5)} has been approved by ${profile?.full_name}.`,
        appointment_id: id,
      });
    }
    await fetchAppointments();
    setActionLoading(null);
  };

  const handleDecline = async () => {
    if (!declineModal) return;
    setActionLoading(declineModal.appointmentId);
    await supabase.from('appointments').update({
      status: 'declined',
      decline_reason: declineModal.reason,
      updated_at: new Date().toISOString(),
    }).eq('id', declineModal.appointmentId);
    // Notify patient
    const apt = appointments.find(a => a.id === declineModal.appointmentId);
    if (apt) {
      await supabase.from('notifications').insert({
        user_id: apt.patient_id,
        title: 'Appointment Declined',
        message: `Your appointment on ${apt.appointment_date} at ${apt.appointment_time?.slice(0,5)} has been declined. Reason: ${declineModal.reason}`,
        appointment_id: declineModal.appointmentId,
      });
    }
    await fetchAppointments();
    setDeclineModal(null);
    setActionLoading(null);
  };

  const handleToggleAvailability = async (dayOfWeek: number, checked: boolean) => {
    if (!profile) return;
    const existing = availability.find((a) => a.day_of_week === dayOfWeek);
    if (existing) {
      await supabase.from('dentist_availability').update({ is_available: checked }).eq('id', existing.id);
    } else {
      await supabase.from('dentist_availability').insert({
        dentist_id: profile.id,
        day_of_week: dayOfWeek,
        start_time: '08:00',
        end_time: '17:00',
        is_available: checked,
      });
    }
    await fetchAvailability();
  };

  const handleUpdateHours = async (dayOfWeek: number, field: 'start_time' | 'end_time', value: string) => {
    if (!profile) return;
    const existing = availability.find((a) => a.day_of_week === dayOfWeek);
    if (existing) {
      await supabase.from('dentist_availability').update({ [field]: value }).eq('id', existing.id);
    } else {
      await supabase.from('dentist_availability').insert({
        dentist_id: profile.id,
        day_of_week: dayOfWeek,
        start_time: field === 'start_time' ? value : '08:00',
        end_time: field === 'end_time' ? value : '17:00',
        is_available: true,
      });
    }
    await fetchAvailability();
  };

  const handleSaveNotes = async () => {
    if (!notesEditor) return;
    setNotesSaving(true);
    await supabase
      .from('appointments')
      .update({ clinical_notes: notesEditor.value, updated_at: new Date().toISOString() })
      .eq('id', notesEditor.appointmentId);
    await fetchAppointments();
    setNotesEditor(null);
    setNotesSaving(false);
  };

  const startNotes = (apt: Appointment) => {
    setNotesEditor({ appointmentId: apt.id, value: apt.clinical_notes || '' });
  };

  const cancelNotes = () => setNotesEditor(null);

  const pending = appointments.filter((a) => a.status === 'pending');
  const today = new Date().toISOString().split('T')[0];
  const todayApts = appointments.filter((a) => a.appointment_date === today && a.status === 'approved');

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview',     label: 'Overview',     icon: <LayoutDashboard size={16} /> },
    { key: 'requests',     label: 'Requests',      icon: <Bell size={16} /> },
    { key: 'availability', label: 'Availability',  icon: <Settings size={16} /> },
    { key: 'history',      label: 'History',       icon: <Calendar size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Decline modal */}
      {declineModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-1">Decline Appointment Request</h3>
            <p className="text-gray-500 text-sm mb-4">Please provide a reason for declining this appointment.</p>
            <textarea
              value={declineModal.reason}
              onChange={(e) => setDeclineModal({ ...declineModal, reason: e.target.value })}
              rows={3}
              placeholder="e.g. Schedule conflict, unavailable on this date..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setDeclineModal(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleDecline}
                disabled={!declineModal.reason.trim() || !!actionLoading}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-semibold transition-all"
              >
                {actionLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Decline'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white border-r border-gray-100 fixed left-0 top-0 z-40">
          <div className="p-6 border-b border-gray-100">
            <button onClick={() => navigate('/')} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2C8 2 6 5 6 8c0 2 .5 3.5 1 5 .5 1.5 1 3 1 5 0 1 .5 2 2 2h4c1.5 0 2-1 2-2 0-2 .5-3.5 1-5 .5-1.5 1-3 1-5 0-3-2-6-6-6z"/>
                </svg>
              </div>
              <span className="font-bold text-gray-900 text-sm">Mohamed Patel Optometrist</span>
            </button>
          </div>
          <div className="flex-1 p-4 space-y-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  tab === t.key ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {t.icon}
                {t.label}
                {t.key === 'requests' && pending.length > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {pending.length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-3 px-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                {profile?.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800 truncate">{profile?.full_name}</div>
                <div className="text-xs text-gray-500">Optometrist</div>
              </div>
            </div>
            <button
              onClick={async () => { await signOut(); navigate('/'); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />Sign Out
            </button>
          </div>
        </aside>

        <main className="flex-1 lg:ml-64">
          {/* Mobile top nav */}
          <div className="lg:hidden bg-white border-b border-gray-100 sticky top-0 z-30">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="font-bold text-gray-900">Optometrist Portal</span>
              <button onClick={async () => { await signOut(); navigate('/'); }} className="p-2 text-red-500">
                <LogOut size={18} />
              </button>
            </div>
            <div className="flex border-t border-gray-100 overflow-x-auto">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 min-w-[72px] flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors ${
                    tab === t.key ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500'
                  }`}
                >
                  {t.icon}{t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 md:p-8 max-w-4xl mx-auto">
            {/* OVERVIEW */}
            {tab === 'overview' && (
              <div>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Welcome, {profile?.full_name.split(' ')[0]}</h1>
                  <p className="text-gray-500 text-sm mt-1">Optometrist Dashboard</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Today's Appointments", value: todayApts.length, color: 'bg-teal-600', icon: <Calendar size={18} /> },
                    { label: 'Pending Requests', value: pending.length, color: 'bg-amber-500', icon: <AlertCircle size={18} /> },
                    { label: 'Total Approved', value: appointments.filter(a => a.status === 'approved').length, color: 'bg-green-600', icon: <CheckCircle size={18} /> },
                    { label: 'Total Patients', value: new Set(appointments.map(a => a.patient_id)).size, color: 'bg-blue-700', icon: <User size={18} /> },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                      <div className={`w-9 h-9 rounded-xl ${stat.color} text-white flex items-center justify-center mb-3`}>{stat.icon}</div>
                      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Pending requests */}
                {pending.length > 0 && (
                  <div className="bg-white rounded-2xl border border-amber-200 bg-amber-50/30 shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-bold text-gray-900 flex items-center gap-2">
                        <AlertCircle size={18} className="text-amber-500" />
                        Pending Requests
                      </h2>
                      <button onClick={() => setTab('requests')} className="text-teal-600 text-sm font-medium hover:underline flex items-center gap-1">
                        View all <ChevronRight size={14} />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {pending.slice(0, 3).map((apt) => (
                        <AppointmentRow key={apt.id} apt={apt} onApprove={handleApprove} onDecline={(id) => setDeclineModal({ appointmentId: id, reason: '' })} actionLoading={actionLoading} notesEditor={notesEditor} onStartNotes={startNotes} onSaveNotes={handleSaveNotes} onCancelNotes={cancelNotes} notesSaving={notesSaving} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Today's schedule */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="font-bold text-gray-900 mb-4">Today's Schedule</h2>
                  {todayApts.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">No appointments scheduled for today.</p>
                  ) : (
                    <div className="space-y-3">
                      {todayApts.map((apt) => (
                        <AppointmentRow key={apt.id} apt={apt} onApprove={handleApprove} onDecline={(id) => setDeclineModal({ appointmentId: id, reason: '' })} actionLoading={actionLoading} notesEditor={notesEditor} onStartNotes={startNotes} onSaveNotes={handleSaveNotes} onCancelNotes={cancelNotes} notesSaving={notesSaving} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* REQUESTS */}
            {tab === 'requests' && (
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Appointment Requests</h1>
                {loading ? (
                  <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-gray-100" />)}</div>
                ) : pending.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <CheckCircle size={40} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">All requests processed.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pending.map((apt) => (
                      <AppointmentRow key={apt.id} apt={apt} onApprove={handleApprove} onDecline={(id) => setDeclineModal({ appointmentId: id, reason: '' })} actionLoading={actionLoading} expanded notesEditor={notesEditor} onStartNotes={startNotes} onSaveNotes={handleSaveNotes} onCancelNotes={cancelNotes} notesSaving={notesSaving} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AVAILABILITY */}
            {tab === 'availability' && (
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Manage Availability</h1>
                <p className="text-gray-500 text-sm mb-6">Set your working days and hours. Patients can only book during your available times.</p>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
                  {DAYS.map((day, dayIndex) => {
                    const avail = availability.find((a) => a.day_of_week === dayIndex);
                    const isAvailable = avail?.is_available ?? false;
                    return (
                      <div key={day} className="p-4 flex flex-wrap items-center gap-4">
                        <div className="w-28 font-medium text-gray-800 text-sm">{day}</div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <div
                            onClick={() => handleToggleAvailability(dayIndex, !isAvailable)}
                            className={`w-10 h-6 rounded-full transition-all cursor-pointer relative ${isAvailable ? 'bg-teal-500' : 'bg-gray-200'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${isAvailable ? 'left-5' : 'left-1'}`} />
                          </div>
                          <span className={`text-sm ${isAvailable ? 'text-teal-700 font-medium' : 'text-gray-400'}`}>
                            {isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                        </label>
                        {isAvailable && (
                          <div className="flex items-center gap-2 text-sm">
                            <input
                              type="time"
                              defaultValue={avail?.start_time || '08:00'}
                              onBlur={(e) => handleUpdateHours(dayIndex, 'start_time', e.target.value)}
                              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                            <span className="text-gray-400">–</span>
                            <input
                              type="time"
                              defaultValue={avail?.end_time || '17:00'}
                              onBlur={(e) => handleUpdateHours(dayIndex, 'end_time', e.target.value)}
                              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* HISTORY */}
            {tab === 'history' && (
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Appointment History</h1>
                {loading ? (
                  <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-gray-100" />)}</div>
                ) : appointments.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <Calendar size={40} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No appointment history.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {appointments.filter(a => a.status !== 'pending').map((apt) => (
                      <AppointmentRow key={apt.id} apt={apt} onApprove={handleApprove} onDecline={(id) => setDeclineModal({ appointmentId: id, reason: '' })} actionLoading={actionLoading} notesEditor={notesEditor} onStartNotes={startNotes} onSaveNotes={handleSaveNotes} onCancelNotes={cancelNotes} notesSaving={notesSaving} />
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

function AppointmentRow({
  apt,
  onApprove,
  onDecline,
  actionLoading,
  expanded,
  notesEditor,
  onStartNotes,
  onSaveNotes,
  onCancelNotes,
  notesSaving,
}: {
  apt: Appointment;
  onApprove: (id: string) => void;
  onDecline: (id: string) => void;
  actionLoading: string | null;
  expanded?: boolean;
  notesEditor: NotesEditor | null;
  onStartNotes: (apt: Appointment) => void;
  onSaveNotes: () => void;
  onCancelNotes: () => void;
  notesSaving: boolean;
}) {
  const s = STATUS_STYLES[apt.status] || STATUS_STYLES.pending;
  const isPending = apt.status === 'pending';
  const canHaveNotes = apt.status === 'approved' || apt.status === 'declined';
  const isEditing = notesEditor?.appointmentId === apt.id;
  const hasNotes = !!apt.clinical_notes?.trim();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-gray-900 text-sm">
              {(apt.service as Service)?.name || 'Appointment'}
            </span>
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold border px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
              {s.icon}{apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
            </span>
          </div>
          <div className="text-xs text-gray-500 flex flex-wrap gap-3">
            <span className="flex items-center gap-1"><User size={11} />{(apt.patient as Profile)?.full_name || 'Patient'}</span>
            <span className="flex items-center gap-1"><Calendar size={11} />{new Date(apt.appointment_date + 'T00:00:00').toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span className="flex items-center gap-1"><Clock size={11} />{apt.appointment_time?.slice(0, 5)}</span>
          </div>
          {expanded && apt.notes && (
            <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">Notes: {apt.notes}</div>
          )}
          {apt.status === 'declined' && apt.decline_reason && (
            <div className="mt-2 text-xs bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg">
              Reason: {apt.decline_reason}
            </div>
          )}
          {/* Clinical notes — display or editor for approved appointments */}
          {canHaveNotes && !isEditing && (
            <div className="mt-3">
              {hasNotes ? (
                <div className="text-xs text-gray-600 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
                  <span className="font-semibold text-teal-800">Clinical Notes:</span>{' '}
                  {apt.clinical_notes}
                </div>
              ) : (
                <div className="text-xs text-gray-400 italic">No clinical notes recorded yet.</div>
              )}
              <button
                onClick={() => onStartNotes(apt)}
                className="mt-2 text-xs font-medium text-teal-700 hover:text-teal-800 flex items-center gap-1"
              >
                <FileText size={12} /> {hasNotes ? 'Edit clinical notes' : 'Add clinical notes'}
              </button>
            </div>
          )}
          {isEditing && (
            <div className="mt-3">
              <textarea
                value={notesEditor!.value}
                onChange={(e) => setNotesEditor({ appointmentId: apt.id, value: e.target.value })}
                rows={4}
                placeholder="Record clinical observations, diagnosis, treatment summary, follow-up instructions..."
                className="w-full px-3 py-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={onCancelNotes}
                  disabled={notesSaving}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onSaveNotes}
                  disabled={notesSaving}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white text-xs font-semibold transition-all flex items-center gap-1"
                >
                  {notesSaving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={12} />}
                  Save Notes
                </button>
              </div>
            </div>
          )}
        </div>
        {isPending && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => onApprove(apt.id)}
              disabled={actionLoading === apt.id}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-all disabled:opacity-50"
            >
              {actionLoading === apt.id ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={12} />}
              Approve
            </button>
            <button
              onClick={() => onDecline(apt.id)}
              disabled={!!actionLoading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold transition-all disabled:opacity-50"
            >
              <XCircle size={12} />
              Decline
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
