import 'dotenv/config';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import OtpChallenge from '../models/OtpChallenge.js';
import LoginActivity from '../models/LoginActivity.js';

async function resetAuthData() {
  console.log('==================================================');
  console.log('AUTHENTICATION DATA RESET INITIALIZED');
  console.log('==================================================\n');

  await connectDB();

  const adminEmail = (process.env.ADMIN_EMAIL || 'madhann426@gmail.com').toLowerCase();

  // 1. Identify existing Admin Accounts to protect
  const protectedAdmins = await User.find({
    $or: [{ role: 'admin' }, { email: adminEmail }]
  });

  if (protectedAdmins.length === 0) {
    console.warn('⚠️ Warning: No existing admin found prior to reset. Run "npm run seed:admin" first if needed.');
  } else {
    console.log(`🔒 Protecting ${protectedAdmins.length} Admin Account(s):`);
    protectedAdmins.forEach(adm => console.log(`   - ${adm.email} (Role: ${adm.role})`));
  }

  // 2. Count non-admin data before removal
  const customerCount = await User.countDocuments({ role: 'customer' });
  const hotelAdminCount = await User.countDocuments({ role: 'hotel_admin' });
  const otpCount = await OtpChallenge.countDocuments({});
  const loginActivityCount = await LoginActivity.countDocuments({});

  // 3. Delete ONLY non-admin authentication data
  const userDeleteResult = await User.deleteMany({
    role: { $ne: 'admin' },
    email: { $ne: adminEmail }
  });

  const otpDeleteResult = await OtpChallenge.deleteMany({});
  const activityDeleteResult = await LoginActivity.deleteMany({});

  // 4. Verify Admin Account remains intact
  const verifiedAdmin = await User.findOne({ email: adminEmail, role: 'admin' });

  console.log('\n==================================================');
  console.log('RESET SUMMARY REPORT');
  console.log('==================================================');
  console.log(`Admin accounts protected       : ${protectedAdmins.length}`);
  console.log(`Customer accounts removed      : ${userDeleteResult.deletedCount}`);
  console.log(`Hotel admin accounts removed   : ${hotelAdminCount}`);
  console.log(`OTP records removed            : ${otpDeleteResult.deletedCount}`);
  console.log(`Login activity records removed : ${activityDeleteResult.deletedCount}`);
  console.log('--------------------------------------------------');

  if (verifiedAdmin) {
    console.log(`✅ Admin Account Preserved Successfully:`);
    console.log(`   Email : ${verifiedAdmin.email}`);
    console.log(`   Role  : ${verifiedAdmin.role}`);
  } else {
    console.error('❌ ERROR: Admin account missing after reset! Re-seeding admin account...');
    process.exit(1);
  }

  console.log('\nAuthentication data reset completed successfully.');
  console.log('Hotel, Room, Booking, Payment & Dynamic Pricing data remain untouched.\n');

  process.exit(0);
}

resetAuthData().catch((err) => {
  console.error('Reset execution error:', err);
  process.exit(1);
});
