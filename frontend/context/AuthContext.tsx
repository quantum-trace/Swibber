import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  ConfirmationResult,
  type ApplicationVerifier,
  updateProfile,
} from 'firebase/auth';
import { firebaseAuth } from '../config/firebase';
import { apiClient } from '../api/client';
import { StorageService } from '../services/storageService';
import { setAuthExpiredHandler } from '../api/client';
import { AuthProviderEnum } from '../constants/authEnums';
import type { AuthProvider as AuthProviderType } from '../constants/authEnums';

// ── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  membershipTier: string;
  rewardPoints: number;
  walletBalance?: number;
  role?: string;
  primaryAuthProvider?: AuthProviderType;
  authProviders?: AuthProviderType[];
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
}

interface TokenExchangeMeta {
  name?: string;
  email?: string;
  avatarUrl?: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  phoneConfirmation: ConfirmationResult | null;
  signInWithGoogleToken: (idToken: string, meta?: TokenExchangeMeta) => Promise<void>;
  signInWithAppleToken: (identityToken: string, rawNonce: string, meta?: TokenExchangeMeta) => Promise<void>;
  sendPhoneOTP: (phone: string) => Promise<ConfirmationResult>;
  verifyPhoneOTP: (otp: string, name?: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (partial: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Converts an Axios/network error into a human-readable message. */
function extractMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    // Axios response error
    const response = e.response as Record<string, unknown> | undefined;
    if (response) {
      const data = response.data as Record<string, unknown> | undefined;
      if (typeof data?.message === 'string') return data.message;
      if (typeof data?.error === 'string') return data.error;
    }
    if (typeof e.message === 'string') return e.message;
  }
  return 'Something went wrong. Please try again.';
}

// ── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [phoneConfirmation, setPhoneConfirmation] = useState<ConfirmationResult | null>(null);

  // ── Session bootstrap ──────────────────────────────────────────────────────

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/user/profile');
      if (data.success) {
        setUser(data.data);
        await StorageService.setUserProfile(data.data);
        console.log('[USER_PROFILE_LOADED] Profile refreshed — userId:', data.data?.id);
      }
    } catch {
      // Silently fall back to cached profile
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      const token = await StorageService.getAuthToken();
      if (token) {
        const cached = await StorageService.getUserProfile<UserProfile>();
        if (cached) setUser(cached);
        // Background refresh — don't block the UI
        refreshUser().catch(() => {});
      }
      setIsLoading(false);
    };

    bootstrap();
    setAuthExpiredHandler(() => setUser(null));
  }, [refreshUser]);

  // ── Core token exchange (Firebase ID token → backend JWT) ─────────────────

  const exchangeFirebaseToken = async (
    firebaseIdToken: string,
    provider: AuthProviderType,
    meta?: TokenExchangeMeta,
  ): Promise<void> => {
    console.log('[AUTH_START] Exchanging Firebase token — provider:', provider);
    const fcmToken = await StorageService.get<string>('@swibber/fcm_token');

    let data: {
      data: {
        accessToken: string;
        refreshToken: string;
        user: UserProfile;
      };
    };

    try {
      const res = await apiClient.post('/auth/firebase', {
        idToken: firebaseIdToken,
        fcmToken,
        authProvider: provider,
        name: meta?.name,
        email: meta?.email,
        avatarUrl: meta?.avatarUrl,
      });
      data = res.data;
      console.log('[AUTH_SUCCESS] Backend JWT received — userId:', data.data.user?.id);
    } catch (err) {
      console.log('[AUTH] Token exchange failed:', extractMessage(err));
      throw new Error(extractMessage(err));
    }

    await StorageService.setAuthToken(data.data.accessToken);
    await StorageService.setRefreshToken(data.data.refreshToken);
    console.log('[SESSION_STORED] Tokens persisted to secure storage');

    await StorageService.setUserProfile(data.data.user);
    setUser(data.data.user);
    console.log('[AUTH_CONTEXT_UPDATED] User state updated — isAuthenticated will become true');
  };

  // ── Google ────────────────────────────────────────────────────────────────

  const signInWithGoogleToken = async (
    idToken: string,
    meta?: TokenExchangeMeta,
  ): Promise<void> => {
    const credential = GoogleAuthProvider.credential(idToken);
    const userCred = await signInWithCredential(firebaseAuth, credential);
    const firebaseToken = await userCred.user.getIdToken();
    await exchangeFirebaseToken(firebaseToken, AuthProviderEnum.GOOGLE, {
      name: meta?.name ?? userCred.user.displayName ?? undefined,
      email: meta?.email ?? userCred.user.email ?? undefined,
      avatarUrl: meta?.avatarUrl ?? userCred.user.photoURL ?? undefined,
    });
  };

  // ── Apple ─────────────────────────────────────────────────────────────────

  const signInWithAppleToken = async (
    identityToken: string,
    rawNonce: string,
    meta?: TokenExchangeMeta,
  ): Promise<void> => {
    const provider = new OAuthProvider('apple.com');
    const credential = provider.credential({ idToken: identityToken, rawNonce });
    const userCred = await signInWithCredential(firebaseAuth, credential);
    const firebaseToken = await userCred.user.getIdToken();
    await exchangeFirebaseToken(firebaseToken, AuthProviderEnum.APPLE, {
      name: meta?.name ?? userCred.user.displayName ?? undefined,
      email: meta?.email ?? userCred.user.email ?? undefined,
    });
  };

  // ── Phone OTP ─────────────────────────────────────────────────────────────

  const sendPhoneOTP = async (phone: string): Promise<ConfirmationResult> => {
    // In a real native build Firebase uses the device's invisible reCAPTCHA.
    // The ApplicationVerifier below satisfies the TypeScript interface while
    // Firebase's native SDK intercepts the actual verification.
    const nativeVerifier: ApplicationVerifier = {
      type: 'recaptcha',
      verify: () => Promise.resolve(''),
    };
    const confirmation = await signInWithPhoneNumber(firebaseAuth, phone, nativeVerifier);
    setPhoneConfirmation(confirmation);
    return confirmation;
  };

  const verifyPhoneOTP = async (otp: string, name?: string): Promise<void> => {
    if (!phoneConfirmation) {
      throw new Error('No active OTP session. Please request a new code.');
    }
    const result = await phoneConfirmation.confirm(otp);
    const firebaseToken = await result.user.getIdToken();
    await exchangeFirebaseToken(firebaseToken, AuthProviderEnum.PHONE, { name });
    setPhoneConfirmation(null);
  };

  // ── Email ─────────────────────────────────────────────────────────────────

  const signInWithEmail = async (email: string, password: string): Promise<void> => {
    const userCred = await signInWithEmailAndPassword(firebaseAuth, email, password);
    const firebaseToken = await userCred.user.getIdToken();
    await exchangeFirebaseToken(firebaseToken, AuthProviderEnum.EMAIL, {
      email: userCred.user.email ?? undefined,
    });
  };

  const signUpWithEmail = async (
    name: string,
    email: string,
    password: string,
  ): Promise<void> => {
    const userCred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    await updateProfile(userCred.user, { displayName: name });
    const firebaseToken = await userCred.user.getIdToken();
    await exchangeFirebaseToken(firebaseToken, AuthProviderEnum.EMAIL, { name, email });
  };

  const sendPasswordReset = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(firebaseAuth, email);
  };

  // ── Session management ────────────────────────────────────────────────────

  const logout = async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Best-effort — always clear local state regardless
    }
    await firebaseAuth.signOut();
    await StorageService.clearAuth();
    setPhoneConfirmation(null);
    setUser(null);
  };

  const updateUser = (partial: Partial<UserProfile>) =>
    setUser((prev) => (prev ? { ...prev, ...partial } : prev));

  // ── Context value ─────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        phoneConfirmation,
        signInWithGoogleToken,
        signInWithAppleToken,
        sendPhoneOTP,
        verifyPhoneOTP,
        signInWithEmail,
        signUpWithEmail,
        sendPasswordReset,
        logout,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
};
