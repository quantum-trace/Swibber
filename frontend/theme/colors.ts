export const Colors = {
  // Brand palette
  primary: '#4C35E8',
  primaryLight: '#6B52F0',
  primaryDark: '#3520C0',
  primaryAlpha20: 'rgba(76,53,232,0.20)',
  primaryAlpha10: 'rgba(76,53,232,0.10)',

  secondary: '#7B2FBE',
  secondaryLight: '#9B4FDE',
  secondaryDark: '#5B1F9E',
  secondaryAlpha20: 'rgba(123,47,190,0.20)',

  accent: '#00D4FF',
  accentLight: '#40E0FF',
  accentDark: '#00A8CC',
  accentAlpha20: 'rgba(0,212,255,0.20)',

  // Semantic colours
  success: '#00C853',
  successLight: '#69F0AE',
  successAlpha20: 'rgba(0,200,83,0.20)',
  warning: '#FF9500',
  warningLight: '#FFCC02',
  warningAlpha20: 'rgba(255,149,0,0.20)',
  error: '#FF3B30',
  errorLight: '#FF6B6B',
  errorAlpha20: 'rgba(255,59,48,0.20)',
  info: '#007AFF',
  infoAlpha20: 'rgba(0,122,255,0.20)',

  // Gradient pairs (start → end)
  gradientPrimary: ['#4C35E8', '#7B2FBE'] as string[],
  gradientAccent: ['#00D4FF', '#4C35E8'] as string[],
  gradientDark: ['#1A1A2E', '#0A0A0F'] as string[],
  gradientSuccess: ['#00C853', '#00E676'] as string[],
  gradientSunset: ['#FF6B6B', '#7B2FBE'] as string[],
  gradientOcean: ['#00D4FF', '#0052FF'] as string[],
  gradientRide: ['#4C35E8', '#00D4FF'] as string[],
  gradientFood: ['#FF6B6B', '#FF9500'] as string[],
  gradientParcel: ['#00C853', '#00D4FF'] as string[],
  gradientGold: ['#FFD700', '#FF9500'] as string[],

  // Dark theme surface tokens
  dark: {
    background: '#0A0A0F',
    surface: '#111118',
    card: '#1A1A24',
    cardElevated: '#22223A',
    border: '#2A2A3A',
    borderLight: '#3A3A50',
    text: '#FFFFFF',
    textSub: '#A0A0B8',
    textMuted: '#606078',
    textDisabled: '#404058',
    overlay: 'rgba(0,0,0,0.75)',
    glassBg: 'rgba(26,26,36,0.85)',
    glassStroke: 'rgba(255,255,255,0.08)',
    tabBar: '#0E0E18',
  },

  // Light theme surface tokens
  light: {
    background: '#F8F9FF',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    cardElevated: '#F0F0FF',
    border: '#E8E8F0',
    borderLight: '#F0F0F8',
    text: '#0A0A1A',
    textSub: '#606080',
    textMuted: '#A0A0B8',
    textDisabled: '#C0C0D0',
    overlay: 'rgba(0,0,0,0.40)',
    glassBg: 'rgba(255,255,255,0.85)',
    glassStroke: 'rgba(255,255,255,0.50)',
    tabBar: '#FFFFFF',
  },

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type ColorsType = typeof Colors;
export type ThemeSurface = typeof Colors.dark | typeof Colors.light;
