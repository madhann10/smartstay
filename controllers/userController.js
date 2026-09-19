import User from '../models/User.js';
import { normalizePhone } from '../utils/phone.js';

const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, profile: user.profile, createdAt: user.createdAt, updatedAt: user.updatedAt });

export const getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User account was not found.' });
  return res.json({ success: true, user: publicUser(user) });
};

export const updateMe = async (req, res) => {
  try {
    const { name, email, phone, profile } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User account was not found.' });
    if (name !== undefined) { if (!String(name).trim()) return res.status(400).json({ success: false, message: 'Name cannot be empty.' }); user.name = String(name).trim(); }
    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) return res.status(400).json({ success: false, message: 'Invalid email address.' });
      const duplicate = await User.exists({ email: normalizedEmail, _id: { $ne: user._id } });
      if (duplicate) return res.status(409).json({ success: false, message: 'An account already uses this email address.' });
      user.email = normalizedEmail;
    }
    if (phone !== undefined) {
      const normalizedPhone = normalizePhone(phone);
      if (!normalizedPhone) return res.status(400).json({ success: false, message: 'Invalid mobile number. Use +91XXXXXXXXXX.' });
      const duplicate = await User.exists({ phone: normalizedPhone, _id: { $ne: user._id } });
      if (duplicate) return res.status(409).json({ success: false, message: 'An account already uses this mobile number.' });
      user.phone = normalizedPhone;
      if (normalizedPhone !== req.user.phone) user.phoneVerifiedAt = undefined;
    }
    if (profile !== undefined && typeof profile === 'object') user.profile = { ...user.profile.toObject(), avatarUrl: String(profile.avatarUrl || '').slice(0, 500), address: String(profile.address || '').slice(0, 500) };
    await user.save();
    return res.json({ success: true, user: publicUser(user) });
  } catch { return res.status(500).json({ success: false, message: 'Unable to update profile.' }); }
};
