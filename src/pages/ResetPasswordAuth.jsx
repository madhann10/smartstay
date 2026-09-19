import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../services/api';
import PasswordField from '../components/PasswordField';
import { KeyRound } from 'lucide-react';

export default function ResetPasswordAuth() {
  const [params] = useSearchParams(); const [password, setPassword] = useState(''); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const submit = async (event) => { event.preventDefault(); setError(''); try { const data = await authApi.resetPassword(params.get('token'), password); setMessage(data.message); } catch (err) { setError(err.response?.data?.message || 'Unable to reset password.'); } };
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-5"><form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm"><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Account recovery</p><h1 className="mt-2 text-3xl font-bold">Choose a new password</h1>{message && <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}{error && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}<div className="mt-6"><PasswordField icon={<KeyRound size={16}/>} label="New password" value={password} onChange={setPassword} placeholder="At least 8 characters" minLength={8}/></div><button className="mt-5 w-full rounded-lg bg-indigo-600 py-3 text-sm font-bold text-white">Reset password</button><Link to="/login" className="mt-5 block text-center text-sm font-semibold text-indigo-600">Back to login</Link></form></main>;
}
