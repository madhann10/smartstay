import mongoose from 'mongoose';

const otpChallengeSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true, index: true },
  otpHash: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  lastSentAt: { type: Date, required: true },
  requestsInWindow: { type: Number, default: 1 },
  requestWindowStartedAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  usedAt: Date,
}, { timestamps: true });

export default mongoose.model('OtpChallenge', otpChallengeSchema);
