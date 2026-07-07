import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { Config } from '../constants/config';
import { StorageService } from '../services/storageService';
import { reconnectSocket } from '../socket/socketManager';

let _onAuthExpired: (() => void) | null = null;
let _isRefreshing = false;
let _refreshQueue: Array<(token: string) => void> = [];

export const setAuthExpiredHandler = (handler: () => void): void => {
  _onAuthExpired = handler;
};

const processQueue = (token: string | null, error?: AxiosError): void => {
  _refreshQueue.forEach((cb) => (token ? cb(token) : cb('')));
  _refreshQueue = [];
};

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: Config.API_BASE_URL,
    timeout: Config.API_TIMEOUT,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  });

  client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const token = await StorageService.getAuthToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (_isRefreshing) {
          return new Promise((resolve, reject) => {
            _refreshQueue.push((token) => {
              if (!token) { reject(error); return; }
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(client(originalRequest));
            });
          });
        }

        originalRequest._retry = true;
        _isRefreshing = true;

        try {
          const refreshToken = await StorageService.getRefreshToken();
          if (!refreshToken) throw new Error('No refresh token');

          const { data } = await axios.post(`${Config.API_BASE_URL}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = data.data;

          await StorageService.setAuthToken(accessToken);
          await StorageService.setRefreshToken(newRefreshToken);

          // Re-authenticate the socket with the fresh token immediately.
          // Fire-and-forget — don't block the HTTP retry on socket reconnect.
          reconnectSocket().catch(() => {});

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          processQueue(accessToken);
          return client(originalRequest);
        } catch {
          processQueue(null);
          await StorageService.clearAuth();
          _onAuthExpired?.();
          return Promise.reject(error);
        } finally {
          _isRefreshing = false;
        }
      }

      return Promise.reject(error);
    },
  );

  return client;
};

export const apiClient = createApiClient();
