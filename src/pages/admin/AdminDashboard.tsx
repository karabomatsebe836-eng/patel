import { useEffect, useState, useCallback } from 'react';
import {
  Users, Calendar, Stethoscope, LayoutDashboard, LogOut,
  Plus, Trash2, Edit, CheckCircle, XCircle, BarChart2,
  TrendingUp, AlertCircle, X, Save
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from '../../contexts/RouterContext';
import type { Profile, Service, Appointment } from '../../lib/types';

type Tab = 'overview' | 'patients' | 'dentists' | 'services' | 'appointments' | 'reports';

interface ServiceForm {
  id?: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: string;
  category: string;
  icon_name: string;
  is_active: boolean;
}

const EMPTY_SERVICE: ServiceForm = {
  name: '', description: '', duration_minutes: 30, price: '',
  category: 'Eye Care', icon_name: 'eye', is_active: true,
};

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const { navigate } = useRouter();
  const [tab, setTab] = useState<Tab>('overview');

  const [patients, setPatients] = useState<Profile[]>([]);
  const [dentists, setDentists] = useState<Profile[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Service form modal
  const [serviceModal, setServiceModal] = useState<ServiceForm | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');

  const fetchAll = useCallback(async () => {
    const [pRes, dRes, sRes, aRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'patient').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('role', 'dentist').order('created_at', { ascending: false }),
      supabase.from('services').select('*').order('name'),
      supabase.from('appointments').select(`*, service:services(*), patient:profiles!appointments_patient_id_fkey(*), dentist:profiles!appointments_dentist_id_fkey(*)`).order('created_at', { ascending: false }).limit(100),
    ]);
    if (pRes.data) setPatients(pRes.data);
    if (dRes.data) setDentists(dRes.data);
    if (sRes.data) setServices(sRes.data);
    if (aRes.data) setAppointments(aRes.data as Appointment[]);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Delete this user? This action cannot be undone.')) return;
    await supabase.from('profiles').delete().eq('id', userId);
    await fetchAll();
  };

  const handleSaveService = async () => {
    if (!serviceModal) return;
    setSaveLoading(true);
    setSaveError('');
    const payload = {
      name: serviceModal.name,
      description: serviceModal.description,
      duration_minutes: serviceModal.duration_minutes,
      price: serviceModal.price ? parseFloat(serviceModal.price) : null,
      category: serviceModal.category,
      icon_name: serviceModal.icon_name,
      is_active: serviceModal.is_active,
    };
    const { error } = serviceModal.id
      ? await supabase.from('services').update(payload).eq('id', serviceModal.id)
      : await supabase.from('services').insert(payload);
    if (error) { setSaveError(error.message); }
    else { setServiceModal(null); await fetchAll(); }
    setSaveLoading(false);
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Delete this service?')) return;
    await supabase.from('services').delete().eq('id', id);
    await fetchAll();
  };

  const handleToggleService = async (id: string, current: boolean) => {
    await supabase.from('services').update({ is_active: !current }).eq('id', id);
    await fetchAll();
  };

  const handleUpdateAppointmentStatus = async (id: string, status: string) => {
    await supabase.from('appointments').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    await fetchAll();
  };

  const statusCount = (s: string) => appointments.filter((a) => a.status === s).length;

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview',      label: 'Overview',      icon: <LayoutDashboard size={16} /> },
    { key: 'appointments',  label: 'Appointments',  icon: <Calendar size={16} /> },
    { key: 'patients',      label: 'Patients',      icon: <Users size={16} /> },
    { key: 'dentists',      label: 'Optometrists',  icon: <Stethoscope size={16} /> },
    { key: 'services',      label: 'Services',      icon: <BarChart2 size={16} /> },
    { key: 'reports',       label: 'Reports',       icon: <TrendingUp size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Service modal */}
      {serviceModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 text-lg">{serviceModal.id ? 'Edit Service' : 'Add Service'}</h3>
              <button onClick={() => setServiceModal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            {saveError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{saveError}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Name *</label>
                <input
                  value={serviceModal.name}
                  onChange={(e) => setServiceModal({ ...serviceModal, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g. Comprehensive Eye Examination"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={serviceModal.description}
                  onChange={(e) => setServiceModal({ ...serviceModal, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                  <input
                    type="number"
                    value={serviceModal.duration_minutes}
                    onChange={(e) => setServiceModal({ ...serviceModal, duration_minutes: parseInt(e.target.value) || 30 })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (optional)</label>
                  <input
                    type="number"
                    value={serviceModal.price}
                    onChange={(e) => setServiceModal({ ...serviceModal, price: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={serviceModal.category}
                    onChange={(e) => setServiceModal({ ...serviceModal, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {['Eye Care','Eyewear','Prescriptions','Sunglasses','Contact Lenses','Medical Aid','Other'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={serviceModal.is_active ? 'active' : 'inactive'}
                    onChange={(e) => setServiceModal({ ...serviceModal, is_active: e.target.value === 'active' })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setServiceModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <button
                onClick={handleSaveService}
                disabled={!serviceModal.name.trim() || saveLoading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-sm font-semibold transition-all"
              >
                {saveLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={15} />Save</>}
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
              <div className="w-8 h-8 rounded-lg bg-purple-700 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2C8 2 6 5 6 8c0 2 .5 3.5 1 5 .5 1.5 1 3 1 5 0 1 .5 2 2 2h4c1.5 0 2-1 2-2 0-2 .5-3.5 1-5 .5-1.5 1-3 1-5 0-3-2-6-6-6z"/>
                </svg>
              </div>
              <span className="font-bold text-gray-900 text-sm">Glasses Direct</span>
            </button>
          </div>
          <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-2 ml-1">Admin Panel</div>
          <div className="flex-1 px-4 space-y-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  tab === t.key ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {t.icon}{t.label}
              </button>
            ))}
          </div>
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-3 px-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                {profile?.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800 truncate">{profile?.full_name}</div>
                <div className="text-xs text-gray-500">Administrator</div>
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
          {/* Mobile nav */}
          <div className="lg:hidden bg-white border-b border-gray-100 sticky top-0 z-30">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="font-bold text-gray-900">Admin Panel</span>
              <button onClick={async () => { await signOut(); navigate('/'); }} className="p-2 text-red-500"><LogOut size={18} /></button>
            </div>
            <div className="flex border-t border-gray-100 overflow-x-auto">
              {TABS.map((t) => (
                <button key={t.key} onClick={() => setTab(t.key)} className={`flex-1 min-w-[60px] flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors ${tab === t.key ? 'text-purple-700 border-b-2 border-purple-700' : 'text-gray-500'}`}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 md:p-8 max-w-5xl mx-auto">
            {/* OVERVIEW */}
            {tab === 'overview' && (
              <div>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                  <p className="text-gray-500 text-sm mt-1">Glasses Direct — Practice Management</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: 'Total Patients', value: patients.length, color: 'bg-blue-700', icon: <Users size={18} /> },
                    { label: 'Optometrists', value: dentists.length, color: 'bg-teal-600', icon: <Stethoscope size={18} /> },
                    { label: 'Services', value: services.filter(s => s.is_active).length, color: 'bg-green-600', icon: <BarChart2 size={18} /> },
                    { label: 'Total Appointments', value: appointments.length, color: 'bg-purple-700', icon: <Calendar size={18} /> },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                      <div className={`w-9 h-9 rounded-xl ${stat.color} text-white flex items-center justify-center mb-3`}>{stat.icon}</div>
                      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Appointment status breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="font-bold text-gray-900 mb-4">Appointment Status</h2>
                    <div className="space-y-3">
                      {[
                        { label: 'Pending', status: 'pending', color: 'bg-amber-500' },
                        { label: 'Approved', status: 'approved', color: 'bg-green-500' },
                        { label: 'Declined', status: 'declined', color: 'bg-red-500' },
                        { label: 'Cancelled', status: 'cancelled', color: 'bg-gray-400' },
                      ].map((item) => {
                        const count = statusCount(item.status);
                        const pct = appointments.length ? Math.round((count / appointments.length) * 100) : 0;
                        return (
                          <div key={item.status}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">{item.label}</span>
                              <span className="font-semibold text-gray-900">{count}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="font-bold text-gray-900 mb-4">Recent Appointments</h2>
                    <div className="space-y-3">
                      {appointments.slice(0, 4).map((apt) => (
                        <div key={apt.id} className="flex items-center gap-3 text-sm">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${{ pending: 'bg-amber-500', approved: 'bg-green-500', declined: 'bg-red-500', cancelled: 'bg-gray-400' }[apt.status] || 'bg-gray-400'}`} />
                          <span className="text-gray-700 truncate flex-1">{(apt.patient as Profile)?.full_name || 'Patient'}</span>
                          <span className="text-gray-400 shrink-0">{new Date(apt.appointment_date + 'T00:00:00').toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* APPOINTMENTS */}
            {tab === 'appointments' && (
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-6">All Appointments</h1>
                {loading ? (
                  <div className="space-y-2">{Array.from({length:5}).map((_,i) => <div key={i} className="h-14 bg-white rounded-xl animate-pulse border border-gray-100" />)}</div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            {['Patient', 'Optometrist', 'Service', 'Date', 'Time', 'Status', 'Actions'].map(h => (
                              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {appointments.map((apt) => (
                            <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 font-medium text-gray-900">{(apt.patient as Profile)?.full_name || '—'}</td>
                              <td className="px-4 py-3 text-gray-600">{(apt.dentist as Profile)?.full_name || '—'}</td>
                              <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">{(apt.service as Service)?.name || '—'}</td>
                              <td className="px-4 py-3 text-gray-600">{new Date(apt.appointment_date + 'T00:00:00').toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}</td>
                              <td className="px-4 py-3 text-gray-600">{apt.appointment_time?.slice(0,5)}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold border px-2 py-0.5 rounded-full ${{
                                  pending: 'bg-amber-50 border-amber-200 text-amber-700',
                                  approved: 'bg-green-50 border-green-200 text-green-700',
                                  declined: 'bg-red-50 border-red-200 text-red-700',
                                  cancelled: 'bg-gray-50 border-gray-200 text-gray-500',
                                }[apt.status] || ''}`}>
                                  {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {apt.status === 'pending' && (
                                  <div className="flex gap-1.5">
                                    <button onClick={() => handleUpdateAppointmentStatus(apt.id, 'approved')} className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors" title="Approve">
                                      <CheckCircle size={14} />
                                    </button>
                                    <button onClick={() => handleUpdateAppointmentStatus(apt.id, 'declined')} className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors" title="Decline">
                                      <XCircle size={14} />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {appointments.length === 0 && (
                        <div className="text-center py-10 text-gray-400 text-sm">No appointments found.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PATIENTS */}
            {tab === 'patients' && (
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Patients</h1>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          {['Name', 'Email', 'Phone', 'Joined', 'Actions'].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {patients.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-900">{p.full_name || '—'}</td>
                            <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{p.email || '—'}</td>
                            <td className="px-4 py-3 text-gray-600">{p.phone || '—'}</td>
                            <td className="px-4 py-3 text-gray-500">{new Date(p.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                            <td className="px-4 py-3">
                              <button onClick={() => handleDeleteUser(p.id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Delete">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {patients.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">No patients registered yet.</div>}
                  </div>
                </div>
              </div>
            )}

            {/* DENTISTS */}
            {tab === 'dentists' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Manage Optometrists</h1>
                </div>
                <div className="space-y-4">
                  {dentists.map((d) => (
                    <div key={d.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-white font-bold">
                          {d.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{d.full_name}</div>
                          <div className="text-sm text-gray-500">{d.email}</div>
                          {d.phone && <div className="text-xs text-gray-400">{d.phone}</div>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-1 rounded-lg font-medium">Optometrist</span>
                        <button onClick={() => handleDeleteUser(d.id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {dentists.length === 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                      <Stethoscope size={40} className="text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">No optometrists registered yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SERVICES */}
            {tab === 'services' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Manage Services</h1>
                  <button
                    onClick={() => setServiceModal({ ...EMPTY_SERVICE })}
                    className="flex items-center gap-2 bg-purple-700 hover:bg-purple-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-purple-700/20"
                  >
                    <Plus size={16} /> Add Service
                  </button>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          {['Service', 'Category', 'Duration', 'Status', 'Actions'].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {services.map((s) => (
                          <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{s.name}</div>
                              <div className="text-xs text-gray-400 truncate max-w-[200px]">{s.description}</div>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{s.category}</td>
                            <td className="px-4 py-3 text-gray-600">{s.duration_minutes}min</td>
                            <td className="px-4 py-3">
                              <span className={`text-[11px] font-semibold border px-2 py-0.5 rounded-full ${s.is_active ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                                {s.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => setServiceModal({ id: s.id, name: s.name, description: s.description || '', duration_minutes: s.duration_minutes, price: s.price?.toString() || '', category: s.category || 'Eye Care', icon_name: s.icon_name || 'star', is_active: s.is_active })}
                                  className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                >
                                  <Edit size={14} />
                                </button>
                                <button onClick={() => handleToggleService(s.id, s.is_active)} className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors" title={s.is_active ? 'Deactivate' : 'Activate'}>
                                  {s.is_active ? <XCircle size={14} /> : <CheckCircle size={14} />}
                                </button>
                                <button onClick={() => handleDeleteService(s.id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* REPORTS */}
            {tab === 'reports' && (
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports & Statistics</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {[
                    { label: 'Total Appointments', value: appointments.length, icon: <Calendar size={20} />, color: 'text-blue-700 bg-blue-50' },
                    { label: 'Approved Appointments', value: statusCount('approved'), icon: <CheckCircle size={20} />, color: 'text-green-700 bg-green-50' },
                    { label: 'Pending Appointments', value: statusCount('pending'), icon: <AlertCircle size={20} />, color: 'text-amber-700 bg-amber-50' },
                    { label: 'Declined Appointments', value: statusCount('declined'), icon: <XCircle size={20} />, color: 'text-red-700 bg-red-50' },
                    { label: 'Cancelled Appointments', value: statusCount('cancelled'), icon: <X size={20} />, color: 'text-gray-600 bg-gray-100' },
                    { label: 'Active Services', value: services.filter(s => s.is_active).length, icon: <BarChart2 size={20} />, color: 'text-teal-700 bg-teal-50' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>{stat.icon}</div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                        <div className="text-xs text-gray-500">{stat.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Service popularity */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="font-bold text-gray-900 mb-4">Most Booked Services</h2>
                  {(() => {
                    const counts: Record<string, number> = {};
                    appointments.forEach((a) => {
                      const name = (a.service as Service)?.name || 'Unknown';
                      counts[name] = (counts[name] || 0) + 1;
                    });
                    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
                    const max = sorted[0]?.[1] || 1;
                    return sorted.length === 0 ? (
                      <p className="text-gray-400 text-sm">No booking data available.</p>
                    ) : (
                      <div className="space-y-3">
                        {sorted.map(([name, count]) => (
                          <div key={name}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-700 font-medium">{name}</span>
                              <span className="text-gray-500">{count} booking{count !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
