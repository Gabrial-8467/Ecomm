import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { ENV } from '../../config/env.js';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);

      // Set HttpOnly cookie
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: ENV.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { identifier, password } = req.body;
      const result = await AuthService.login(identifier, password);

      res.cookie('token', result.token, {
        httpOnly: true,
        secure: ENV.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response) {
    res.clearCookie('token');
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getMe(req.user!.id);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}
