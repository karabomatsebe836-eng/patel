import { useState, useEffect } from 'react';
import {
  User, Mail, Phone, Calendar, Shield, Save, CheckCircle,
  ArrowLeft, Edit2, Camera
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from '../../contexts/RouterContext';

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  patient:  { label: 'Patient',       color: 'bg-blue-100 text-blue-700 border-blue-200' },
  dentist:  { label: 'Optometrist',   color: 'bg-teal-100 text-teal-700 border-teal-200' },
  admin:    { label: 'Administrator', color: 'bg-purple-100 text-purple-700 border-purple-200' },
};

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const { navigate } = useRouter();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [editingName, setEditingName] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setDateOfBirth(profile.date_of_birth || '');
    }
  }, [profile]);

  if (!profile) {
    navigate('/login');
    return null;
  }

  const dashboardPath =
    profile.role === 'dentist' ? '/dentist' : profile.role === 'admin' ? '/admin' : '/patient';

  const roleInfo = ROLE_LABELS[profile.role] || ROLE_LABELS.patient;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Full name cannot be empty.');
      return;
    }
    setError('');
    setSaving(true);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        date_of_birth: dateOfBirth || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      await refreshProfile();
      setSaved(true);
      setEditingName(false);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back button */}
        <button
          onClick={() => navigate(dashboardPath)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

        {/* Avatar + role card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {profile.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-white rounded-xl border border-gray-200 shadow flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">
                <Camera size={13} />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{profile.full_name}</h2>
              <p className="text-gray-500 text-sm mt-0.5">{profile.email}</p>
              <div className="mt-2">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold border px-3 py-1 rounded-full ${roleInfo.color}`}>
                  <Shield size={11} />
                  {roleInfo.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-900">Personal Information</h3>
            {!editingName && (
              <button
                type="button"
                onClick={() => setEditingName(true)}
                className="flex items-center gap-1.5 text-sm text-blue-700 font-medium hover:text-blue-800 transition-colors"
              >
                <Edit2 size={14} />
                Edit
              </button>
            )}
          </div>

          {saved && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-5">
              <CheckCircle size={16} />
              Profile updated successfully.
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={!editingName}
                  required
                  placeholder="Your full name"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all ${
                    editingName
                      ? 'border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'
                      : 'border-gray-200 bg-gray-50 text-gray-700 cursor-default'
                  }`}
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={profile.email || ''}
                  disabled
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-sm cursor-default"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed here.</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!editingName}
                  placeholder="082 123 4567"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all ${
                    editingName
                      ? 'border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'
                      : 'border-gray-200 bg-gray-50 text-gray-700 cursor-default'
                  }`}
                />
              </div>
            </div>

            {/* Date of birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  disabled={!editingName}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all ${
                    editingName
                      ? 'border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'
                      : 'border-gray-200 bg-gray-50 text-gray-700 cursor-default'
                  }`}
                />
              </div>
            </div>

            {/* Role (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Role</label>
              <div className="relative">
                <Shield size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={roleInfo.label}
                  disabled
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-sm cursor-default capitalize"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Role is assigned by the clinic and cannot be changed.</p>
            </div>

            {/* Action buttons (only shown in edit mode) */}
            {editingName && (
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingName(false);
                    setFullName(profile.full_name || '');
                    setPhone(profile.phone || '');
                    setDateOfBirth(profile.date_of_birth || '');
                    setError('');
                  }}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-700/20"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Save size={15} /> Save Changes</>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Account info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Account Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Member since</span>
              <span className="font-medium text-gray-800">
                {new Date(profile.created_at).toLocaleDateString('en-ZA', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-500">Account status</span>
              <span className="inline-flex items-center gap-1.5 text-green-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
