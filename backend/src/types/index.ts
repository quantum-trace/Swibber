import { Request } from 'express';
import { UserRole } from './enums';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    phone?: string;
    email?: string;
    role: UserRole;
    firebaseUid?: string;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Coordinates {
  lat: number;
  lng: number;
}
