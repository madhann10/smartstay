import { Building2, KeyRound, Mail } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import PasswordField from '../components/PasswordField';

const errorText = (err, fallback) => err?.response?.data?.message || fallback;

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [googleReady, setGoogleReady] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const completeLogin = (data) => {
    login(data);
    const redirect = location.state?.from?.pathname;
    navigate(redirect || (data.user?.role === 'admin' ? '/admin' : '/dashboard'));
  };

  // Show success or session expiration message
  useEffect(() => {
    if (location.state?.message) setMessage(location.state.message);
    const params = new URLSearchParams(window.location.search);
    if (params.get('expired') === '1') {
      setMessage('Your administrator session has expired. Please sign in again.');
    }
  }, [location.state]);

  const fillAdmin = () => {
    setEmail('admin@example.com');
    setPassword('Admin@12345');
  };

  // Google Sign-In SDK loader
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

    const scriptId = 'google-gsi-sdk';
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
      const data = await authApi.login({
        email: email.trim().toLowerCase(),
        password,
      });
      completeLogin(data);
    } catch (err) {
      setError(errorText(err, 'Invalid email or password.'));
    } finally {
      setLoading('');
    }
  };

  const handleFallbackGoogle = async () => {
    setError('');
    setMessage('');
    setLoading('google');
    try {
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
      {/* Left branding panel — desktop only */}
      <section className="hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500">
            <Building2 size={20} />
          </span>
          SmartStay
        </Link>
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-300">
            Hotel booking, reimagined
          </p>
          <h1 className="mt-4 max-w-lg text-5xl font-bold leading-tight">
            A better way to plan your next stay.
          </h1>
          <p className="mt-5 max-w-md leading-7 text-slate-300">
            Search quality stays, understand dynamic room rates, and keep every booking in one place.
          </p>
        </div>
        <p className="text-sm text-slate-400">SmartStay · 2026</p>
      </section>

      {/* Right login panel */}
      <section className="grid place-items-center bg-slate-50 p-5">
        <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-sm sm:p-9">
          {/* Mobile logo */}
          <Link to="/" className="mb-8 flex items-center gap-2 text-lg font-bold text-slate-900 lg:hidden">
            <Building2 size={22} />SmartStay
          </Link>

          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Welcome back</p>
          <h2 className="mt-2 text-3xl font-bold">Sign in to SmartStay.</h2>

          {message && (
            <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>
          )}
          {error && (
            <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
          )}

          {/* Google Sign-In */}
          <div className="mt-6">
            <div id="google-btn-container" className="flex min-h-[44px] justify-center" />
            {(!googleClientId || !googleReady) && (
              <button
                type="button"
                onClick={handleFallbackGoogle}
                disabled={loading === 'google'}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
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
            <div className="w-full border-t border-slate-200" />
            <span className="absolute bg-white px-3 text-xs font-semibold uppercase text-slate-400">
              Or email &amp; password
            </span>
          </div>

          {/* Quick Admin Fill Helper */}
          <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50/80 p-3 text-xs text-indigo-950 flex items-center justify-between">
            <div>
              <span className="font-bold text-indigo-900 block">Administrator Login</span>
              <span className="text-slate-600">admin@example.com</span>
            </div>
            <button
              type="button"
              onClick={fillAdmin}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              Fill Admin
            </button>
          </div>

          {/* Email + Password form */}
          <form onSubmit={submitEmail} className="space-y-4">
            <FieldLabel icon={<Mail size={16} />} label="Email Address">
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </FieldLabel>
            <PasswordField
              icon={<KeyRound size={16} />}
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="Enter your password"
            />
            <div className="text-right">
              <Link to="/forgot-password" className="text-sm font-semibold text-indigo-600">
                Forgot password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={!!loading}
              className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {loading === 'email' ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            New to SmartStay?{' '}
            <Link to="/register" className="font-semibold text-indigo-600">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

function FieldLabel({ icon, label, children }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      {children && (
        <span className="mt-2 block [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-slate-200 [&_input]:px-3 [&_input]:py-3 [&_input]:outline-indigo-500">
          {children}
        </span>
      )}
    </label>
  );
}
