import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
} from './auth.validation.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';
import { authLimiter } from '../../middleware/rate-limiter.js';

const controller = new AuthController();

export const adminAuthRoutes = Router();

adminAuthRoutes.post('/login', authLimiter, validate({ body: loginSchema }), controller.login);
adminAuthRoutes.post('/refresh', validate({ body: refreshTokenSchema }), controller.refresh);
adminAuthRoutes.post('/logout', controller.logout);
adminAuthRoutes.get('/me', requireAuth, requireRole('ADMIN', 'STAFF'), controller.me);
adminAuthRoutes.patch(
  '/profile',
  requireAuth,
  requireRole('ADMIN', 'STAFF'),
  validate({ body: updateProfileSchema }),
  controller.updateProfile
);
adminAuthRoutes.post(
  '/change-password',
  requireAuth,
  requireRole('ADMIN', 'STAFF'),
  validate({ body: changePasswordSchema }),
  controller.changePassword
);

export const storefrontAuthRoutes = Router();

storefrontAuthRoutes.post('/register', authLimiter, validate({ body: registerSchema }), controller.register);
storefrontAuthRoutes.post('/login', authLimiter, validate({ body: loginSchema }), controller.login);
storefrontAuthRoutes.post('/refresh', validate({ body: refreshTokenSchema }), controller.refresh);
storefrontAuthRoutes.post('/logout', controller.logout);
storefrontAuthRoutes.get('/me', requireAuth, requireRole('CUSTOMER'), controller.me);
storefrontAuthRoutes.patch(
  '/profile',
  requireAuth,
  requireRole('CUSTOMER'),
  validate({ body: updateProfileSchema }),
  controller.updateProfile
);
storefrontAuthRoutes.post(
  '/change-password',
  requireAuth,
  requireRole('CUSTOMER'),
  validate({ body: changePasswordSchema }),
  controller.changePassword
);
storefrontAuthRoutes.post('/forgot-password', authLimiter, validate({ body: forgotPasswordSchema }), controller.forgotPassword);
storefrontAuthRoutes.post('/reset-password', authLimiter, validate({ body: resetPasswordSchema }), controller.resetPassword);
