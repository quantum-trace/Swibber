import { apiClient } from '../api/client';
import { Endpoints } from '../api/endpoints';
import { StorageService } from './storageService';

export interface LoginPayload {
  emailOrPhone: string;
  password: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  membershipTier: string;
  rewardPoints: number;
  walletBalance: number;
}

export interface OTPPayload {
  phone: string;
  context: 'signup' | 'forgotPassword';
}

export const AuthService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>(Endpoints.AUTH.LOGIN, payload);
    await StorageService.setAuthToken(data.token);
    await StorageService.setRefreshToken(data.refreshToken);
    await StorageService.setUserProfile(data.user);
    return data;
  },

  async signup(payload: SignupPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>(Endpoints.AUTH.SIGNUP, payload);
    await StorageService.setAuthToken(data.token);
    await StorageService.setRefreshToken(data.refreshToken);
    await StorageService.setUserProfile(data.user);
    return data;
  },

  async sendOTP(payload: OTPPayload): Promise<{ message: string }> {
    const { data } = await apiClient.post(Endpoints.AUTH.SEND_OTP, payload);
    return data;
  },

  async verifyOTP(phone: string, otp: string, context: string): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>(Endpoints.AUTH.VERIFY_OTP, { phone, otp, context });
    if (context === 'signup') {
      await StorageService.setAuthToken(data.token);
      await StorageService.setRefreshToken(data.refreshToken);
      await StorageService.setUserProfile(data.user);
    }
    return data;
  },

  async forgotPassword(emailOrPhone: string): Promise<void> {
    await apiClient.post(Endpoints.AUTH.FORGOT_PASSWORD, { emailOrPhone });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post(Endpoints.AUTH.RESET_PASSWORD, { token, newPassword });
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post(Endpoints.AUTH.LOGOUT);
    } finally {
      await StorageService.clearAuth();
    }
  },

  async getProfile(): Promise<UserProfile> {
    const { data } = await apiClient.get<UserProfile>(Endpoints.USER.PROFILE);
    await StorageService.setUserProfile(data);
    return data;
  },
};
