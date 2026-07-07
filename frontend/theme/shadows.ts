import { Platform, ViewStyle } from 'react-native';

const shadow = (
  y: number, opacity: number, radius: number,
  elevation: number, color = '#000',
): ViewStyle =>
  Platform.OS === 'ios'
    ? { shadowColor: color, shadowOffset: { width: 0, height: y }, shadowOpacity: opacity, shadowRadius: radius }
    : { elevation };

export const Shadows = {
  none: {} as ViewStyle,
  sm: shadow(2, 0.06, 4, 2),
  md: shadow(4, 0.08, 8, 4),
  lg: shadow(8, 0.10, 16, 8),
  xl: shadow(12, 0.12, 24, 12),
  xxl: shadow(20, 0.15, 32, 20),
  primary: shadow(8, 0.35, 16, 10, '#4C35E8'),
  accent: shadow(4, 0.30, 12, 8, '#00D4FF'),
  success: shadow(4, 0.30, 12, 8, '#00C853'),
};
