import { useState, useCallback } from 'react';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useAuthContext } from '../context/AuthContext';
import {
  GoogleSignInErrorCode,
  googleSignInErrorConfigs,
} from '../constants/authEnums';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export interface UseGoogleAuthResult {
  signIn: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Maps a native GoogleSignin error code to the config-driven error message.
 * Returns null for silent outcomes (user cancelled, sign-in already in progress).
 */
function resolveErrorMessage(err: unknown): string | null {
  const code = (err as { code?: string } | null)?.code;

  switch (code) {
    case statusCodes.SIGN_IN_CANCELLED:
      return googleSignInErrorConfigs[GoogleSignInErrorCode.CANCELLED].message;
    case statusCodes.IN_PROGRESS:
      return googleSignInErrorConfigs[GoogleSignInErrorCode.IN_PROGRESS].message;
    case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
      return googleSignInErrorConfigs[GoogleSignInErrorCode.PLAY_SERVICES_NOT_AVAILABLE].message;
    default:
      return (
        (err as { message?: string } | null)?.message ??
        googleSignInErrorConfigs[GoogleSignInErrorCode.UNKNOWN].message
      );
  }
}

export function useGoogleAuth(): UseGoogleAuthResult {
  const auth = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async () => {
    if (isLoading) return;
    setError(null);
    setIsLoading(true);

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      const response = await GoogleSignin.signIn();

      if (response.type === 'cancelled') return;

      const idToken = response.data?.idToken;
      if (!idToken) {
        setError(
          googleSignInErrorConfigs[GoogleSignInErrorCode.UNKNOWN].message ??
            'Google sign-in did not return a valid token. Please try again.',
        );
        return;
      }

      await auth.signInWithGoogleToken(idToken);
    } catch (err: unknown) {
      const message = resolveErrorMessage(err);
      if (message) setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [auth, isLoading]);

  return {
    signIn,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}
