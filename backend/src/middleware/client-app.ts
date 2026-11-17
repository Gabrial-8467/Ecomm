import { NextFunction, Request, Response } from 'express';
import { ForbiddenError } from '../utils/errors.js';

/**
 * Binds a top-level API namespace to one client application.
 * The URL namespace is the source of truth — request headers can never switch apps.
 */
export function setClientApp(clientApp: 'admin' | 'storefront') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const declaredApp = req.headers['x-client-app'];
    if (declaredApp && declaredApp !== clientApp) {
      next(new ForbiddenError('X-Client-App header does not match this API'));
      return;
    }

    req.clientApp = clientApp;
    next();
  };
}
