import { useState } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { useAuthContext } from '../context/AuthContext';

async function generateNonce(): Promise<{ raw: string; hashed: string }> {
  const raw = Math.random().toString(36).substring(2, 18) + Math.random().toString(36).substring(2, 18);
  const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw);
  return { raw, hashed };
}

export function useAppleAuth() {
  const auth = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAvailable = Platform.OS === 'ios';

  const signIn = async (): Promise<void> => {
    if (!isAvailable) return;

    setIsLoading(true);
    setError(null);

    try {
      const { raw: rawNonce, hashed: hashedNonce } = await generateNonce();

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        throw new Error('Apple Sign In did not return an identity token.');
      }

      const name = credential.fullName
        ? [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join(' ')
        : undefined;

      await auth.signInWithAppleToken(credential.identityToken, rawNonce, {
        name: name || undefined,
        email: credential.email ?? undefined,
      });
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err?.code === 'ERR_REQUEST_CANCELED') return; // User cancelled — no error shown
      setError(err?.message ?? 'Apple Sign In failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signIn,
    isAvailable,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}
