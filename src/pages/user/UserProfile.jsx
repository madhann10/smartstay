import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, User, Mail, Phone, ShieldCheck, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { userApi, authApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PasswordField from '../../components/PasswordField';

export default function UserProfile() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmNew: '' });
  const [saving, setSaving] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    userApi.getMe().then((user) => {
      setProfile(user);
      setForm({ name: user?.name || '', phone: user?.phone || '' });
    }).catch(() => setError('Could not load profile.')).finally(() => setLoading(false));
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setError(''); setMessage(''); setSaving('profile');
    try {
      const updatedUser = await userApi.updateMe({ name: form.name.trim(), phone: form.phone.trim() });
      setProfile(updatedUser);
      setEditing(false);
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally { setSaving(''); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    if (pwForm.newPassword !== pwForm.confirmNew) return setError('New passwords do not match.');
    if (pwForm.newPassword.length < 8) return setError('Password must be at least 8 characters.');
    setSaving('pw');
    try {
      const data = await authApi.changePassword(pwForm.currentPassword, pwForm.newPassword);
      setMessage(data.message || 'Password changed successfully.');
      setPwForm({ currentPassword: '', newPassword: '', confirmNew: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.');
    } finally { setSaving(''); }
  };

  if (loading) return <div className='grid min-h-screen place-items-center bg-slate-50'><p className='text-slate-500'>Loading profile…</p></div>;

  return (
    <main className='min-h-screen bg-slate-50 py-10 px-5'>
      <div className='mx-auto max-w-2xl'>
        {/* Header */}
        <div className='mb-6 flex items-center gap-3'>
          <Link to='/dashboard' className='flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800'>
            <ArrowLeft size={16}/> Back to My stays
          </Link>
        </div>
        <div className='mb-4 flex items-center gap-2 text-xl font-bold text-slate-900'>
          <Building2 size={22} className='text-indigo-600'/> SmartStay
        </div>
        <p className='text-xs font-bold uppercase tracking-widest text-indigo-600'>Account</p>
        <h1 className='mt-1 text-3xl font-bold text-slate-900'>My Profile</h1>

        {message && <p className='mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700'>{message}</p>}
        {error && <p className='mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700'>{error}</p>}

        {/* Profile Card */}
        <div className='mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
          <div className='flex items-start justify-between'>
            <h2 className='text-lg font-bold text-slate-900'>Personal information</h2>
            {!editing && (
              <button onClick={() => { setEditing(true); setMessage(''); setError(''); }} className='rounded-lg border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50'>
                Edit
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={saveProfile} className='mt-5 space-y-4'>
              <label className='block text-sm font-medium text-slate-700'>
                <span className='flex items-center gap-2'><User size={16}/>Full name</span>
                <input required value={form.name} onChange={(e) => setForm((f) => ({...f, name: e.target.value}))} className='mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 outline-indigo-500'/>
              </label>
              <label className='block text-sm font-medium text-slate-700'>
                <span className='flex items-center gap-2'><Phone size={16}/>Mobile number</span>
                <input value={form.phone} onChange={(e) => setForm((f) => ({...f, phone: e.target.value}))} placeholder='+91 98765 43210' className='mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 outline-indigo-500'/>
              </label>
              <div className='flex gap-3'>
                <button type='submit' disabled={!!saving} className='rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60'>
                  {saving === 'profile' ? 'Saving…' : 'Save changes'}
                </button>
                <button type='button' onClick={() => { setEditing(false); setError(''); }} className='rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700'>Cancel</button>
              </div>
            </form>
          ) : (
            <dl className='mt-5 space-y-4'>
              <ProfileRow icon={<User size={16}/>} label='Name' value={profile?.name || '—'}/>
              <ProfileRow icon={<Mail size={16}/>} label='Email' value={profile?.email || '—'}/>
              <ProfileRow icon={<Phone size={16}/>} label='Mobile' value={profile?.phone || 'Not set'}/>
              <ProfileRow icon={<ShieldCheck size={16}/>} label='Role' value={profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : '—'}/>
              <div className='flex items-center gap-2 text-sm'>
                <span className='w-28 font-medium text-slate-500'>Phone verified</span>
                {profile?.phoneVerified
                  ? <span className='flex items-center gap-1 text-emerald-600 font-semibold'><CheckCircle2 size={16}/> Verified</span>
                  : <span className='flex items-center gap-1 text-slate-400'><XCircle size={16}/> Not verified</span>
                }
              </div>
            </dl>
          )}
        </div>

        {/* Change Password Card — only for email/local accounts */}
        {profile?.authProvider !== 'google' && (
          <div className='mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
            <h2 className='text-lg font-bold text-slate-900'>Change password</h2>
            <form onSubmit={changePassword} className='mt-5 space-y-4'>
              <PasswordField label='Current password' value={pwForm.currentPassword} onChange={(v) => setPwForm((p) => ({...p, currentPassword: v}))} placeholder='Your current password'/>
              <PasswordField label='New password' value={pwForm.newPassword} onChange={(v) => setPwForm((p) => ({...p, newPassword: v}))} placeholder='At least 8 characters'/>
              <PasswordField label='Confirm new password' value={pwForm.confirmNew} onChange={(v) => setPwForm((p) => ({...p, confirmNew: v}))} placeholder='Repeat new password'/>
              <button type='submit' disabled={!!saving} className='rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60'>
                {saving === 'pw' ? 'Changing…' : 'Change password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}

function ProfileRow({ icon, label, value }) {
  return (
    <div className='flex items-center gap-2 text-sm'>
      <span className='w-28 font-medium text-slate-500'>{label}</span>
      <span className='flex items-center gap-1 text-slate-900'>{icon}{value}</span>
    </div>
  );
}
