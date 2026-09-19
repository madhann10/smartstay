/**
 * Replace this adapter with a provider SDK/API call when credentials are supplied.
 * In development, mock delivery intentionally does not return an OTP to the browser.
 */
export async function sendOtp(phone, otp) {
  const provider = process.env.SMS_PROVIDER || 'mock';
  if (provider === 'mock') {
    if (process.env.NODE_ENV === 'production') throw new Error('SMS provider is not configured.');
    if (process.env.DEV_OTP_LOGGING === 'true' || process.env.NODE_ENV !== 'production') {
      console.log(`\n========================================\n[DEV MOCK SMS] OTP for ${phone}: ${otp}\n========================================\n`);
    }
    return { provider: 'mock', delivered: true };
  }
  if (!process.env.SMS_PROVIDER_API_KEY || !process.env.SMS_PROVIDER_API_SECRET || !process.env.SMS_PROVIDER_SENDER_ID) {
    throw new Error('SMS provider environment variables are incomplete.');
  }
  // Provider-specific transport belongs here. Never return or log the OTP.
  throw new Error(`SMS provider "${provider}" has not been implemented.`);
}
