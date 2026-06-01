import { Router } from 'express';
import {
  register,
  login,
  googleAuth,
  refreshToken,
  logout,
  getMe,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPasswordWithOtp,
} from '../controllers/authController';
import { authenticate, validateRequest } from '../middleware';
import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  refreshTokenSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordWithOtpSchema,
} from '../utils/validationSchemas';

const router = Router();

// Public routes
router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/google', validateRequest(googleAuthSchema), googleAuth);
router.post('/refresh', validateRequest(refreshTokenSchema), refreshToken);
router.post('/verify-otp', validateRequest(verifyOtpSchema), verifyOtp);
router.post('/resend-otp', validateRequest(resendOtpSchema), resendOtp);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), forgotPassword);
router.post('/reset-password-otp', validateRequest(resetPasswordWithOtpSchema), resetPasswordWithOtp);

// Protected routes
router.use(authenticate); // All routes below require authentication
router.post('/logout', logout);
router.get('/me', getMe);

export default router;
