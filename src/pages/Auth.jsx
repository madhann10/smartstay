import { Building2, KeyRound, Mail, Phone, ShieldCheck } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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

export default function Auth({ register = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [mode, setMode] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(location.state?.verifiedPhone || '');
  const [otp, setOtp] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [loading, setLoading] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [googleReady, setGoogleReady] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const completeLogin = (data) => {
    login(data);
    navigate(location.state?.from?.pathname || (data.user.role === 'admin' ? '/admin' : '/dashboard'));
  };

  useEffect(() => {
    if (!seconds) return undefined;
    const timer = setInterval(() => setSeconds((val) => Math.max(0, val - 1)), 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  useEffect(() => {
    if (location.state?.message) setMessage(location.state.message);
  }, [location.state]);

  // Google Sign-In script loader
  useEffect(() => {
    if (!googleClientId) return;
    const handleCredentialResponse = async (response) => {
      try {
        setError('');
        setMessage('');
        setLoading('google');
        const data = await authApi.loginWithGoogle(response.credential);
        completeLogin(data);
      } catch (err) {
        setError(errorText(err, 'Google authentication failed. Please try again.'));
      } finally {
        setLoading('');
      }
    };

    const scriptId = 'google-jssdk';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleCredentialResponse,
          });
          const btnDiv = document.getElementById('google-btn-container');
          if (btnDiv) {
            window.google.accounts.id.renderButton(btnDiv, {
              theme: 'outline',
              size: 'large',
              width: 350,
              text: 'continue_with',
            });
            setGoogleReady(true);
          }
        }
      };
      document.body.appendChild(script);
    }
  }, [googleClientId]);

  const submitEmail = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading('email');
    try {
      const data = await authApi.login({ email, password });
      completeLogin(data);
    } catch (err) {
      setError(errorText(err, 'Login failed. Please try again.'));
    } finally {
      setLoading('');
    }
  };

  const requestOtp = async () => {
    setError('');
    setMessage('');
    const formattedPhone = normalizeFrontendPhone(phone);
    if (!formattedPhone) {
      return setError('Invalid mobile number. Enter a valid 10-digit number (e.g. 9876543210 or +919876543210).');
    }
    setLoading('send');
    try {
      const data = await authApi.sendOtp(formattedPhone);
      setPhone(formattedPhone);
      setSeconds(data.expiresIn || 60);
      setMessage(data.message);
    } catch (err) {
      setError(errorText(err, 'Unable to send OTP. Please try again.'));
    } finally {
      setLoading('');
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    const formattedPhone = normalizeFrontendPhone(phone);
    if (!formattedPhone) return setError('Invalid mobile number. Enter a valid 10-digit number.');
    if (!/^\d{6}$/.test(otp)) return setError('Enter the 6-digit OTP.');
    setLoading('verify');
    try {
      const data = await authApi.verifyOtp(formattedPhone, otp);
      if (data.requiresOnboarding) {
        navigate('/register', { state: { verifiedPhone: data.phone, message: data.message } });
        return;
      }
      completeLogin(data);
    } catch (err) {
      setError(errorText(err, 'OTP verification failed. Please try again.'));
    } finally {
      setLoading('');
    }
  };

  const submitRegister = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    const formattedPhone = phone ? normalizeFrontendPhone(phone) : undefined;
    if (phone && !formattedPhone) {
      return setError('Invalid mobile number. Enter a valid 10-digit number.');
    }
    setLoading('register');
    try {
      await authApi.register({ name, email, password, phone: formattedPhone });
      navigate('/login', { state: { message: 'Account created. Sign in with email, mobile, or Google.' } });
    } catch (err) {
      setError(errorText(err, 'Registration failed. Please try again.'));
    } finally {
      setLoading('');
    }
  };

  const handleFallbackGoogle = async () => {
    try {
      setError('');
      setMessage('');
      setLoading('google');
      const data = await authApi.loginWithGoogle(null, true);
      completeLogin(data);
    } catch (err) {
      setError(errorText(err, 'Google authentication failed. Please try again.'));
    } finally {
      setLoading('');
    }
  };

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500"><Building2 size={20}/></span>SmartStay
        </Link>
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-300">Hotel booking, reimagined</p>
          <h1 className="mt-4 max-w-lg text-5xl font-bold leading-tight">A better way to plan your next stay.</h1>
          <p className="mt-5 max-w-md leading-7 text-slate-300">Search quality stays, understand dynamic room rates, and keep every booking in one place.</p>
        </div>
        <p className="text-sm text-slate-400">SmartStay · 2026</p>
      </section>

      <section className="grid place-items-center bg-slate-50 p-5">
        <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-sm sm:p-9">
          <Link to="/" className="mb-8 flex items-center gap-2 text-lg font-bold text-slate-900 lg:hidden">
            <Building2 size={22}/>SmartStay
          </Link>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">{register ? 'Create your account' : 'Welcome back'}</p>
          <h2 className="mt-2 text-3xl font-bold">{register ? 'Start booking smarter.' : 'Sign in to SmartStay.'}</h2>

          {message && <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
          {error && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

          {register ? (
            <form onSubmit={submitRegister} className="mt-7 space-y-4">
              <Label icon={<ShieldCheck size={16}/>} label="Full name"><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"/></Label>
              <Label icon={<Mail size={16}/>} label="Email"><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"/></Label>
              <Label icon={<Phone size={16}/>} label="Mobile number (optional)"><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210 or +91 98765 43210"/></Label>
              <PasswordField icon={<KeyRound size={16}/>} label="Password" value={password} onChange={setPassword} placeholder="At least 8 characters"/>
              <button disabled={!!loading} className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-bold text-white disabled:opacity-60">{loading === 'register' ? 'Creating account…' : 'Create account'}</button>
              <p className="text-center text-sm text-slate-500">Already have an account? <Link to="/login" className="font-semibold text-indigo-600">Sign in</Link></p>
            </form>
          ) : (
            <>
              {/* Google Sign-In Button */}
              <div className="mt-6">
                <div id="google-btn-container" className="flex justify-center min-h-[44px]"></div>
                {(!googleClientId || !googleReady) && (
                  <button
                    type="button"
                    onClick={handleFallbackGoogle}
                    className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    Continue with Google
                  </button>
                )}
              </div>

              <div className="relative my-6 flex items-center justify-center">
                <div className="w-full border-t border-slate-200"></div>
                <span className="absolute bg-white px-3 text-xs font-semibold uppercase text-slate-400">Or continue with</span>
              </div>

              <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1">
                <button onClick={() => {setMode('email');setError('');}} className={`rounded-md px-3 py-2 text-sm font-semibold ${mode === 'email' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Login with Email</button>
                <button onClick={() => {setMode('mobile');setError('');}} className={`rounded-md px-3 py-2 text-sm font-semibold ${mode === 'mobile' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Login with Mobile</button>
              </div>

              {mode === 'email' ? (
                <form onSubmit={submitEmail} className="mt-6 space-y-4">
                  <Label icon={<Mail size={16}/>} label="Email"><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"/></Label>
                  <PasswordField icon={<KeyRound size={16}/>} label="Password" value={password} onChange={setPassword} placeholder="Enter your password"/>
                  <div className="text-right"><Link to="/forgot-password" className="text-sm font-semibold text-indigo-600">Forgot password?</Link></div>
                  <button disabled={!!loading} className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-bold text-white disabled:opacity-60">{loading === 'email' ? 'Logging in…' : 'Login'}</button>
                </form>
              ) : (
                <form onSubmit={verifyOtp} className="mt-6 space-y-4">
                  <Label icon={<Phone size={16}/>} label="Mobile number"><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210 or +91 98765 43210" inputMode="tel"/></Label>
                  <button type="button" onClick={requestOtp} disabled={!!loading || seconds > 0} className="w-full rounded-lg border border-indigo-200 bg-indigo-50 py-3 text-sm font-bold text-indigo-700 disabled:opacity-60">{loading === 'send' ? 'Sending OTP…' : seconds > 0 ? `OTP sent · expires in ${formatTime(seconds)}` : 'Send OTP'}</button>
                  {seconds > 0 && (
                    <>
                      <Label icon={<KeyRound size={16}/>} label="Enter OTP"><input required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="_ _ _ _ _ _" inputMode="numeric" maxLength="6" className="tracking-[.45em]"/></Label>
                      <p className="text-center text-sm text-slate-500">OTP expires in: <strong>{formatTime(seconds)}</strong></p>
                      <button disabled={!!loading} className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-bold text-white disabled:opacity-60">{loading === 'verify' ? 'Verifying OTP…' : 'Verify OTP'}</button>
                    </>
                  )}
                  <button type="button" onClick={requestOtp} disabled={!!loading || seconds > 0} className="mx-auto block text-sm font-semibold text-indigo-600 disabled:text-slate-400">{seconds > 0 ? `Resend OTP in ${seconds}s` : 'Resend OTP'}</button>
                </form>
              )}
              <p className="mt-5 text-center text-sm text-slate-500">New to SmartStay? <Link to="/register" className="font-semibold text-indigo-600">Create an account</Link></p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function Label({ icon, label, children }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      <span className="flex items-center gap-2">{icon}{label}</span>
      {children && <span className="mt-2 block [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-slate-200 [&_input]:px-3 [&_input]:py-3 [&_input]:outline-indigo-500">{children}</span>}
    </label>
  );
}

function formatTime(value) {
  return `00:${String(value).padStart(2, '0')}`;
}
