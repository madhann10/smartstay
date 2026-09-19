import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
  phone: { type: String, trim: true, unique: true, sparse: true },
  passwordHash: { type: String, select: false },
  role: { type: String, enum: ['customer', 'hotel_admin', 'admin'], default: 'customer' },
  googleId: { type: String, unique: true, sparse: true },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  profile: {
    avatarUrl: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
  },
  phoneVerified: { type: Boolean, default: false },
  phoneVerifiedAt: Date,
  passwordResetHash: { type: String, select: false },
  passwordResetExpiresAt: { type: Date, select: false },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
