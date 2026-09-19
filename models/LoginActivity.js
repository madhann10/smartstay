import mongoose from 'mongoose';

const loginActivitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  loginMethod: { type: String, enum: ['EMAIL', 'MOBILE_OTP', 'GOOGLE'], required: true, index: true },
  loginTime: { type: Date, default: Date.now, index: true },
  logoutTime: Date,
  status: { type: String, enum: ['SUCCESS', 'FAILED'], required: true, index: true },
  sessionId: { type: String, index: true, sparse: true },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
}, { timestamps: true });

loginActivitySchema.index({ loginTime: -1 });
export default mongoose.model('LoginActivity', loginActivitySchema);
