import { MD3DarkTheme, configureFonts } from 'react-native-paper';

export const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#6366f1', // Indigo sleek
    secondary: '#10b981', // Emerald for success
    tertiary: '#f59e0b', // Amber for warnings/alerts
    surface: '#0f172a', // Slate 900
    background: '#1e293b', // Slate 800
    error: '#ef4444',
    onPrimary: '#ffffff',
    onSurface: '#f8fafc',
    onSurfaceVariant: '#94a3b8',
  },
  roundness: 12,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
