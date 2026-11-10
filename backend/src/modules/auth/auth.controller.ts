import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { sendCreated, sendSuccess } from '../../utils/response.js';
import { env } from '../../config/env.js';

const authService = new AuthService();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip;
      const { user, tokens } = await authService.register(req.body, userAgent, ipAddress);

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
      const { user, tokens } = await authService.login(req.body, userAgent, ipAddress);

      res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
      sendSuccess(res, { user, accessToken: tokens.accessToken }, 'Logged in successfully');
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.refreshToken || req.body.refreshToken;
      if (!token) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No refresh token provided' } });
        return;
      }

      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip;
      const { accessToken, newRefreshToken } = await authService.refresh(token, userAgent, ipAddress);

      res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);
      sendSuccess(res, { accessToken }, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.refreshToken;
      await authService.logout(token);
      res.clearCookie('refreshToken', COOKIE_OPTIONS);
      sendSuccess(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getCurrentUser(req.user!.id);
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
}
