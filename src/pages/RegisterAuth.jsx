import { Building2, KeyRound, Mail, Phone, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import PasswordField from '../components/PasswordField';

const normalizeFrontendPhone = (value) => {
  let compact = String(value || '').replace(/[\s()-]/g, '');
  if (/^[6-9]\d{9}$/.test(compact)) compact = `+91${compact}`;
  if (/^0[6-9]\d{9}$/.test(compact)) compact = `+91${compact.slice(1)}`;
  if (/^\+91[6-9]\d{9}$/.test(compact)) return compact;
  return null;
};

const errorText = (error, fallback) => error.response?.data?.message || fallback;

export default function RegisterAuth() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [step, setStep] = useState(1); // 1: Enter details, 2: Verify OTP, 3: Completed
  const [otp, setOtp] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState('');

  const setField = (key, value) => setForm((curr) => ({ ...curr, [key]: value }));

  useEffect(() => {
    if (!seconds) return undefined;
    const timer = setInterval(() => setSeconds((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  // STEP 1: Send OTP to Mobile Number
  const handleSendOtp = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!form.name.trim()) return setError('Please enter your full name.');
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setError('Please enter a valid email address.');
    
    const formattedPhone = normalizeFrontendPhone(form.phone);
    if (!formattedPhone) return setError('Please enter a valid mobile number.');

    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');

    setLoading('send');
    try {
      const data = await authApi.sendOtp(formattedPhone, true, form.email.trim());
      setForm((curr) => ({ ...curr, phone: formattedPhone }));
      setSeconds(data.expiresIn || 60);
      setMessage(data.message);
      setStep(2);
    } catch (err) {
      setError(errorText(err, 'Unable to send OTP. Please try again.'));
    } finally {
      setLoading('');
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (seconds > 0 || loading) return;
    setError('');
    setMessage('');
    setLoading('send');
    try {
      const data = await authApi.sendOtp(form.phone, true, form.email.trim());
      setSeconds(data.expiresIn || 60);
      setMessage(data.message);
    } catch (err) {
      setError(errorText(err, 'Unable to resend OTP. Please try again.'));
    } finally {
      setLoading('');
    }
  };

  // STEP 2: Verify OTP & Complete Registration
  const handleVerifyAndRegister = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!/^\d{6}$/.test(otp)) return setError('Please enter a valid 6-digit OTP.');

    setLoading('register');
    try {
      // 1. Verify OTP first
      const otpRes = await authApi.verifyOtp(form.phone, otp);
      if (!otpRes.success) throw new Error(otpRes.message || 'OTP verification failed.');

      // 2. Complete Account Registration
      const regRes = await authApi.register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone,
        password: form.password,
        confirmPassword: form.confirmPassword
      });

      if (regRes.token) {
        login(regRes);
        navigate('/dashboard');
      } else {
        navigate('/login', { state: { message: 'Registration complete! Sign in with your email and password.' } });
      }
    } catch (err) {
      setError(errorText(err, 'OTP verification failed. Please try again.'));
    } finally {
      setLoading('');
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-5">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-sm sm:p-9">
        <Link to="/" className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900">
          <Building2 size={22}/>SmartStay
        </Link>
        
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Create your SmartStay account</p>
        <h1 className="mt-2 text-3xl font-bold">Start booking smarter.</h1>

        {message && <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
        {error && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="mt-6 space-y-4">
            <Field icon={<ShieldCheck size={16}/>} label="Full Name" value={form.name} change={(v) => setField('name', v)} placeholder="John Doe"/>
            <Field icon={<Mail size={16}/>} label="Email" type="email" value={form.email} change={(v) => setField('email', v)} placeholder="you@example.com"/>
            <Field icon={<Phone size={16}/>} label="Mobile Number" value={form.phone} change={(v) => setField('phone', v)} placeholder="9876543210 or +91 98765 43210"/>
            <PasswordField icon={<KeyRound size={16}/>} label="Password" value={form.password} onChange={(v) => setField('password', v)} placeholder="At least 8 characters"/>
            <PasswordField icon={<KeyRound size={16}/>} label="Confirm Password" value={form.confirmPassword} onChange={(v) => setField('confirmPassword', v)} placeholder="Repeat password"/>
            
            <button disabled={!!loading} className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-bold text-white disabled:opacity-60">
              {loading === 'send' ? 'Sending OTP…' : 'Send OTP & Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndRegister} className="mt-6 space-y-4">
            <div className="rounded-lg bg-indigo-50 p-4 text-center text-sm text-indigo-900">
              <span className="flex items-center justify-center gap-1 font-semibold text-indigo-700">
                <Phone size={16} /> We sent an OTP to:
              </span>
              <strong className="mt-1 block text-base font-bold text-indigo-950">{form.phone}</strong>
              <button type="button" onClick={() => setStep(1)} className="mt-2 text-xs font-semibold text-indigo-600 underline">
                Change phone number
              </button>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              <span className="flex items-center gap-2"><KeyRound size={16}/>Enter 6-Digit OTP</span>
              <input
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="_ _ _ _ _ _"
                inputMode="numeric"
                maxLength="6"
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 text-center tracking-[.45em] text-lg font-bold outline-indigo-500"
              />
            </label>

            {seconds > 0 && (
              <p className="text-center text-xs text-slate-500">
                OTP expires in: <strong>00:{String(seconds).padStart(2, '0')}</strong>
              </p>
            )}

            <button disabled={!!loading || otp.length !== 6} className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-bold text-white disabled:opacity-60">
              {loading === 'register' ? 'Verifying & Creating Account…' : 'Verify OTP & Create Account'}
            </button>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={!!loading || seconds > 0}
              className="mx-auto block text-sm font-semibold text-indigo-600 disabled:text-slate-400"
            >
              {seconds > 0 ? `Resend OTP in ${seconds}s` : 'Resend OTP'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account? <Link to="/login" className="font-semibold text-indigo-600">Sign in</Link>
        </p>
      </div>
    </main>
  );
}

function Field({ icon, label, value, change, type = 'text', placeholder }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      <span className="flex items-center gap-2">{icon}{label}</span>
      <input
        required
        type={type}
        minLength={type === 'password' ? 8 : undefined}
        value={value}
        onChange={(e) => change(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 outline-indigo-500"
      />
    </label>
  );
}
