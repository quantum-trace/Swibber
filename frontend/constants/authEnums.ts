/**
 * Auth-specific enums for Swibber frontend.
 *
 * AuthProvider and AuthPlatform follow the same `as const` pattern as all other
 * enums — see constants/enums.ts. The TypeScript `enum` keyword is intentionally
 * avoided across this codebase so values are runtime-serialisable without extra
 * transforms and aliases remain DB-overridable via EnumAliasService.
 */

// ─── Auth Provider ────────────────────────────────────────────────────────────

export const AuthProviderEnum = {
  GOOGLE: 'google',
  APPLE:  'apple',
  PHONE:  'phone',
  EMAIL:  'email',
} as const;

export type AuthProvider = (typeof AuthProviderEnum)[keyof typeof AuthProviderEnum];

// ─── Auth Platform ────────────────────────────────────────────────────────────

export const AuthPlatformEnum = {
  IOS:     'ios',
  ANDROID: 'android',
  BOTH:    'both',
} as const;

export type AuthPlatform = (typeof AuthPlatformEnum)[keyof typeof AuthPlatformEnum];

// ─── Google Sign-In Error Codes ───────────────────────────────────────────────

export const GoogleSignInErrorCode = {
  CANCELLED:                  'cancelled',
  IN_PROGRESS:                'in_progress',
  PLAY_SERVICES_NOT_AVAILABLE:'play_services_not_available',
  UNKNOWN:                    'unknown',
} as const;

export type GoogleSignInErrorCodeType =
  (typeof GoogleSignInErrorCode)[keyof typeof GoogleSignInErrorCode];

export interface GoogleSignInErrorConfig {
  key: GoogleSignInErrorCodeType;
  alias: string;
  message: string | null;
}

export const googleSignInErrorConfigs: Record<GoogleSignInErrorCodeType, GoogleSignInErrorConfig> = {
  cancelled: {
    key:     'cancelled',
    alias:   'Sign-In Cancelled',
    message: null,
  },
  in_progress: {
    key:     'in_progress',
    alias:   'Sign-In In Progress',
    message: null,
  },
  play_services_not_available: {
    key:     'play_services_not_available',
    alias:   'Play Services Unavailable',
    message: 'Google Play Services is required for Google Sign-In. Please update Play Services and try again.',
  },
  unknown: {
    key:     'unknown',
    alias:   'Sign-In Failed',
    message: 'Google sign-in failed. Please try again.',
  },
};

// ─── Auth Provider Config ─────────────────────────────────────────────────────

export interface AuthProviderConfig {
  key: AuthProvider;
  alias: string;
  shortAlias: string;
  enabled: boolean;
  platform: AuthPlatform;
  order: number;
  iconName: string;
  primaryColor: string;
}

export const DEFAULT_PROVIDER_CONFIGS: AuthProviderConfig[] = [
  {
    key:          AuthProviderEnum.GOOGLE,
    alias:        'Continue with Google',
    shortAlias:   'Google',
    enabled:      true,
    platform:     AuthPlatformEnum.BOTH,
    order:        1,
    iconName:     'google',
    primaryColor: '#DB4437',
  },
  {
    key:          AuthProviderEnum.APPLE,
    alias:        'Continue with Apple',
    shortAlias:   'Apple',
    enabled:      true,
    platform:     AuthPlatformEnum.IOS,
    order:        2,
    iconName:     'apple',
    primaryColor: '#FFFFFF',
  },
  {
    key:          AuthProviderEnum.PHONE,
    alias:        'Continue with Phone',
    shortAlias:   'Phone',
    enabled:      true,
    platform:     AuthPlatformEnum.BOTH,
    order:        3,
    iconName:     'phone',
    primaryColor: '#4C35E8',
  },
  {
    key:          AuthProviderEnum.EMAIL,
    alias:        'Continue with Email',
    shortAlias:   'Email',
    enabled:      true,
    platform:     AuthPlatformEnum.BOTH,
    order:        4,
    iconName:     'email',
    primaryColor: '#A0A0B8',
  },
];

// ─── Country Codes ────────────────────────────────────────────────────────────

export const COUNTRY_CODES = [
  { code: '+91',  name: 'India',        flag: '🇮🇳', iso: 'IN' },
  { code: '+1',   name: 'USA',          flag: '🇺🇸', iso: 'US' },
  { code: '+44',  name: 'UK',           flag: '🇬🇧', iso: 'GB' },
  { code: '+61',  name: 'Australia',    flag: '🇦🇺', iso: 'AU' },
  { code: '+971', name: 'UAE',          flag: '🇦🇪', iso: 'AE' },
  { code: '+65',  name: 'Singapore',    flag: '🇸🇬', iso: 'SG' },
  { code: '+60',  name: 'Malaysia',     flag: '🇲🇾', iso: 'MY' },
  { code: '+49',  name: 'Germany',      flag: '🇩🇪', iso: 'DE' },
  { code: '+33',  name: 'France',       flag: '🇫🇷', iso: 'FR' },
  { code: '+81',  name: 'Japan',        flag: '🇯🇵', iso: 'JP' },
  { code: '+86',  name: 'China',        flag: '🇨🇳', iso: 'CN' },
  { code: '+55',  name: 'Brazil',       flag: '🇧🇷', iso: 'BR' },
  { code: '+27',  name: 'South Africa', flag: '🇿🇦', iso: 'ZA' },
  { code: '+234', name: 'Nigeria',      flag: '🇳🇬', iso: 'NG' },
];
