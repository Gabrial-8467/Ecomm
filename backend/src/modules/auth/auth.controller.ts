import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { sendCreated, sendSuccess } from '../../utils/response.js';
import { env } from '../../config/env.js';
import { ForbiddenError } from '../../utils/errors.js';

const authService = new AuthService();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const CLEAR_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
};

function getClientApp(req: Request): 'admin' | 'storefront' {
  if (!req.clientApp) {
    throw new ForbiddenError('API client is not configured for this route');
  }
  return req.clientApp;
}

function getRefreshTokenCookieName(req: Request): string {
  return getClientApp(req) === 'admin' ? 'adminRefreshToken' : 'refreshToken';
}

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientApp = getClientApp(req);
      if (clientApp === 'admin') {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Direct registration is not available on the admin portal.' },
        });
        return;
      }

      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip;
      const { user, tokens } = await authService.register(req.body, userAgent, ipAddress);

      // Customer registrations always set 'refreshToken'
      res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
      sendCreated(res, { user, accessToken: tokens.accessToken }, 'User registered successfully');
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip;
      const clientApp = getClientApp(req);
      const { user, tokens } = await authService.login(req.body, userAgent, ipAddress, clientApp);

      const cookieName = getRefreshTokenCookieName(req);
      res.cookie(cookieName, tokens.refreshToken, COOKIE_OPTIONS);
      sendSuccess(res, { user, accessToken: tokens.accessToken }, 'Logged in successfully');
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientApp = getClientApp(req);
      const cookieName = getRefreshTokenCookieName(req);
      // Strict zero-leakage: Admin reads ONLY adminRefreshToken; Storefront reads ONLY refreshToken.
      const token = req.cookies?.[cookieName] || req.body.refreshToken;
      if (!token) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No refresh token provided' } });
        return;
      }

      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip;
      const { accessToken, newRefreshToken } = await authService.refresh(token, userAgent, ipAddress, clientApp);

      res.cookie(cookieName, newRefreshToken, COOKIE_OPTIONS);
      sendSuccess(res, { accessToken }, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientApp = getClientApp(req);
      const cookieName = getRefreshTokenCookieName(req);
      const token = req.cookies?.[cookieName] || req.body.refreshToken;
      if (token) {
        await authService.logout(token);
      }
      // Strictly clear ONLY the calling app's cookie so Storefront logout never clears Admin session and vice versa
      res.clearCookie(cookieName, CLEAR_COOKIE_OPTIONS);
      sendSuccess(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientApp = getClientApp(req);
      const user = await authService.getCurrentUser(req.user!.id);

      // Strict role isolation check on /auth/me
      if (clientApp === 'admin' && user.role !== 'ADMIN' && user.role !== 'STAFF') {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied: Customer accounts cannot access the admin panel.' },
        });
        return;
      }
      if (clientApp === 'storefront' && (user.role === 'ADMIN' || user.role === 'STAFF')) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied: Admin/Staff accounts cannot use storefront session.' },
        });
        return;
      }

      sendSuccess(res, { user });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.forgotPassword(req.body.identifier);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { resetToken, newPassword } = req.body;
      const result = await authService.resetPassword(resetToken, newPassword);
      sendSuccess(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const user = await authService.updateProfile(userId, req.body);
      sendSuccess(res, user, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(userId, currentPassword, newPassword);
      sendSuccess(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }
}
