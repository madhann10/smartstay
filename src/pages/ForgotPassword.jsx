import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import TextField from '../components/TextField.jsx';
import { requestPasswordReset } from '../api/auth.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!email) {
      setError('Enter your email.');
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setError('That email doesn\u2019t look right.');
      return;
    }
    setError('');

    setSubmitting(true);
    try {
      await requestPasswordReset({ email });
      setSent(true);
    } catch (err) {
      setFormError(err.message || 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <AuthLayout
        title="Check your inbox"
        subtitle={`If an account exists for ${email}, a reset link is on its way.`}
      >
        <p className="auth-form__note">
          The link is good for one hour. Nothing arrived? Check spam, or try
          again with a different address.
        </p>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => setSent(false)}
        >
          Use a different email
        </button>
        <p className="auth-card__foot">
          <Link to="/login">Back to sign in</Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Tell us the email on your account and we\u2019ll send a reset link."
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          error={error}
          placeholder="you@example.com"
        />

        {formError ? <p className="auth-form__error">{formError}</p> : null}

        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Sending\u2026' : 'Send reset link'}
        </button>
      </form>

      <p className="auth-card__foot">
        Remembered it after all? <Link to="/login">Back to sign in</Link>
      </p>
    </AuthLayout>
  );
}
