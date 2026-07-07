import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { Colors, ThemeSurface } from '../theme/colors';
import { StorageService } from '../services/storageService';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeSurface;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    StorageService.getThemePref().then((pref) => {
      if (pref) setModeState(pref);
    });
  }, []);

  const isDark =
    mode === 'dark' || (mode === 'system' && systemScheme === 'dark');

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    if (newMode !== 'system') {
      await StorageService.setThemePref(newMode);
    }
  };

  const toggleTheme = () => setMode(isDark ? 'light' : 'dark');

  const value: ThemeContextValue = {
    mode,
    isDark,
    colors: isDark ? Colors.dark : Colors.light,
    setMode,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeContext = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeContext must be used within ThemeProvider');
  return ctx;
};
