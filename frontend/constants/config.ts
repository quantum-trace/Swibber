import Constants from 'expo-constants';

export const Config = {
  APP_NAME: 'Swibber',
  APP_VERSION: Constants.expoConfig?.version ?? '1.0.0',
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api/v1',
  SOCKET_URL: process.env.EXPO_PUBLIC_WS_URL ?? 'http://localhost:5000',
  RAZORPAY_KEY_ID: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ?? '',
  API_TIMEOUT: 30_000,
  OTP_RESEND_TIMER: 30,
  DEFAULT_PAGE_SIZE: 20,
  MAX_CART_ITEMS: 20,
  CURRENCY_SYMBOL: '₹',
  CURRENCY_CODE: 'INR',
  DEFAULT_LOCATION: { lat: 19.076, lng: 72.8777, city: 'Mumbai' },
  ENABLE_HAPTICS: true,
  ENABLE_ANALYTICS: false,
  FIREBASE: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
  },
  STORAGE_KEYS: {
    AUTH_TOKEN: '@swibber/auth_token',
    REFRESH_TOKEN: '@swibber/refresh_token',
    USER_PROFILE: '@swibber/user_profile',
    THEME_PREF: '@swibber/theme_pref',
    ONBOARDING_DONE: '@swibber/onboarding_done',
    ENUM_OVERRIDES: '@swibber/enum_overrides',
  },
} as const;
