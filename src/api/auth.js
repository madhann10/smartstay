// Mock authentication layer.
// Replace the body of each function with a real call to your backend,
// e.g. `return fetch('/api/auth/login', { method: 'POST', body: ... })`.
// Every function returns a Promise so the pages don't need to change
// when you wire up the real API.

const FAKE_LATENCY_MS = 900;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Simulates emails that are "already registered", so you can see the
// error state without a backend. Try registering with taken@wrenkey.com.
const TAKEN_EMAILS = ['taken@wrenkey.com'];

export async function registerUser({ name, email, password }) {
  await delay(FAKE_LATENCY_MS);

  if (TAKEN_EMAILS.includes(email.toLowerCase())) {
    throw new Error('An account with that email already exists.');
  }

  // Real implementation:
  // const res = await fetch('/api/auth/register', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ name, email, password }),
  // });
  // if (!res.ok) throw new Error((await res.json()).message);
  // return res.json();

  return { id: 'usr_' + Date.now(), name, email };
}

export async function loginUser({ email, password }) {
  await delay(FAKE_LATENCY_MS);

  if (password.length < 8) {
    throw new Error('That email and password combination is incorrect.');
  }

  // Real implementation:
  // const res = await fetch('/api/auth/login', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ email, password }),
  // });
  // if (!res.ok) throw new Error((await res.json()).message);
  // return res.json();

  return { token: 'mock_token_' + Date.now(), email };
}

export async function requestPasswordReset({ email }) {
  await delay(FAKE_LATENCY_MS);

  // Real implementation:
  // const res = await fetch('/api/auth/forgot-password', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ email }),
  // });
  // if (!res.ok) throw new Error((await res.json()).message);
  // return res.json();

  // Always resolves — don't reveal whether an email is registered.
  return { sent: true };
}
