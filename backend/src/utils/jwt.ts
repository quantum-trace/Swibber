import jwt, { SignOptions } from 'jsonwebtoken';
import { UserRole } from '../types/enums';

export interface JwtPayload {
  id: string;
  phone?: string;
  email?: string;
  role: UserRole;
  firebaseUid?: string;
}

export const signAccessToken = (payload: JwtPayload): string => {
  const opts: SignOptions = { expiresIn: (process.env.JWT_EXPIRES_IN ?? '15m') as SignOptions['expiresIn'] };
  return jwt.sign(payload, process.env.JWT_SECRET!, opts);
};

export const signRefreshToken = (payload: JwtPayload): string => {
  const opts: SignOptions = { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '30d') as SignOptions['expiresIn'] };
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, opts);
};

export const verifyAccessToken = (token: string): JwtPayload =>
  jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

export const verifyRefreshToken = (token: string): JwtPayload =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JwtPayload;
