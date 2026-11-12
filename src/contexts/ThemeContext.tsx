import React, { createContext, useLayoutEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  // Background colors
  background: string;
  backgroundSecondary: string;
  
  // Sidebar colors
  sidebarBackground: string;
  sidebarText: string;
  sidebarItemHover: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  // Card/Container colors
  cardBackground: string;
  cardBorder: string;
  
  // Accent colors
  accent: string;
  accentLight: string;
  
  // Status/Interactive colors
  success: string;
  warning: string;
  error: string;
  
  // Gradients
  gradientBannerStart: string;
  gradientBannerEnd: string;
  
  // Button colors
  buttonBackground: string;
  buttonText: string;
  buttonHover: string;
  
  // Input/Edit colors
  inputBackground: string;
  inputBorder: string;
}

export const lightTheme: ThemeColors = {
  background: '#FFFBF0',
  backgroundSecondary: '#EAF7FF',
  
  sidebarBackground: '#E0F2FE',
  sidebarText: '#062544',
  sidebarItemHover: '#C7E5FA',
  
  text: '#062544',
  textSecondary: '#31506F',
  textTertiary: '#466683',
  
  cardBackground: '#FFFFFF',
  cardBorder: '#BFDEF3',
  
  accent: '#0F83C8',
  accentLight: '#B8DDF5',
  
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  
  gradientBannerStart: '#60A5FA',
  gradientBannerEnd: '#F5D547',
  
  buttonBackground: '#FFFFFF',
  buttonText: '#062544',
  buttonHover: '#EAF7FF',
  
  inputBackground: '#FFFFFF',
  inputBorder: '#BFDEF3',
};

export const darkTheme: ThemeColors = {
  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  
  sidebarBackground: '#1E293B',
  sidebarText: '#F1F5F9',
  sidebarItemHover: '#334155',
  
  text: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',
  
  cardBackground: '#1E293B',
  cardBorder: '#334155',
  
  accent: '#60A5FA',
  accentLight: '#93C5FD',
  
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  
  gradientBannerStart: '#60A5FA',
  gradientBannerEnd: '#F5D547',
  
  buttonBackground: '#334155',
  buttonText: '#F1F5F9',
  buttonHover: '#475569',
  
  inputBackground: '#0F172A',
  inputBorder: '#334155',
};

interface ThemeContextType {
  mode: ThemeMode;
  theme: ThemeColors;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const systemThemeQuery = '(prefers-color-scheme: dark)';

function getSystemTheme(): ThemeMode {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia(systemThemeQuery).matches
    ? 'dark'
    : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(getSystemTheme);

  useLayoutEffect(() => {
    if (typeof window.matchMedia !== 'function') return;

    const preference = window.matchMedia(systemThemeQuery);
    const followSystemTheme = () => {
      setMode(preference.matches ? 'dark' : 'light');
    };

    preference.addEventListener('change', followSystemTheme);
    // Reconcile changes between initialization and subscription before paint.
    followSystemTheme();

    return () => preference.removeEventListener('change', followSystemTheme);
  }, []);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode;
  }, [mode]);
  
  const theme = mode === 'light' ? lightTheme : darkTheme;
  
  const toggleTheme = () => {
    setMode(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  return (
    <ThemeContext.Provider value={{ mode, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
