import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme as lightTheme } from '@/styles/theme';
import { darkTheme } from '@/styles/darkTheme';

type ThemeMode = 'light' | 'dark' | 'auto';
type Theme = typeof lightTheme;

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme_mode';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const deviceColorScheme = useDeviceColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Save theme preference whenever it changes
  useEffect(() => {
    if (!isLoading) {
      saveThemePreference(themeMode);
    }
  }, [themeMode, isLoading]);

  const loadThemePreference = async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved && (saved === 'light' || saved === 'dark' || saved === 'auto')) {
        setThemeModeState(saved as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveThemePreference = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  const toggleTheme = () => {
    // If auto, set to opposite of current device setting
    // If light, set to dark
    // If dark, set to light
    if (themeMode === 'auto') {
      setThemeModeState(deviceColorScheme === 'dark' ? 'light' : 'dark');
    } else if (themeMode === 'light') {
      setThemeModeState('dark');
    } else {
      setThemeModeState('light');
    }
  };

  // Determine actual theme to use
  const isDark = themeMode === 'auto' 
    ? deviceColorScheme === 'dark'
    : themeMode === 'dark';

  const currentTheme = isDark ? darkTheme : lightTheme;

  const value: ThemeContextType = {
    theme: currentTheme,
    themeMode,
    isDark,
    setThemeMode,
    toggleTheme,
  };

  if (isLoading) {
    // Return null or a loading screen while theme is loading
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Helper hook for just getting theme colors and values
export const useThemedStyles = () => {
  const { theme } = useTheme();
  return theme;
};

export type { ThemeMode, Theme, ThemeContextType };
