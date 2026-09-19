import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import LoginActivity from '../models/LoginActivity.js';
import OtpChallenge from '../models/OtpChallenge.js';
import User from '../models/User.js';
import { sendOtp as sendSmsOtp } from '../services/smsService.js';
import { normalizePhone } from '../utils/phone.js';
import { OAuth2Client } from 'google-auth-library';
import { sendPasswordReset } from '../services/passwordResetService.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const otpExpirySeconds = Number(process.env.OTP_EXPIRY_SECONDS || 60);
const otpHash = (phone, otp) => crypto.createHmac('sha256', process.env.OTP_HASH_SECRET || process.env.JWT_SECRET || 'development-only-secret').update(`${phone}:${otp}`).digest('hex');
const clientMeta = (req) => ({ ipAddress: req.ip || '', userAgent: String(req.get('user-agent') || '').slice(0, 500) });
const issueToken = (user, sessionId) => jwt.sign({ id: user._id, email: user.email, phone: user.phone, role: user.role, sessionId }, process.env.JWT_SECRET || 'development-only-secret', { expiresIn: process.env.JWT_EXPIRY || '1d' });
const record = (req, details) => LoginActivity.create({ ...clientMeta(req), ...details });
const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role });
const validEmail = (email) => /^\S+@\S+\.\S+$/.test(String(email || '').trim());

export const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phone } = req.body;
    if (!name || !validEmail(email) || !password) return res.status(400).json({ success: false, message: 'Please enter your name, a valid email, and a password.' });
    if (password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    if (confirmPassword !== undefined && password !== confirmPassword) return res.status(400).json({ success: false, message: 'Passwords do not match.' });

    const normalizedEmail = email.toLowerCase().trim();
    const emailExists = await User.findOne({ email: normalizedEmail });
    if (emailExists) return res.status(409).json({ success: false, message: 'An account already uses this email address.' });

    let normalizedPhone;
    if (phone) {
      normalizedPhone = normalizePhone(phone);
      if (normalizedPhone) {
        const phoneExists = await User.findOne({ phone: normalizedPhone });
        if (phoneExists) return res.status(409).json({ success: false, message: 'This mobile number is already registered.' });
      }
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      ...(normalizedPhone ? { phone: normalizedPhone } : {}),
      passwordHash: await bcrypt.hash(password, 12),
      role: 'customer'
    });

    const sessionId = crypto.randomUUID();
    await record(req, { userId: user._id, name: user.name, email: user.email, phone: user.phone || '', loginMethod: 'EMAIL', status: 'SUCCESS', sessionId });

    return res.status(201).json({ success: true, message: 'Account created successfully. Please sign in.', token: issueToken(user, sessionId), user: publicUser(user) });
  } catch (error) { return res.status(500).json({ success: false, message: 'Registration failed. Please try again.' }); }
};

export const loginWithEmail = async (req, res) => {
  const { email, password } = req.body;
  if (!validEmail(email) || !password) return res.status(400).json({ success: false, message: 'Invalid email or password.' });
  try {
    const user = await User.findOne({ email: String(email || '').toLowerCase() }).select('+passwordHash');
    if (!user || !user.passwordHash || !(await bcrypt.compare(String(password || ''), user.passwordHash))) {
      await record(req, { email: String(email || '').toLowerCase(), loginMethod: 'EMAIL', status: 'FAILED' });
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    const sessionId = crypto.randomUUID();
    await record(req, { userId: user._id, name: user.name, email: user.email, phone: user.phone, loginMethod: 'EMAIL', status: 'SUCCESS', sessionId });
    return res.json({ success: true, token: issueToken(user, sessionId), user: publicUser(user) });
  } catch { return res.status(500).json({ success: false, message: 'Login failed. Please try again.' }); }
};

export const sendOtp = async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const email = req.body.email ? String(req.body.email).toLowerCase().trim() : null;
  if (!phone) return res.status(400).json({ success: false, message: 'Please enter a valid mobile number.' });

  try {
    // Check duplicates before sending OTP for registration
    const phoneExists = await User.findOne({ phone });
    if (phoneExists && req.body.isRegistration) {
      return res.status(409).json({ success: false, message: 'This mobile number is already registered.' });
    }
    if (email) {
      const emailExists = await User.findOne({ email });
      if (emailExists && req.body.isRegistration) {
        return res.status(409).json({ success: false, message: 'An account already uses this email address.' });
      }
    }

    const now = new Date();
    let challenge = await OtpChallenge.findOne({ phone });
    if (challenge && now - challenge.lastSentAt < 30_000) return res.status(429).json({ success: false, message: 'Please wait before requesting another OTP.' });
    const windowExpired = !challenge || now - challenge.requestWindowStartedAt > 60 * 60 * 1000;
    const requestCount = windowExpired ? 1 : challenge.requestsInWindow + 1;
    if (requestCount > 5) return res.status(429).json({ success: false, message: 'Too many OTP requests. Please try again later.' });

    const otp = crypto.randomInt(100000, 1_000_000).toString();
    const values = { otpHash: otpHash(phone, otp), expiresAt: new Date(now.getTime() + otpExpirySeconds * 1000), lastSentAt: now, requestWindowStartedAt: windowExpired ? now : challenge.requestWindowStartedAt, requestsInWindow: requestCount, attempts: 0, usedAt: undefined };
    challenge = challenge ? Object.assign(challenge, values) : new OtpChallenge({ phone, ...values });
    await challenge.save();

    if (process.env.DEV_OTP_LOGGING === 'true' || process.env.NODE_ENV !== 'production') {
      console.log(`\n[OTP] Mobile: ${phone}\n[OTP] Code: ${otp}\n[OTP] Expires in: ${otpExpirySeconds} seconds\n`);
    }

    try { await sendSmsOtp(phone, otp); } catch (error) { await OtpChallenge.deleteOne({ _id: challenge._id }); return res.status(503).json({ success: false, message: error.message || 'Unable to send OTP. Please try again later.' }); }

    return res.json({ success: true, message: 'OTP sent to your mobile number.', expiresIn: otpExpirySeconds });
  } catch (err) { return res.status(500).json({ success: false, message: err.message || 'Unable to send OTP. Please try again later.' }); }
};

export const verifyOtp = async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const otp = String(req.body.otp || '');
  if (!phone || !/^\d{6}$/.test(otp)) return res.status(400).json({ success: false, message: 'Please enter a valid mobile number and 6-digit OTP.' });

  try {
    const challenge = await OtpChallenge.findOne({ phone });
    if (!challenge) return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP.' });
    if (challenge.usedAt) return res.status(400).json({ success: false, message: 'OTP has already been used. Please request a new OTP.' });
    if (challenge.expiresAt <= new Date()) return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP.' });
    if (challenge.attempts >= 5) return res.status(429).json({ success: false, message: 'Too many attempts. Please request a new OTP.' });

    if (!crypto.timingSafeEqual(Buffer.from(challenge.otpHash), Buffer.from(otpHash(phone, otp)))) {
      challenge.attempts += 1;
      await challenge.save();
      await record(req, { phone, loginMethod: 'MOBILE_OTP', status: 'FAILED' });
      return res.status(401).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }

    challenge.usedAt = new Date();
    await challenge.save();

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(200).json({ success: true, requiresOnboarding: true, message: 'Mobile number verified successfully.', phone });
    }

    const sessionId = crypto.randomUUID();
    await record(req, { userId: user._id, name: user.name, email: user.email, phone, loginMethod: 'MOBILE_OTP', status: 'SUCCESS', sessionId });
    return res.json({ success: true, message: 'Mobile number verified successfully.', token: issueToken(user, sessionId), user: publicUser(user) });
  } catch { return res.status(500).json({ success: false, message: 'OTP verification failed. Please try again.' }); }
};

export const logout = async (req, res) => { if (req.user?.sessionId) await LoginActivity.updateOne({ sessionId: req.user.sessionId, logoutTime: null }, { $set: { logoutTime: new Date() } }); return res.json({ success: true }); };

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || String(newPassword).length < 8) return res.status(400).json({ success: false, message: 'Current password and a new 8-character password are required.' });
  try {
    const user = await User.findById(req.user.id).select('+passwordHash');
    if (!user || !user.passwordHash || !(await bcrypt.compare(currentPassword, user.passwordHash))) return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch { return res.status(500).json({ success: false, message: 'Unable to change password.' }); }
};

export const forgotPassword = async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const generic = { success: true, message: 'If an account exists, password reset instructions have been sent.' };
  if (!validEmail(email)) return res.json(generic);
  try {
    const user = await User.findOne({ email }).select('+passwordResetHash +passwordResetExpiresAt');
    if (!user) return res.json(generic);
    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetHash = crypto.createHash('sha256').update(token).digest('hex');
    user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    await sendPasswordReset(user.email, `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`);
    return res.json(generic);
  } catch { return res.status(500).json({ success: false, message: 'Unable to start password reset.' }); }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword || String(newPassword).length < 8) return res.status(400).json({ success: false, message: 'A valid reset token and an 8-character password are required.' });
  try {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ passwordResetHash: hash, passwordResetExpiresAt: { $gt: new Date() } }).select('+passwordResetHash +passwordResetExpiresAt +passwordHash');
    if (!user) return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired.' });
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordResetHash = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();
    return res.json({ success: true, message: 'Password reset successfully.' });
  } catch { return res.status(500).json({ success: false, message: 'Unable to reset password.' }); }
};

export const loginWithGoogle = async (req, res) => {
  const { credential, isDevMock } = req.body;

  if (isDevMock || credential === 'dev-mock-google-token') {
    const googleId = 'dev-google-user-12345';
    const email = 'dev.google.user@example.com';
    const name = 'Dev Google User';
    const picture = 'https://lh3.googleusercontent.com/a/default-avatar';

    let user = await User.findOne({ googleId });
    if (!user) user = await User.findOne({ email });
    if (user) {
      user.googleId = googleId;
      user.authProvider = 'google';
      await user.save();
    } else {
      user = await User.create({
        name,
        email,
        googleId,
        role: 'customer',
        authProvider: 'google',
        profile: { avatarUrl: picture, address: '' }
      });
    }

    const sessionId = crypto.randomUUID();
    await record(req, {
      userId: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      loginMethod: 'GOOGLE',
      status: 'SUCCESS',
      sessionId
    });

    return res.json({
      success: true,
      token: issueToken(user, sessionId),
      user: publicUser(user)
    });
  }

  if (!credential) return res.status(400).json({ success: false, message: 'Google credential is required.' });

  try {
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID || undefined,
      });
      payload = ticket.getPayload();
    } catch {
      const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
      if (!tokenInfoRes.ok) {
        await record(req, { loginMethod: 'GOOGLE', status: 'FAILED' });
        return res.status(401).json({ success: false, message: 'Invalid or unverified Google token.' });
      }
      payload = await tokenInfoRes.json();
    }

    if (!payload || !payload.email || payload.email_verified === 'false' || payload.email_verified === false) {
      await record(req, { loginMethod: 'GOOGLE', status: 'FAILED' });
      return res.status(401).json({ success: false, message: 'Google email is not verified.' });
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase();
    const name = payload.name || payload.given_name || email.split('@')[0];
    const picture = payload.picture || '';

    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        user.googleId = googleId;
        if (!user.authProvider || user.authProvider === 'local') {
          user.authProvider = 'google';
        }
        if (!user.profile?.avatarUrl && picture) {
          user.profile = { ...(user.profile || {}), avatarUrl: picture };
        }
        await user.save();
      }
    }

    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        role: 'customer',
        authProvider: 'google',
        profile: { avatarUrl: picture, address: '' }
      });
    }

    const sessionId = crypto.randomUUID();
    await record(req, {
      userId: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      loginMethod: 'GOOGLE',
      status: 'SUCCESS',
      sessionId
    });

    return res.json({
      success: true,
      token: issueToken(user, sessionId),
      user: publicUser(user)
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    await record(req, { loginMethod: 'GOOGLE', status: 'FAILED' });
    return res.status(500).json({ success: false, message: 'Google authentication failed. Please try again.' });
  }
};
