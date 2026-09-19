import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { changePassword, forgotPassword, loginWithEmail, loginWithGoogle, logout, register, resetPassword, sendOtp, verifyOtp } from '../controllers/authController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = Router();
const otpSendLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many OTP requests. Please try again later.' } });
const otpVerifyLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many OTP verification attempts. Please try again later.' } });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many login attempts. Please try again later.' } });

router.post('/register', loginLimiter, register);
router.post('/login', loginLimiter, loginWithEmail);
router.post('/google', loginLimiter, loginWithGoogle);
router.post('/send-otp', otpSendLimiter, sendOtp);
router.post('/verify-otp', otpVerifyLimiter, verifyOtp);
router.post('/forgot-password', loginLimiter, forgotPassword);
router.post('/reset-password', loginLimiter, resetPassword);
router.post('/change-password', isAuthenticated, changePassword);
router.post('/logout', isAuthenticated, logout);
export default router;
