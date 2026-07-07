import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, error: err.message });
    return;
  }

  if (err.name === 'ValidationError') {
    res.status(422).json({ success: false, error: err.message });
    return;
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
    return;
  }

  console.error('[Unhandled Error]', err instanceof Error ? `${err.name}: ${err.message}` : err);
  res.status(500).json({ success: false, error: process.env.NODE_ENV === 'development' ? (err instanceof Error ? err.message : 'Internal server error') : 'Internal server error' });
};

export const notFound = (_req: Request, res: Response): void => {
  res.status(404).json({ success: false, error: 'Route not found' });
};
