import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api';

export default function ForgotPasswordAuth() {
  const [email, setEmail] = useState(''); const [message, setMessage] = useState(''); const [loading, setLoading] = useState(false);
  const submit = async (event) => { event.preventDefault(); setLoading(true); try { const data = await authApi.forgotPassword(email); setMessage(data.message); } finally { setLoading(false); } };
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-5"><form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm"><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Account recovery</p><h1 className="mt-2 text-3xl font-bold">Reset your password</h1><p className="mt-3 text-sm text-slate-500">Enter your email and we will send reset instructions if an account exists.</p>{message && <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}<label className="mt-6 block text-sm font-medium">Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 outline-indigo-500"/></label><button disabled={loading} className="mt-5 w-full rounded-lg bg-indigo-600 py-3 text-sm font-bold text-white disabled:opacity-60">{loading ? 'Sending…' : 'Send reset instructions'}</button><Link to="/login" className="mt-5 block text-center text-sm font-semibold text-indigo-600">Back to login</Link></form></main>;
}
