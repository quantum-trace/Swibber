import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: {
    thin: 'System',
    light: 'System',
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
    extraBold: 'System',
    black: 'System',
  },
  android: {
    thin: 'sans-serif-thin',
    light: 'sans-serif-light',
    regular: 'sans-serif',
    medium: 'sans-serif-medium',
    semiBold: 'sans-serif-medium',
    bold: 'sans-serif',
    extraBold: 'sans-serif',
    black: 'sans-serif-black',
  },
  default: {
    thin: 'System',
    light: 'System',
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
    extraBold: 'System',
    black: 'System',
  },
})!;

export const Typography = {
  fontFamily,

  display1: { fontSize: 40, fontWeight: '800' as const, lineHeight: 48, letterSpacing: -0.5 },
  display2: { fontSize: 32, fontWeight: '700' as const, lineHeight: 38, letterSpacing: -0.3 },

  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34, letterSpacing: -0.2 },
  h2: { fontSize: 24, fontWeight: '700' as const, lineHeight: 30, letterSpacing: -0.1 },
  h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 26 },
  h4: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },

  bodyLarge: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },

  labelLarge: { fontSize: 15, fontWeight: '600' as const, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '600' as const, lineHeight: 18, letterSpacing: 0.1 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  captionBold: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16 },
  overline: {
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },

  buttonLarge: { fontSize: 16, fontWeight: '700' as const, lineHeight: 20, letterSpacing: 0.2 },
  button: { fontSize: 14, fontWeight: '600' as const, lineHeight: 18, letterSpacing: 0.1 },
  buttonSmall: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16 },
};
