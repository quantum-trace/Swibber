import { AxiosError } from 'axios';

export interface AppError {
  code: string;
  message: string;
  statusCode?: number;
}

export const parseApiError = (error: unknown): AppError => {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const msg = error.response?.data?.message ?? error.message;
    return { code: `API_${status ?? 'UNKNOWN'}`, message: msg, statusCode: status };
  }
  if (error instanceof Error) {
    return { code: 'CLIENT_ERROR', message: error.message };
  }
  return { code: 'UNKNOWN_ERROR', message: 'Something went wrong. Please try again.' };
};

export const getErrorMessage = (error: unknown): string =>
  parseApiError(error).message;

export const isNetworkError = (error: unknown): boolean =>
  error instanceof AxiosError && !error.response;

export const isAuthError = (error: unknown): boolean =>
  error instanceof AxiosError && error.response?.status === 401;
