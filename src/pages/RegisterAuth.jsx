import { Building2, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import PasswordField from '../components/PasswordField';

const errorText = (err, fallback) => err?.response?.data?.message || fallback;

export default function RegisterAuth() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setField = (key, value) => setForm((curr) => ({ ...curr, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim().toLowerCase();

    if (!trimmedName) return setError('Please enter your full name.');
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) return setError('Please enter a valid email address.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');

    setLoading(true);
    try {
      const data = await authApi.register({
        name: trimmedName,
        email: trimmedEmail,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      // If backend returned a token, log in immediately
      if (data && data.token) {
        login(data);
        navigate('/dashboard');
      } else {
        navigate('/login', {
          state: { message: 'Account created successfully. Please log in with your email and password.' },
        });
      }
    } catch (err) {
      setError(errorText(err, 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-5">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-sm sm:p-9">
        <Link to="/" className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900">
          <Building2 size={22} />SmartStay
        </Link>

        <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
          Create your SmartStay account
        </p>
        <h1 className="mt-2 text-3xl font-bold">Start booking smarter.</h1>

        {error && (
          <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field
            icon={<ShieldCheck size={16} />}
            label="Full Name"
            value={form.name}
            change={(v) => setField('name', v)}
            placeholder="John Doe"
          />
          <Field
            icon={<Mail size={16} />}
            label="Email Address"
            type="email"
            value={form.email}
            change={(v) => setField('email', v)}
            placeholder="you@example.com"
          />
          <PasswordField
            icon={<KeyRound size={16} />}
            label="Password"
            value={form.password}
            onChange={(v) => setField('password', v)}
            placeholder="At least 8 characters"
          />
          <PasswordField
            icon={<KeyRound size={16} />}
            label="Confirm Password"
            value={form.confirmPassword}
            onChange={(v) => setField('confirmPassword', v)}
            placeholder="Repeat your password"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {loading ? 'Creating Account…' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-600">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

function Field({ icon, label, value, change, type = 'text', placeholder }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      <input
        required
        type={type}
        value={value}
        onChange={(e) => change(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 outline-indigo-500"
      />
    </label>
  );
}
