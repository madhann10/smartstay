/**
 * Delivery adapter for password-reset links. A mail provider can replace this
 * without changing controllers. It never returns a reset token to the client.
 */
export async function sendPasswordReset(email, resetUrl) {
  if (process.env.NODE_ENV !== 'production' && process.env.DEV_PASSWORD_RESET_LOGGING === 'true') {
    console.info(`[DEV ONLY] Password reset link for ${email}: ${resetUrl}`);
  }
  // Email delivery is intentionally a no-op until a mail provider is configured.
  return { delivered: false };
}
