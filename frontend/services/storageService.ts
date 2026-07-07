import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../constants/config';

// Secure keys must match [a-zA-Z0-9._-]
const SECURE_KEYS = {
  ACCESS_TOKEN: 'swibber.access_token',
  REFRESH_TOKEN: 'swibber.refresh_token',
};

const secureGet = async (key: string): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
};

const secureSet = async (key: string, value: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // SecureStore unavailable on web/simulator — fall back to AsyncStorage
    await AsyncStorage.setItem(key, value);
  }
};

const secureDelete = async (key: string): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    await AsyncStorage.removeItem(key);
  }
};

export const StorageService = {
  async getAuthToken(): Promise<string | null> {
    return secureGet(SECURE_KEYS.ACCESS_TOKEN);
  },

  async setAuthToken(token: string): Promise<void> {
    await secureSet(SECURE_KEYS.ACCESS_TOKEN, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return secureGet(SECURE_KEYS.REFRESH_TOKEN);
  },

  async setRefreshToken(token: string): Promise<void> {
    await secureSet(SECURE_KEYS.REFRESH_TOKEN, token);
  },

  async getUserProfile<T>(): Promise<T | null> {
    const raw = await AsyncStorage.getItem(Config.STORAGE_KEYS.USER_PROFILE);
    return raw ? (JSON.parse(raw) as T) : null;
  },

  async setUserProfile<T>(profile: T): Promise<void> {
    await AsyncStorage.setItem(Config.STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  },

  async getThemePref(): Promise<'light' | 'dark' | null> {
    return AsyncStorage.getItem(Config.STORAGE_KEYS.THEME_PREF) as Promise<'light' | 'dark' | null>;
  },

  async setThemePref(pref: 'light' | 'dark'): Promise<void> {
    await AsyncStorage.setItem(Config.STORAGE_KEYS.THEME_PREF, pref);
  },

  async isOnboardingDone(): Promise<boolean> {
    const val = await AsyncStorage.getItem(Config.STORAGE_KEYS.ONBOARDING_DONE);
    return val === 'true';
  },

  async markOnboardingDone(): Promise<void> {
    await AsyncStorage.setItem(Config.STORAGE_KEYS.ONBOARDING_DONE, 'true');
  },

  async clearAuth(): Promise<void> {
    await Promise.all([
      secureDelete(SECURE_KEYS.ACCESS_TOKEN),
      secureDelete(SECURE_KEYS.REFRESH_TOKEN),
      AsyncStorage.removeItem(Config.STORAGE_KEYS.USER_PROFILE),
    ]);
  },

  async clearAll(): Promise<void> {
    await Promise.all([
      secureDelete(SECURE_KEYS.ACCESS_TOKEN),
      secureDelete(SECURE_KEYS.REFRESH_TOKEN),
      AsyncStorage.clear(),
    ]);
  },

  async get<T>(key: string): Promise<T | null> {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  },

  async set<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },

  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
};
