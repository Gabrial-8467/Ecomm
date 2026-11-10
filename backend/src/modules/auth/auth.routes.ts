import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.validation.js';
import { requireAuth } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rate-limiter.js';

const router = Router();
const controller = new AuthController();

router.post('/register', authLimiter, validate({ body: registerSchema }), controller.register);
router.post('/login', authLimiter, validate({ body: loginSchema }), controller.login);
router.post('/refresh', validate({ body: refreshTokenSchema }), controller.refresh);
router.post('/logout', controller.logout);
router.get('/me', requireAuth, controller.me);

export const authRoutes = router;
