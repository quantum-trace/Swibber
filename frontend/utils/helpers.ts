import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export const Screen = {
  width: SCREEN_W,
  height: SCREEN_H,
  isSmall: SCREEN_W < 375,
  isLarge: SCREEN_W >= 414,
};

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const generateId = (): string =>
  `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  if (hour < 21) return 'Good Evening';
  return 'Good Night';
};

export const calculateFare = (
  basePrice: number,
  pricePerKm: number,
  distanceKm: number,
  surgeMultiplier = 1.0,
): number => {
  const raw = basePrice + pricePerKm * distanceKm;
  return Math.round(raw * surgeMultiplier);
};

export const extractFirstName = (fullName: string): string =>
  fullName.trim().split(' ')[0];

export const groupBy = <T>(
  arr: T[],
  key: keyof T,
): Record<string, T[]> =>
  arr.reduce((acc, item) => {
    const group = String(item[key]);
    acc[group] = [...(acc[group] || []), item];
    return acc;
  }, {} as Record<string, T[]>);

export const debounce = <T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number,
): ((...args: Parameters<T>) => void) => {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};
