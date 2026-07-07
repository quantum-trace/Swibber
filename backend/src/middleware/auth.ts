import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';
import { AuthenticatedRequest } from '../types';

export const authenticate = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedError('Missing auth token');

    const token = header.split(' ')[1];
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
};

export const requireRole =
  (...roles: string[]) =>
  (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new UnauthorizedError('Insufficient permissions'));
      return;
    }
    next();
  };
