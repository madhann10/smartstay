import 'dotenv/config';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import User from '../models/User.js';

const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
  throw new Error('Set ADMIN_NAME, ADMIN_EMAIL, and an 8+ character ADMIN_PASSWORD in .env before seeding.');
}
await connectDB();
const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
const user = await User.findOneAndUpdate(
  { email: ADMIN_EMAIL.toLowerCase() },
  { $set: { name: ADMIN_NAME, email: ADMIN_EMAIL.toLowerCase(), passwordHash, role: 'admin' } },
  { upsert: true, new: true, setDefaultsOnInsert: true }
);
console.log(`Admin account ready for ${user.email}.`);
process.exit(0);
