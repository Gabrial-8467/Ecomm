import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authenticate, validateRequest } from '../../middleware/auth.js';
import { authRateLimiter } from '../../middleware/security.js';
import { registerSchema, loginSchema } from './auth.validation.js';

const router = Router();

router.post('/register', authRateLimiter, validateRequest(registerSchema), AuthController.register);
router.post('/login', authRateLimiter, validateRequest(loginSchema), AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', authenticate, AuthController.me);

export default router;
