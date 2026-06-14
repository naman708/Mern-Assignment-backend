import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth.controller';
import { uploadProfileImage } from '../middlewares/upload.middleware';
import { validate } from '../middlewares/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  registerRules,
  createAdminRules,
  loginRules,
  verifyEmailRules,
  refreshRules,
  forgotPasswordRules,
  resetPasswordRules,
} from '../validators/auth.validator';

const router = Router();

// Throttle sensitive auth endpoints to blunt brute-force / abuse.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/register',
  authLimiter,
  uploadProfileImage, // multipart: parses fields + optional `profileImage`
  validate(registerRules),
  asyncHandler(authController.register)
);

router.post(
  '/create-admin',
  authLimiter,
  validate(createAdminRules),
  asyncHandler(authController.createAdmin)
);

router.get('/verify-email', validate(verifyEmailRules), asyncHandler(authController.verifyEmail));

router.post('/login', authLimiter, validate(loginRules), asyncHandler(authController.login));

router.post('/refresh', validate(refreshRules), asyncHandler(authController.refresh));

router.post('/logout', validate(refreshRules), asyncHandler(authController.logout));

router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordRules),
  asyncHandler(authController.forgotPassword)
);

router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordRules),
  asyncHandler(authController.resetPassword)
);

export default router;
