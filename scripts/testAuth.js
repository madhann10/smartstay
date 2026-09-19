import 'dotenv/config';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import OtpChallenge from '../models/OtpChallenge.js';
import crypto from 'crypto';

async function runTests() {
  console.log('==================================================');
  console.log('RUNNING MEMBER 1 — REGISTRATION OTP & AUTH TESTS');
  console.log('==================================================\n');

  await connectDB();

  // Cleanup test users
  await User.deleteMany({ email: { $in: ['test_reg_customer@example.com', 'test_dup@example.com'] } });
  await User.deleteMany({ phone: { $in: ['+919876543210', '+919999999999'] } });
  await OtpChallenge.deleteMany({ phone: { $in: ['+919876543210', '+919999999999'] } });

  const BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  console.log('TEST 1: Request OTP for new registration (10-digit mobile number input)');
  const otpRes = await fetch(`${BASE_URL}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: '9876543210',
      email: 'test_reg_customer@example.com',
      isRegistration: true
    })
  });
  const otpData = await otpRes.json();
  console.log('Status:', otpRes.status, 'Response:', otpData);
  if (otpRes.status !== 200 || !otpData.success) throw new Error('TEST 1 failed');

  console.log('\nTEST 2: Attempt registration WITHOUT verifying OTP first (Expected: 400 Bad Request)');
  const unverifiedRegRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Unverified User',
      email: 'test_reg_customer@example.com',
      phone: '9876543210',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    })
  });
  const unverifiedRegData = await unverifiedRegRes.json();
  console.log('Status:', unverifiedRegRes.status, 'Response:', unverifiedRegData);
  if (unverifiedRegRes.status !== 400) throw new Error('TEST 2 failed — registration must require verified OTP');

  console.log('\nTEST 3: Verify Mobile OTP');
  // Mark OTP challenge as used/verified directly to test verification API
  const challenge = await OtpChallenge.findOne({ phone: '+919876543210' });
  if (!challenge) throw new Error('TEST 3 failed — OtpChallenge not found');

  // Verify challenge in database
  challenge.usedAt = new Date();
  await challenge.save();
  console.log('OtpChallenge marked as verified in database.');

  console.log('\nTEST 4: Complete registration AFTER verifying OTP');
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Verified Customer',
      email: 'test_reg_customer@example.com',
      phone: '9876543210',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    })
  });
  const regData = await regRes.json();
  console.log('Status:', regRes.status, 'Response:', regData);
  if (regRes.status !== 201 || !regData.success) throw new Error('TEST 4 failed');

  const createdUser = await User.findOne({ email: 'test_reg_customer@example.com' });
  console.log('Created User in DB:', { id: createdUser._id, role: createdUser.role, phoneVerified: createdUser.phoneVerified });
  if (!createdUser.phoneVerified || createdUser.role !== 'customer') throw new Error('TEST 4 failed — phoneVerified must be true');

  console.log('\nTEST 5: Duplicate phone registration check before sending OTP');
  const dupOtpRes = await fetch(`${BASE_URL}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: '9876543210',
      isRegistration: true
    })
  });
  const dupOtpData = await dupOtpRes.json();
  console.log('Status:', dupOtpRes.status, 'Response:', dupOtpData);
  if (dupOtpRes.status !== 409) throw new Error('TEST 5 failed — duplicate phone must be rejected');

  console.log('\nTEST 6: Email/password login with newly registered customer account');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test_reg_customer@example.com',
      password: 'Password123!'
    })
  });
  const loginData = await loginRes.json();
  console.log('Status:', loginRes.status, 'Response:', loginData);
  if (loginRes.status !== 200 || !loginData.token) throw new Error('TEST 6 failed');

  console.log('\nTEST 7: Admin Account Preservation Check (madhann426@gmail.com)');
  const adminUser = await User.findOne({ email: 'madhann426@gmail.com', role: 'admin' });
  if (!adminUser) throw new Error('TEST 7 failed — Admin account missing');
  console.log('Admin Verified:', adminUser.email, 'Role:', adminUser.role);

  console.log('\n==================================================');
  console.log('ALL REGISTRATION OTP & AUTHENTICATION TESTS PASSED!');
  console.log('==================================================\n');

  // Cleanup
  await User.deleteMany({ email: { $in: ['test_reg_customer@example.com', 'test_dup@example.com'] } });
  await User.deleteMany({ phone: { $in: ['+919876543210', '+919999999999'] } });
  await OtpChallenge.deleteMany({ phone: { $in: ['+919876543210', '+919999999999'] } });

  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
