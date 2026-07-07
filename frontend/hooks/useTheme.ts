import { useThemeContext } from '../context/ThemeContext';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../theme';

export const useTheme = () => {
  const { isDark, colors, mode, setMode, toggleTheme } = useThemeContext();
  return {
    isDark,
    colors,
    mode,
    setMode,
    toggleTheme,
    Colors,
    Spacing,
    BorderRadius,
    Typography,
    Shadows,
  };
};
